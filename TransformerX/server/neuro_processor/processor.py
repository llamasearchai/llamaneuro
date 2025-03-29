#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Neural Signal Processor
Provides real-time processing of EEG signals for neural decoding
"""

import os
import time
import json
import logging
import threading
import queue
import numpy as np
from typing import Dict, List, Tuple, Any, Optional, Union

# Configure logging
logger = logging.getLogger(__name__)

# Import local modules
from .feature_extraction import extract_features
from .transformers import TransformerEncoder

# Try importing PyTorch
try:
    import torch
    from .classification import MotorImageryClassifier
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("PyTorch not available, using dummy classifier")
    # Define dummy classifier class if PyTorch is not available
    class MotorImageryClassifier:
        def __init__(self, *args, **kwargs):
            pass
        def __call__(self, x):
            return np.random.rand(1, 5)  # Random output for 5 classes

class NeuroProcessor:
    """Neural Signal Processor for EEG data"""
    
    def __init__(
        self,
        sampling_rate: int = 250,
        buffer_duration: float = 4.0,  # seconds
        using_simulated_data: bool = True,
        electrode_names: Optional[List[str]] = None,
        frequency_bands: Optional[Dict[str, List[float]]] = None,
        transformer_model_path: Optional[str] = None,
        classifier_model_path: Optional[str] = None
    ):
        """
        Initialize Neural Signal Processor
        
        Args:
            sampling_rate: EEG sampling rate in Hz
            buffer_duration: Duration of data buffer in seconds
            using_simulated_data: Whether to use simulated data
            electrode_names: List of electrode names
            frequency_bands: Dictionary of frequency bands {name: [low_freq, high_freq]}
            transformer_model_path: Path to transformer model weights
            classifier_model_path: Path to classifier model weights
        """
        # Configuration
        self.sampling_rate = sampling_rate
        self.buffer_duration = buffer_duration
        self.using_simulated_data = using_simulated_data
        self.active = False
        self.processing_thread = None
        self.data_queue = queue.Queue()
        
        # Electrode setup
        if electrode_names is None:
            self.electrode_names = ["Fp1", "Fp2", "F7", "F3", "Fz", "F4", "F8", 
                                    "T3", "C3", "Cz", "C4", "T4", "T5", "P3", 
                                    "Pz", "P4", "T6", "O1", "O2"]
        else:
            self.electrode_names = electrode_names
        
        # Frequency bands
        if frequency_bands is None:
            self.frequency_bands = {
                "delta": [0.5, 4],
                "theta": [4, 8],
                "alpha": [8, 13],
                "beta": [13, 30],
                "gamma": [30, 100]
            }
        else:
            self.frequency_bands = frequency_bands
        
        # Buffer setup - stores raw EEG data
        self.buffer_samples = int(sampling_rate * buffer_duration)
        self.data_buffer = np.zeros((len(self.electrode_names), self.buffer_samples))
        
        # Feature and classification state
        self.features = {}
        self.transformer_output = None
        self.attention_weights = None
        self.classification = {
            "class": None,
            "confidence": 0.0,
            "probabilities": None,
            "timestamp": None
        }
        
        # Simulated data configuration
        self.simulated_class = "rest"
        self.simulated_confidence = 0.7
        self.classes = ["left_hand", "right_hand", "feet", "tongue", "rest"]
        
        # Transformer configuration
        self.transformer_config = {
            "input_dim": len(self.electrode_names),
            "hidden_dim": 64,
            "num_heads": 4,
            "num_layers": 2,
            "dropout": 0.1
        }
        
        # Initialize models
        self._initialize_models(transformer_model_path, classifier_model_path)
        
        # Processing state
        self.last_update_time = time.time()
        self.error = None
    
    def _initialize_models(self, transformer_model_path: Optional[str], classifier_model_path: Optional[str]) -> None:
        """
        Initialize transformer and classifier models
        
        Args:
            transformer_model_path: Path to transformer model weights
            classifier_model_path: Path to classifier model weights
        """
        # Initialize transformer model
        try:
            self.transformer = TransformerEncoder(
                input_dim=self.transformer_config["input_dim"],
                hidden_dim=self.transformer_config["hidden_dim"],
                num_heads=self.transformer_config["num_heads"],
                num_layers=self.transformer_config["num_layers"],
                dropout=self.transformer_config["dropout"]
            )
            logger.info("Transformer model initialized")
            
            # Load model weights if provided
            if transformer_model_path and os.path.exists(transformer_model_path) and TORCH_AVAILABLE:
                self.transformer.load_state_dict(torch.load(transformer_model_path))
                logger.info(f"Loaded transformer weights from {transformer_model_path}")
        except Exception as e:
            self.error = f"Error initializing transformer: {str(e)}"
            logger.error(self.error)
            self.transformer = None
        
        # Initialize classifier model
        try:
            if TORCH_AVAILABLE:
                feature_dim = self.transformer_config["hidden_dim"] if self.transformer else len(self.electrode_names) * 5  # Rough estimate
                self.classifier = MotorImageryClassifier(
                    input_dim=feature_dim,
                    hidden_dim=64,
                    num_classes=len(self.classes),
                    dropout=0.3
                )
                logger.info("Classifier model initialized")
                
                # Load model weights if provided
                if classifier_model_path and os.path.exists(classifier_model_path):
                    self.classifier.load_state_dict(torch.load(classifier_model_path))
                    logger.info(f"Loaded classifier weights from {classifier_model_path}")
            else:
                self.classifier = MotorImageryClassifier()
                logger.warning("Using dummy classifier (PyTorch not available)")
        except Exception as e:
            self.error = f"Error initializing classifier: {str(e)}"
            logger.error(self.error)
            self.classifier = None
    
    def start(self) -> bool:
        """
        Start the neural processor
        
        Returns:
            True if started successfully, False otherwise
        """
        if self.active:
            logger.warning("Neural processor already active")
            return True
        
        # Check if models are initialized
        if self.transformer is None or self.classifier is None:
            self.error = "Models not initialized properly"
            logger.error(self.error)
            return False
        
        # Start processing thread
        self.active = True
        self.processing_thread = threading.Thread(target=self._processing_loop)
        self.processing_thread.daemon = True
        self.processing_thread.start()
        
        logger.info("Neural processor started")
        return True
    
    def stop(self) -> None:
        """Stop the neural processor"""
        if not self.active:
            return
        
        self.active = False
        if self.processing_thread and self.processing_thread.is_alive():
            self.processing_thread.join(timeout=2.0)
        
        logger.info("Neural processor stopped")
    
    def reset(self) -> None:
        """Reset the processor state"""
        # Clear buffer
        self.data_buffer = np.zeros((len(self.electrode_names), self.buffer_samples))
        
        # Reset feature and classification state
        self.features = {}
        self.transformer_output = None
        self.attention_weights = None
        self.classification = {
            "class": None,
            "confidence": 0.0,
            "probabilities": None,
            "timestamp": None
        }
        
        logger.info("Neural processor state reset")
    
    def _processing_loop(self) -> None:
        """Main processing loop running in a separate thread"""
        while self.active:
            try:
                # Get data from queue (if using real data)
                if not self.using_simulated_data:
                    try:
                        # Try to get data from queue with timeout
                        data_chunk = self.data_queue.get(timeout=0.1)
                        self._process_data_chunk(data_chunk)
                        self.data_queue.task_done()
                    except queue.Empty:
                        # No data received, continue
                        pass
                else:
                    # Generate simulated data
                    data_chunk = self._generate_simulated_data()
                    self._process_data_chunk(data_chunk)
                    
                    # Sleep to control update rate
                    time.sleep(0.1)
                
            except Exception as e:
                self.error = f"Error in processing loop: {str(e)}"
                logger.error(self.error)
                time.sleep(1.0)  # Avoid tight loop on error
    
    def _generate_simulated_data(self) -> np.ndarray:
        """
        Generate simulated EEG data
        
        Returns:
            Simulated EEG data chunk [channels, samples]
        """
        # Number of samples to generate (0.1s worth of data)
        num_samples = int(self.sampling_rate * 0.1)
        num_channels = len(self.electrode_names)
        
        # Base signal (random noise)
        data = np.random.randn(num_channels, num_samples) * 0.5
        
        # Add frequency components based on simulated class
        t = np.arange(num_samples) / self.sampling_rate
        
        # Add alpha (8-13 Hz) to all channels as baseline
        alpha_freq = 10.0
        alpha_amp = 1.0
        data += alpha_amp * np.sin(2 * np.pi * alpha_freq * t).reshape(1, -1)
        
        # Add class-specific activity
        if self.simulated_class == "left_hand":
            # Mu rhythm suppression in right motor cortex (C4)
            c4_idx = self.electrode_names.index("C4") if "C4" in self.electrode_names else 0
            data[c4_idx, :] *= 0.5  # Suppress
            
            # Beta enhancement
            beta_freq = 20.0
            beta_amp = 1.5
            data[c4_idx, :] += beta_amp * np.sin(2 * np.pi * beta_freq * t)
            
        elif self.simulated_class == "right_hand":
            # Mu rhythm suppression in left motor cortex (C3)
            c3_idx = self.electrode_names.index("C3") if "C3" in self.electrode_names else 0
            data[c3_idx, :] *= 0.5  # Suppress
            
            # Beta enhancement
            beta_freq = 20.0
            beta_amp = 1.5
            data[c3_idx, :] += beta_amp * np.sin(2 * np.pi * beta_freq * t)
            
        elif self.simulated_class == "feet":
            # Activity in central midline (Cz)
            cz_idx = self.electrode_names.index("Cz") if "Cz" in self.electrode_names else 0
            
            # Beta enhancement
            beta_freq = 18.0
            beta_amp = 2.0
            data[cz_idx, :] += beta_amp * np.sin(2 * np.pi * beta_freq * t)
            
        elif self.simulated_class == "tongue":
            # Activity in prefrontal regions (Fp1, Fp2)
            fp_indices = []
            if "Fp1" in self.electrode_names:
                fp_indices.append(self.electrode_names.index("Fp1"))
            if "Fp2" in self.electrode_names:
                fp_indices.append(self.electrode_names.index("Fp2"))
            
            if fp_indices:
                # Gamma activity
                gamma_freq = 35.0
                gamma_amp = 0.8
                for idx in fp_indices:
                    data[idx, :] += gamma_amp * np.sin(2 * np.pi * gamma_freq * t)
        
        # Add time-dependent drift
        drift = np.linspace(0, 0.2, num_samples).reshape(1, -1)
        data += drift
        
        # Add random noise based on confidence
        # Lower confidence = more noise
        noise_level = 1.0 - self.simulated_confidence
        data += np.random.randn(num_channels, num_samples) * noise_level
        
        return data
    
    def _process_data_chunk(self, data_chunk: np.ndarray) -> None:
        """
        Process a chunk of EEG data
        
        Args:
            data_chunk: EEG data chunk [channels, samples]
        """
        # Check if data chunk is valid
        if data_chunk.size == 0:
            return
        
        # Update buffer (shift old data and add new)
        chunk_samples = data_chunk.shape[1]
        self.data_buffer = np.roll(self.data_buffer, -chunk_samples, axis=1)
        self.data_buffer[:, -chunk_samples:] = data_chunk
        
        # Extract features from the buffer
        self.features = extract_features(
            self.data_buffer,
            self.sampling_rate,
            self.frequency_bands,
            temporal_features=True,
            spectral_features=True,
            connectivity_features=False
        )
        
        # Convert features to format expected by transformer
        # We'll use the frequency band powers as the main input
        feature_mat = np.array([self.features[f'band_{band}'] for band in self.frequency_bands.keys()])
        feature_mat = feature_mat.T  # [channels, bands]
        
        # Apply transformer if available
        if self.transformer is not None:
            # Convert to torch tensor if using PyTorch
            if TORCH_AVAILABLE:
                with torch.no_grad():
                    x = torch.tensor(feature_mat, dtype=torch.float32)
                    x = x.unsqueeze(0)  # Add batch dimension
                    
                    # Forward pass through transformer
                    outputs, attention = self.transformer(x, return_attention=True)
                    
                    # Store transformer output and attention weights
                    self.transformer_output = outputs.squeeze(0).numpy()
                    self.attention_weights = attention.squeeze(0).numpy()
            else:
                # Use dummy implementation from transformer.py
                self.transformer_output, self.attention_weights = self.transformer(feature_mat, return_attention=True)
        else:
            # If transformer not available, use features directly
            self.transformer_output = feature_mat.flatten()
            self.attention_weights = None
        
        # Apply classifier if available
        if self.classifier is not None:
            if TORCH_AVAILABLE:
                with torch.no_grad():
                    if self.transformer_output is not None:
                        x = torch.tensor(self.transformer_output, dtype=torch.float32)
                        x = x.unsqueeze(0)  # Add batch dimension
                    else:
                        x = torch.tensor(feature_mat.flatten(), dtype=torch.float32)
                        x = x.unsqueeze(0)  # Add batch dimension
                    
                    # Forward pass through classifier
                    logits = self.classifier(x)
                    
                    # Apply softmax to get probabilities
                    probs = torch.nn.functional.softmax(logits, dim=1)
                    
                    # Get predicted class and confidence
                    class_idx = torch.argmax(probs, dim=1).item()
                    confidence = probs[0, class_idx].item()
                    
                    # Update classification
                    self.classification = {
                        "class": self.classes[class_idx],
                        "confidence": confidence,
                        "probabilities": {cls: probs[0, i].item() for i, cls in enumerate(self.classes)},
                        "timestamp": time.time()
                    }
            else:
                # Using dummy classifier
                if self.using_simulated_data:
                    # For simulated data, use the simulated class
                    class_idx = self.classes.index(self.simulated_class)
                    confidence = self.simulated_confidence
                    
                    # Create dummy probabilities
                    probs = [0.1] * len(self.classes)
                    probs[class_idx] = confidence
                    
                    # Normalize probabilities
                    probs = np.array(probs)
                    probs = probs / probs.sum()
                    
                    # Update classification
                    self.classification = {
                        "class": self.simulated_class,
                        "confidence": confidence,
                        "probabilities": {cls: probs[i] for i, cls in enumerate(self.classes)},
                        "timestamp": time.time()
                    }
                else:
                    # Random classification for non-simulated data
                    probs = np.random.rand(len(self.classes))
                    probs = probs / probs.sum()
                    
                    class_idx = np.argmax(probs)
                    confidence = probs[class_idx]
                    
                    # Update classification
                    self.classification = {
                        "class": self.classes[class_idx],
                        "confidence": confidence,
                        "probabilities": {cls: probs[i] for i, cls in enumerate(self.classes)},
                        "timestamp": time.time()
                    }
        
        # Update last update time
        self.last_update_time = time.time()
    
    def add_data(self, data: np.ndarray) -> None:
        """
        Add EEG data to the processing queue
        
        Args:
            data: EEG data chunk [channels, samples]
        """
        if self.active:
            self.data_queue.put(data)
    
    def get_current_data(self) -> Dict[str, Any]:
        """
        Get current data state
        
        Returns:
            Dictionary with current data state
        """
        current_time = time.time()
        
        # Basic state information
        result = {
            "timestamp": current_time,
            "active": self.active,
            "mode": "simulated" if self.using_simulated_data else "real",
            "sampling_rate": self.sampling_rate,
            "last_update": self.last_update_time,
            "classification": self.classification
        }
        
        # Add band powers from features
        band_powers = {}
        for band_name in self.frequency_bands.keys():
            feature_key = f'band_{band_name}'
            if feature_key in self.features:
                band_powers[band_name] = self.features[feature_key].tolist()
        
        result["band_powers"] = band_powers
        
        # Add attention weights if available
        if self.attention_weights is not None:
            # Convert to list for JSON serialization
            if isinstance(self.attention_weights, np.ndarray):
                result["attention_weights"] = self.attention_weights.tolist()
            else:
                result["attention_weights"] = self.attention_weights
        
        return result
    
    def set_simulated_class(self, class_name: str, confidence: float = 0.8) -> None:
        """
        Set the simulated class for testing
        
        Args:
            class_name: Class name to simulate
            confidence: Confidence level (0-1)
        """
        if class_name in self.classes:
            self.simulated_class = class_name
            self.simulated_confidence = min(1.0, max(0.0, confidence))
            logger.info(f"Set simulated class to {class_name} with confidence {confidence:.2f}")
        else:
            logger.warning(f"Invalid class name: {class_name}. Valid classes: {self.classes}")
    
    def update_settings(self, settings: Dict[str, Any]) -> None:
        """
        Update processor settings
        
        Args:
            settings: Dictionary of settings to update
        """
        if "sampling_rate" in settings:
            new_rate = int(settings["sampling_rate"])
            if new_rate != self.sampling_rate:
                self.sampling_rate = new_rate
                # Update buffer size
                self.buffer_samples = int(self.sampling_rate * self.buffer_duration)
                self.data_buffer = np.zeros((len(self.electrode_names), self.buffer_samples))
                logger.info(f"Updated sampling rate to {new_rate} Hz")
        
        if "buffer_duration" in settings:
            new_duration = float(settings["buffer_duration"])
            if new_duration != self.buffer_duration:
                self.buffer_duration = new_duration
                # Update buffer size
                self.buffer_samples = int(self.sampling_rate * self.buffer_duration)
                self.data_buffer = np.zeros((len(self.electrode_names), self.buffer_samples))
                logger.info(f"Updated buffer duration to {new_duration} s")
        
        if "electrode_names" in settings:
            self.electrode_names = settings["electrode_names"]
            # Resize buffer for new number of electrodes
            self.data_buffer = np.zeros((len(self.electrode_names), self.buffer_samples))
            logger.info(f"Updated electrode names: {self.electrode_names}")
        
        if "frequency_bands" in settings:
            self.frequency_bands = settings["frequency_bands"]
            logger.info(f"Updated frequency bands: {self.frequency_bands}")
        
        if "using_simulated_data" in settings:
            self.using_simulated_data = settings["using_simulated_data"]
            logger.info(f"Updated simulated data mode: {self.using_simulated_data}")
        
        if "classes" in settings:
            self.classes = settings["classes"]
            logger.info(f"Updated classes: {self.classes}")
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get processor status
        
        Returns:
            Dictionary with processor status
        """
        return {
            "active": self.active,
            "error": self.error,
            "mode": "simulated" if self.using_simulated_data else "real",
            "sampling_rate": self.sampling_rate,
            "buffer_duration": self.buffer_duration,
            "buffer_samples": self.buffer_samples,
            "electrode_count": len(self.electrode_names),
            "frequency_bands": self.frequency_bands,
            "simulated_class": self.simulated_class if self.using_simulated_data else None,
            "simulated_confidence": self.simulated_confidence if self.using_simulated_data else None,
            "last_classification": self.classification["class"],
            "last_confidence": self.classification["confidence"],
            "last_update": self.last_update_time,
            "classifier_ready": self.classifier is not None,
            "transformer_ready": self.transformer is not None
        } 