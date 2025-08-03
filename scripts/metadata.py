"""
Metadata extraction and enrichment module.
"""

import re
import logging
from typing import List, Set, Dict
from collections import Counter

from .models import ProcessedChunk
from .config import CONCEPT_KEYWORDS, FRAMEWORK_PATTERNS

logger = logging.getLogger(__name__)


class MetadataExtractor:
    """Extracts and enriches metadata from document chunks."""
    
    def __init__(self):
        # Common business/consulting terms for James Kemp's content
        self.business_terms = {
            "consultant", "consulting", "client", "customer", "business",
            "revenue", "profit", "scale", "leverage", "offer", "service",
            "framework", "system", "process", "strategy", "tactic",
            "workshop", "course", "coaching", "mentor", "expert",
            "sovereign", "transformation", "results", "outcome"
        }
        
        # James Kemp specific concepts
        self.jk_concepts = {
            "3 E's", "Energy", "Earnings", "Experience",
            "Daily Client Machine", "DCM",
            "Hybrid Offer", "Sovereign Consultant",
            "3k Code", "$100 Workshop",
            "Offer Code", "Install Offer"
        }
    
    def enrich_chunks(self, chunks: List[ProcessedChunk]) -> List[ProcessedChunk]:
        """Enrich chunks with extracted metadata."""
        logger.info(f"Enriching metadata for {len(chunks)} chunks")
        
        for chunk in chunks:
            # Extract keywords
            chunk.metadata.keywords = self._extract_keywords(chunk.text)
            
            # Extract entities (people, concepts, frameworks)
            chunk.metadata.entities = self._extract_entities(chunk.text)
            
            # Categorize concept type
            chunk.metadata.concept_category = self._categorize_concept(chunk.text)
            
            # Find related concepts
            chunk.metadata.related_concepts = self._find_related_concepts(chunk.text)
        
        return chunks
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract relevant keywords from text."""
        # Convert to lowercase for matching
        text_lower = text.lower()
        
        keywords = set()
        
        # Add concept keywords found in text
        for keyword in CONCEPT_KEYWORDS:
            if keyword in text_lower:
                keywords.add(keyword)
        
        # Add business terms found in text
        for term in self.business_terms:
            if term in text_lower:
                keywords.add(term)
        
        # Add specific JK concepts (case-sensitive)
        for concept in self.jk_concepts:
            if concept in text:
                keywords.add(concept.lower())
        
        # Extract potential keywords using simple heuristics
        # Look for capitalized phrases (potential concepts)
        capitalized_phrases = re.findall(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*', text)
        for phrase in capitalized_phrases:
            if len(phrase.split()) <= 3 and len(phrase) > 5:
                keywords.add(phrase.lower())
        
        # Limit to top 10 keywords
        return sorted(list(keywords))[:10]
    
    def _extract_entities(self, text: str) -> List[str]:
        """Extract named entities and important concepts."""
        entities = set()
        
        # Extract JK specific concepts
        for concept in self.jk_concepts:
            if concept in text:
                entities.add(concept)
        
        # Extract framework names using patterns
        for pattern in FRAMEWORK_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                entities.add(match)
        
        # Extract quoted concepts
        quoted = re.findall(r'"([^"]+)"', text)
        for quote in quoted:
            if 5 < len(quote) < 50:  # Reasonable length for a concept
                entities.add(quote)
        
        # Extract money amounts (relevant for business content)
        money_amounts = re.findall(r'\$[\d,]+(?:k|K|M)?|\d+k\s+(?:per|/)', text)
        entities.update(money_amounts)
        
        return sorted(list(entities))[:15]  # Limit to 15 entities
    
    def _categorize_concept(self, text: str) -> str:
        """Categorize the type of concept in the chunk."""
        text_lower = text.lower()
        
        # Count occurrences of category indicators
        categories = {
            "framework": ["framework", "system", "model", "structure"],
            "strategy": ["strategy", "approach", "method", "plan"],
            "tactic": ["tactic", "technique", "tip", "hack", "tool"],
            "mindset": ["mindset", "belief", "principle", "philosophy", "thinking"]
        }
        
        category_scores = {}
        for category, indicators in categories.items():
            score = sum(1 for indicator in indicators if indicator in text_lower)
            if score > 0:
                category_scores[category] = score
        
        # Return the highest scoring category
        if category_scores:
            return max(category_scores, key=category_scores.get)
        
        return "strategy"  # Default
    
    def _find_related_concepts(self, text: str) -> List[str]:
        """Find concepts that are related to the content."""
        related = set()
        
        # Map of concept relationships
        concept_map = {
            "3 E's": ["Energy", "Earnings", "Experience", "leverage", "evaluation"],
            "Energy": ["3 E's", "passion", "motivation", "burnout"],
            "Earnings": ["3 E's", "revenue", "profit", "pricing"],
            "Experience": ["3 E's", "expertise", "results", "transformation"],
            "Daily Client Machine": ["DCM", "consistency", "pipeline", "acquisition"],
            "Hybrid Offer": ["offer", "package", "service", "value"],
            "Sovereign Consultant": ["independence", "freedom", "expertise", "positioning"],
            "$100 Workshop": ["workshop", "low-ticket", "entry", "funnel"],
        }
        
        # Find which concepts are mentioned
        for concept, related_concepts in concept_map.items():
            if concept in text:
                related.update(related_concepts)
        
        # Remove concepts that are already in the text
        related = {r for r in related if r not in text}
        
        return sorted(list(related))[:5]  # Limit to 5 related concepts
    
    def build_cross_references(self, chunks: List[ProcessedChunk]) -> Dict[str, List[str]]:
        """Build cross-references between chunks based on shared concepts."""
        concept_to_chunks = {}
        
        # Build index of concepts to chunk IDs
        for chunk in chunks:
            for entity in chunk.metadata.entities:
                if entity not in concept_to_chunks:
                    concept_to_chunks[entity] = []
                concept_to_chunks[entity].append(chunk.metadata.chunk_id)
        
        # Only keep concepts that appear in multiple chunks
        cross_refs = {
            concept: chunk_ids 
            for concept, chunk_ids in concept_to_chunks.items() 
            if len(chunk_ids) > 1
        }
        
        return cross_refs