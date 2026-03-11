#!/bin/bash
# Installation script for backend dependencies

echo "Installing Python dependencies..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Install requirements
pip install --upgrade pip
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

echo "Installation complete!"
