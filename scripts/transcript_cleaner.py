"""
Transcript cleaning and processing module.
"""

import re
import logging
from typing import List, Tuple, Optional

from .config import FILLER_WORDS

logger = logging.getLogger(__name__)


class TranscriptCleaner:
    """Cleans and structures video transcripts."""
    
    def __init__(self):
        # Create regex pattern for filler words (case-insensitive)
        self.filler_pattern = self._create_filler_pattern()
        
        # Pattern for timestamps
        self.timestamp_pattern = re.compile(r'\[[\d:]+\]|\d{1,2}:\d{2}(?::\d{2})?')
        
        # Pattern for speaker labels
        self.speaker_pattern = re.compile(r'^(Speaker\s*\d*|[A-Z][a-z]+|Q|A|James|JK):\s*', re.MULTILINE)
    
    def clean_transcript(self, text: str) -> str:
        """
        Clean a transcript by removing filler words and formatting.
        
        Args:
            text: Raw transcript text
            
        Returns:
            Cleaned transcript with structure preserved
        """
        logger.info("Cleaning transcript")
        
        # Step 1: Remove filler words
        cleaned_text = self._remove_fillers(text)
        
        # Step 2: Clean up timestamps but preserve structure
        cleaned_text = self._clean_timestamps(cleaned_text)
        
        # Step 3: Consolidate repeated ideas
        cleaned_text = self._consolidate_repetitions(cleaned_text)
        
        # Step 4: Add topic headers based on content
        cleaned_text = self._add_topic_headers(cleaned_text)
        
        # Step 5: Format for readability
        cleaned_text = self._format_transcript(cleaned_text)
        
        return cleaned_text
    
    def _create_filler_pattern(self) -> re.Pattern:
        """Create regex pattern for filler words."""
        # Escape special characters and create pattern
        fillers = [re.escape(filler) for filler in FILLER_WORDS]
        pattern = r'\b(' + '|'.join(fillers) + r')\b'
        return re.compile(pattern, re.IGNORECASE)
    
    def _remove_fillers(self, text: str) -> str:
        """Remove filler words while preserving sentence structure."""
        # Remove filler words
        cleaned = self.filler_pattern.sub('', text)
        
        # Clean up extra spaces and commas
        cleaned = re.sub(r'\s+,', ',', cleaned)  # Remove space before comma
        cleaned = re.sub(r',\s*,+', ',', cleaned)  # Remove multiple commas
        cleaned = re.sub(r',\s*\.', '.', cleaned)  # Remove comma before period
        cleaned = re.sub(r'\s+', ' ', cleaned)  # Normalize spaces
        
        return cleaned.strip()
    
    def _clean_timestamps(self, text: str) -> str:
        """Clean timestamps while preserving topic breaks."""
        lines = text.split('\n')
        cleaned_lines = []
        
        for i, line in enumerate(lines):
            # Check if line starts with timestamp
            if self.timestamp_pattern.match(line.strip()):
                # If there's content after timestamp, keep it
                cleaned_line = self.timestamp_pattern.sub('', line).strip()
                if cleaned_line:
                    # Add a topic marker if significant time gap
                    if i > 0 and self._is_topic_break(lines, i):
                        cleaned_lines.append('\n---\n')
                    cleaned_lines.append(cleaned_line)
            else:
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def _is_topic_break(self, lines: List[str], index: int) -> bool:
        """Detect if there's a topic break at this point."""
        # Simple heuristic: if previous line was empty or very short
        if index > 0:
            prev_line = lines[index - 1].strip()
            if not prev_line or len(prev_line) < 20:
                return True
        return False
    
    def _consolidate_repetitions(self, text: str) -> str:
        """Consolidate repeated ideas (not remove, but organize)."""
        paragraphs = text.split('\n\n')
        consolidated = []
        
        # Track similar content
        seen_concepts = {}
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # Create a simplified version for comparison
            simplified = self._simplify_text(para)
            
            # Check if we've seen very similar content
            is_repetition = False
            for concept, original_para in seen_concepts.items():
                similarity = self._calculate_similarity(simplified, concept)
                if similarity > 0.8:  # High similarity threshold
                    # Merge with existing paragraph if very similar
                    is_repetition = True
                    # Keep the longer/more complete version
                    if len(para) > len(original_para):
                        seen_concepts[concept] = para
                    break
            
            if not is_repetition:
                seen_concepts[simplified] = para
                consolidated.append(para)
        
        return '\n\n'.join(consolidated)
    
    def _simplify_text(self, text: str) -> str:
        """Create simplified version of text for comparison."""
        # Remove speaker labels
        text = self.speaker_pattern.sub('', text)
        # Lowercase and remove punctuation
        text = re.sub(r'[^\w\s]', '', text.lower())
        # Remove extra spaces
        text = ' '.join(text.split())
        return text
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Simple word-based similarity calculation."""
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1 & words2
        union = words1 | words2
        
        return len(intersection) / len(union)
    
    def _add_topic_headers(self, text: str) -> str:
        """Add topic headers based on content shifts."""
        sections = text.split('---')
        processed_sections = []
        
        for section in sections:
            section = section.strip()
            if not section:
                continue
            
            # Try to identify the topic of this section
            topic = self._identify_topic(section)
            
            if topic:
                processed_sections.append(f"## {topic}\n\n{section}")
            else:
                processed_sections.append(section)
        
        return '\n\n---\n\n'.join(processed_sections)
    
    def _identify_topic(self, text: str) -> Optional[str]:
        """Identify the main topic of a text section."""
        # Look for key phrases that indicate topics
        topic_patterns = {
            "Introduction": [r'welcome', r'today we', r'going to talk about'],
            "Framework Overview": [r'framework', r'system', r'model', r'process'],
            "Implementation Steps": [r'step \d', r'first', r'next', r'then', r'finally'],
            "Examples & Case Studies": [r'example', r'case study', r'client', r'worked with'],
            "Q&A Session": [r'question', r'Q:', r'ask', r'answer'],
            "Action Items": [r'action', r'homework', r'assignment', r'your task'],
            "Summary": [r'summary', r'recap', r'remember', r'key point'],
        }
        
        text_lower = text.lower()
        
        for topic, patterns in topic_patterns.items():
            matches = sum(1 for pattern in patterns if re.search(pattern, text_lower))
            if matches >= 2:  # At least 2 pattern matches
                return topic
        
        # Try to extract topic from first sentence
        first_sentence = text.split('.')[0] if '.' in text else text[:100]
        if len(first_sentence) < 100:
            # Clean and capitalize
            topic = first_sentence.strip()
            # Remove speaker labels
            topic = self.speaker_pattern.sub('', topic)
            if 20 < len(topic) < 60:
                return topic.title()
        
        return None
    
    def _format_transcript(self, text: str) -> str:
        """Final formatting for readability."""
        # Ensure proper spacing after periods
        text = re.sub(r'\.(?=[A-Z])', '. ', text)
        
        # Format speaker labels consistently
        text = self.speaker_pattern.sub(r'\n**\1:**\n', text)
        
        # Remove excessive blank lines
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Ensure quotes are preserved
        text = self._preserve_important_quotes(text)
        
        return text.strip()
    
    def _preserve_important_quotes(self, text: str) -> str:
        """Ensure important quotes are preserved verbatim."""
        # Find quoted text
        quotes = re.findall(r'"([^"]+)"', text)
        
        # Mark important quotes (longer ones with substance)
        for quote in quotes:
            if len(quote) > 50:  # Substantial quote
                # Format as blockquote
                text = text.replace(f'"{quote}"', f'\n> "{quote}"\n')
        
        return text