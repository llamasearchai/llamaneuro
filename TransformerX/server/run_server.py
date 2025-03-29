#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
TransformerX Server Runner
Main entry point for starting the TransformerX server
"""

import os
import sys
import argparse
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Import from app module
from server.app import create_app, main

if __name__ == "__main__":
    main() 