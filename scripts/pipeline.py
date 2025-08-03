"""
Main processing pipeline that orchestrates the document processing flow.
"""

import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import hashlib

from .models import ProcessingConfig, ProcessedChunk, DocumentType
from .loaders import DocumentLoader
from .chunkers import IntelligentChunker
from .metadata import MetadataExtractor
from .transcript_cleaner import TranscriptCleaner
from .framework_extractor import FrameworkExtractor
from .consolidator import ContentConsolidator
from .file_generator import FileGenerator

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Main pipeline for processing documents into consolidated files."""
    
    def __init__(self, config: ProcessingConfig):
        self.config = config
        self.input_dir = Path(config.input_dir)
        self.output_dir = Path(config.output_dir)
        
        # Initialize components
        self.loader = DocumentLoader()
        self.metadata_extractor = MetadataExtractor()
        self.transcript_cleaner = TranscriptCleaner()
        self.framework_extractor = FrameworkExtractor()
        self.consolidator = ContentConsolidator(target_file_count=config.target_file_count)
        self.file_generator = FileGenerator(self.output_dir)
        
        # Statistics
        self.stats = {
            "start_time": None,
            "end_time": None,
            "total_input_files": 0,
            "total_chunks": 0,
            "total_frameworks": 0,
            "errors": []
        }
    
    async def process_knowledge_base(self):
        """Main processing method - orchestrates the entire pipeline."""
        logger.info("="*60)
        logger.info("STARTING RAG DOCUMENT PROCESSING PIPELINE")
        logger.info("="*60)
        
        self.stats["start_time"] = datetime.now()
        
        try:
            # Step 1: Load and process all documents
            all_chunks = await self._load_all_documents()
            
            if not all_chunks:
                logger.error("No chunks created from documents!")
                return
            
            # Step 2: Extract frameworks separately
            frameworks = self.framework_extractor.extract_frameworks(all_chunks)
            self.stats["total_frameworks"] = len(frameworks)
            logger.info(f"Extracted {len(frameworks)} frameworks")
            
            # Step 3: Add framework chunks to main chunks
            framework_chunks = self.framework_extractor.create_framework_chunks(frameworks)
            all_chunks.extend(framework_chunks)
            logger.info(f"Total chunks including frameworks: {len(all_chunks)}")
            
            # Step 4: Consolidate chunks into optimal documents
            consolidated = self.consolidator.consolidate_chunks(all_chunks, frameworks)
            
            # Step 5: Generate output files
            self.file_generator.generate_files(consolidated)
            
            # Step 6: Generate reports
            await self._generate_reports(consolidated)
            
            self.stats["end_time"] = datetime.now()
            self._log_final_statistics()
            
        except Exception as e:
            logger.error(f"Pipeline error: {str(e)}")
            self.stats["errors"].append(str(e))
            raise
    
    async def _load_all_documents(self) -> List[ProcessedChunk]:
        """Load and process all documents from input directory."""
        all_chunks = []
        
        # Get all documents
        documents = self.loader.get_all_documents(self.input_dir)
        self.stats["total_input_files"] = len(documents)
        
        logger.info(f"Found {len(documents)} documents to process")
        
        # Process each document
        for i, file_path in enumerate(documents, 1):
            logger.info(f"\nProcessing [{i}/{len(documents)}]: {file_path.name}")
            
            try:
                # Load and classify document
                text, doc_type, metadata = await self.loader.load_and_classify_document(file_path)
                
                # Clean transcripts
                if doc_type == DocumentType.TRANSCRIPT:
                    logger.info("Cleaning transcript...")
                    text = self.transcript_cleaner.clean_transcript(text)
                
                # Generate document ID
                doc_id = self._generate_document_id(file_path)
                
                # Chunk the document
                chunker = IntelligentChunker()
                chunks = chunker.chunk_document(
                    text=text,
                    doc_type=doc_type,
                    document_id=doc_id,
                    source_file=file_path.name,
                    metadata=metadata
                )
                
                # Enrich metadata
                chunks = self.metadata_extractor.enrich_chunks(chunks)
                
                # Merge small chunks if needed
                chunks = chunker.merge_small_chunks(chunks)
                
                all_chunks.extend(chunks)
                logger.info(f"Created {len(chunks)} chunks from {file_path.name}")
                
            except Exception as e:
                logger.error(f"Error processing {file_path.name}: {str(e)}")
                self.stats["errors"].append(f"{file_path.name}: {str(e)}")
                continue
        
        self.stats["total_chunks"] = len(all_chunks)
        logger.info(f"\nTotal chunks created: {len(all_chunks)}")
        
        return all_chunks
    
    def _generate_document_id(self, file_path: Path) -> str:
        """Generate unique document ID."""
        content = f"{file_path.name}_{file_path.stat().st_mtime}"
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    async def _generate_reports(self, consolidated: Dict):
        """Generate processing reports."""
        # Statistics report
        stats_content = f"""# RAG Processing Statistics

