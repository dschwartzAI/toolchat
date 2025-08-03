"""
Configuration management for the RAG processor.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from .models import ProcessingConfig, ChunkingStrategy, DocumentType

# Load environment variables
load_dotenv()


# Default chunking strategies by document type
CHUNKING_STRATEGIES = {
    DocumentType.BOOK: ChunkingStrategy(
        max_tokens=1200,
        min_tokens=400,
        overlap_tokens=150,
        split_on=["###", "##", "#", "\n\n", "\n", ".", " "],
        preserve_all_content=True
    ),
    DocumentType.TRANSCRIPT: ChunkingStrategy(
        max_tokens=800,
        min_tokens=300,
        overlap_tokens=100,
        split_on=["\n\n", "Speaker:", "[", "\n", ".", " "],
        preserve_all_content=True
    ),
    DocumentType.FRAMEWORK: ChunkingStrategy(
        max_tokens=600,
        min_tokens=200,
        overlap_tokens=50,
        split_on=["framework_component", "example", "use_case", "\n\n", "\n"],
        preserve_all_content=True
    ),
    DocumentType.TEMPLATE: ChunkingStrategy(
        max_tokens=500,
        min_tokens=200,
        overlap_tokens=50,
        split_on=["\n\n", "\n", "---", "###"],
        preserve_all_content=True
    ),
    DocumentType.EMAIL: ChunkingStrategy(
        max_tokens=400,
        min_tokens=150,
        overlap_tokens=50,
        split_on=["\n\n", "\n", "Subject:", "From:"],
        preserve_all_content=True
    ),
    DocumentType.GUIDE: ChunkingStrategy(
        max_tokens=800,
        min_tokens=300,
        overlap_tokens=100,
        split_on=["##", "#", "\n\n", "\n", "Step"],
        preserve_all_content=True
    )
}


# Framework patterns to detect
FRAMEWORK_PATTERNS = [
    r"(\d+\s*[A-Z]'s)\s*(?:framework|model|system)",  # "3 E's framework"
    r"The\s+(\w+\s+\w+)\s+(?:Framework|Model|System)",  # "The Sovereign Consultant"
    r"(\w+)\s+Framework",  # Generic framework pattern
    r"(\w+)\s+Method",  # Method pattern
    r"(\w+)\s+System",  # System pattern
    r"(\w+)\s+Process",  # Process pattern
    r"Daily\s+Client\s+Machine",  # Specific framework
    r"Hybrid\s+Offer",  # Specific framework
]


# Keywords that indicate important concepts
CONCEPT_KEYWORDS = [
    "framework", "system", "method", "process", "strategy",
    "tactic", "principle", "concept", "model", "approach",
    "technique", "formula", "blueprint", "template", "guide"
]


# Filler words to remove from transcripts
FILLER_WORDS = [
    "um", "uh", "umm", "uhh", "like", "you know", "I mean",
    "sort of", "kind of", "basically", "actually", "literally",
    "right?", "okay?", "you see", "so basically", "essentially"
]


def get_default_config(
    input_dir: str = "./JK knowledge",
    output_dir: str = "./output",
    **kwargs
) -> ProcessingConfig:
    """Get default processing configuration."""
    return ProcessingConfig(
        input_dir=input_dir,
        output_dir=output_dir,
        **kwargs
    )