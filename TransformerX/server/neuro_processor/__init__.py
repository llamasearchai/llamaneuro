#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Neural Signal Processor Module
Provides functionality for processing EEG signals and extracting features
"""

from .processor import NeuroProcessor
from .feature_extraction import extract_features, extract_frequency_bands, compute_connectivity
from .transformers import TransformerEncoder

__all__ = [
    'NeuroProcessor',
    'extract_features',
    'extract_frequency_bands',
    'compute_connectivity',
    'TransformerEncoder'
] 