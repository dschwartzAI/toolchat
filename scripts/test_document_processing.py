"""
Test suite for the RAG document processing pipeline.
"""

import pytest
from pathlib import Path
import tempfile
import asyncio

from rag_processor.models import DocumentType, ProcessedChunk, ChunkMetadata
from rag_processor.loaders import DocumentLoader
from rag_processor.chunkers import IntelligentChunker
from rag_processor.transcript_cleaner import TranscriptCleaner
from rag_processor.framework_extractor import FrameworkExtractor


@pytest.fixture
def sample_book_text():
    """Sample book text for testing."""
    return """
# Chapter 1: Introduction to Consulting

Consulting is about transformation. The key to success lies in understanding
your client's needs and delivering exceptional value.

## The Foundation

Every successful consultant needs three things:
1. Expertise in their domain
2. Ability to communicate effectively
3. Systems for consistent delivery

## Building Your Practice

Start with a clear offer. Know what transformation you provide.
Define your ideal client. Focus on those who need your specific expertise.

# Chapter 2: The Framework Approach

The 3 E's framework is fundamental to evaluating any business opportunity:

**Energy**: Does this give you energy or drain it?
**Earnings**: What's the financial potential?
**Experience**: What experience will you gain?

When all three align, you have a winning opportunity.
"""


@pytest.fixture
def sample_transcript_text():
    """Sample transcript text for testing."""
    return """
[00:00] James: Welcome everyone to today's workshop. Um, so like, you know, 
today we're going to talk about the Daily Client Machine.

[00:15] James: So, uh, the Daily Client Machine is, you know, basically 
a system for, um, getting clients consistently. Like, every single day.

[00:30] Q: How long does it take to implement?

[00:35] James: Great question. So, typically, um, it takes about, you know,
30 days to get the full system running. But you can start seeing results
in the first week if you, uh, follow the process exactly.
"""


class TestDocumentLoader:
    """Test document loading and classification."""
    
    def test_classify_book(self, sample_book_text):
        """Test book classification."""
        loader = DocumentLoader()
        doc_type = loader._classify_document(sample_book_text, "book.pdf")
        assert doc_type == DocumentType.BOOK
    
    def test_classify_transcript(self, sample_transcript_text):
        """Test transcript classification."""
        loader = DocumentLoader()
        doc_type = loader._classify_document(sample_transcript_text, "workshop_transcript.txt")
        assert doc_type == DocumentType.TRANSCRIPT
    
    def test_classify_by_filename(self):
        """Test classification by filename."""
        loader = DocumentLoader()
        
        assert loader._classify_document("", "email_template.pdf") == DocumentType.TEMPLATE
        assert loader._classify_document("", "guide.pdf") == DocumentType.GUIDE
        assert loader._classify_document("", "framework_doc.pdf") == DocumentType.FRAMEWORK


class TestChunking:
    """Test intelligent chunking."""
    
    def test_chunk_creation(self, sample_book_text):
        """Test basic chunk creation."""
        chunker = IntelligentChunker()
        chunks = chunker.chunk_document(
            text=sample_book_text,
            doc_type=DocumentType.BOOK,
            document_id="test_doc",
            source_file="test.pdf"
        )
        
        assert len(chunks) > 0
        assert all(isinstance(chunk, ProcessedChunk) for chunk in chunks)
        assert all(chunk.token_count > 0 for chunk in chunks)
    
    def test_chapter_extraction(self, sample_book_text):
        """Test chapter extraction from chunks."""
        chunker = IntelligentChunker()
        chunks = chunker.chunk_document(
            text=sample_book_text,
            doc_type=DocumentType.BOOK,
            document_id="test_doc",
            source_file="test.pdf"
        )
        
        # At least one chunk should have chapter info
        chapters = [c.metadata.chapter for c in chunks if c.metadata.chapter]
        assert len(chapters) > 0


class TestTranscriptCleaner:
    """Test transcript cleaning."""
    
    def test_remove_fillers(self, sample_transcript_text):
        """Test filler word removal."""
        cleaner = TranscriptCleaner()
        cleaned = cleaner.clean_transcript(sample_transcript_text)
        
        # Check filler words are removed
        assert "um" not in cleaned.lower()
        assert "uh" not in cleaned.lower()
        assert "you know" not in cleaned.lower()
        assert "like," not in cleaned  # Filler "like"
        
        # Check important content is preserved
        assert "Daily Client Machine" in cleaned
        assert "30 days" in cleaned
        assert "first week" in cleaned
    
    def test_preserve_quotes(self):
        """Test that important quotes are preserved."""
        cleaner = TranscriptCleaner()
        text = 'James said: "The key to success is consistency in your daily actions."'
        cleaned = cleaner.clean_transcript(text)
        
        assert "The key to success is consistency" in cleaned


class TestFrameworkExtractor:
    """Test framework extraction."""
    
    def test_extract_3es_framework(self, sample_book_text):
        """Test extraction of 3 E's framework."""
        # Create chunks first
        chunker = IntelligentChunker()
        chunks = chunker.chunk_document(
            text=sample_book_text,
            doc_type=DocumentType.BOOK,
            document_id="test_doc",
            source_file="test.pdf"
        )
        
        # Extract frameworks
        extractor = FrameworkExtractor()
        frameworks = extractor.extract_frameworks(chunks)
        
        # Should find the 3 E's framework
        assert len(frameworks) > 0
        framework_names = list(frameworks.keys())
        assert any("3 E" in name or "3E" in name for name in framework_names)
    
    def test_framework_components(self, sample_book_text):
        """Test that framework components are extracted."""
        chunker = IntelligentChunker()
        chunks = chunker.chunk_document(
            text=sample_book_text,
            doc_type=DocumentType.BOOK,
            document_id="test_doc",
            source_file="test.pdf"
        )
        
        extractor = FrameworkExtractor()
        frameworks = extractor.extract_frameworks(chunks)
        
        # Check that components are found
        for name, framework in frameworks.items():
            if "3 E" in name:
                assert "Energy" in framework.complete_text
                assert "Earnings" in framework.complete_text
                assert "Experience" in framework.complete_text


@pytest.mark.asyncio
async def test_integration():
    """Test basic integration of components."""
    # Create a simple test document
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write("This is a test document about the 3 E's framework.")
        temp_path = Path(f.name)
    
    try:
        # Load document
        loader = DocumentLoader()
        text, doc_type, metadata = await loader.load_and_classify_document(temp_path)
        
        assert len(text) > 0
        assert doc_type is not None
        assert metadata is not None
        
    finally:
        # Clean up
        temp_path.unlink()


def test_token_counting():
    """Test token counting accuracy."""
    from rag_processor.chunkers import IntelligentChunker
    
    chunker = IntelligentChunker()
    
    # Test with known text
    text = "This is a simple test sentence."
    tokens = len(chunker.tokenizer.encode(text))
    
    assert tokens > 0
    assert tokens < 20  # Simple sentence should be less than 20 tokens


if __name__ == "__main__":
    # Run basic tests
    pytest.main([__file__, "-v"])