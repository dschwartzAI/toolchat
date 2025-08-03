"""
Framework extraction and special handling module.
"""

import re
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass

from .models import ProcessedChunk, DocumentType, ChunkMetadata
from .config import FRAMEWORK_PATTERNS

logger = logging.getLogger(__name__)


@dataclass
class Framework:
    """Represents an extracted framework."""
    name: str
    complete_text: str
    components: Dict[str, str]
    summary: str
    application: str
    source_chunks: List[str]


class FrameworkExtractor:
    """Extracts and handles frameworks with special treatment."""
    
    def __init__(self):
        # Known frameworks in James Kemp's content
        self.known_frameworks = {
            "3 E's": {
                "components": ["Energy", "Earnings", "Experience"],
                "aliases": ["3Es", "Three E's", "The 3 E's Framework"]
            },
            "Daily Client Machine": {
                "components": ["Daily", "Consistent", "Pipeline"],
                "aliases": ["DCM", "Daily Client Machine", "Client Machine"]
            },
            "Hybrid Offer": {
                "components": ["High-ticket", "Low-ticket", "Middle-ticket"],
                "aliases": ["Hybrid", "Hybrid Offer Framework"]
            },
            "Sovereign Consultant": {
                "components": ["Independence", "Expertise", "Positioning"],
                "aliases": ["Sovereign", "The Sovereign Consultant"]
            },
            "$100 Workshop": {
                "components": ["Entry", "Value", "Upsell"],
                "aliases": ["100 Dollar Workshop", "Low-ticket Workshop"]
            }
        }
    
    def extract_frameworks(self, chunks: List[ProcessedChunk]) -> Dict[str, Framework]:
        """
        Extract complete frameworks from chunks.
        
        Returns:
            Dictionary mapping framework names to Framework objects
        """
        logger.info(f"Extracting frameworks from {len(chunks)} chunks")
        
        frameworks = {}
        
        # First pass: identify chunks containing frameworks
        framework_chunks = self._identify_framework_chunks(chunks)
        
        # Second pass: extract complete frameworks
        for framework_name, chunk_list in framework_chunks.items():
            framework = self._build_complete_framework(framework_name, chunk_list)
            if framework:
                frameworks[framework_name] = framework
        
        logger.info(f"Extracted {len(frameworks)} frameworks")
        return frameworks
    
    def _identify_framework_chunks(self, chunks: List[ProcessedChunk]) -> Dict[str, List[ProcessedChunk]]:
        """Identify which chunks contain framework content."""
        framework_chunks = {}
        
        for chunk in chunks:
            # Check against known frameworks
            for framework_name, info in self.known_frameworks.items():
                if self._chunk_contains_framework(chunk, framework_name, info):
                    if framework_name not in framework_chunks:
                        framework_chunks[framework_name] = []
                    framework_chunks[framework_name].append(chunk)
            
            # Check against framework patterns
            for pattern in FRAMEWORK_PATTERNS:
                matches = re.findall(pattern, chunk.text, re.IGNORECASE)
                for match in matches:
                    framework_name = match[0] if isinstance(match, tuple) else match
                    if framework_name not in framework_chunks:
                        framework_chunks[framework_name] = []
                    if chunk not in framework_chunks[framework_name]:
                        framework_chunks[framework_name].append(chunk)
        
        return framework_chunks
    
    def _chunk_contains_framework(self, chunk: ProcessedChunk, name: str, info: dict) -> bool:
        """Check if a chunk contains a specific framework."""
        text = chunk.text
        
        # Check main name
        if name in text:
            return True
        
        # Check aliases
        for alias in info.get("aliases", []):
            if alias in text:
                return True
        
        # Check if all components are mentioned
        components = info.get("components", [])
        if components:
            component_count = sum(1 for comp in components if comp in text)
            if component_count >= len(components) * 0.7:  # At least 70% of components
                return True
        
        return False
    
    def _build_complete_framework(
        self, 
        framework_name: str, 
        chunks: List[ProcessedChunk]
    ) -> Optional[Framework]:
        """Build a complete framework from related chunks."""
        if not chunks:
            return None
        
        # Sort chunks by their original index to maintain order
        chunks.sort(key=lambda c: c.metadata.chunk_index)
        
        # Combine all text
        complete_text = "\n\n".join(chunk.text for chunk in chunks)
        
        # Extract components
        components = self._extract_components(framework_name, complete_text)
        
        # Generate summary
        summary = self._generate_summary(framework_name, complete_text, components)
        
        # Extract application examples
        application = self._extract_application(complete_text)
        
        # Get source chunk IDs
        source_chunks = [chunk.metadata.chunk_id for chunk in chunks]
        
        return Framework(
            name=framework_name,
            complete_text=complete_text,
            components=components,
            summary=summary,
            application=application,
            source_chunks=source_chunks
        )
    
    def _extract_components(self, framework_name: str, text: str) -> Dict[str, str]:
        """Extract individual components of a framework."""
        components = {}
        
        # Check if it's a known framework
        if framework_name in self.known_frameworks:
            known_components = self.known_frameworks[framework_name]["components"]
            
            for component in known_components:
                # Find text related to this component
                component_text = self._extract_component_text(text, component)
                if component_text:
                    components[component] = component_text
        else:
            # Try to extract components using patterns
            # Look for numbered or bulleted lists
            patterns = [
                r'(?:^|\n)\s*(?:\d+\.?|[-•])\s*([^:\n]+):\s*([^\n]+(?:\n(?!\s*(?:\d+\.?|[-•]))[^\n]+)*)',
                r'(?:^|\n)\s*\*\*([^*]+)\*\*:\s*([^\n]+(?:\n(?!\s*\*\*)[^\n]+)*)',
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, text, re.MULTILINE)
                for component_name, component_desc in matches:
                    component_name = component_name.strip()
                    component_desc = component_desc.strip()
                    if component_name and component_desc:
                        components[component_name] = component_desc
        
        return components
    
    def _extract_component_text(self, text: str, component: str) -> Optional[str]:
        """Extract text specifically about a component."""
        # Look for sections about this component
        patterns = [
            rf'{component}[:\s]+([^.]+\.(?:[^.]+\.)?)',  # Component: description
            rf'\b{component}\b[^.]*?means?\s+([^.]+\.)',  # Component means...
            rf'\b{component}\b[^.]*?is\s+([^.]+\.)',  # Component is...
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # Fallback: find paragraph containing component
        paragraphs = text.split('\n\n')
        for para in paragraphs:
            if component in para and len(para) > 50:
                return para.strip()
        
        return None
    
    def _generate_summary(
        self, 
        framework_name: str, 
        text: str, 
        components: Dict[str, str]
    ) -> str:
        """Generate a concise summary of the framework."""
        # Look for existing summary in text
        summary_patterns = [
            r'(?:summary|overview|in short|simply put)[:\s]+([^.]+\.)',
            r'The\s+' + re.escape(framework_name) + r'\s+(?:is|helps|enables)\s+([^.]+\.)',
        ]
        
        for pattern in summary_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # Generate summary from components
        if components:
            comp_list = ", ".join(components.keys())
            return f"The {framework_name} framework consists of {comp_list}."
        
        # Fallback: use first substantial sentence mentioning the framework
        sentences = text.split('.')
        for sentence in sentences:
            if framework_name in sentence and 50 < len(sentence) < 200:
                return sentence.strip() + "."
        
        return f"The {framework_name} is a comprehensive framework for business transformation."
    
    def _extract_application(self, text: str) -> str:
        """Extract how to apply the framework."""
        # Look for application sections
        application_patterns = [
            r'(?:how to apply|application|implementation|using this)[:\s]+([^.]+\.(?:[^.]+\.)?)',
            r'(?:step(?:s)?|process|approach)[:\s]+([^.]+\.(?:[^.]+\.)?)',
            r'To\s+(?:use|apply|implement)\s+[^,]+,\s+([^.]+\.)',
        ]
        
        for pattern in application_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # Look for numbered steps
        steps = re.findall(r'(?:^|\n)\s*\d+\.?\s+([^\n]+)', text, re.MULTILINE)
        if len(steps) >= 3:
            return "Application steps:\n" + "\n".join(f"- {step}" for step in steps[:5])
        
        return "See the complete framework description for detailed application guidelines."
    
    def create_framework_chunks(self, frameworks: Dict[str, Framework]) -> List[ProcessedChunk]:
        """
        Create ProcessedChunks from extracted frameworks.
        
        This creates multiple representations:
        1. Complete framework chunk
        2. Individual component chunks
        3. Summary chunk
        4. Application chunk
        """
        framework_chunks = []
        
        for name, framework in frameworks.items():
            # 1. Complete framework chunk
            complete_chunk = ProcessedChunk(
                text=f"# {name} Framework\n\n{framework.complete_text}",
                metadata=ChunkMetadata(
                    chunk_id=f"framework_{name}_complete",
                    document_id=f"framework_{name}",
                    source_file="extracted_frameworks",
                    document_type=DocumentType.FRAMEWORK,
                    title=f"{name} Framework - Complete",
                    keywords=["framework", name.lower()],
                    entities=[name] + list(framework.components.keys()),
                    concept_category="framework",
                    chunk_index=0,
                    total_chunks_in_section=4
                ),
                token_count=int(len(framework.complete_text.split()) * 1.3)  # Rough estimate
            )
            framework_chunks.append(complete_chunk)
            
            # 2. Component chunks
            for i, (comp_name, comp_text) in enumerate(framework.components.items()):
                comp_chunk = ProcessedChunk(
                    text=f"## {name} Framework - {comp_name}\n\n{comp_text}",
                    metadata=ChunkMetadata(
                        chunk_id=f"framework_{name}_component_{i}",
                        document_id=f"framework_{name}",
                        source_file="extracted_frameworks",
                        document_type=DocumentType.FRAMEWORK,
                        title=f"{name} - {comp_name}",
                        keywords=["framework", "component", name.lower(), comp_name.lower()],
                        entities=[name, comp_name],
                        concept_category="framework",
                        chunk_index=i + 1,
                        total_chunks_in_section=len(framework.components) + 3
                    ),
                    token_count=int(len(comp_text.split()) * 1.3)
                )
                framework_chunks.append(comp_chunk)
            
            # 3. Summary chunk
            summary_chunk = ProcessedChunk(
                text=f"## {name} Framework - Summary\n\n{framework.summary}",
                metadata=ChunkMetadata(
                    chunk_id=f"framework_{name}_summary",
                    document_id=f"framework_{name}",
                    source_file="extracted_frameworks",
                    document_type=DocumentType.FRAMEWORK,
                    title=f"{name} - Summary",
                    keywords=["framework", "summary", name.lower()],
                    entities=[name],
                    concept_category="framework",
                    chunk_index=len(framework.components) + 1,
                    total_chunks_in_section=len(framework.components) + 3
                ),
                token_count=int(len(framework.summary.split()) * 1.3)
            )
            framework_chunks.append(summary_chunk)
            
            # 4. Application chunk
            app_chunk = ProcessedChunk(
                text=f"## {name} Framework - Application\n\n{framework.application}",
                metadata=ChunkMetadata(
                    chunk_id=f"framework_{name}_application",
                    document_id=f"framework_{name}",
                    source_file="extracted_frameworks",
                    document_type=DocumentType.FRAMEWORK,
                    title=f"{name} - How to Apply",
                    keywords=["framework", "application", "implementation", name.lower()],
                    entities=[name],
                    concept_category="framework",
                    chunk_index=len(framework.components) + 2,
                    total_chunks_in_section=len(framework.components) + 3
                ),
                token_count=int(len(framework.application.split()) * 1.3)
            )
            framework_chunks.append(app_chunk)
        
        return framework_chunks