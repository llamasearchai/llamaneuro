#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Configuration Module for TransformerX
Contains settings and configuration for all components of the system
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional

# Configure logging
logger = logging.getLogger(__name__)

class Config:
    """Configuration class for TransformerX system"""
    
    # Default configuration
    DEFAULT_CONFIG = {
        "server": {
            "host": "0.0.0.0",
            "port": 8080,
            "debug": False,
            "dashboard_dir": "../dashboard",
            "logs_dir": "../logs",
            "api_prefix": "/api/v1"
        },
        "neuro_processor": {
            "active": True,
            "use_simulated_data": True,
            "sampling_rate": 250,
            "buffer_duration": 4.0,  # seconds
            "electrode_names": ["Fp1", "Fp2", "F7", "F3", "Fz", "F4", "F8", "T3", "C3", "Cz", "C4", "T4", "T5", "P3", "Pz", "P4", "T6", "O1", "O2"],
            "frequency_bands": {
                "delta": [0.5, 4],
                "theta": [4, 8],
                "alpha": [8, 13],
                "beta": [13, 30],
                "gamma": [30, 100]
            },
            "model_paths": {
                "transformer": "./models/eeg_transformer.pt",
                "classifier": "./models/motor_imagery_classifier.pt"
            },
            "classes": ["left_hand", "right_hand", "feet", "tongue", "rest"],
            "confidence_threshold": 0.6,
            "update_interval": 0.1,  # seconds
        },
        "llama_interface": {
            "active": True,
            "model_path": "./models/llama_weights",
            "use_quantization": True,
            "context_length": 2048,
            "temperature": 0.7,
            "top_p": 0.9,
            "repetition_penalty": 1.1,
            "num_beams": 1,
            "neural_guidance_strength": 0.5,
            "semantic_mapping": {
                "left_hand": ["move", "change", "shift", "select"],
                "right_hand": ["create", "add", "increase", "new"],
                "feet": ["stop", "pause", "halt", "reduce"],
                "tongue": ["confirm", "accept", "approve", "yes"],
                "rest": ["neutral", "wait", "standby", "idle"]
            }
        }
    }
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize configuration
        
        Args:
            config_path: Path to configuration file (optional)
        """
        self.config_data = self.DEFAULT_CONFIG.copy()
        
        # Load configuration from file if provided
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    file_config = json.load(f)
                    # Update default config with file values
                    self._update_nested_dict(self.config_data, file_config)
                logger.info(f"Loaded configuration from {config_path}")
            except Exception as e:
                logger.error(f"Error loading configuration from {config_path}: {e}")
        else:
            logger.info("Using default configuration")
            
        # Ensure directories exist
        self._ensure_directories()
    
    def _update_nested_dict(self, d: Dict[str, Any], u: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update nested dictionary
        
        Args:
            d: Base dictionary
            u: Dictionary with updates
            
        Returns:
            Updated dictionary
        """
        for k, v in u.items():
            if isinstance(v, dict) and k in d and isinstance(d[k], dict):
                d[k] = self._update_nested_dict(d[k], v)
            else:
                d[k] = v
        return d
    
    def _ensure_directories(self):
        """Create necessary directories from configuration"""
        # Logs directory
        logs_dir = self.get("server.logs_dir")
        if logs_dir:
            os.makedirs(logs_dir, exist_ok=True)
            
        # Models directory
        models_dir = os.path.dirname(self.get("neuro_processor.model_paths.transformer"))
        if models_dir:
            os.makedirs(models_dir, exist_ok=True)
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """
        Get configuration value by dot-separated path
        
        Args:
            key_path: Dot-separated path to configuration value
            default: Default value if key not found
            
        Returns:
            Configuration value
        """
        parts = key_path.split('.')
        current = self.config_data
        
        for part in parts:
            if part not in current:
                return default
            current = current[part]
            
        return current
    
    def set(self, key_path: str, value: Any) -> None:
        """
        Set configuration value by dot-separated path
        
        Args:
            key_path: Dot-separated path to configuration value
            value: Value to set
        """
        parts = key_path.split('.')
        current = self.config_data
        
        for i, part in enumerate(parts[:-1]):
            if part not in current:
                current[part] = {}
            current = current[part]
            
        current[parts[-1]] = value
    
    def save(self, config_path: str) -> bool:
        """
        Save configuration to file
        
        Args:
            config_path: Path to save configuration file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(config_path), exist_ok=True)
            
            # Write config to file
            with open(config_path, 'w') as f:
                json.dump(self.config_data, f, indent=2)
                
            logger.info(f"Configuration saved to {config_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving configuration to {config_path}: {e}")
            return False
            
    def as_dict(self) -> Dict[str, Any]:
        """
        Get complete configuration as dictionary
        
        Returns:
            Configuration dictionary
        """
        return self.config_data.copy()


# Global configuration instance
config = Config()

# Function to initialize from file
def init_config(config_path: str) -> Config:
    """
    Initialize configuration from file
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        Configuration instance
    """
    global config
    config = Config(config_path)
    return config 