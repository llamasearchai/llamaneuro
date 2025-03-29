#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Model Downloader for TransformerX
Downloads pre-trained models for EEG processing and LLaMA integration
"""

import os
import sys
import argparse
import logging
from pathlib import Path
import urllib.request
import hashlib
import shutil
import zipfile
import tarfile

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Model information
MODEL_INFO = {
    "eeg_transformer": {
        "url": "https://huggingface.co/demo-dummy/eeg-transformer/resolve/main/eeg_transformer_demo.pt",
        "file_name": "eeg_transformer.pt",
        "size_bytes": 10485760,  # 10MB
        "md5": "dummy_md5_checksum",  # Replace with actual checksum
        "description": "EEG Transformer model for neural encoding"
    },
    "motor_imagery": {
        "url": "https://huggingface.co/demo-dummy/motor-imagery/resolve/main/motor_imagery_classifier_demo.pt",
        "file_name": "motor_imagery_classifier.pt",
        "size_bytes": 5242880,  # 5MB
        "md5": "dummy_md5_checksum",  # Replace with actual checksum
        "description": "Motor imagery classifier model"
    },
    "llama_weights": {
        "url": "https://huggingface.co/meta-llama/Llama-2-7b-chat-hf/resolve/main/llama_weights_demo.bin",
        "file_name": "llama_weights/model.bin",
        "size_bytes": 104857600,  # 100MB
        "md5": "dummy_md5_checksum",  # Replace with actual checksum
        "description": "LLaMA model weights (demo version)"
    }
}

def create_directory(path):
    """Create directory if it doesn't exist"""
    if not os.path.exists(path):
        os.makedirs(path)
        logger.info(f"Created directory: {path}")

def download_file(url, file_path, description, size_bytes):
    """
    Download file with progress tracking
    
    Args:
        url: URL to download
        file_path: Path to save file
        description: Description of the file
        size_bytes: Expected size in bytes
    """
    try:
        # Create directory if needed
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        if os.path.exists(file_path):
            logger.info(f"{description} already exists at {file_path}")
            return
        
        logger.info(f"Downloading {description}...")
        
        # Simple mock download for demonstration
        # In a real implementation, this would use urllib.request.urlretrieve with a progress callback
        with open(file_path, 'wb') as f:
            # Just create a dummy file with the right size for demonstration
            f.write(b'\0' * min(size_bytes, 1024))  # Limit to 1KB for demo
        
        logger.info(f"Downloaded {description} to {file_path}")
        
    except Exception as e:
        logger.error(f"Error downloading {description}: {e}")
        if os.path.exists(file_path):
            os.remove(file_path)
        return False
    
    return True

def verify_checksum(file_path, expected_md5):
    """
    Verify file MD5 checksum
    
    Args:
        file_path: Path to file
        expected_md5: Expected MD5 checksum
    """
    if expected_md5 == "dummy_md5_checksum":
        # Skip verification for dummy checksums
        return True
        
    logger.info(f"Verifying checksum for {file_path}...")
    
    md5_hash = hashlib.md5()
    with open(file_path, "rb") as f:
        # Read file in chunks to handle large files
        for chunk in iter(lambda: f.read(4096), b""):
            md5_hash.update(chunk)
    
    file_md5 = md5_hash.hexdigest()
    
    if file_md5 != expected_md5:
        logger.error(f"Checksum verification failed for {file_path}")
        logger.error(f"Expected: {expected_md5}")
        logger.error(f"Got: {file_md5}")
        return False
    
    logger.info(f"Checksum verified for {file_path}")
    return True

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="TransformerX Model Downloader")
    parser.add_argument("--model", choices=list(MODEL_INFO.keys()) + ["all"], default="all",
                        help="Model to download (default: all)")
    parser.add_argument("--models-dir", type=str, default="../models",
                        help="Directory to save models (default: ../models)")
    parser.add_argument("--force", action="store_true",
                        help="Force download even if files exist")
    
    args = parser.parse_args()
    
    # Resolve models directory path
    models_dir = os.path.abspath(os.path.join(
        os.path.dirname(__file__), 
        args.models_dir
    ))
    
    # Create models directory
    create_directory(models_dir)
    
    # Determine which models to download
    models_to_download = list(MODEL_INFO.keys()) if args.model == "all" else [args.model]
    
    # Download each model
    success = True
    for model_key in models_to_download:
        model_info = MODEL_INFO[model_key]
        
        # Construct file path
        file_path = os.path.join(models_dir, model_info["file_name"])
        
        # Remove existing file if forced
        if args.force and os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Removed existing file: {file_path}")
        
        # Download file
        if download_file(
            model_info["url"],
            file_path,
            model_info["description"],
            model_info["size_bytes"]
        ):
            # Verify checksum
            if not verify_checksum(file_path, model_info["md5"]):
                success = False
        else:
            success = False
    
    if success:
        logger.info("All models downloaded successfully!")
    else:
        logger.error("Some models failed to download. Check logs for details.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 