#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
TransformerX Server
Main package for the TransformerX server system
"""

import logging

# Configure logging
logger = logging.getLogger(__name__)

# Version
__version__ = "1.0.0"

from .llama_interface import LlamaInterface
from .neuro_processor import NeuroProcessor

# Import main components for easy access
from .run_server import create_app, main
from .utils import config, init_config

__all__ = [
    "create_app",
    "main",
    "NeuroProcessor",
    "LlamaInterface",
    "config",
    "init_config",
    "__version__",
]
