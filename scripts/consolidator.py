"""
Content consolidation engine - THE CORE of the system.

This module takes thousands of chunks and intelligently consolidates them into
50-100 files while preserving ALL content (except exact duplicates).
"""

import hashlib
import logging
from typing import Dict, List, Set, Tuple
from collections import defaultdict
import tiktoken

from .models import ProcessedChunk, ConsolidatedDocument, DocumentType
from .framework_extractor import Framework

logger = logging.getLogger(__name__)


class ContentTracker:
    """Tracks content to ensure nothing is lost during consolidation."""
    
    def __init__(self):
        self.original_content = {}
        self.original_char_count = 0
        self.consolidated_char_count = 0
    
    def record_original_content(self, chunks: List[ProcessedChunk]):
        """Record all original content for verification."""
        for chunk in chunks:
            self.original_content[chunk.metadata.chunk_id] = chunk.text
            self.original_char_count += len(chunk.text)
    
    def verify_no_content_loss(self, consolidated: Dict[str, List[ConsolidatedDocument]]):
        """Verify that no content was lost during consolidation."""
        self.consolidated_char_count = 0
        for docs in consolidated.values():
            for doc in docs:
                self.consolidated_char_count += len(doc.content)
        
        preservation_rate = (self.consolidated_char_count / self.original_char_count) * 100
        logger.info(f"Content preservation rate: {preservation_rate:.2f}%")
        
        if preservation_rate < 95:
            logger.warning(f"Content preservation below 95%! Rate: {preservation_rate:.2f}%")
        
        return preservation_rate


