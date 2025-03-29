#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Setup script for TransformerX
This is mainly for backwards compatibility - prefer using pyproject.toml
"""

from setuptools import setup, find_packages

setup(
    name="transformerx",
    version="1.0.0",
    packages=find_packages(),
    include_package_data=True,
    python_requires=">=3.8",
) 