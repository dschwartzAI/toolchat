"""
Intelligent document chunking module.
"""

import logging
from typing import List, Optional
import tiktoken
from langchain.text_splitter import RecursiveCharacterTextSplitter

from .models import ProcessedChunk, ChunkMetadata, DocumentType, ChunkingStrategy
from .config import CHUNKING_STRATEGIES

logger = logging.getLogger(__name__)


class IntelligentChunker:
    """Intelligently chunks documents based on type and content structure."""
    
    def __init__(self, strategy: Optional[ChunkingStrategy] = None):
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        self.strategy = strategy
    
    def chunk_document(
        self,
        text: str,
        doc_type: DocumentType,
        document_id: str,
        source_file: str,
        metadata: dict = None
    ) -> List[ProcessedChunk]:
        """
        Chunk a document intelligently based on its type.
        
        Args:
            text: Full document text
            doc_type: Type of document
            document_id: Unique document identifier
            source_file: Source filename
            metadata: Additional metadata from loader
            
        Returns:
            List of processed chunks with metadata
        """
        # Get strategy for document type if not provided
        if not self.strategy:
            self.strategy = CHUNKING_STRATEGIES.get(doc_type)
        
        logger.info(f"Chunking {source_file} as {doc_type} with strategy: "
                   f"{self.strategy.max_tokens} max tokens")
        
        # Create text splitter with document-specific settings
        splitter = self._create_splitter(doc_type)
        
        # Split the text
        raw_chunks = splitter.split_text(text)
        
        # Process chunks with metadata
        processed_chunks = []
        total_chunks = len(raw_chunks)
        
        for i, chunk_text in enumerate(raw_chunks):
            token_count = len(self.tokenizer.encode(chunk_text))
            
            # Skip chunks that are too small (likely noise)
            if token_count < self.strategy.min_tokens:
                logger.debug(f"Skipping small chunk ({token_count} tokens)")
                continue
            
            # Create chunk metadata
            chunk_metadata = ChunkMetadata(
                chunk_id="",  # Will be auto-generated
                document_id=document_id,
                source_file=source_file,
                document_type=doc_type,
                title=metadata.get("title") if metadata else None,
                chunk_index=i,
                total_chunks_in_section=total_chunks,
                keywords=[],  # Will be enriched later
                entities=[],  # Will be enriched later
            )
            
            # Extract chapter/section info if available
            if doc_type == DocumentType.BOOK:
                chunk_metadata.chapter = self._extract_chapter(chunk_text)
                chunk_metadata.section = self._extract_section(chunk_text)
            
            processed_chunk = ProcessedChunk(
                text=chunk_text.strip(),
                metadata=chunk_metadata,
                token_count=token_count
            )
            
            processed_chunks.append(processed_chunk)
        
        logger.info(f"Created {len(processed_chunks)} chunks from {source_file}")
        return processed_chunks
    
    def _create_splitter(self, doc_type: DocumentType) -> RecursiveCharacterTextSplitter:
        """Create a text splitter configured for the document type."""
        strategy = self.strategy or CHUNKING_STRATEGIES[doc_type]
        
        return RecursiveCharacterTextSplitter(
            chunk_size=strategy.max_tokens,
            chunk_overlap=strategy.overlap_tokens,
            length_function=lambda x: len(self.tokenizer.encode(x)),
            separators=strategy.split_on,
            is_separator_regex=False
        )
    
    def _extract_chapter(self, text: str) -> Optional[str]:
        """Extract chapter information from chunk text."""
        lines = text.split('\n')[:5]  # Check first 5 lines
        
        for line in lines:
            line = line.strip()
            # Look for chapter patterns
            if line.lower().startswith('chapter'):
                return line
            # Look for numbered patterns like "1." or "1:"
            import re
            if re.match(r'^\d+[.:\s]', line):
                return line
        
        return None
    
    def _extract_section(self, text: str) -> Optional[str]:
        """Extract section information from chunk text."""
        lines = text.split('\n')[:10]  # Check first 10 lines
        
        for line in lines:
            line = line.strip()
            # Look for section markers
            if line.startswith('##') and not line.startswith('###'):
                return line.replace('#', '').strip()
            # Look for section patterns
            if line.lower().startswith('section'):
                return line
        
        return None
    
    def merge_small_chunks(self, chunks: List[ProcessedChunk]) -> List[ProcessedChunk]:
        """Merge chunks that are too small with adjacent chunks."""
        if not chunks:
            return chunks
        
        merged_chunks = []
        current_chunk = chunks[0]
        
        for next_chunk in chunks[1:]:
            current_tokens = current_chunk.token_count
            next_tokens = next_chunk.token_count
            
            # Merge if both are small and combined wouldn't exceed max
            if (current_tokens < self.strategy.min_tokens and 
                next_tokens < self.strategy.min_tokens and
                current_tokens + next_tokens <= self.strategy.max_tokens):
                
                # Merge chunks
                current_chunk = ProcessedChunk(
                    text=current_chunk.text + "\n\n" + next_chunk.text,
                    metadata=current_chunk.metadata,
                    token_count=current_tokens + next_tokens
                )
            else:
                # Save current and move to next
                merged_chunks.append(current_chunk)
                current_chunk = next_chunk
        
        # Don't forget the last chunk
        merged_chunks.append(current_chunk)
        
        return merged_chunks