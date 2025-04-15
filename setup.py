#!/usr/bin/env python3
"""
Setup script for llamaneuro
"""
from setuptools import find_packages, setup

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="llamaneuro",
    version="0.1.0",
    author="Nik Jois",
    author_email="nikjois@llamasearch.ai",
    description="Advanced toolkit for neuro operations in AI applications",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/llamasearchai/llamaneuro",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        # Add your package dependencies here
    ],
)
