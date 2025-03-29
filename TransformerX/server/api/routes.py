#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
API Routes for TransformerX Server
Defines Flask routes for the API endpoints
"""

import os
import json
import time
import logging
from typing import Dict, Any, List, Optional
from flask import Blueprint, jsonify, request, Response, stream_with_context

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint for API routes
api_bp = Blueprint('api', __name__)

# Module instances will be set by the application
neuro_processor = None
llama_interface = None
config = None

def init_routes(app, processor, llama, cfg):
    """
    Initialize API routes with instances
    
    Args:
        app: Flask application
        processor: NeuroProcessor instance
        llama: LlamaInterface instance
        cfg: Config instance
    """
    global neuro_processor, llama_interface, config
    neuro_processor = processor
    llama_interface = llama
    config = cfg
    
    # Register blueprint with prefix
    prefix = cfg.get("server.api_prefix", "/api/v1")
    app.register_blueprint(api_bp, url_prefix=prefix)
    
    logger.info(f"API routes initialized with prefix: {prefix}")
    
    return api_bp

# System routes
@api_bp.route('/status', methods=['GET'])
def get_status():
    """Get overall system status"""
    status = {
        "timestamp": time.time(),
        "neuro_processor": neuro_processor.get_status() if neuro_processor else {"active": False, "error": "Not initialized"},
        "llama_interface": llama_interface.get_status() if llama_interface else {"active": False, "error": "Not initialized"},
        "version": "1.0.0",
        "uptime": time.time() - _get_start_time()
    }
    
    return jsonify(status)

@api_bp.route('/config', methods=['GET'])
def get_config():
    """Get system configuration"""
    if not config:
        return jsonify({"error": "Configuration not initialized"}), 500
        
    return jsonify(config.as_dict())

@api_bp.route('/config', methods=['POST'])
def update_config():
    """Update system configuration"""
    if not config:
        return jsonify({"error": "Configuration not initialized"}), 500
        
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No configuration data provided"}), 400
            
        # Update config values
        for key_path, value in data.items():
            config.set(key_path, value)
            
        # Apply changes to modules
        if neuro_processor:
            neuro_processor_config = {k.split('.')[-1]: v for k, v in data.items() if k.startswith('neuro_processor.')}
            if neuro_processor_config:
                neuro_processor.update_settings(neuro_processor_config)
                
        if llama_interface:
            llama_config = {k.split('.')[-1]: v for k, v in data.items() if k.startswith('llama_interface.')}
            if llama_config:
                llama_interface.update_settings(llama_config)
        
        return jsonify({"success": True, "message": "Configuration updated"})
        
    except Exception as e:
        logger.error(f"Error updating configuration: {str(e)}")
        return jsonify({"error": f"Error updating configuration: {str(e)}"}), 500

# Neural Processor routes
@api_bp.route('/neuro/start', methods=['POST'])
def start_neuro_processor():
    """Start neural processor"""
    if not neuro_processor:
        return jsonify({"error": "Neural processor not initialized"}), 500
        
    success = neuro_processor.start()
    
    if success:
        return jsonify({"success": True, "message": "Neural processor started"})
    else:
        return jsonify({"error": "Failed to start neural processor"}), 500

@api_bp.route('/neuro/stop', methods=['POST'])
def stop_neuro_processor():
    """Stop neural processor"""
    if not neuro_processor:
        return jsonify({"error": "Neural processor not initialized"}), 500
        
    neuro_processor.stop()
    
    return jsonify({"success": True, "message": "Neural processor stopped"})

@api_bp.route('/neuro/status', methods=['GET'])
def get_neuro_status():
    """Get neural processor status"""
    if not neuro_processor:
        return jsonify({"error": "Neural processor not initialized"}), 500
        
    return jsonify(neuro_processor.get_status())

@api_bp.route('/neuro/data', methods=['GET'])
def get_neuro_data():
    """Stream neural processor data"""
    if not neuro_processor:
        return jsonify({"error": "Neural processor not initialized"}), 500
        
    if not neuro_processor.active:
        return jsonify({"error": "Neural processor is not active"}), 400
    
    def generate():
        """Generate SSE data stream"""
        while neuro_processor.active:
            # Get current data
            data = neuro_processor.get_current_data()
            
            if data:
                # Format as SSE event
                yield f"data: {json.dumps(data)}\n\n"
            
            # Wait before next update
            time.sleep(0.1)
    
    return Response(stream_with_context(generate()), 
                   mimetype='text/event-stream',
                   headers={'Cache-Control': 'no-cache', 
                           'Connection': 'keep-alive'})

@api_bp.route('/neuro/reset', methods=['POST'])
def reset_neuro_processor():
    """Reset neural processor state"""
    if not neuro_processor:
        return jsonify({"error": "Neural processor not initialized"}), 500
        
    neuro_processor.reset()
    
    return jsonify({"success": True, "message": "Neural processor reset"})

@api_bp.route('/neuro/simulate_data', methods=['POST'])
def simulate_neuro_data():
    """Simulate neural data for testing"""
    if not neuro_processor:
        return jsonify({"error": "Neural processor not initialized"}), 500
        
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No simulation data provided"}), 400
            
        # Set simulated class if provided
        if 'class' in data:
            neuro_processor.set_simulated_class(data['class'], data.get('confidence', 0.8))
            
        return jsonify({"success": True, "message": f"Simulated data set to class: {data.get('class', 'None')}"})
        
    except Exception as e:
        logger.error(f"Error simulating neural data: {str(e)}")
        return jsonify({"error": f"Error simulating neural data: {str(e)}"}), 500

# LLaMA Interface routes
@api_bp.route('/llama/start', methods=['POST'])
def start_llama():
    """Start LLaMA interface"""
    if not llama_interface:
        return jsonify({"error": "LLaMA interface not initialized"}), 500
        
    success = llama_interface.start()
    
    if success:
        return jsonify({"success": True, "message": "LLaMA interface started"})
    else:
        return jsonify({"error": "Failed to start LLaMA interface", "details": llama_interface.error}), 500

@api_bp.route('/llama/stop', methods=['POST'])
def stop_llama():
    """Stop LLaMA interface"""
    if not llama_interface:
        return jsonify({"error": "LLaMA interface not initialized"}), 500
        
    llama_interface.stop()
    
    return jsonify({"success": True, "message": "LLaMA interface stopped"})

@api_bp.route('/llama/status', methods=['GET'])
def get_llama_status():
    """Get LLaMA interface status"""
    if not llama_interface:
        return jsonify({"error": "LLaMA interface not initialized"}), 500
        
    return jsonify(llama_interface.get_status())

@api_bp.route('/llama/generate', methods=['POST'])
def generate_text():
    """Generate text using LLaMA model"""
    if not llama_interface:
        return jsonify({"error": "LLaMA interface not initialized"}), 500
        
    if not llama_interface.active:
        return jsonify({"error": "LLaMA interface is not active"}), 400
        
    try:
        data = request.json
        
        if not data or 'prompt' not in data:
            return jsonify({"error": "No prompt provided"}), 400
            
        prompt = data['prompt']
        max_length = data.get('max_length', 100)
        
        # Set neural guidance if provided
        if 'neural_class' in data and 'neural_confidence' in data:
            llama_interface.set_neural_guidance(
                data['neural_class'],
                float(data['neural_confidence']),
                data.get('attention_weights')
            )
        
        # This is a synchronous endpoint for simplicity
        # In a production system, this should be asynchronous
        result = llama_interface._generate_text_internal(prompt, max_length)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error generating text: {str(e)}")
        return jsonify({"error": f"Error generating text: {str(e)}"}), 500

@api_bp.route('/llama/settings', methods=['POST'])
def update_llama_settings():
    """Update LLaMA interface settings"""
    if not llama_interface:
        return jsonify({"error": "LLaMA interface not initialized"}), 500
        
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No settings provided"}), 400
            
        llama_interface.update_settings(data)
        
        return jsonify({"success": True, "message": "LLaMA settings updated"})
        
    except Exception as e:
        logger.error(f"Error updating LLaMA settings: {str(e)}")
        return jsonify({"error": f"Error updating LLaMA settings: {str(e)}"}), 500

@api_bp.route('/llama/history', methods=['GET'])
def get_llama_history():
    """Get LLaMA message history"""
    if not llama_interface:
        return jsonify({"error": "LLaMA interface not initialized"}), 500
        
    return jsonify({"history": llama_interface.message_history})

@api_bp.route('/neural_llama/process', methods=['POST'])
def process_neural_llama():
    """
    Process neural data and generate text
    This endpoint combines neural processing and LLaMA text generation
    """
    if not neuro_processor or not llama_interface:
        return jsonify({"error": "Neural processor or LLaMA interface not initialized"}), 500
        
    if not neuro_processor.active:
        return jsonify({"error": "Neural processor is not active"}), 400
        
    if not llama_interface.active:
        return jsonify({"error": "LLaMA interface is not active"}), 400
        
    try:
        data = request.json
        
        if not data or 'prompt' not in data:
            return jsonify({"error": "No prompt provided"}), 400
            
        prompt = data['prompt']
        max_length = data.get('max_length', 100)
        
        # Get neural data from processor
        neural_data = neuro_processor.get_current_data()
        
        if not neural_data or 'classification' not in neural_data:
            return jsonify({"error": "No neural classification available"}), 400
            
        # Set neural guidance
        neural_class = neural_data['classification']['class']
        neural_confidence = neural_data['classification']['confidence']
        attention_weights = neural_data.get('attention_weights')
        
        llama_interface.set_neural_guidance(neural_class, neural_confidence, attention_weights)
        
        # Generate text
        result = llama_interface._generate_text_internal(prompt, max_length)
        
        # Add neural data to result
        result['neural_data'] = neural_data
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error processing neural LLaMA request: {str(e)}")
        return jsonify({"error": f"Error processing neural LLaMA request: {str(e)}"}), 500


# Helper functions
_start_time = time.time()

def _get_start_time():
    """Get server start time"""
    global _start_time
    return _start_time 