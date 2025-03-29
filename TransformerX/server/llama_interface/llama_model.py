#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
LLaMA Interface Module
Provides integration with the LLaMA language model
"""

import os
import time
import json
import logging
from typing import Dict, List, Tuple, Any, Optional, Union
import numpy as np
import threading
import queue

# Configure logging
logger = logging.getLogger(__name__)

# Try to import transformers
try:
    from transformers import AutoTokenizer, AutoModelForCausalLM
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logger.warning("Transformers library not available, LLaMA interface will be limited")

class LlamaInterface:
    """Interface for the LLaMA language model"""
    
    def __init__(
        self,
        model_path: str = "meta-llama/Llama-2-7b-chat-hf",
        use_quantization: bool = True,
        context_length: int = 2048,
        temperature: float = 0.7,
        top_p: float = 0.9,
        repetition_penalty: float = 1.1,
        neural_guidance_strength: float = 0.5,
        semantic_mapping: Optional[Dict[str, List[str]]] = None
    ):
        """
        Initialize LLaMA Interface
        
        Args:
            model_path: Path to the model or model identifier from huggingface.co/models
            use_quantization: Whether to use quantization to reduce memory usage
            context_length: Maximum context length
            temperature: Sampling temperature
            top_p: Top-p sampling probability
            repetition_penalty: Repetition penalty for text generation
            neural_guidance_strength: Strength of neural guidance (0 to 1)
            semantic_mapping: Mapping from neural classes to semantic concepts
        """
        self.model_path = model_path
        self.use_quantization = use_quantization
        self.context_length = context_length
        self.temperature = temperature
        self.top_p = top_p
        self.repetition_penalty = repetition_penalty
        self.neural_guidance_strength = neural_guidance_strength
        self.semantic_mapping = semantic_mapping or {
            "left_hand": ["move", "change", "shift", "select"],
            "right_hand": ["create", "add", "increase", "new"],
            "feet": ["stop", "pause", "halt", "reduce"],
            "tongue": ["confirm", "accept", "approve", "yes"],
            "rest": ["neutral", "wait", "standby", "idle"]
        }
        
        # Model state
        self.model = None
        self.tokenizer = None
        self.active = False
        self.ready = False
        self.error = None
        
        # Neural guidance state
        self.neural_class = None
        self.neural_confidence = 0.0
        self.attention_weights = None
        
        # Message history
        self.message_history = []
        
        # Processing queue for non-blocking operations
        self.queue = queue.Queue()
        self.worker_thread = None
        
        # Initialize model if possible
        self._initialize_model()
    
    def _initialize_model(self) -> bool:
        """
        Initialize LLaMA model and tokenizer
        
        Returns:
            True if successful, False otherwise
        """
        if not TRANSFORMERS_AVAILABLE:
            self.error = "Transformers library not available"
            logger.error(self.error)
            return False
        
        try:
            logger.info(f"Loading LLaMA model from {self.model_path}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            
            # Load model with optional quantization
            if self.use_quantization:
                logger.info("Using 4-bit quantization for LLaMA model")
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_path,
                    load_in_4bit=True,
                    device_map="auto"
                )
            else:
                device = "cuda" if torch.cuda.is_available() else "cpu"
                logger.info(f"Loading LLaMA model on {device}")
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_path
                ).to(device)
            
            self.ready = True
            logger.info("LLaMA model initialized successfully")
            return True
            
        except Exception as e:
            self.error = f"Error initializing LLaMA model: {str(e)}"
            logger.error(self.error)
            return False
    
    def start(self) -> bool:
        """
        Start LLaMA interface
        
        Returns:
            True if successful, False otherwise
        """
        if not self.ready:
            if not self._initialize_model():
                return False
        
        # Start worker thread
        if self.worker_thread is None or not self.worker_thread.is_alive():
            self.active = True
            self.worker_thread = threading.Thread(target=self._worker_loop)
            self.worker_thread.daemon = True
            self.worker_thread.start()
            logger.info("LLaMA interface started")
        
        return True
    
    def stop(self) -> None:
        """Stop LLaMA interface"""
        self.active = False
        if self.worker_thread and self.worker_thread.is_alive():
            # Wait for thread to terminate
            self.queue.put(None)  # Signal to exit
            self.worker_thread.join(timeout=2.0)
            logger.info("LLaMA interface stopped")
    
    def _worker_loop(self) -> None:
        """Worker thread loop for processing generation requests"""
        while self.active:
            try:
                # Get task from queue
                task = self.queue.get(timeout=0.5)
                
                if task is None:
                    # Exit signal
                    break
                
                # Process task
                task_type, args, callback = task
                
                if task_type == "generate":
                    result = self._generate_text_internal(*args)
                    if callback:
                        callback(result)
                
                # Mark task as done
                self.queue.task_done()
                
            except queue.Empty:
                # No tasks in queue
                pass
            except Exception as e:
                logger.error(f"Error in LLaMA worker thread: {e}")
    
    def set_neural_guidance(
        self, 
        neural_class: str, 
        confidence: float,
        attention_weights: Optional[np.ndarray] = None
    ) -> None:
        """
        Set neural guidance parameters
        
        Args:
            neural_class: Classified neural activity class
            confidence: Confidence level (0 to 1)
            attention_weights: Optional attention matrix from neural processing
        """
        self.neural_class = neural_class
        self.neural_confidence = confidence
        self.attention_weights = attention_weights
        
        logger.debug(f"Neural guidance set: class={neural_class}, confidence={confidence:.2f}")
    
    def generate_text(
        self,
        prompt: str,
        max_length: int = 100,
        callback: Optional[callable] = None
    ) -> Optional[str]:
        """
        Generate text using LLaMA model (non-blocking)
        
        Args:
            prompt: Text prompt for generation
            max_length: Maximum length of generated text
            callback: Optional callback function for result
            
        Returns:
            None (result is passed to callback when ready)
        """
        if not self.ready:
            if callback:
                callback({"error": "LLaMA model not ready"})
            return
        
        # Add task to queue
        self.queue.put(("generate", (prompt, max_length), callback))
    
    def _generate_text_internal(
        self,
        prompt: str,
        max_length: int = 100
    ) -> Dict[str, Any]:
        """
        Internal method to generate text using LLaMA model
        
        Args:
            prompt: Text prompt for generation
            max_length: Maximum length of generated text
            
        Returns:
            Dictionary with generated text and metadata
        """
        if not self.ready or self.model is None or self.tokenizer is None:
            return {"error": "LLaMA model not ready"}
        
        try:
            # Apply neural guidance if available
            temp_modifier = 0
            rep_penalty_modifier = 0
            
            if self.neural_class and self.neural_class in self.semantic_mapping:
                # Modify generation parameters based on neural guidance
                confidence = self.neural_confidence
                
                # Adjust temperature based on confidence (higher confidence = lower temperature)
                temp_modifier = -0.2 * confidence * self.neural_guidance_strength
                
                # Adjust repetition penalty based on confidence
                rep_penalty_modifier = 0.1 * confidence * self.neural_guidance_strength
                
                # Add semantic concepts to prompt
                semantic_concepts = self.semantic_mapping[self.neural_class]
                guidance_text = f"[Focusing on concepts: {', '.join(semantic_concepts)}]"
                prompt = f"{guidance_text}\n{prompt}"
                
                logger.debug(f"Applied neural guidance with class {self.neural_class}")
            
            # Prepare inputs
            input_ids = self.tokenizer.encode(prompt, return_tensors="pt")
            
            # Move input to the same device as the model
            device = next(self.model.parameters()).device
            input_ids = input_ids.to(device)
            
            # Generate text
            temperature = max(0.1, self.temperature + temp_modifier)
            repetition_penalty = max(1.0, self.repetition_penalty + rep_penalty_modifier)
            
            attention_mask = None
            if self.attention_weights is not None and self.neural_guidance_strength > 0:
                # Convert neural attention weights to model attention mask
                # This is a simplification - in a real system, would need more complex mapping
                attention_mask = torch.ones_like(input_ids, dtype=torch.float)
                
            # Generated tokens
            with torch.no_grad():
                outputs = self.model.generate(
                    input_ids,
                    attention_mask=attention_mask,
                    max_length=min(input_ids.shape[1] + max_length, self.context_length),
                    temperature=temperature,
                    top_p=self.top_p,
                    repetition_penalty=repetition_penalty,
                    do_sample=True
                )
            
            # Decode generated text
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract only the newly generated part (after the prompt)
            prompt_text = self.tokenizer.decode(input_ids[0], skip_special_tokens=True)
            new_text = generated_text[len(prompt_text):]
            
            # Add to message history
            self.message_history.append({
                "prompt": prompt,
                "generated": new_text,
                "neural_class": self.neural_class,
                "neural_confidence": self.neural_confidence,
                "timestamp": time.time()
            })
            
            # Trim message history if it gets too long
            if len(self.message_history) > 50:
                self.message_history = self.message_history[-50:]
            
            return {
                "text": new_text,
                "full_text": generated_text,
                "neural_class": self.neural_class,
                "neural_confidence": self.neural_confidence,
                "parameters": {
                    "temperature": temperature,
                    "repetition_penalty": repetition_penalty,
                    "top_p": self.top_p
                }
            }
            
        except Exception as e:
            error_msg = f"Error generating text: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}
    
    def update_settings(self, settings: Dict[str, Any]) -> None:
        """
        Update LLaMA interface settings
        
        Args:
            settings: Dictionary of settings to update
        """
        if "temperature" in settings:
            self.temperature = float(settings["temperature"])
        
        if "top_p" in settings:
            self.top_p = float(settings["top_p"])
        
        if "repetition_penalty" in settings:
            self.repetition_penalty = float(settings["repetition_penalty"])
        
        if "neural_guidance_strength" in settings:
            self.neural_guidance_strength = float(settings["neural_guidance_strength"])
        
        if "semantic_mapping" in settings:
            self.semantic_mapping = settings["semantic_mapping"]
            
        logger.info(f"LLaMA settings updated: {settings}")
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get LLaMA interface status
        
        Returns:
            Dictionary with status information
        """
        return {
            "active": self.active,
            "ready": self.ready,
            "error": self.error,
            "model_path": self.model_path,
            "neural_guidance": {
                "active": self.neural_class is not None,
                "class": self.neural_class,
                "confidence": self.neural_confidence,
                "strength": self.neural_guidance_strength
            },
            "settings": {
                "temperature": self.temperature,
                "top_p": self.top_p,
                "repetition_penalty": self.repetition_penalty,
                "context_length": self.context_length
            }
        }

