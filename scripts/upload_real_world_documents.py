#!/usr/bin/env python3
"""
Script to batch upload real-world documents to the Temporal Document Embeddings Platform.

Usage:
    python scripts/upload_real_world_documents.py --directory /path/to/documents
    python scripts/upload_real_world_documents.py --file document.pdf --lifecycle-id lifecycle_001 --document-type "Purchase Order"
"""

import os
import sys
import argparse
import requests
from pathlib import Path
from typing import Optional, List, Dict
import json
import time

# Add parent directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

API_BASE = "http://localhost:8000"
API_KEY = "dev-local-key"

SUPPORTED_EXTENSIONS = {'.pdf', '.docx', '.doc', '.txt', '.csv', '.xlsx', '.xls', '.json'}


def upload_document(
    file_path: str,
    lifecycle_id: Optional[str] = None,
    document_type: Optional[str] = None,
    api_base: str = API_BASE,
    api_key: str = API_KEY
) -> Dict:
    """
    Upload a document to the system.
    
    Args:
        file_path: Path to the document file
        lifecycle_id: Optional lifecycle ID (will be auto-detected if not provided)
        document_type: Optional document type (will be auto-detected if not provided)
        api_base: API base URL
        api_key: API key for authentication
    
    Returns:
        Response dictionary from the API
    """
    url = f"{api_base}/api/documents/upload"
    headers = {"X-API-Key": api_key}
    
    file_ext = Path(file_path).suffix.lower()
    if file_ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {file_ext}. Supported: {SUPPORTED_EXTENSIONS}")
    
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    # Determine MIME type
    mime_types = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel',
        '.json': 'application/json'
    }
    mime_type = mime_types.get(file_ext, 'application/octet-stream')
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (os.path.basename(file_path), f, mime_type)}
            data = {}
            if lifecycle_id:
                data['lifecycle_id'] = lifecycle_id
            if document_type:
                data['document_type'] = document_type
            
            response = requests.post(url, headers=headers, files=files, data=data, timeout=120)
            response.raise_for_status()
            return response.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to upload {file_path}: {str(e)}")


def detect_lifecycle_id_from_filename(filename: str) -> Optional[str]:
    """Extract lifecycle ID from filename patterns."""
    import re
    
    # Pattern: LC001, lifecycle_001, LC-001, etc.
    patterns = [
        r'LC[_-]?(\d+)',
        r'lifecycle[_-]?(\d+)',
        r'LC(\d{3,})',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, filename, re.IGNORECASE)
        if match:
            num = match.group(1).zfill(3)
            return f"lifecycle_{num}"
    
    return None


def detect_document_type_from_filename(filename: str) -> Optional[str]:
    """Extract document type from filename patterns."""
    filename_upper = filename.upper()
    
    type_mappings = {
        'PO': 'Purchase Order',
        'PURCHASE_ORDER': 'Purchase Order',
        'CO': 'Change Order',
        'CHANGE_ORDER': 'Change Order',
        'INV': 'Invoice',
        'INVOICE': 'Invoice',
        'CONTRACT': 'Contract',
        'RESUME': 'Resume',
        'CV': 'Resume',
        'APPLICATION': 'Application',
        'OFFER': 'Offer Letter',
        'PROPOSAL': 'Proposal',
        'QUOTE': 'Quote',
        'LEAD': 'Lead',
        'NDA': 'NDA',
    }
    
    for key, doc_type in type_mappings.items():
        if key in filename_upper:
            return doc_type
    
    return None


