#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
TransformerX Server Application
Main Flask application for the TransformerX server
"""

import os
import sys
import time
import logging
import threading
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../logs/server.log'), 'a')
    ]
)
logger = logging.getLogger(__name__)

# Create logs directory if it doesn't exist
os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../logs'), exist_ok=True)

# Flask imports
try:
    from flask import Flask, send_from_directory, jsonify
    from flask_cors import CORS
    HAS_FLASK = True
except ImportError:
    HAS_FLASK = False
    logger.error("Flask or Flask-CORS not available, please install with: pip install flask flask-cors")
    sys.exit(1)

# Import modules
try:
    from utils import config, init_config
    from neuro_processor import NeuroProcessor
    from llama_interface import LlamaInterface, HAS_LLAMA
    from api import init_routes
except ImportError as e:
    logger.error(f"Failed to import required modules: {e}")
    logger.error("Please make sure all required packages are installed")
    sys.exit(1)

def create_app(config_path=None):
    """
    Create and configure the Flask application
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        Configured Flask application
    """
    # Initialize configuration
    if config_path:
        init_config(config_path)
    
    # Create Flask app
    app = Flask(__name__, static_folder=None)
    
    # Enable CORS
    CORS(app)
    
    # Get configuration values
    dashboard_dir = config.get("server.dashboard_dir")
    dashboard_path = os.path.abspath(os.path.join(os.path.dirname(__file__), dashboard_dir))
    
    # Initialize components
    neuro_processor = NeuroProcessor(
        sampling_rate=config.get("neuro_processor.sampling_rate"),
        buffer_duration=config.get("neuro_processor.buffer_duration"),
        using_simulated_data=config.get("neuro_processor.use_simulated_data", True),
        electrode_names=config.get("neuro_processor.electrode_names"),
        frequency_bands=config.get("neuro_processor.frequency_bands"),
        transformer_model_path=config.get("neuro_processor.model_paths.transformer"),
        classifier_model_path=config.get("neuro_processor.model_paths.classifier")
    )
    
    # Initialize LLaMA interface
    llama_interface = LlamaInterface(
        model_path=config.get("llama_interface.model_path"),
        use_quantization=config.get("llama_interface.use_quantization"),
        context_length=config.get("llama_interface.context_length"),
        temperature=config.get("llama_interface.temperature"),
        top_p=config.get("llama_interface.top_p"),
        repetition_penalty=config.get("llama_interface.repetition_penalty"),
        neural_guidance_strength=config.get("llama_interface.neural_guidance_strength"),
        semantic_mapping=config.get("llama_interface.semantic_mapping")
    )
    
    # Initialize API routes
    init_routes(app, neuro_processor, llama_interface, config)
    
    # Route to serve dashboard static files
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_dashboard(path):
        """Serve dashboard files"""
        if path == "" or path == "/" or path == "index.html":
            return send_from_directory(dashboard_path, "index.html")
        return send_from_directory(dashboard_path, path)
    
    # Add error handlers
    @app.errorhandler(404)
    def not_found(e):
        """Handle 404 errors"""
        return jsonify({"error": "Not found"}), 404
    
    @app.errorhandler(500)
    def server_error(e):
        """Handle 500 errors"""
        return jsonify({"error": "Server error"}), 500
    
    # Start components in background threads
    def start_components():
        """Start neuro processor and LLaMA interface in background"""
        time.sleep(2)  # Wait for server to start
        
        # Start neural processor
        if config.get("neuro_processor.active"):
            logger.info("Starting Neural Processor...")
            neuro_processor.start()
        
        # Start LLaMA interface
        if config.get("llama_interface.active"):
            logger.info("Starting LLaMA Interface...")
            llama_interface.start()
    
    # Start components in background thread
    if not (os.environ.get('WERKZEUG_RUN_MAIN') == 'true'):
        threading.Thread(target=start_components, daemon=True).start()
    
    return app

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="TransformerX Server")
    parser.add_argument("--config", "-c", type=str, help="Path to configuration file")
    parser.add_argument("--host", type=str, help="Host to run the server on")
    parser.add_argument("--port", type=int, help="Port to run the server on")
    parser.add_argument("--debug", action="store_true", help="Run in debug mode")
    parser.add_argument("--dev", action="store_true", help="Run in development mode")
    
    args = parser.parse_args()
    
    # Create the application
    app = create_app(args.config)
    
    # Get configuration values
    host = args.host or config.get("server.host")
    port = args.port or config.get("server.port")
    debug = args.debug or config.get("server.debug") or args.dev
    
    # Display server info
    logger.info(f"Starting TransformerX Server on http://{host}:{port}")
    logger.info(f"Dashboard available at http://{host}:{port}")
    logger.info(f"API available at http://{host}:{port}{config.get('server.api_prefix')}")
    
    # Run the server
    app.run(host=host, port=port, debug=debug, threaded=True)

if __name__ == "__main__":
    main() 