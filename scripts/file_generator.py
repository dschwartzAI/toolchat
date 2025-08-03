"""
Output file generation module.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List
from datetime import datetime

from .models import ConsolidatedDocument

logger = logging.getLogger(__name__)


class FileGenerator:
    """Generates markdown files and manifest for upload."""
    
    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.categories = ["frameworks", "core_concepts", "transcripts", "templates", "guides"]
        self.stats = {
            "total_files": 0,
            "total_tokens": 0,
            "files_by_category": {},
            "generation_time": None
        }
    
    def generate_files(self, consolidated_docs: Dict[str, List[ConsolidatedDocument]]):
        """Generate all output files organized by category."""
        logger.info("Generating output files")
        start_time = datetime.now()
        
        # Create output directory structure
        self._create_directory_structure()
        
        # Generate files for each category
        for category in self.categories:
            docs = consolidated_docs.get(category, [])
            if docs:
                self._generate_category_files(category, docs)
        
        # Generate upload manifest
        self._generate_upload_manifest(consolidated_docs)
        
        # Log statistics
        self.stats["generation_time"] = (datetime.now() - start_time).total_seconds()
        self._log_statistics()
    
    def _create_directory_structure(self):
        """Create the output directory structure."""
        # Main output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # For upload directory
        for_upload_dir = self.output_dir / "for_upload"
        for_upload_dir.mkdir(exist_ok=True)
        
        # Category directories
        for category in self.categories:
            category_dir = for_upload_dir / category
            category_dir.mkdir(exist_ok=True)
        
        # Supporting directories
        (self.output_dir / "processing").mkdir(exist_ok=True)
        (self.output_dir / "logs").mkdir(exist_ok=True)
        (self.output_dir / "reports").mkdir(exist_ok=True)
    
    def _generate_category_files(self, category: str, docs: List[ConsolidatedDocument]):
        """Generate files for a specific category."""
        category_dir = self.output_dir / "for_upload" / category
        
        self.stats["files_by_category"][category] = 0
        
        for i, doc in enumerate(docs, 1):
            # Update filename with proper numbering
            filename = f"{i:02d}_{doc.filename.split('_', 1)[1] if '_' in doc.filename else doc.filename}"
            filepath = category_dir / filename
            
            # Generate markdown content with metadata header
            content = self._format_markdown(doc)
            
            # Write file
            filepath.write_text(content, encoding='utf-8')
            
            # Update statistics
            self.stats["total_files"] += 1
            self.stats["total_tokens"] += doc.total_tokens
            self.stats["files_by_category"][category] += 1
            
            logger.info(f"Created: {filepath.name} ({doc.total_tokens} tokens)")
    
    def _format_markdown(self, doc: ConsolidatedDocument) -> str:
        """Format document as markdown with metadata header."""
        # Create metadata header
        header = f"""---
title: {doc.title}
type: {doc.category}
source_files: {', '.join(doc.source_files[:5])}  # Limit to 5 for readability
keywords: {', '.join(doc.keywords)}
token_count: {doc.total_tokens}
duplicates_removed: {doc.duplicate_count if doc.has_duplicates_removed else 0}
generated: {datetime.now().isoformat()}
---

# {doc.title}

"""
        
        # Add content
        return header + doc.content
    
    def _generate_upload_manifest(self, consolidated_docs: Dict[str, List[ConsolidatedDocument]]):
        """Generate manifest file with upload instructions."""
        manifest = {
            "generated": datetime.now().isoformat(),
            "generator": "RAG Document Processor v1.0",
            "statistics": {
                "total_files": self.stats["total_files"],
                "total_tokens": self.stats["total_tokens"],
                "average_tokens_per_file": (
                    self.stats["total_tokens"] // self.stats["total_files"] 
                    if self.stats["total_files"] > 0 else 0
                ),
                "files_by_category": self.stats["files_by_category"]
            },
            "upload_instructions": {
                "step1": "Navigate to LibreChat and select the Dark JK Coach agent",
                "step2": "Go to the Files/Knowledge section in agent settings",
                "step3": "Upload files in the following order for best results:",
                "order": [
                    "1. frameworks/ - Core business frameworks (highest priority)",
                    "2. core_concepts/ - Book chapters and key concepts",
                    "3. transcripts/ - Workshop and training transcripts",
                    "4. templates/ - Email and offer templates",
                    "5. guides/ - Implementation guides and SOPs"
                ],
                "step4": "Wait for each category to process before uploading the next",
                "step5": "Test with queries like 'What are the 3 Es?' to verify"
            },
            "categories": {}
        }
        
        # Add details for each category
        for category, docs in consolidated_docs.items():
            if not docs:
                continue
                
            manifest["categories"][category] = {
                "file_count": len(docs),
                "total_tokens": sum(doc.total_tokens for doc in docs),
                "files": []
            }
            
            # Add file details
            for i, doc in enumerate(docs, 1):
                file_info = {
                    "filename": f"{i:02d}_{doc.filename.split('_', 1)[1] if '_' in doc.filename else doc.filename}",
                    "title": doc.title,
                    "tokens": doc.total_tokens,
                    "keywords": doc.keywords[:5],  # Top 5 keywords
                    "source_count": len(doc.source_chunks)
                }
                manifest["categories"][category]["files"].append(file_info)
        
        # Write manifest
        manifest_path = self.output_dir / "for_upload" / "upload_manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
        
        # Also create a simple upload guide
        self._generate_upload_guide()
    
    def _generate_upload_guide(self):
        """Generate a simple markdown upload guide."""
        guide_content = """# RAG Knowledge Base Upload Guide

