#!/usr/bin/env python3
"""Check if PyTorch/transformers compatibility issue is fixed"""

try:
    import torch
    import transformers
    import sentence_transformers
    
    print(f"[OK] PyTorch: {torch.__version__}")
    print(f"[OK] Transformers: {transformers.__version__}")
    print(f"[OK] SentenceTransformers: {sentence_transformers.__version__}")
    
    # Test the import that was failing
    from sentence_transformers import SentenceTransformer
    print("[OK] SentenceTransformer import successful")
    
    # Test if the problematic attribute exists
    try:
        import torch.utils._pytree as pytree
        if hasattr(pytree, 'register_pytree_node') or hasattr(pytree, '_register_pytree_node'):
            print("[OK] PyTorch pytree module is accessible")
        else:
            print("[WARN] PyTorch pytree module structure may have changed")
    except Exception as e:
        print(f"[WARN] Could not check pytree: {e}")
    
    print("\n[SUCCESS] All dependencies are working correctly!")
    print("You can now start the backend server.")
    
except AttributeError as e:
    if 'register_pytree_node' in str(e):
        print(f"[ERROR] Compatibility issue still exists: {e}")
        print("\nPlease run in WSL: bash fix_dependencies.sh")
    else:
        print(f"[ERROR] Error: {e}")
except ImportError as e:
    print(f"[ERROR] Import error: {e}")
    print("\nPlease run in WSL: bash fix_dependencies.sh")
except Exception as e:
    print(f"[ERROR] Unexpected error: {e}")
