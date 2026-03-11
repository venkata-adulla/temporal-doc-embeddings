#!/bin/bash
# Fix PyTorch/transformers compatibility issue

cd /mnt/d/Venkat/AI_Agents/temporal-doc-embeddings/backend
source venv/bin/activate

echo "Upgrading PyTorch and transformers to compatible versions..."
pip install --upgrade torch==2.0.1 transformers==4.35.2 sentence-transformers==2.2.2

echo "Done! Please restart the backend server."
