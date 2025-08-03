#!/usr/bin/env python3
"""
Simple validation script to check the RAG processor structure.
"""

import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def check_module_structure():
    """Check if all modules can be imported."""
    modules_to_check = [
        "rag_processor",
        "rag_processor.models",
        "rag_processor.loaders",
        "rag_processor.chunkers",
        "rag_processor.metadata",
        "rag_processor.transcript_cleaner",
        "rag_processor.framework_extractor",
        "rag_processor.consolidator",
        "rag_processor.file_generator",
        "rag_processor.pipeline",
        "rag_processor.validator",
        "rag_processor.reporter"
    ]
    
    print("Checking module structure...")
    print("-" * 50)
    
    all_good = True
    for module in modules_to_check:
        try:
            exec(f"import {module}")
            print(f"✓ {module}")
        except ImportError as e:
            print(f"✗ {module}: {str(e)}")
            all_good = False
        except Exception as e:
            print(f"✗ {module}: Unexpected error - {str(e)}")
            all_good = False
    
    print("-" * 50)
    return all_good

def check_file_structure():
    """Check if all expected files exist."""
    base_path = Path(__file__).parent
    expected_files = [
        "rag_processor/__init__.py",
        "rag_processor/models.py",
        "rag_processor/loaders.py",
        "rag_processor/chunkers.py",
        "rag_processor/metadata.py",
        "rag_processor/transcript_cleaner.py",
        "rag_processor/framework_extractor.py",
        "rag_processor/consolidator.py",
        "rag_processor/file_generator.py",
        "rag_processor/pipeline.py",
        "rag_processor/validator.py",
        "rag_processor/reporter.py",
        "rag_processor/requirements.txt",
        "process_knowledge_base.py",
        "test_document_processing.py"
    ]
    
    print("\nChecking file structure...")
    print("-" * 50)
    
    all_good = True
    for file_path in expected_files:
        full_path = base_path / file_path
        if full_path.exists():
            print(f"✓ {file_path}")
        else:
            print(f"✗ {file_path}: File not found")
            all_good = False
    
    print("-" * 50)
    return all_good

def check_input_directory():
    """Check if input directory exists."""
    input_dir = Path("./JK knowledge")
    
    print("\nChecking input directory...")
    print("-" * 50)
    
    if input_dir.exists():
        files = list(input_dir.glob("*"))
        print(f"✓ Input directory exists: {input_dir}")
        print(f"  Found {len(files)} files")
        
        # Show first 5 files
        for f in files[:5]:
            print(f"  - {f.name}")
        if len(files) > 5:
            print(f"  ... and {len(files) - 5} more")
        return True
    else:
        print(f"✗ Input directory not found: {input_dir}")
        return False

def main():
    """Run all validation checks."""
    print("=" * 50)
    print("RAG PROCESSOR STRUCTURE VALIDATION")
    print("=" * 50)
    
    results = []
    
    # Check file structure
    results.append(("File Structure", check_file_structure()))
    
    # Check module imports
    results.append(("Module Imports", check_module_structure()))
    
    # Check input directory
    results.append(("Input Directory", check_input_directory()))
    
    # Summary
    print("\n" + "=" * 50)
    print("VALIDATION SUMMARY")
    print("=" * 50)
    
    all_passed = True
    for check_name, passed in results:
        status = "PASS" if passed else "FAIL"
        symbol = "✓" if passed else "✗"
        print(f"{symbol} {check_name}: {status}")
        if not passed:
            all_passed = False
    
    print("=" * 50)
    
    if all_passed:
        print("\n✓ All validation checks passed!")
        print("\nNext steps:")
        print("1. Install dependencies: pip install -r rag_processor/requirements.txt")
        print("2. Run the processor: python process_knowledge_base.py")
        print("3. Run tests: pytest test_document_processing.py -v")
        return 0
    else:
        print("\n✗ Some validation checks failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())