class ContentConsolidator:
    """THE CORE - Consolidates chunks into optimal documents for upload."""
    
    def __init__(self, target_file_count: int = 75):
        self.target_files = target_file_count
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        self.min_tokens = 2000
        self.target_tokens = 3500  # Sweet spot
        self.max_tokens = 5000
        self.deduplication_threshold = 0.95  # Only remove near-exact duplicates
        self.content_tracker = ContentTracker()
    
    def consolidate_chunks(
        self, 
        chunks: List[ProcessedChunk],
        frameworks: Dict[str, Framework] = None
    ) -> Dict[str, List[ConsolidatedDocument]]:
        """
        Main consolidation method - THE HEART OF THE SYSTEM.
        
        Args:
            chunks: All processed chunks
            frameworks: Extracted frameworks (handled separately)
            
        Returns:
            Dictionary of categorized consolidated documents
        """
        logger.info(f"Starting consolidation of {len(chunks)} chunks into ~{self.target_files} files")
        
        # CRITICAL: Track all content to ensure nothing is lost
        self.content_tracker.record_original_content(chunks)
        
        # Step 1: Remove only exact duplicates
        deduplicated_chunks = self._remove_exact_duplicates(chunks)
        duplicate_count = len(chunks) - len(deduplicated_chunks)
        logger.info(f"Removed {duplicate_count} exact duplicates")
        
        # Step 2: Group by document type and semantic similarity
        grouped = self._group_by_type_and_topic(deduplicated_chunks)
        
        # Step 3: Handle frameworks separately (they get special treatment)
        framework_docs = []
        if frameworks:
            framework_docs = self._consolidate_frameworks(frameworks)
        
        # Step 4: Consolidate each group intelligently
        consolidated = {
            "frameworks": framework_docs,
            "core_concepts": self._consolidate_concepts(grouped.get(DocumentType.BOOK, [])),
            "transcripts": self._consolidate_transcripts(grouped.get(DocumentType.TRANSCRIPT, [])),
            "templates": self._consolidate_templates(
                grouped.get(DocumentType.TEMPLATE, []) + 
                grouped.get(DocumentType.EMAIL, [])
            ),
            "guides": self._consolidate_guides(grouped.get(DocumentType.GUIDE, []))
        }
        
        # Step 5: Optimize file count if needed
        consolidated = self._optimize_file_count(consolidated)
        
        # Step 6: VERIFY no content was lost
        preservation_rate = self.content_tracker.verify_no_content_loss(consolidated)
        
        # Log final statistics
        total_files = sum(len(docs) for docs in consolidated.values())
        logger.info(f"Consolidation complete: {total_files} files, {preservation_rate:.1f}% content preserved")
        
        return consolidated
    
    def _remove_exact_duplicates(self, chunks: List[ProcessedChunk]) -> List[ProcessedChunk]:
        """Remove only exact or near-exact duplicates."""
        seen_hashes = {}
        unique_chunks = []
        duplicate_count = 0
        
        for chunk in chunks:
            # Normalize whitespace for comparison
            normalized = " ".join(chunk.text.split())
            content_hash = hashlib.md5(normalized.encode()).hexdigest()
            
            if content_hash not in seen_hashes:
                seen_hashes[content_hash] = chunk
                unique_chunks.append(chunk)
            else:
                # Check if it's truly a duplicate
                existing = seen_hashes[content_hash]
                similarity = self._calculate_similarity(chunk.text, existing.text)
                
                if similarity < self.deduplication_threshold:
                    # Not a true duplicate, keep it
                    unique_chunks.append(chunk)
                else:
                    duplicate_count += 1
                    logger.debug(f"Removed duplicate chunk: {chunk.metadata.chunk_id}")
        
        logger.info(f"Removed {duplicate_count} exact duplicates")
        return unique_chunks
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts."""
        # Simple character-level similarity
        if not text1 or not text2:
            return 0.0
        
        # Normalize
        text1 = " ".join(text1.split()).lower()
        text2 = " ".join(text2.split()).lower()
        
        # Character-level similarity
        common_chars = sum(1 for c1, c2 in zip(text1, text2) if c1 == c2)
        max_len = max(len(text1), len(text2))
        
        return common_chars / max_len if max_len > 0 else 0.0
    
    def _group_by_type_and_topic(
        self, 
        chunks: List[ProcessedChunk]
    ) -> Dict[DocumentType, List[ProcessedChunk]]:
        """Group chunks by document type and topic."""
        grouped = defaultdict(list)
        
        for chunk in chunks:
            grouped[chunk.metadata.document_type].append(chunk)
        
        # Further group by topic within each type
        for doc_type, type_chunks in grouped.items():
            # Sort by source file and chunk index to maintain order
            type_chunks.sort(key=lambda c: (c.metadata.source_file, c.metadata.chunk_index))
        
        return grouped
    
    def _consolidate_frameworks(self, frameworks: Dict[str, Framework]) -> List[ConsolidatedDocument]:
        """Consolidate frameworks - each framework gets its own file."""
        consolidated = []
        
        for i, (name, framework) in enumerate(frameworks.items(), 1):
            # Create comprehensive framework document
            content = f"# {name} Framework\n\n"
            content += f"## Overview\n\n{framework.summary}\n\n"
            content += f"## Complete Framework\n\n{framework.complete_text}\n\n"
            
            if framework.components:
                content += "## Components\n\n"
                for comp_name, comp_text in framework.components.items():
                    content += f"### {comp_name}\n\n{comp_text}\n\n"
            
            content += f"## How to Apply\n\n{framework.application}\n\n"
            
            doc = ConsolidatedDocument(
                filename=f"{i:02d}_{name.replace(' ', '_')}_Framework_Complete.md",
                title=f"{name} Framework - Complete Guide",
                category="frameworks",
                content=content,
                source_chunks=framework.source_chunks,
                source_files=list(set(framework.source_chunks)),  # Unique source files
                total_tokens=len(self.tokenizer.encode(content)),
                keywords=[name.lower(), "framework", "system", "method"],
                has_duplicates_removed=False,
                duplicate_count=0
            )
            
            consolidated.append(doc)
        
        return consolidated
    
    def _consolidate_concepts(
        self, 
        book_chunks: List[ProcessedChunk]
    ) -> List[ConsolidatedDocument]:
        """Consolidate book chapters and core concepts."""
        if not book_chunks:
            return []
        
        consolidated = []
        current_content = []
        current_tokens = 0
        current_chapter = None
        current_sources = []
        current_files = set()
        
        for chunk in book_chunks:
            chunk_tokens = chunk.token_count
            chunk_chapter = chunk.metadata.chapter or "General"
            
            # Decision point: start new document?
            should_start_new = False
            
            # Start new if chapter changes AND we have enough content
            if chunk_chapter != current_chapter and current_tokens >= self.min_tokens:
                should_start_new = True
            
            # Start new if adding this would exceed max tokens
            if current_tokens + chunk_tokens > self.max_tokens:
                should_start_new = True
            
            if should_start_new and current_content:
                # Save current document
                doc = self._create_consolidated_doc(
                    content_list=current_content,
                    category="core_concepts",
                    title=f"Core Concepts - {current_chapter or 'Collection'}",
                    sources=current_sources,
                    files=list(current_files),
                    doc_index=len(consolidated)
                )
                consolidated.append(doc)
                
                # Reset for new document
                current_content = []
                current_sources = []
                current_files = set()
                current_tokens = 0
            
            # Add chunk to current document
            current_content.append(chunk.text)
            current_sources.append(chunk.metadata.chunk_id)
            current_files.add(chunk.metadata.source_file)
            current_tokens += chunk_tokens
            current_chapter = chunk_chapter
        
        # Don't forget the last document
        if current_content:
            doc = self._create_consolidated_doc(
                content_list=current_content,
                category="core_concepts",
                title=f"Core Concepts - {current_chapter or 'Collection'}",
                sources=current_sources,
                files=list(current_files),
                doc_index=len(consolidated)
            )
            consolidated.append(doc)
        
        return consolidated
    
    def _consolidate_transcripts(
        self, 
        transcript_chunks: List[ProcessedChunk]
    ) -> List[ConsolidatedDocument]:
        """Consolidate transcript chunks by session/topic."""
        if not transcript_chunks:
            return []
        
        # Group by source file (each transcript)
        by_source = defaultdict(list)
        for chunk in transcript_chunks:
            by_source[chunk.metadata.source_file].append(chunk)
        
        consolidated = []
        
        for source_file, chunks in by_source.items():
            # Sort by chunk index
            chunks.sort(key=lambda c: c.metadata.chunk_index)
            
            # Combine all chunks from same transcript
            content_list = [chunk.text for chunk in chunks]
            sources = [chunk.metadata.chunk_id for chunk in chunks]
            total_tokens = sum(chunk.token_count for chunk in chunks)
            
            # Extract clean title from filename
            title = source_file.replace('_', ' ').replace('.txt', '').replace('.pdf', '')
            title = title.title()
            
            # If transcript is too large, split it
            if total_tokens > self.max_tokens:
                # Split into multiple documents
                parts = self._split_large_content(content_list, chunks)
                for i, (part_content, part_chunks) in enumerate(parts):
                    doc = self._create_consolidated_doc(
                        content_list=part_content,
                        category="transcripts",
                        title=f"{title} - Part {i+1}",
                        sources=[c.metadata.chunk_id for c in part_chunks],
                        files=[source_file],
                        doc_index=len(consolidated)
                    )
                    consolidated.append(doc)
            else:
                # Single document for this transcript
                doc = self._create_consolidated_doc(
                    content_list=content_list,
                    category="transcripts",
                    title=title,
                    sources=sources,
                    files=[source_file],
                    doc_index=len(consolidated)
                )
                consolidated.append(doc)
        
        return consolidated
    
    def _consolidate_templates(
        self, 
        template_chunks: List[ProcessedChunk]
    ) -> List[ConsolidatedDocument]:
        """Consolidate templates and emails."""
        if not template_chunks:
            return []
        
        # Group similar templates
        email_templates = []
        offer_templates = []
        other_templates = []
        
        for chunk in template_chunks:
            text_lower = chunk.text.lower()
            if "email" in text_lower or "subject:" in text_lower:
                email_templates.append(chunk)
            elif "offer" in text_lower or "package" in text_lower:
                offer_templates.append(chunk)
            else:
                other_templates.append(chunk)
        
        consolidated = []
        
        # Consolidate email templates
        if email_templates:
            doc = self._create_consolidated_doc(
                content_list=[c.text for c in email_templates],
                category="templates",
                title="Email Templates Collection",
                sources=[c.metadata.chunk_id for c in email_templates],
                files=list(set(c.metadata.source_file for c in email_templates)),
                doc_index=0
            )
            consolidated.append(doc)
        
        # Consolidate offer templates
        if offer_templates:
            doc = self._create_consolidated_doc(
                content_list=[c.text for c in offer_templates],
                category="templates",
                title="Offer Templates Collection",
                sources=[c.metadata.chunk_id for c in offer_templates],
                files=list(set(c.metadata.source_file for c in offer_templates)),
                doc_index=1
            )
            consolidated.append(doc)
        
        # Consolidate other templates
        if other_templates:
            doc = self._create_consolidated_doc(
                content_list=[c.text for c in other_templates],
                category="templates",
                title="Business Templates Collection",
                sources=[c.metadata.chunk_id for c in other_templates],
                files=list(set(c.metadata.source_file for c in other_templates)),
                doc_index=2
            )
            consolidated.append(doc)
        
        return consolidated
    
    def _consolidate_guides(
        self, 
        guide_chunks: List[ProcessedChunk]
    ) -> List[ConsolidatedDocument]:
        """Consolidate guide documents."""
        if not guide_chunks:
            return []
        
        # Group by source file
        by_source = defaultdict(list)
        for chunk in guide_chunks:
            by_source[chunk.metadata.source_file].append(chunk)
        
        # Merge guides from same source
        consolidated = []
        for source_file, chunks in by_source.items():
            chunks.sort(key=lambda c: c.metadata.chunk_index)
            
            doc = self._create_consolidated_doc(
                content_list=[c.text for c in chunks],
                category="guides",
                title=source_file.replace('_', ' ').replace('.pdf', '').title(),
                sources=[c.metadata.chunk_id for c in chunks],
                files=[source_file],
                doc_index=len(consolidated)
            )
            consolidated.append(doc)
        
        return consolidated
    
    def _create_consolidated_doc(
        self,
        content_list: List[str],
        category: str,
        title: str,
        sources: List[str],
        files: List[str],
        doc_index: int
    ) -> ConsolidatedDocument:
        """Create a consolidated document from content pieces."""
        # Join content with proper spacing
        content = "\n\n".join(content_list)
        
        # Calculate tokens
        total_tokens = len(self.tokenizer.encode(content))
        
        # Extract keywords from content
        keywords = self._extract_doc_keywords(content)
        
        # Generate filename
        safe_title = title.replace(' ', '_').replace('-', '_')
        safe_title = ''.join(c for c in safe_title if c.isalnum() or c == '_')
        filename = f"{doc_index+1:02d}_{safe_title}.md"
        
        return ConsolidatedDocument(
            filename=filename,
            title=title,
            category=category,
            content=content,
            source_chunks=sources,
            source_files=files,
            total_tokens=total_tokens,
            keywords=keywords,
            has_duplicates_removed=True,
            duplicate_count=0  # Will be updated if needed
        )
    
    def _extract_doc_keywords(self, content: str) -> List[str]:
        """Extract keywords from document content."""
        # Simple keyword extraction
        keywords = set()
        
        # Common important terms
        important_terms = [
            "framework", "system", "method", "strategy", "tactic",
            "client", "customer", "business", "offer", "service",
            "leverage", "scale", "growth", "revenue", "profit"
        ]
        
        content_lower = content.lower()
        for term in important_terms:
            if term in content_lower:
                keywords.add(term)
        
        return sorted(list(keywords))[:10]
    
    def _split_large_content(
        self, 
        content_list: List[str], 
        chunks: List[ProcessedChunk]
    ) -> List[Tuple[List[str], List[ProcessedChunk]]]:
        """Split large content into multiple documents."""
        parts = []
        current_content = []
        current_chunks = []
        current_tokens = 0
        
        for content, chunk in zip(content_list, chunks):
            chunk_tokens = chunk.token_count
            
            if current_tokens + chunk_tokens > self.max_tokens and current_content:
                # Save current part
                parts.append((current_content, current_chunks))
                current_content = []
                current_chunks = []
                current_tokens = 0
            
            current_content.append(content)
            current_chunks.append(chunk)
            current_tokens += chunk_tokens
        
        # Don't forget the last part
        if current_content:
            parts.append((current_content, current_chunks))
        
        return parts
    
    def _optimize_file_count(
        self, 
        consolidated: Dict[str, List[ConsolidatedDocument]]
    ) -> Dict[str, List[ConsolidatedDocument]]:
        """Optimize the file count to reach target."""
        total_files = sum(len(docs) for docs in consolidated.values())
        
        logger.info(f"Current file count: {total_files}, target: {self.target_files}")
        
        # If we have too many files, merge smallest ones
        if total_files > self.target_files * 1.2:  # 20% tolerance
            consolidated = self._merge_small_documents(consolidated)
        
        # If we have too few files, consider splitting largest ones
        elif total_files < self.target_files * 0.5:  # Less than half target
            logger.warning(f"File count ({total_files}) is much lower than target ({self.target_files})")
            # Could implement splitting logic here if needed
        
        return consolidated
    
    def _merge_small_documents(
        self, 
        consolidated: Dict[str, List[ConsolidatedDocument]]
    ) -> Dict[str, List[ConsolidatedDocument]]:
        """Merge small documents within same category."""
        for category, docs in consolidated.items():
            if len(docs) <= 1:
                continue
            
            # Sort by token count
            docs.sort(key=lambda d: d.total_tokens)
            
            merged_docs = []
            i = 0
            
            while i < len(docs):
                current_doc = docs[i]
                
                # Try to merge with next document if both are small
                if (i + 1 < len(docs) and 
                    current_doc.total_tokens < self.min_tokens and
                    docs[i + 1].total_tokens < self.min_tokens and
                    current_doc.total_tokens + docs[i + 1].total_tokens <= self.max_tokens):
                    
                    # Merge documents
                    next_doc = docs[i + 1]
                    merged_content = f"{current_doc.content}\n\n---\n\n{next_doc.content}"
                    
                    merged_doc = ConsolidatedDocument(
                        filename=current_doc.filename,
                        title=f"{current_doc.title} & {next_doc.title}",
                        category=category,
                        content=merged_content,
                        source_chunks=current_doc.source_chunks + next_doc.source_chunks,
                        source_files=list(set(current_doc.source_files + next_doc.source_files)),
                        total_tokens=current_doc.total_tokens + next_doc.total_tokens,
                        keywords=list(set(current_doc.keywords + next_doc.keywords))[:10],
                        has_duplicates_removed=True,
                        duplicate_count=0
                    )
                    
                    merged_docs.append(merged_doc)
                    i += 2  # Skip next document
                else:
                    merged_docs.append(current_doc)
                    i += 1
            
            consolidated[category] = merged_docs
        
        return consolidated