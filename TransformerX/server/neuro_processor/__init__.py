#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Neural Signal Processor Module
Provides functionality for processing EEG signals and extracting features
"""

from .feature_extraction import (
    compute_connectivity,
    extract_features,
    extract_frequency_bands,
)
from .processor import NeuroProcessor
from .transformers import TransformerEncoder

__all__ = [
    "NeuroProcessor",
    "extract_features",
    "extract_frequency_bands",
    "compute_connectivity",
    "TransformerEncoder",
]