# Dummy implementation if transformers is not available
if not TRANSFORMERS_AVAILABLE:
    class DummyLlama:
        """Dummy LLaMA interface for when transformers is not available"""
        
        def __init__(self, *args, **kwargs):
            """Initialize dummy LLaMA interface"""
            self.active = False
            self.ready = False
            self.error = "Transformers library not available"
            self.neural_class = None
            self.neural_confidence = 0.0
            self.message_history = []
            logger.warning("Using dummy LLaMA interface - text generation will be simulated")
        
        def start(self):
            """Start dummy interface"""
            self.active = True
            logger.info("Dummy LLaMA interface started")
            return True
        
        def stop(self):
            """Stop dummy interface"""
            self.active = False
            logger.info("Dummy LLaMA interface stopped")
        
        def set_neural_guidance(self, neural_class, confidence, attention_weights=None):
            """Set dummy neural guidance"""
            self.neural_class = neural_class
            self.neural_confidence = confidence
        
        def generate_text(self, prompt, max_length=100, callback=None):
            """Generate dummy text"""
            result = self._generate_text_internal(prompt, max_length)
            if callback:
                callback(result)
        
        def _generate_text_internal(self, prompt, max_length=100):
            """Internal method to generate dummy text"""
            # Generate simple response based on prompt and neural class
            responses = [
                "This is a simulated response from the LLaMA model.",
                "The neural processor is influencing this response.",
                "Without the transformers library, I can only provide simulated text.",
                "In a full implementation, this would be generated by the LLaMA model."
            ]
            
            # Add neural class specific text if available
            if self.neural_class:
                neural_responses = {
                    "left_hand": "Moving focus to different aspects.",
                    "right_hand": "Creating new concepts and ideas.",
                    "feet": "Stopping current process and reconsidering.",
                    "tongue": "Confirming and accepting the current direction.",
                    "rest": "Maintaining neutral stance and observing."
                }
                responses.append(neural_responses.get(self.neural_class, "Neural influence detected."))
            
            # Generate simple response
            import random
            response = random.choice(responses)
            
            # Add to message history
            self.message_history.append({
                "prompt": prompt,
                "generated": response,
                "neural_class": self.neural_class,
                "neural_confidence": self.neural_confidence,
                "timestamp": time.time()
            })
            
            return {
                "text": response,
                "full_text": f"{prompt}\n{response}",
                "neural_class": self.neural_class,
                "neural_confidence": self.neural_confidence,
                "parameters": {
                    "temperature": 0.7,
                    "repetition_penalty": 1.1,
                    "top_p": 0.9
                }
            }
        
        def update_settings(self, settings):
            """Update dummy settings"""
            pass
        
        def get_status(self):
            """Get dummy status"""
            return {
                "active": self.active,
                "ready": self.ready,
                "error": self.error,
                "model_path": "dummy_model",
                "neural_guidance": {
                    "active": self.neural_class is not None,
                    "class": self.neural_class,
                    "confidence": self.neural_confidence,
                    "strength": 0.5
                },
                "settings": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "repetition_penalty": 1.1,
                    "context_length": 2048
                }
            }