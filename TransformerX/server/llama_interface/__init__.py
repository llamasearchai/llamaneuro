#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
LLaMA Interface Module
Provides integration with the LLaMA language model
"""

import logging

# Configure logging
logger = logging.getLogger(__name__)

# Try to import transformers
try:
    from .llama_model import LlamaInterface
    HAS_LLAMA = True
except ImportError:
    from .llama_model import DummyLlama as LlamaInterface
    HAS_LLAMA = False
    logger.warning("Using dummy LLaMA interface due to missing dependencies")

__all__ = ['LlamaInterface', 'HAS_LLAMA'] 