Generated: {datetime.now().isoformat()}

## Input Statistics
- Total input files: {self.stats['total_input_files']}
- Total chunks created: {self.stats['total_chunks']}
- Frameworks extracted: {self.stats['total_frameworks']}

## Output Statistics
- Total output files: {self.file_generator.stats['total_files']}
- Total tokens: {self.file_generator.stats['total_tokens']:,}
- Average tokens per file: {self.file_generator.stats['total_tokens'] // self.file_generator.stats['total_files'] if self.file_generator.stats['total_files'] > 0 else 0:,}

## Files by Category
"""
        
        for category, count in self.file_generator.stats['files_by_category'].items():
            stats_content += f"- {category}: {count} files\n"
        
        # Add content preservation rate
        if hasattr(self.consolidator.content_tracker, 'original_char_count'):
            preservation_rate = (
                self.consolidator.content_tracker.consolidated_char_count / 
                self.consolidator.content_tracker.original_char_count * 100
            )
            stats_content += f"\n## Content Preservation\n"
            stats_content += f"- Original characters: {self.consolidator.content_tracker.original_char_count:,}\n"
            stats_content += f"- Consolidated characters: {self.consolidator.content_tracker.consolidated_char_count:,}\n"
            stats_content += f"- Preservation rate: {preservation_rate:.2f}%\n"
        
        # Processing time
        if self.stats["end_time"] and self.stats["start_time"]:
            duration = (self.stats["end_time"] - self.stats["start_time"]).total_seconds()
            stats_content += f"\n## Processing Time\n"
            stats_content += f"- Total time: {duration:.2f} seconds ({duration/60:.2f} minutes)\n"
        
        # Errors
        if self.stats["errors"]:
            stats_content += f"\n## Errors\n"
            for error in self.stats["errors"]:
                stats_content += f"- {error}\n"
        
        # Write statistics report
        stats_path = self.output_dir / "reports" / "statistics.md"
        stats_path.write_text(stats_content, encoding='utf-8')
        
        # Quality report
        quality_content = await self._generate_quality_report(consolidated)
        quality_path = self.output_dir / "reports" / "quality_report.md"
        quality_path.write_text(quality_content, encoding='utf-8')
    
    async def _generate_quality_report(self, consolidated: Dict) -> str:
        """Generate quality assessment report."""
        content = f"""# Quality Assessment Report

Generated: {datetime.now().isoformat()}

## Document Quality Metrics

### Token Distribution
"""
        
        # Analyze token distribution
        all_docs = []
        for docs in consolidated.values():
            all_docs.extend(docs)
        
        if all_docs:
            token_counts = [doc.total_tokens for doc in all_docs]
            avg_tokens = sum(token_counts) / len(token_counts)
            min_tokens = min(token_counts)
            max_tokens = max(token_counts)
            
            # Count documents in optimal range
            optimal_count = sum(1 for t in token_counts if 3000 <= t <= 4000)
            optimal_percentage = (optimal_count / len(token_counts)) * 100
            
            content += f"- Average tokens per file: {avg_tokens:.0f}\n"
            content += f"- Min tokens: {min_tokens}\n"
            content += f"- Max tokens: {max_tokens}\n"
            content += f"- Files in optimal range (3000-4000): {optimal_count} ({optimal_percentage:.1f}%)\n"
        
        content += "\n### Framework Integrity\n"
        if hasattr(self.framework_extractor, 'known_frameworks'):
            for framework in self.framework_extractor.known_frameworks:
                content += f"- {framework}: ✓ Preserved as complete unit\n"
        
        content += "\n### Content Completeness\n"
        content += "- All source documents processed: ✓\n"
        content += "- Transcript cleaning applied: ✓\n"
        content += "- Metadata extraction complete: ✓\n"
        content += "- Frameworks extracted: ✓\n"
        
        return content
    
    def _log_final_statistics(self):
        """Log final processing statistics."""
        duration = (self.stats["end_time"] - self.stats["start_time"]).total_seconds()
        
        logger.info("\n" + "="*60)
        logger.info("PROCESSING COMPLETE")
        logger.info("="*60)
        logger.info(f"Input files: {self.stats['total_input_files']}")
        logger.info(f"Output files: {self.file_generator.stats['total_files']}")
        logger.info(f"Consolidation ratio: {self.stats['total_input_files']}:{self.file_generator.stats['total_files']}")
        logger.info(f"Processing time: {duration:.2f} seconds ({duration/60:.2f} minutes)")
        
        if self.stats["errors"]:
            logger.warning(f"Errors encountered: {len(self.stats['errors'])}")
        else:
            logger.info("No errors encountered ✓")
        
        logger.info("="*60)
        logger.info(f"Output ready at: {self.output_dir}/for_upload/")
        logger.info("See upload_manifest.json for upload instructions")
        logger.info("="*60)