"""
Data models for the RAG document processing pipeline.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Optional, Literal
from datetime import datetime
from enum import Enum
import hashlib


class DocumentType(str, Enum):
    """Types of documents we process"""
    BOOK = "book"
    TRANSCRIPT = "transcript"
    FRAMEWORK = "framework"
    TEMPLATE = "template"
    EMAIL = "email"
    GUIDE = "guide"


class ChunkMetadata(BaseModel):
    """Metadata for each document chunk"""
    chunk_id: str = Field(..., description="Unique chunk identifier")
    document_id: str = Field(..., description="Parent document ID")
    source_file: str
    document_type: DocumentType
    title: Optional[str] = None
    chapter: Optional[str] = None
    section: Optional[str] = None
    page_number: Optional[int] = None
    keywords: List[str] = Field(default_factory=list)
    entities: List[str] = Field(default_factory=list)
    concept_category: Optional[Literal["framework", "strategy", "tactic", "mindset"]] = None
    related_concepts: List[str] = Field(default_factory=list)
    chunk_index: int
    total_chunks_in_section: int
    timestamp: datetime = Field(default_factory=datetime.now)
    
    @field_validator('chunk_id', mode='before')
    @classmethod
    def generate_chunk_id(cls, v, info):
        if not v:
            content = f"{info.data.get('document_id')}_{info.data.get('chunk_index')}"
            return hashlib.md5(content.encode()).hexdigest()[:16]
        return v


class ProcessedChunk(BaseModel):
    """A processed text chunk with metadata"""
    text: str
    metadata: ChunkMetadata
    token_count: int
    # No embedding field - LibreChat RAG API handles this


class ConsolidatedDocument(BaseModel):
    """Represents a consolidated document ready for upload"""
    filename: str
    title: str
    category: str
    content: str
    source_chunks: List[str]  # Track original chunk IDs
    source_files: List[str]
    total_tokens: int
    keywords: List[str]
    has_duplicates_removed: bool = False
    duplicate_count: int = 0


class ChunkingStrategy(BaseModel):
    """Strategy for chunking documents"""
    max_tokens: int
    min_tokens: int
    overlap_tokens: int
    split_on: List[str]
    preserve_all_content: bool = True  # Never lose data


class ProcessingConfig(BaseModel):
    """Configuration for the processing pipeline"""
    input_dir: str
    output_dir: str
    target_file_count: int = 75
    min_tokens_per_file: int = 2000
    target_tokens_per_file: int = 3500
    max_tokens_per_file: int = 5000
    deduplication_threshold: float = 0.95
    preserve_content: bool = True
    verbose: bool = False


class ProcessingStats(BaseModel):
    """Statistics from the processing run"""
    total_input_files: int
    total_output_files: int
    total_input_tokens: int
    total_output_tokens: int
    content_preservation_rate: float
    duplicates_removed: int
    processing_time_seconds: float
    files_by_category: Dict[str, int]
    error_count: int = 0
    warnings: List[str] = Field(default_factory=list)