## Quick Start

1. **Open LibreChat** and navigate to the agent configuration
2. **Select** the Dark JK Coach agent (or create it if needed)
3. **Go to** Files/Knowledge section
4. **Upload** files in this order:

### Upload Order (Important!)

1. **frameworks/** (5-10 files)
   - Contains core business frameworks
   - Start here for best results
   
2. **core_concepts/** (20-30 files)
   - Book chapters and key concepts
   - Upload after frameworks
   
3. **transcripts/** (10-20 files)
   - Workshop and training transcripts
   - Upload after core concepts
   
4. **templates/** (5-10 files)
   - Email and offer templates
   - Upload after transcripts
   
5. **guides/** (5-10 files)
   - Implementation guides
   - Upload last

## Verification

After uploading, test with these queries:
- "What are the 3 E's?"
- "How do I create a hybrid offer?"
- "What is the Daily Client Machine?"
- "How should I price my consulting services?"

## Tips

- Upload one category at a time
- Wait for processing to complete before next category
- Total upload time: ~10-15 minutes
- If errors occur, retry that category

## File Summary

Check `upload_manifest.json` for detailed file information.
"""
        
        guide_path = self.output_dir / "reports" / "upload_guide.md"
        guide_path.write_text(guide_content, encoding='utf-8')
    
    def _generate_processing_metadata(self, consolidated_docs: Dict[str, List[ConsolidatedDocument]]):
        """Generate detailed processing metadata."""
        # Consolidated map showing how chunks were grouped
        consolidated_map = {}
        
        for category, docs in consolidated_docs.items():
            consolidated_map[category] = []
            
            for doc in docs:
                doc_info = {
                    "filename": doc.filename,
                    "title": doc.title,
                    "source_chunks": doc.source_chunks,
                    "source_files": doc.source_files,
                    "token_count": doc.total_tokens
                }
                consolidated_map[category].append(doc_info)
        
        # Write consolidated map
        map_path = self.output_dir / "processing" / "consolidated_map.json"
        map_path.write_text(json.dumps(consolidated_map, indent=2), encoding='utf-8')
        
        # Metadata index
        metadata_index = {
            "total_documents": self.stats["total_files"],
            "total_tokens": self.stats["total_tokens"],
            "categories": self.stats["files_by_category"],
            "processing_time": self.stats["generation_time"],
            "timestamp": datetime.now().isoformat()
        }
        
        index_path = self.output_dir / "processing" / "metadata_index.json"
        index_path.write_text(json.dumps(metadata_index, indent=2), encoding='utf-8')
    
    def _log_statistics(self):
        """Log generation statistics."""
        logger.info("\n" + "="*50)
        logger.info("FILE GENERATION COMPLETE")
        logger.info("="*50)
        logger.info(f"Total files created: {self.stats['total_files']}")
        logger.info(f"Total tokens: {self.stats['total_tokens']:,}")
        
        if self.stats['total_files'] > 0:
            avg_tokens = self.stats['total_tokens'] // self.stats['total_files']
            logger.info(f"Average tokens per file: {avg_tokens:,}")
        
        logger.info("\nFiles by category:")
        for category, count in self.stats['files_by_category'].items():
            logger.info(f"  {category}: {count} files")
        
        logger.info(f"\nGeneration time: {self.stats['generation_time']:.2f} seconds")
        logger.info("="*50)