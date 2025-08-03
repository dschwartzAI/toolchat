"""
Document loading and classification module.
"""

import re
from pathlib import Path
from typing import Tuple, Dict, List, Optional
import logging
from unstructured.partition.auto import partition
from unstructured.documents.elements import Element

from .models import DocumentType
from .config import CONCEPT_KEYWORDS

logger = logging.getLogger(__name__)


class DocumentLoader:
    """Loads and classifies documents from various formats."""
    
    def __init__(self):
        self.supported_extensions = {'.pdf', '.txt', '.md', '.docx'}
    
    async def load_and_classify_document(
        self, file_path: Path
    ) -> Tuple[str, DocumentType, Dict]:
        """
        Load a document and classify its type.
        
        Returns:
            - Full text content
            - Document type
            - Metadata dictionary
        """
        logger.info(f"Loading document: {file_path}")
        
        # Use unstructured for robust parsing
        try:
            # Try hi_res for PDFs first, fallback to fast if poppler not available
            if file_path.suffix == ".pdf":
                try:
                    # Try hi_res strategy first
                    elements = partition(
                        filename=str(file_path),
                        strategy="hi_res",
                        include_page_breaks=True,
                        include_metadata=True
                    )
                except Exception as e:
                    if "poppler" in str(e).lower():
                        logger.warning(f"Poppler not installed, using fast strategy for {file_path.name}")
                        # Fallback to fast strategy which doesn't require poppler
                        elements = partition(
                            filename=str(file_path),
                            strategy="fast",
                            include_page_breaks=True,
                            include_metadata=True
                        )
                    else:
                        raise
            else:
                # Non-PDF files
                elements = partition(
                    filename=str(file_path),
                    strategy="auto",
                    include_page_breaks=True,
                    include_metadata=True
                )
            
            # Combine all text elements
            text = "\n".join([str(el) for el in elements])
            
            # Classify document type
            doc_type = self._classify_document(text, file_path.name)
            
            # Extract metadata
            metadata = self._extract_metadata(elements, file_path)
            
            logger.info(f"Loaded {file_path.name} as {doc_type} with {len(text)} chars")
            
            return text, doc_type, metadata
            
        except Exception as e:
            logger.error(f"Error loading {file_path}: {str(e)}")
            raise
    
    def _classify_document(self, text: str, filename: str) -> DocumentType:
        """Classify document based on content and filename patterns."""
        
        # Normalize for comparison
        text_lower = text.lower()
        filename_lower = filename.lower()
        
        # Check filename patterns first
        if "transcript" in filename_lower or "_cleaned" in filename_lower:
            return DocumentType.TRANSCRIPT
        
        if "template" in filename_lower:
            return DocumentType.TEMPLATE
        
        if "email" in filename_lower:
            return DocumentType.EMAIL
        
        if "guide" in filename_lower or "sop" in filename_lower:
            return DocumentType.GUIDE
        
        # Check content patterns
        if any(keyword in text_lower for keyword in ["chapter", "table of contents", "introduction"]):
            return DocumentType.BOOK
        
        # Count framework indicators
        framework_count = sum(1 for keyword in ["framework", "system", "method", "process"] 
                            if keyword in text_lower)
        
        if framework_count >= 3:
            return DocumentType.FRAMEWORK
        
        # Check for transcript patterns
        if re.search(r'\[[\d:]+\]|\d+:\d+|Speaker:|Q:|A:', text):
            return DocumentType.TRANSCRIPT
        
        # Check for email patterns
        if re.search(r'Subject:|From:|To:|Dear\s+\w+|Hi\s+\w+', text):
            return DocumentType.EMAIL
        
        # Default to guide for instructional content
        if any(word in text_lower for word in ["step", "how to", "guide", "instructions"]):
            return DocumentType.GUIDE
        
        # Default to book
        return DocumentType.BOOK
    
    def _extract_metadata(self, elements: List[Element], file_path: Path) -> Dict:
        """Extract metadata from document elements."""
        metadata = {
            "filename": file_path.name,
            "file_path": str(file_path),
            "file_type": file_path.suffix,
            "total_elements": len(elements),
            "total_pages": 0,
            "title": None,
            "has_images": False,
            "has_tables": False
        }
        
        # Extract title from first few elements
        for i, element in enumerate(elements[:5]):
            element_text = str(element).strip()
            if element_text and len(element_text) > 10 and len(element_text) < 100:
                # Likely a title
                metadata["title"] = element_text
                break
        
        # If no title found, use filename
        if not metadata["title"]:
            metadata["title"] = file_path.stem.replace("_", " ").title()
        
        # Count pages and element types
        page_numbers = set()
        for element in elements:
            if hasattr(element, 'metadata'):
                if hasattr(element.metadata, 'page_number'):
                    page_numbers.add(element.metadata.page_number)
                
                # Check element type
                element_type = getattr(element, '__class__.__name__', '')
                if 'Image' in element_type:
                    metadata["has_images"] = True
                elif 'Table' in element_type:
                    metadata["has_tables"] = True
        
        metadata["total_pages"] = len(page_numbers) if page_numbers else 1
        
        return metadata
    
    def get_all_documents(self, directory: Path) -> List[Path]:
        """Get all supported documents from a directory."""
        documents = []
        
        for ext in self.supported_extensions:
            documents.extend(directory.glob(f"*{ext}"))
        
        # Sort for consistent processing order
        return sorted(documents)