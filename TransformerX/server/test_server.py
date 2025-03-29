#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Test Script for TransformerX Server
Verifies the functionality of the server components
"""

import os
import sys
import time
import json
import argparse
import requests
from typing import Dict, Any, List, Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import server modules
from server.utils import config
from server.neuro_processor import NeuroProcessor
from server.llama_interface import LlamaInterface

def test_components():
    """Test individual components"""
    print("\n=== Testing Individual Components ===")
    
    # Test configuration
    print("\nTesting Configuration...")
    try:
        assert config is not None, "Config not initialized"
        print("✓ Configuration loaded successfully")
        print(f"  - Server port: {config.get('server.port')}")
        print(f"  - API prefix: {config.get('server.api_prefix')}")
    except Exception as e:
        print(f"✗ Configuration test failed: {str(e)}")
    
    # Test neural processor
    print("\nTesting Neural Processor...")
    try:
        processor = NeuroProcessor(
            sampling_rate=250,
            buffer_duration=2.0,
            using_simulated_data=True
        )
        assert processor is not None, "Neural processor not initialized"
        print("✓ Neural processor initialized successfully")
        
        # Test starting the processor
        success = processor.start()
        assert success, "Failed to start neural processor"
        print("✓ Neural processor started successfully")
        
        # Test getting data
        time.sleep(0.5)  # Wait for processing
        data = processor.get_current_data()
        assert data is not None, "Failed to get data from neural processor"
        assert "classification" in data, "No classification in data"
        print("✓ Neural processor data retrieved successfully")
        print(f"  - Classification: {data['classification']['class']}")
        print(f"  - Confidence: {data['classification']['confidence']:.2f}")
        
        # Test stopping the processor
        processor.stop()
        print("✓ Neural processor stopped successfully")
    except Exception as e:
        print(f"✗ Neural processor test failed: {str(e)}")
    
    # Test LLaMA interface
    print("\nTesting LLaMA Interface...")
    try:
        llama = LlamaInterface(
            model_path="dummy_model",
            use_quantization=False
        )
        assert llama is not None, "LLaMA interface not initialized"
        print("✓ LLaMA interface initialized successfully")
        
        # Test starting the interface
        success = llama.start()
        assert success, "Failed to start LLaMA interface"
        print("✓ LLaMA interface started successfully")
        
        # Test generating text
        result = llama._generate_text_internal("Hello, world!")
        assert "text" in result, "No text in generation result"
        print("✓ LLaMA text generation successful")
        print(f"  - Generated text: {result['text']}")
        
        # Test stopping the interface
        llama.stop()
        print("✓ LLaMA interface stopped successfully")
    except Exception as e:
        print(f"✗ LLaMA interface test failed: {str(e)}")

def test_api(base_url: str = "http://localhost:8080"):
    """
    Test API endpoints
    
    Args:
        base_url: Base URL of the server
    """
    print("\n=== Testing API Endpoints ===")
    api_prefix = config.get("server.api_prefix", "/api/v1")
    api_url = f"{base_url}{api_prefix}"
    
    # Test status endpoint
    print("\nTesting Status Endpoint...")
    try:
        response = requests.get(f"{api_url}/status")
        assert response.status_code == 200, f"Status endpoint returned {response.status_code}"
        data = response.json()
        assert "neuro_processor" in data, "No neuro_processor in status"
        assert "llama_interface" in data, "No llama_interface in status"
        print("✓ Status endpoint working")
        print(f"  - Neuro processor active: {data['neuro_processor']['active']}")
        print(f"  - LLaMA interface active: {data['llama_interface']['active']}")
    except Exception as e:
        print(f"✗ Status endpoint test failed: {str(e)}")
    
    # Test starting neural processor
    print("\nTesting Neural Processor Start Endpoint...")
    try:
        response = requests.post(f"{api_url}/neuro/start")
        assert response.status_code == 200, f"Neuro start endpoint returned {response.status_code}"
        data = response.json()
        assert data.get("success", False), "Failed to start neural processor"
        print("✓ Neural processor start endpoint working")
    except Exception as e:
        print(f"✗ Neural processor start endpoint test failed: {str(e)}")
    
    # Test neural processor status
    print("\nTesting Neural Processor Status Endpoint...")
    try:
        response = requests.get(f"{api_url}/neuro/status")
        assert response.status_code == 200, f"Neuro status endpoint returned {response.status_code}"
        data = response.json()
        assert "active" in data, "No active status in response"
        print("✓ Neural processor status endpoint working")
        print(f"  - Active: {data['active']}")
        print(f"  - Mode: {data['mode']}")
    except Exception as e:
        print(f"✗ Neural processor status endpoint test failed: {str(e)}")
    
    # Test simulating neural data
    print("\nTesting Neural Data Simulation Endpoint...")
    try:
        response = requests.post(
            f"{api_url}/neuro/simulate_data",
            json={"class": "left_hand", "confidence": 0.9}
        )
        assert response.status_code == 200, f"Neuro simulate endpoint returned {response.status_code}"
        data = response.json()
        assert data.get("success", False), "Failed to simulate neural data"
        print("✓ Neural data simulation endpoint working")
    except Exception as e:
        print(f"✗ Neural data simulation endpoint test failed: {str(e)}")
    
    # Test starting LLaMA interface
    print("\nTesting LLaMA Interface Start Endpoint...")
    try:
        response = requests.post(f"{api_url}/llama/start")
        assert response.status_code == 200, f"LLaMA start endpoint returned {response.status_code}"
        data = response.json()
        assert data.get("success", False), "Failed to start LLaMA interface"
        print("✓ LLaMA interface start endpoint working")
    except Exception as e:
        print(f"✗ LLaMA interface start endpoint test failed: {str(e)}")
    
    # Test LLaMA interface status
    print("\nTesting LLaMA Interface Status Endpoint...")
    try:
        response = requests.get(f"{api_url}/llama/status")
        assert response.status_code == 200, f"LLaMA status endpoint returned {response.status_code}"
        data = response.json()
        assert "active" in data, "No active status in response"
        print("✓ LLaMA interface status endpoint working")
        print(f"  - Active: {data['active']}")
        print(f"  - Ready: {data['ready']}")
    except Exception as e:
        print(f"✗ LLaMA interface status endpoint test failed: {str(e)}")
    
    # Test generating text
    print("\nTesting LLaMA Text Generation Endpoint...")
    try:
        response = requests.post(
            f"{api_url}/llama/generate",
            json={"prompt": "Hello, world!", "max_length": 50}
        )
        assert response.status_code == 200, f"LLaMA generate endpoint returned {response.status_code}"
        data = response.json()
        assert "text" in data, "No text in generation result"
        print("✓ LLaMA text generation endpoint working")
        print(f"  - Generated text: {data['text']}")
    except Exception as e:
        print(f"✗ LLaMA text generation endpoint test failed: {str(e)}")
    
    # Test neural LLaMA processing
    print("\nTesting Neural LLaMA Processing Endpoint...")
    try:
        response = requests.post(
            f"{api_url}/neural_llama/process",
            json={"prompt": "Translate neural activity into language"}
        )
        assert response.status_code == 200, f"Neural LLaMA endpoint returned {response.status_code}"
        data = response.json()
        assert "text" in data, "No text in result"
        assert "neural_data" in data, "No neural data in result"
        print("✓ Neural LLaMA processing endpoint working")
        print(f"  - Generated text: {data['text']}")
        print(f"  - Neural class: {data['neural_data']['classification']['class']}")
    except Exception as e:
        print(f"✗ Neural LLaMA processing endpoint test failed: {str(e)}")
    
    # Test stopping neural processor
    print("\nTesting Neural Processor Stop Endpoint...")
    try:
        response = requests.post(f"{api_url}/neuro/stop")
        assert response.status_code == 200, f"Neuro stop endpoint returned {response.status_code}"
        data = response.json()
        assert data.get("success", False), "Failed to stop neural processor"
        print("✓ Neural processor stop endpoint working")
    except Exception as e:
        print(f"✗ Neural processor stop endpoint test failed: {str(e)}")
    
    # Test stopping LLaMA interface
    print("\nTesting LLaMA Interface Stop Endpoint...")
    try:
        response = requests.post(f"{api_url}/llama/stop")
        assert response.status_code == 200, f"LLaMA stop endpoint returned {response.status_code}"
        data = response.json()
        assert data.get("success", False), "Failed to stop LLaMA interface"
        print("✓ LLaMA interface stop endpoint working")
    except Exception as e:
        print(f"✗ LLaMA interface stop endpoint test failed: {str(e)}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Test TransformerX Server")
    parser.add_argument("--components", action="store_true", help="Test individual components")
    parser.add_argument("--api", action="store_true", help="Test API endpoints")
    parser.add_argument("--url", type=str, default="http://localhost:8080", help="Server URL")
    
    args = parser.parse_args()
    
    # If no specific tests are requested, run all tests
    run_all = not (args.components or args.api)
    
    print("=== TransformerX Server Test ===")
    
    if args.components or run_all:
        test_components()
    
    if args.api or run_all:
        test_api(args.url)
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main() 