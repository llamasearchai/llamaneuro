#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Feature Extraction Module
Provides functions for extracting features from EEG signals
"""

import numpy as np
import logging
from typing import Dict, List, Tuple, Any, Optional, Union

# Configure logging
logger = logging.getLogger(__name__)

# Try importing signal processing libraries
try:
    from scipy import signal
    from scipy.stats import kurtosis
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    logger.warning("SciPy not available, feature extraction will be limited")

try:
    import mne
    MNE_AVAILABLE = True
except ImportError:
    MNE_AVAILABLE = False
    logger.warning("MNE not available, connectivity features will be limited")

def extract_frequency_bands(
    data: np.ndarray,
    sampling_rate: int,
    frequency_bands: Dict[str, List[float]],
    method: str = 'welch'
) -> Dict[str, np.ndarray]:
    """
    Extract power in specified frequency bands from EEG data
    
    Args:
        data: EEG data [channels, samples]
        sampling_rate: Sampling rate in Hz
        frequency_bands: Dictionary of frequency bands {name: [low_freq, high_freq]}
        method: Method for spectral estimation ('welch' or 'fft')
        
    Returns:
        Dictionary of band powers {band_name: power_array}
    """
    if not SCIPY_AVAILABLE and method == 'welch':
        method = 'fft'
        logger.warning("SciPy not available, using FFT for frequency band extraction")
    
    if method == 'welch' and SCIPY_AVAILABLE:
        # Use Welch's method for power spectral density estimation
        n_channels = data.shape[0]
        window_size = min(256, data.shape[1])
        
        # Compute power spectral density
        freqs, psd = signal.welch(
            data,
            fs=sampling_rate,
            nperseg=window_size,
            noverlap=window_size // 2,
            scaling='density'
        )
        
        # Extract band powers
        band_powers = {}
        for band_name, (low_freq, high_freq) in frequency_bands.items():
            # Find indices corresponding to the frequency band
            idx_band = np.logical_and(freqs >= low_freq, freqs <= high_freq)
            
            # Calculate average power in the band
            if np.any(idx_band):
                band_powers[band_name] = np.mean(psd[:, idx_band], axis=1)
            else:
                band_powers[band_name] = np.zeros(n_channels)
    
    else:
        # Use FFT for spectral estimation
        n_channels, n_samples = data.shape
        
        # Compute FFT
        fft_data = np.fft.rfft(data, axis=1)
        freqs = np.fft.rfftfreq(n_samples, 1.0/sampling_rate)
        
        # Compute power (squared magnitude)
        psd = np.abs(fft_data) ** 2 / n_samples
        
        # Extract band powers
        band_powers = {}
        for band_name, (low_freq, high_freq) in frequency_bands.items():
            # Find indices corresponding to the frequency band
            idx_band = np.logical_and(freqs >= low_freq, freqs <= high_freq)
            
            # Calculate average power in the band
            if np.any(idx_band):
                band_powers[band_name] = np.mean(psd[:, idx_band], axis=1)
            else:
                band_powers[band_name] = np.zeros(n_channels)
    
    return band_powers

def compute_connectivity(
    data: np.ndarray,
    sampling_rate: int,
    method: str = 'coherence',
    frequency_band: Optional[List[float]] = None
) -> np.ndarray:
    """
    Compute connectivity matrix from EEG data
    
    Args:
        data: EEG data [channels, samples]
        sampling_rate: Sampling rate in Hz
        method: Connectivity method ('coherence', 'plv', 'wpli', 'corr')
        frequency_band: Optional frequency band to filter data [low_freq, high_freq]
        
    Returns:
        Connectivity matrix [channels, channels]
    """
    n_channels = data.shape[0]
    
    # Apply band-pass filter if frequency band is specified
    if frequency_band is not None:
        if SCIPY_AVAILABLE:
            low_freq, high_freq = frequency_band
            nyquist = sampling_rate / 2
            
            # Create filter
            b, a = signal.butter(
                4,
                [low_freq / nyquist, high_freq / nyquist],
                btype='bandpass'
            )
            
            # Apply filter
            data = signal.filtfilt(b, a, data, axis=1)
        else:
            logger.warning("SciPy not available, skipping frequency band filtering")
    
    # Use MNE for connectivity if available
    if method == 'coherence' and MNE_AVAILABLE:
        # Create MNE RawArray
        info = mne.create_info(n_channels, sampling_rate, ch_types='eeg')
        raw = mne.io.RawArray(data, info)
        
        # Compute connectivity
        con = mne.connectivity.spectral_connectivity(
            raw,
            method='coh',
            mode='multitaper',
            fmin=frequency_band[0] if frequency_band else 0,
            fmax=frequency_band[1] if frequency_band else sampling_rate/2,
            faverage=True
        )
        
        conn_matrix = con[0]
    
    elif method == 'plv' and MNE_AVAILABLE:
        # Phase Locking Value using MNE
        info = mne.create_info(n_channels, sampling_rate, ch_types='eeg')
        raw = mne.io.RawArray(data, info)
        
        # Compute connectivity
        con = mne.connectivity.spectral_connectivity(
            raw,
            method='plv',
            mode='multitaper',
            fmin=frequency_band[0] if frequency_band else 0,
            fmax=frequency_band[1] if frequency_band else sampling_rate/2,
            faverage=True
        )
        
        conn_matrix = con[0]
    
    else:
        # Fall back to correlation-based connectivity
        # Compute correlation matrix
        conn_matrix = np.corrcoef(data)
    
    return conn_matrix

def extract_temporal_features(
    data: np.ndarray,
    include_hjorth: bool = True
) -> Dict[str, np.ndarray]:
    """
    Extract temporal features from EEG data
    
    Args:
        data: EEG data [channels, samples]
        include_hjorth: Whether to include Hjorth parameters
        
    Returns:
        Dictionary of temporal features {feature_name: feature_array}
    """
    n_channels = data.shape[0]
    
    # Initialize features dictionary
    features = {}
    
    # Basic statistical features
    features['mean'] = np.mean(data, axis=1)
    features['std'] = np.std(data, axis=1)
    features['ptp'] = np.ptp(data, axis=1)  # Peak-to-peak amplitude
    
    # Compute kurtosis if scipy available
    if SCIPY_AVAILABLE:
        features['kurtosis'] = kurtosis(data, axis=1)
    else:
        # Simple kurtosis approximation
        m4 = np.mean((data - features['mean'][:, np.newaxis])**4, axis=1)
        m2 = features['std']**2
        features['kurtosis'] = m4 / (m2**2) - 3
    
    # Hjorth parameters
    if include_hjorth:
        # Activity - variance of the signal
        activity = np.var(data, axis=1)
        features['hjorth_activity'] = activity
        
        # Mobility - square root of variance of the first derivative divided by variance
        diff1 = np.diff(data, axis=1)
        mobility = np.sqrt(np.var(diff1, axis=1) / activity)
        features['hjorth_mobility'] = mobility
        
        # Complexity - ratio of mobility of the first derivative to the mobility
        diff2 = np.diff(diff1, axis=1)
        mobility_diff = np.sqrt(np.var(diff2, axis=1) / np.var(diff1, axis=1))
        features['hjorth_complexity'] = mobility_diff / mobility
    
    return features

def extract_features(
    data: np.ndarray,
    sampling_rate: int,
    frequency_bands: Dict[str, List[float]],
    temporal_features: bool = True,
    spectral_features: bool = True,
    connectivity_features: bool = False,
    connectivity_method: str = 'coherence'
) -> Dict[str, np.ndarray]:
    """
    Extract features from EEG data
    
    Args:
        data: EEG data [channels, samples]
        sampling_rate: Sampling rate in Hz
        frequency_bands: Dictionary of frequency bands {name: [low_freq, high_freq]}
        temporal_features: Whether to extract temporal features
        spectral_features: Whether to extract spectral features
        connectivity_features: Whether to extract connectivity features
        connectivity_method: Method for connectivity computation
        
    Returns:
        Dictionary of features {feature_name: feature_array}
    """
    features = {}
    
    # Extract temporal features
    if temporal_features:
        temp_features = extract_temporal_features(data)
        features.update(temp_features)
    
    # Extract spectral features
    if spectral_features:
        band_powers = extract_frequency_bands(data, sampling_rate, frequency_bands)
        # Add band prefix to feature names
        for band_name, band_power in band_powers.items():
            features[f'band_{band_name}'] = band_power
    
    # Extract connectivity features
    if connectivity_features:
        # Compute connectivity for each frequency band
        for band_name, band_range in frequency_bands.items():
            conn_matrix = compute_connectivity(data, sampling_rate, 
                                             method=connectivity_method,
                                             frequency_band=band_range)
            
            # Flatten upper triangle of connectivity matrix
            triu_indices = np.triu_indices(conn_matrix.shape[0], k=1)
            conn_flat = conn_matrix[triu_indices]
            
            features[f'conn_{band_name}'] = conn_flat
    
    return features 