#!/usr/bin/env python3
"""
Minimal test run to validate the processing pipeline with limited files.
"""

import sys
import asyncio
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from rag_processor.models import ProcessingConfig
from rag_processor.loaders import DocumentLoader
from rag_processor.chunkers import IntelligentChunker

async def test_minimal_processing():
    """Test processing a single file."""
    print("=" * 60)
    print("MINIMAL PROCESSING TEST")
    print("=" * 60)
    
    # Pick one text file for testing
    test_file = Path("./JK knowledge/James 3k Code Transcript.txt")
    
    if not test_file.exists():
        print(f"Test file not found: {test_file}")
        return
    
    print(f"\nTesting with: {test_file.name}")
    print("-" * 60)
    
    try:
        # Step 1: Load and classify
        loader = DocumentLoader()
        text, doc_type, metadata = await loader.load_and_classify_document(test_file)
        
        print(f"✓ Document loaded")
        print(f"  - Type: {doc_type}")
        print(f"  - Length: {len(text)} characters")
        print(f"  - First 100 chars: {text[:100]}...")
        
        # Step 2: Chunk the document
        chunker = IntelligentChunker()
        chunks = chunker.chunk_document(
            text=text,
            doc_type=doc_type,
            document_id="test_001",
            source_file=test_file.name
        )
        
        print(f"\n✓ Document chunked")
        print(f"  - Chunks created: {len(chunks)}")
        print(f"  - First chunk tokens: {chunks[0].token_count}")
        print(f"  - First chunk preview: {chunks[0].text[:100]}...")
        
        # Step 3: Test transcript cleaning if it's a transcript
        if doc_type.value == "transcript":
            from rag_processor.transcript_cleaner import TranscriptCleaner
            cleaner = TranscriptCleaner()
            cleaned = cleaner.clean_transcript(text[:1000])  # Test first 1000 chars
            print(f"\n✓ Transcript cleaning tested")
            print(f"  - Original length: {len(text[:1000])}")
            print(f"  - Cleaned length: {len(cleaned)}")
        
        print("\n" + "=" * 60)
        print("✓ MINIMAL TEST PASSED!")
        print("=" * 60)
        print("\nThe core pipeline components are working correctly.")
        print("You can now run the full processor with:")
        print("  python process_knowledge_base.py --verbose")
        
    except Exception as e:
        print(f"\n✗ Error during processing: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_minimal_processing())