def upload_directory(
    directory: str,
    recursive: bool = True,
    delay: float = 1.0
) -> List[Dict]:
    """
    Upload all supported documents from a directory.
    
    Args:
        directory: Directory path containing documents
        recursive: Whether to search subdirectories
        delay: Delay between uploads (seconds)
    
    Returns:
        List of upload results
    """
    directory_path = Path(directory)
    if not directory_path.exists():
        raise FileNotFoundError(f"Directory not found: {directory}")
    
    results = []
    
    # Find all supported files
    pattern = "**/*" if recursive else "*"
    files = []
    for ext in SUPPORTED_EXTENSIONS:
        files.extend(directory_path.glob(f"{pattern}{ext}"))
    
    print(f"Found {len(files)} documents to upload")
    
    for i, file_path in enumerate(files, 1):
        print(f"\n[{i}/{len(files)}] Uploading: {file_path.name}")
        
        # Try to detect lifecycle ID and document type from filename
        lifecycle_id = detect_lifecycle_id_from_filename(file_path.name)
        document_type = detect_document_type_from_filename(file_path.name)
        
        if lifecycle_id:
            print(f"  Detected lifecycle ID: {lifecycle_id}")
        if document_type:
            print(f"  Detected document type: {document_type}")
        
        try:
            result = upload_document(
                str(file_path),
                lifecycle_id=lifecycle_id,
                document_type=document_type
            )
            results.append({
                'file': str(file_path),
                'status': 'success',
                'result': result
            })
            print(f"  ✓ Success: {result.get('document_id', 'N/A')}")
        except Exception as e:
            results.append({
                'file': str(file_path),
                'status': 'error',
                'error': str(e)
            })
            print(f"  ✗ Error: {str(e)}")
        
        # Delay between uploads to avoid overwhelming the server
        if i < len(files):
            time.sleep(delay)
    
    return results


def main():
    parser = argparse.ArgumentParser(
        description="Upload real-world documents to the Temporal Document Embeddings Platform"
    )
    parser.add_argument(
        '--file',
        type=str,
        help='Single file to upload'
    )
    parser.add_argument(
        '--directory',
        type=str,
        help='Directory containing documents to upload'
    )
    parser.add_argument(
        '--lifecycle-id',
        type=str,
        help='Lifecycle ID (optional, will be auto-detected if not provided)'
    )
    parser.add_argument(
        '--document-type',
        type=str,
        help='Document type (optional, will be auto-detected if not provided)'
    )
    parser.add_argument(
        '--api-base',
        type=str,
        default=API_BASE,
        help=f'API base URL (default: {API_BASE})'
    )
    parser.add_argument(
        '--api-key',
        type=str,
        default=API_KEY,
        help=f'API key (default: {API_KEY})'
    )
    parser.add_argument(
        '--delay',
        type=float,
        default=1.0,
        help='Delay between uploads in seconds (default: 1.0)'
    )
    parser.add_argument(
        '--output',
        type=str,
        help='Output JSON file to save upload results'
    )
    
    args = parser.parse_args()
    
    if not args.file and not args.directory:
        parser.error("Either --file or --directory must be provided")
    
    results = []
    
    try:
        if args.file:
            # Upload single file
            print(f"Uploading single file: {args.file}")
            result = upload_document(
                args.file,
                lifecycle_id=args.lifecycle_id,
                document_type=args.document_type,
                api_base=args.api_base,
                api_key=args.api_key
            )
            results.append({
                'file': args.file,
                'status': 'success',
                'result': result
            })
            print(f"\n✓ Successfully uploaded: {result.get('document_id', 'N/A')}")
        
        elif args.directory:
            # Upload directory
            print(f"Uploading documents from directory: {args.directory}")
            results = upload_directory(
                args.directory,
                recursive=True,
                delay=args.delay
            )
            
            # Print summary
            successful = sum(1 for r in results if r['status'] == 'success')
            failed = sum(1 for r in results if r['status'] == 'error')
            print(f"\n{'='*60}")
            print(f"Upload Summary:")
            print(f"  Total: {len(results)}")
            print(f"  Successful: {successful}")
            print(f"  Failed: {failed}")
            print(f"{'='*60}")
        
        # Save results to file if requested
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"\nResults saved to: {args.output}")
    
    except Exception as e:
        print(f"\n✗ Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
