#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Transformer Models for EEG Signal Processing
Provides transformer-based models for processing and analyzing EEG signals
"""

import numpy as np
import logging
from typing import Dict, List, Tuple, Any, Optional, Union

# Configure logging
logger = logging.getLogger(__name__)

# Try importing PyTorch
try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("PyTorch not available, transformer models will be limited")

if TORCH_AVAILABLE:
    class PositionalEncoding(nn.Module):
        """Positional encoding for transformer models"""
        
        def __init__(self, d_model: int, max_len: int = 5000):
            """
            Initialize positional encoding
            
            Args:
                d_model: Hidden dimension size
                max_len: Maximum sequence length
            """
            super(PositionalEncoding, self).__init__()
            
            # Create positional encoding matrix
            pe = torch.zeros(max_len, d_model)
            position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
            div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
            
            # Apply sin to even positions and cos to odd positions
            pe[:, 0::2] = torch.sin(position * div_term)
            pe[:, 1::2] = torch.cos(position * div_term)
            
            # Add batch dimension and register as buffer
            pe = pe.unsqueeze(0)
            self.register_buffer('pe', pe)
        
        def forward(self, x: torch.Tensor) -> torch.Tensor:
            """
            Add positional encoding to input tensor
            
            Args:
                x: Input tensor [batch_size, seq_len, d_model]
                
            Returns:
                Tensor with positional encoding added
            """
            return x + self.pe[:, :x.size(1), :]

    class AttentionBlock(nn.Module):
        """Multi-head attention block with residual connection and layer normalization"""
        
        def __init__(
            self,
            embed_dim: int,
            num_heads: int,
            dropout: float = 0.1
        ):
            """
            Initialize attention block
            
            Args:
                embed_dim: Hidden dimension size
                num_heads: Number of attention heads
                dropout: Dropout probability
            """
            super(AttentionBlock, self).__init__()
            
            # Multi-head attention
            self.attention = nn.MultiheadAttention(embed_dim, num_heads, dropout=dropout)
            
            # Feed-forward network
            self.feed_forward = nn.Sequential(
                nn.Linear(embed_dim, embed_dim * 4),
                nn.ReLU(),
                nn.Dropout(dropout),
                nn.Linear(embed_dim * 4, embed_dim)
            )
            
            # Layer normalization
            self.norm1 = nn.LayerNorm(embed_dim)
            self.norm2 = nn.LayerNorm(embed_dim)
            
            # Dropout
            self.dropout = nn.Dropout(dropout)
        
        def forward(
            self,
            x: torch.Tensor,
            return_attention: bool = False
        ) -> Union[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
            """
            Process input through attention block
            
            Args:
                x: Input tensor [batch_size, seq_len, embed_dim]
                return_attention: Whether to return attention weights
                
            Returns:
                Output tensor or tuple of (output tensor, attention weights)
            """
            # Transpose for multi-head attention
            x_t = x.transpose(0, 1)
            
            # Apply multi-head attention
            attn_output, attn_weights = self.attention(x_t, x_t, x_t)
            
            # Residual connection and layer normalization
            x = x + self.dropout(attn_output.transpose(0, 1))
            x = self.norm1(x)
            
            # Feed-forward network with residual connection
            ff_output = self.feed_forward(x)
            x = x + self.dropout(ff_output)
            x = self.norm2(x)
            
            if return_attention:
                return x, attn_weights
            return x

    class TransformerEncoder(nn.Module):
        """Transformer encoder for EEG signal processing"""
        
        def __init__(
            self,
            input_dim: int,
            hidden_dim: int = 128,
            num_heads: int = 8,
            num_layers: int = 4,
            dropout: float = 0.1
        ):
            """
            Initialize transformer encoder
            
            Args:
                input_dim: Input feature dimension
                hidden_dim: Hidden layer dimension
                num_heads: Number of attention heads
                num_layers: Number of transformer blocks
                dropout: Dropout probability
            """
            super(TransformerEncoder, self).__init__()
            
            self.input_dim = input_dim
            self.hidden_dim = hidden_dim
            self.num_heads = num_heads
            self.num_layers = num_layers
            
            # Input projection
            self.input_projection = nn.Linear(input_dim, hidden_dim)
            
            # Positional encoding
            self.pos_encoder = PositionalEncoding(hidden_dim)
            
            # Transformer blocks
            self.transformer_blocks = nn.ModuleList([
                AttentionBlock(hidden_dim, num_heads, dropout)
                for _ in range(num_layers)
            ])
            
            # Output projection
            self.output_projection = nn.Linear(hidden_dim, hidden_dim)
            
            # Initialize parameters
            self._init_parameters()
        
        def _init_parameters(self):
            """Initialize model parameters"""
            for p in self.parameters():
                if p.dim() > 1:
                    nn.init.xavier_uniform_(p)
        
        def forward(
            self,
            x: torch.Tensor,
            return_attention: bool = False
        ) -> Union[torch.Tensor, Tuple[torch.Tensor, torch.Tensor]]:
            """
            Process input through transformer encoder
            
            Args:
                x: Input tensor [batch_size, channels, features] or [batch_size, sequence_length, features]
                return_attention: Whether to return attention weights
                
            Returns:
                Output tensor or tuple of (output tensor, attention weights)
            """
            # If input has shape [batch_size, channels, features], transpose to [batch_size, features, channels]
            if x.dim() == 3 and x.size(1) == self.input_dim:
                x = x.transpose(1, 2)
            
            # Project input to hidden dimension
            x = self.input_projection(x)
            
            # Add positional encoding
            x = self.pos_encoder(x)
            
            # Apply transformer blocks
            attention_weights = None
            for i, block in enumerate(self.transformer_blocks):
                if i == len(self.transformer_blocks) - 1 and return_attention:
                    # Return attention weights from the last block
                    x, attention_weights = block(x, return_attention=True)
                else:
                    x = block(x)
            
            # Apply output projection
            x = self.output_projection(x)
            
            # Global average pooling over sequence dimension
            x = x.mean(dim=1)
            
            if return_attention:
                return x, attention_weights
            return x

else:
    # Dummy implementations for when PyTorch is not available
    class AttentionBlock:
        """Dummy attention block for when PyTorch is not available"""
        
        def __init__(self, *args, **kwargs):
            logger.warning("AttentionBlock initialized without PyTorch")
        
        def __call__(self, x, return_attention=False):
            if return_attention:
                # Return dummy attention weights
                attention = np.random.rand(x.shape[0], x.shape[1], x.shape[1])
                return x, attention
            return x

    class TransformerEncoder:
        """Dummy transformer encoder for when PyTorch is not available"""
        
        def __init__(
            self,
            input_dim: int,
            hidden_dim: int = 128,
            num_heads: int = 8,
            num_layers: int = 4,
            dropout: float = 0.1
        ):
            """
            Initialize dummy transformer encoder
            
            Args:
                input_dim: Input feature dimension
                hidden_dim: Hidden layer dimension
                num_heads: Number of attention heads
                num_layers: Number of transformer blocks
                dropout: Dropout probability
            """
            self.input_dim = input_dim
            self.hidden_dim = hidden_dim
            logger.warning("TransformerEncoder initialized without PyTorch - functionality will be limited")
        
        def __call__(
            self,
            x: np.ndarray,
            return_attention: bool = False
        ) -> Union[np.ndarray, Tuple[np.ndarray, np.ndarray]]:
            """
            Process input through dummy transformer encoder
            
            Args:
                x: Input array
                return_attention: Whether to return attention weights
                
            Returns:
                Output array or tuple of (output array, attention weights)
            """
            # For a dummy implementation, just return a random projection
            if isinstance(x, np.ndarray):
                # Convert to proper shape (batch_size, sequence_length, hidden_dim)
                if x.ndim == 2:
                    # Assume input is (channels, features) or (features, channels)
                    batch_size = 1
                    seq_len = x.shape[0]
                    # Just return a random array of the expected output size
                    output = np.random.randn(batch_size, self.hidden_dim)
                else:
                    # Assume input is (batch_size, channels/sequence, features)
                    batch_size = x.shape[0]
                    seq_len = x.shape[1]
                    output = np.random.randn(batch_size, self.hidden_dim)
                
                if return_attention:
                    # Generate dummy attention weights
                    attention = np.random.rand(batch_size, seq_len, seq_len)
                    return output, attention
                return output
            
            # Fallback for unexpected input type
            logger.warning(f"Unexpected input type: {type(x)}")
            if return_attention:
                return np.zeros(self.hidden_dim), np.zeros((1, 1))
            return np.zeros(self.hidden_dim) 