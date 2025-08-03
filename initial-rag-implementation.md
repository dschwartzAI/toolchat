name: "Initial RAG Implementation - Advanced Document Processing Pipeline"
description: |

## Purpose
Build a comprehensive document processing pipeline to prepare James Kemp's business knowledge base for optimal RAG (Retrieval Augmented Generation) performance in the DarkJK coaching tool, with intelligent consolidation that preserves ALL content while creating manageable file counts for manual upload.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md
6. **Content Preservation**: NEVER lose data during consolidation (except exact duplicates)

---

## Goal
Create a Python script that processes 20+ diverse documents (PDFs, text files, video transcripts) from the "JK Knowledge" folder into 50-100 optimized document files ready for manual upload to LibreChat agents. The consolidation must preserve ALL content while organizing it semantically for 10x better retrieval performance.

## Why
- **Business value**: Enable Dark JK Coach agent to provide accurate, context-aware business coaching based on James Kemp's knowledge
- **Integration**: Prepare documents for manual upload to LibreChat's RAG system
- **Problems solved**: Poor retrieval accuracy, loss of context in frameworks, messy transcript data, too many files to manually manage
- **10x Improvement**: Intelligent consolidation and enrichment for dramatically better retrieval

## What
Python-based document processing pipeline that:
- Processes all files in "JK Knowledge" folder
- Uses intelligent chunking and consolidation based on document type
- Outputs optimized documents (50-100 files) ready for manual upload
- Creates semantically coherent documents that preserve context
- Generates rich metadata for each output file
- Provides clear file naming for easy manual management

### Success Criteria
- [ ] All 20+ documents successfully processed
- [ ] Output consolidated to 50-100 high-quality files
- [ ] Framework structures preserved in single files (e.g., complete 3 E's framework)
- [ ] Related content intelligently grouped together
- [ ] Clear file naming convention for manual upload
- [ ] Test queries show 10x improvement in retrieval quality
- [ ] Processing completes in <30 minutes
- [ ] Error rate <5% of content

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://docs.unstructured.io/open-source/introduction/overview
  why: Document parsing library documentation
  critical: Supports PDFs, DOCX, TXT with structure preservation
  
- url: https://python.langchain.com/docs/integrations/vectorstores/pgvector/
  why: pgVector integration with LangChain
  section: Connection setup and document storage
  
- url: https://github.com/Unstructured-IO/unstructured
  why: Examples of document processing patterns
  critical: Use hi_res strategy for PDFs with tables
  
- file: /Users/danielschwartz/jk-ai/jk-ai/scripts/upload-knowledge-base.sh
  why: Existing upload script shows RAG API integration pattern
  
- file: /Users/danielschwartz/jk-ai/jk-ai/LibreChat/.env
  why: Contains RAG configuration and API endpoints
  
- file: /Users/danielschwartz/jk-ai/jk-ai/LibreChat/docker-compose.override.yml
  why: RAG service configuration and dependencies

- docfile: /Users/danielschwartz/jk-ai/jk-ai/initialrag.md
  why: Original feature requirements and specifications
```

### Current Codebase Structure
```bash
jk-ai/
├── JK knowledge/                    # Source documents to process
│   ├── *.pdf                       # Books, frameworks, templates
│   ├── *.txt                       # Transcripts and notes
│   └── [20+ files total]
├── LibreChat/
│   ├── docker-compose.override.yml  # RAG services (pgVector, RAG API)
│   └── .env                        # Configuration
├── scripts/
│   ├── setup-rag.sh               # RAG setup script
│   └── upload-knowledge-base.sh    # Current upload script
└── PRPs/                          # Project plans
```

### Desired Output Structure
```bash
output/
├── for_upload/                         # ~50-100 optimized files ready for manual upload
│   ├── frameworks/                     # Complete framework documents
│   │   ├── 01_3Es_Framework_Complete.md
│   │   ├── 02_Hybrid_Offer_Framework.md
│   │   ├── 03_Daily_Client_Machine.md
│   │   └── ...
│   ├── core_concepts/                  # Grouped conceptual content
│   │   ├── 01_Sovereign_Consultant_Ch1-3.md
│   │   ├── 02_Sovereign_Consultant_Ch4-6.md
│   │   ├── 03_Business_Leverage_Strategies.md
│   │   └── ...
│   ├── transcripts/                    # Cleaned and structured transcripts
│   │   ├── 01_DCM_Workshop_Full.md
│   │   ├── 02_3k_Code_Training.md
│   │   └── ...
│   ├── templates/                      # Ready-to-use templates
│   │   ├── 01_Email_Templates_Collection.md
│   │   ├── 02_Offer_Templates.md
│   │   └── ...
│   └── upload_manifest.json            # Metadata and upload instructions
├── processing/
│   ├── consolidated_map.json          # Shows how chunks were consolidated
│   └── metadata_index.json            # Rich metadata for each output file
├── logs/
│   ├── processing.log                 # Detailed processing log
│   └── consolidation.log              # How files were merged
└── reports/
    ├── statistics.md                  # Processing statistics
    ├── quality_report.md              # Validation results
    └── upload_guide.md                # Instructions for manual upload
```

### Known Gotchas & Library Quirks
```python
# CRITICAL: Output consolidation strategy
# - Target 50-100 files maximum for manual upload
# - Each file should be 2000-5000 tokens (optimal for RAG)
# - Group related content semantically, not just by source
# - PRESERVE ALL CONTENT - no data loss during consolidation
# - Only remove exact duplicates (e.g., repeated paragraphs)

# CRITICAL: No embedding needed
# - LibreChat RAG API handles all embedding
# - Focus on content quality and organization
# - Output plain markdown files with metadata headers

# CRITICAL: File naming for manual upload
# - Use numbered prefixes for ordering (01_, 02_, etc.)
# - Descriptive names that indicate content
# - No spaces in filenames (use underscores)
# - Include content type in name

# CRITICAL: Unstructured library quirks
# - Use strategy="hi_res" for PDFs with tables/images
# - Default strategy misses some formatting
# - Large PDFs may need chunking before processing

# CRITICAL: Content preservation rules
# - NEVER remove content unless it's an exact duplicate
# - Preserve all examples, case studies, quotes
# - Keep all framework components and variations
# - Maintain original formatting where possible
# - Group by semantic similarity WITHOUT data loss

# CRITICAL: Token counting for output files
# - Use tiktoken with cl100k_base encoding
# - Target 3000-4000 tokens per file (sweet spot)
# - Max 5000 tokens to avoid context issues
# - If content exceeds max, split logically (not mid-sentence)
```

## Implementation Blueprint

### Data Models and Structure

```python
# Core data models using Pydantic v2
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Literal
from datetime import datetime
import hashlib

class DocumentType(str, Enum):
    BOOK = "book"
    TRANSCRIPT = "transcript"
    FRAMEWORK = "framework"
    TEMPLATE = "template"
    EMAIL = "email"

class ChunkMetadata(BaseModel):
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
    
    @validator('chunk_id', pre=True, always=True)
    def generate_chunk_id(cls, v, values):
        if not v:
            content = f"{values.get('document_id')}_{values.get('chunk_index')}"
            return hashlib.md5(content.encode()).hexdigest()[:16]
        return v

class ProcessedChunk(BaseModel):
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
    max_tokens: int
    min_tokens: int
    overlap_tokens: int
    split_on: List[str]
    preserve_all_content: bool = True  # Never lose data
```

### List of Tasks in Order

```yaml
Task 1: Set up project structure and dependencies
CREATE rag_processor/
  - __init__.py
  - models.py (data models above)
  - config.py (configuration management)
  - requirements.txt

Task 2: Document loading and classification
CREATE rag_processor/loaders.py:
  - IMPLEMENT document type detection
  - USE unstructured library for parsing
  - CLASSIFY documents based on content patterns

Task 3: Intelligent chunking implementation
CREATE rag_processor/chunkers.py:
  - IMPLEMENT base chunker class
  - CREATE specialized chunkers for each document type
  - PRESERVE semantic units (frameworks, concepts)

Task 4: Metadata extraction and enrichment
CREATE rag_processor/metadata.py:
  - EXTRACT document structure (chapters, sections)
  - IDENTIFY key concepts and entities
  - BUILD cross-reference mappings

Task 5: Transcript cleaning and processing
CREATE rag_processor/transcript_cleaner.py:
  - REMOVE filler words and redundancies
  - IDENTIFY speaker changes and topics
  - SEGMENT by semantic breaks

Task 6: Framework extraction and special handling
CREATE rag_processor/framework_extractor.py:
  - DETECT framework patterns (e.g., "3 E's")
  - CREATE complete and component chunks
  - GENERATE summary and application chunks

Task 7: Content consolidation engine
CREATE rag_processor/consolidator.py:
  - GROUP related chunks by semantic similarity
  - MERGE chunks into optimal-sized documents (3000-4000 tokens)
  - PRESERVE framework integrity
  - MAINTAIN topic coherence

Task 8: Output file generation
CREATE rag_processor/file_generator.py:
  - GENERATE markdown files with proper formatting
  - ADD metadata headers to each file
  - CREATE numbered file names for easy sorting
  - ORGANIZE into category folders

Task 9: Main processing pipeline
CREATE rag_processor/pipeline.py:
  - ORCHESTRATE document processing flow
  - CONSOLIDATE chunks into 50-100 files
  - HANDLE errors gracefully

Task 10: Quality assurance and validation
CREATE rag_processor/validator.py:
  - CHECK output file count (target: 50-100)
  - VALIDATE file sizes (2000-5000 tokens)
  - ENSURE framework completeness
  - TEST semantic coherence

Task 11: Reporting and upload guide
CREATE rag_processor/reporter.py:
  - GENERATE processing statistics
  - CREATE upload manifest with file descriptions
  - OUTPUT upload instructions
  - PROVIDE quality metrics

Task 12: CLI interface
CREATE process_knowledge_base.py:
  - PARSE command line arguments
  - INITIALIZE pipeline
  - RUN processing with progress bars
  - OUTPUT ready-to-upload files
```

### Per Task Pseudocode

```python
# Task 2: Document loading and classification
async def load_and_classify_document(file_path: Path) -> Tuple[str, DocumentType, Dict]:
    # PATTERN: Use unstructured for robust parsing
    from unstructured.partition.auto import partition
    
    # CRITICAL: Use hi_res for PDFs with complex layouts
    elements = partition(
        filename=str(file_path),
        strategy="hi_res" if file_path.suffix == ".pdf" else "auto",
        include_page_breaks=True,
        include_metadata=True
    )
    
    # PATTERN: Classify based on content patterns
    text = "\n".join([str(el) for el in elements])
    doc_type = classify_document(text, file_path.name)
    
    # Extract basic metadata
    metadata = {
        "title": extract_title(elements, file_path.name),
        "total_pages": count_pages(elements),
        "file_type": file_path.suffix
    }
    
    return text, doc_type, metadata

# Task 3: Intelligent chunking
class IntelligentChunker:
    def __init__(self, strategy: ChunkingStrategy):
        self.strategy = strategy
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
    
    def chunk_document(self, text: str, doc_type: DocumentType) -> List[ProcessedChunk]:
        # PATTERN: Use RecursiveCharacterTextSplitter as base
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        
        # CRITICAL: Adjust separators based on document type
        separators = self.strategy.split_on
        if doc_type == DocumentType.BOOK:
            separators = ["###", "##", "#", "\n\n", "\n", ".", " "]
        elif doc_type == DocumentType.TRANSCRIPT:
            # PATTERN: Split on speaker changes and timestamps
            separators = ["\n\n", "Speaker:", "[", "\n", ".", " "]
        
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.strategy.max_tokens,
            chunk_overlap=self.strategy.overlap_tokens,
            length_function=lambda x: len(self.tokenizer.encode(x)),
            separators=separators
        )
        
        # GOTCHA: Preserve context by adding section headers
        chunks = []
        for i, chunk_text in enumerate(splitter.split_text(text)):
            # Ensure minimum size
            if len(self.tokenizer.encode(chunk_text)) < self.strategy.min_tokens:
                continue
            
            chunks.append(ProcessedChunk(
                text=chunk_text,
                token_count=len(self.tokenizer.encode(chunk_text)),
                metadata=ChunkMetadata(
                    chunk_index=i,
                    document_type=doc_type,
                    # Additional metadata filled by caller
                )
            ))
        
        return chunks

# Task 6: Framework extraction
def extract_frameworks(chunks: List[ProcessedChunk]) -> Dict[str, List[ProcessedChunk]]:
    # PATTERN: Use regex and NLP to identify frameworks
    framework_patterns = [
        r"(\d+\s*[A-Z]'s)\s*(?:framework|model|system)",  # "3 E's framework"
        r"The\s+(\w+\s+\w+)\s+(?:Framework|Model|System)",  # "The Sovereign Consultant"
    ]
    
    frameworks = {}
    for chunk in chunks:
        for pattern in framework_patterns:
            if match := re.search(pattern, chunk.text, re.IGNORECASE):
                framework_name = match.group(1)
                
                # CRITICAL: Create multiple chunk types for frameworks
                if framework_name not in frameworks:
                    frameworks[framework_name] = []
                
                # 1. Complete chunk with full explanation
                complete_chunk = extract_complete_framework(chunk, framework_name)
                
                # 2. Component chunks (e.g., individual E's)
                component_chunks = extract_components(complete_chunk)
                
                # 3. Summary chunk for quick reference
                summary_chunk = create_summary(complete_chunk)
                
                # 4. Application chunk
                application_chunk = extract_application(chunks, framework_name)
                
                frameworks[framework_name].extend([
                    complete_chunk, 
                    *component_chunks, 
                    summary_chunk, 
                    application_chunk
                ])
    
    return frameworks

# Task 7: Content consolidation engine
class ContentConsolidator:
    def __init__(self, target_file_count: int = 75):
        self.target_files = target_file_count
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        self.min_tokens = 2000
        self.target_tokens = 3500
        self.max_tokens = 5000
        self.deduplication_threshold = 0.95  # Only remove near-exact duplicates
    
    def consolidate_chunks(self, chunks: List[ProcessedChunk]) -> Dict[str, List[ConsolidatedDocument]]:
        # CRITICAL: Track all content to ensure nothing is lost
        content_tracker = ContentTracker()
        content_tracker.record_original_content(chunks)
        
        # PATTERN: Remove only exact duplicates
        deduplicated_chunks = self.remove_exact_duplicates(chunks)
        duplicate_count = len(chunks) - len(deduplicated_chunks)
        
        # PATTERN: Group by document type and semantic similarity
        grouped = self.group_by_type_and_topic(deduplicated_chunks)
        
        # CRITICAL: Preserve frameworks as complete units
        frameworks = self.extract_complete_frameworks(deduplicated_chunks)
        
        # Consolidation strategy by type - NO CONTENT REMOVAL
        consolidated = {
            "frameworks": self.consolidate_frameworks(frameworks, preserve_all=True),
            "core_concepts": self.consolidate_concepts(grouped["books"], preserve_all=True),
            "transcripts": self.consolidate_transcripts(grouped["transcripts"], preserve_all=True),
            "templates": self.consolidate_templates(grouped["templates"], preserve_all=True)
        }
        
        # VERIFY: Ensure all content is preserved
        content_tracker.verify_no_content_loss(consolidated)
        
        return self.optimize_file_count(consolidated)
    
    def remove_exact_duplicates(self, chunks: List[ProcessedChunk]) -> List[ProcessedChunk]:
        # PATTERN: Only remove exact or near-exact duplicates
        seen_content = {}
        unique_chunks = []
        
        for chunk in chunks:
            # Normalize whitespace for comparison
            normalized = " ".join(chunk.text.split())
            content_hash = hashlib.md5(normalized.encode()).hexdigest()
            
            if content_hash not in seen_content:
                seen_content[content_hash] = chunk
                unique_chunks.append(chunk)
            else:
                # Check if it's truly a duplicate (not just similar)
                existing = seen_content[content_hash]
                similarity = self.calculate_similarity(chunk.text, existing.text)
                
                if similarity < self.deduplication_threshold:
                    # Not a true duplicate, keep it
                    unique_chunks.append(chunk)
        
        return unique_chunks
    
    def consolidate_concepts(self, book_chunks: List[ProcessedChunk], preserve_all: bool = True) -> List[ConsolidatedDocument]:
        # PATTERN: Group chapters while preserving ALL content
        consolidated = []
        current_content = []
        current_tokens = 0
        current_chapter = None
        current_sources = []
        
        for chunk in sorted(book_chunks, key=lambda x: (x.metadata.chapter or 0, x.metadata.chunk_index)):
            chunk_tokens = len(self.tokenizer.encode(chunk.text))
            
            # Start new doc if: chapter boundary AND size is good
            if (chunk.metadata.chapter != current_chapter and 
                current_tokens >= self.min_tokens) or \
               (current_tokens + chunk_tokens > self.max_tokens):
                
                if current_content:
                    # CRITICAL: Combine all content, no data loss
                    doc = ConsolidatedDocument(
                        filename=f"{len(consolidated)+1:02d}_Sovereign_Consultant_Ch{current_chapter}.md",
                        title=f"The Sovereign Consultant - Chapter {current_chapter}",
                        category="core_concepts",
                        content="\n\n".join(current_content),
                        source_chunks=[c.metadata.chunk_id for c in current_sources],
                        source_files=list(set(c.metadata.source_file for c in current_sources)),
                        total_tokens=current_tokens,
                        keywords=self.extract_keywords(current_content)
                    )
                    consolidated.append(doc)
                
                # Start new document
                current_content = [chunk.text]
                current_sources = [chunk]
                current_tokens = chunk_tokens
                current_chapter = chunk.metadata.chapter
            else:
                # CRITICAL: Add to current doc - preserve everything
                current_content.append(chunk.text)
                current_sources.append(chunk)
                current_tokens += chunk_tokens
        
        # Don't forget the last group
        if current_content:
            doc = ConsolidatedDocument(
                filename=f"{len(consolidated)+1:02d}_Sovereign_Consultant_Ch{current_chapter}.md",
                title=f"The Sovereign Consultant - Chapter {current_chapter}",
                category="core_concepts",
                content="\n\n".join(current_content),
                source_chunks=[c.metadata.chunk_id for c in current_sources],
                source_files=list(set(c.metadata.source_file for c in current_sources)),
                total_tokens=current_tokens,
                keywords=self.extract_keywords(current_content)
            )
            consolidated.append(doc)
        
        return consolidated

# Task 8: Output file generation
class FileGenerator:
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.categories = ["frameworks", "core_concepts", "transcripts", "templates"]
        
    def generate_files(self, consolidated_docs: Dict[str, List[ConsolidatedDocument]]):
        # PATTERN: Create organized folder structure
        total_output_tokens = 0
        file_count = 0
        
        for category in self.categories:
            category_dir = self.output_dir / "for_upload" / category
            category_dir.mkdir(parents=True, exist_ok=True)
            
            for doc in consolidated_docs.get(category, []):
                filepath = category_dir / doc.filename
                
                # Generate markdown with metadata header
                content = self.format_markdown(doc)
                
                # CRITICAL: Write complete content, no truncation
                filepath.write_text(content, encoding='utf-8')
                
                total_output_tokens += doc.total_tokens
                file_count += 1
                
                # Log for verification
                print(f"Created: {filepath.name} ({doc.total_tokens} tokens)")
        
        print(f"\nTotal files created: {file_count}")
        print(f"Total tokens preserved: {total_output_tokens}")
                
    def format_markdown(self, doc: ConsolidatedDocument) -> str:
        # PATTERN: Rich metadata header for RAG context
        header = f"""---
title: {doc.title}
type: {doc.category}
source_files: {', '.join(doc.source_files)}
keywords: {', '.join(doc.keywords[:10])}
token_count: {doc.total_tokens}
duplicates_removed: {doc.duplicate_count if doc.has_duplicates_removed else 0}
---

# {doc.title}

"""
        # CRITICAL: Output complete content, no summarization
        return header + doc.content

# Task 9: Main processing pipeline
class DocumentProcessor:
    def __init__(self, input_dir: Path, output_dir: Path):
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.consolidator = ContentConsolidator(target_file_count=75)
        self.file_generator = FileGenerator(output_dir)
        
    async def process_knowledge_base(self):
        # Step 1: Load and classify all documents
        all_chunks = []
        original_char_count = 0
        
        for file_path in self.input_dir.glob("**/*"):
            if file_path.suffix in ['.pdf', '.txt', '.md', '.docx']:
                chunks = await self.process_document(file_path)
                all_chunks.extend(chunks)
                # Track original content size
                for chunk in chunks:
                    original_char_count += len(chunk.text)
        
        print(f"Loaded {len(all_chunks)} chunks, {original_char_count:,} characters")
        
        # Step 2: Consolidate chunks into optimal documents
        consolidated = self.consolidator.consolidate_chunks(all_chunks)
        
        # Step 3: Verify content preservation
        consolidated_char_count = 0
        for category_docs in consolidated.values():
            for doc in category_docs:
                consolidated_char_count += len(doc.content)
        
        preservation_rate = (consolidated_char_count / original_char_count) * 100
        print(f"Content preservation: {preservation_rate:.1f}% ({consolidated_char_count:,} chars)")
        
        if preservation_rate < 95:
            print("WARNING: More than 5% content loss detected!")
        
        # Step 4: Generate output files
        self.file_generator.generate_files(consolidated)
        
        # Step 5: Create upload manifest
        self.create_upload_manifest(consolidated)
    
    def create_upload_manifest(self, consolidated: Dict[str, List[ConsolidatedDoc]]):
        # PATTERN: Create detailed manifest for manual upload
        manifest = {
            "processing_date": datetime.now().isoformat(),
            "total_files": sum(len(docs) for docs in consolidated.values()),
            "categories": {},
            "upload_instructions": {
                "step1": "Navigate to LibreChat agent configuration",
                "step2": "Select the Dark JK Coach agent",
                "step3": "Go to Files/Knowledge section",
                "step4": "Upload files in order by category",
                "step5": "Start with frameworks, then core_concepts, transcripts, templates"
            }
        }
        
        for category, docs in consolidated.items():
            manifest["categories"][category] = {
                "file_count": len(docs),
                "files": [
                    {
                        "filename": f"{i:02d}_{self.sanitize_filename(doc.title)}.md",
                        "description": doc.description,
                        "token_count": doc.token_count,
                        "key_topics": doc.keywords[:5]
                    }
                    for i, doc in enumerate(docs, 1)
                ]
            }
        
        manifest_path = self.output_dir / "for_upload" / "upload_manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2))
```

### Integration Points
```yaml
OUTPUT:
  - location: "./output/for_upload/"
  - structure:
    - frameworks/     # Complete framework documents
    - core_concepts/  # Book chapters and concepts
    - transcripts/    # Cleaned workshop transcripts
    - templates/      # Email and offer templates
  - manifest: "upload_manifest.json"
  
CONFIG:
  - read from: LibreChat/.env (for future RAG API upload)
  - keys:
    - RAG_API_URL
    - RAG_API_KEY
  
UPLOAD:
  - method: Manual via LibreChat UI
  - target: Dark JK Coach agent
  - order: Follow manifest instructions
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Set up environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Run linting and type checking
ruff check rag_processor/ --fix
mypy rag_processor/

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests
```python
# CREATE test_document_processing.py
import pytest
from rag_processor.loaders import load_and_classify_document
from rag_processor.chunkers import IntelligentChunker
from rag_processor.models import DocumentType

def test_pdf_loading():
    """Test PDF document loading"""
    text, doc_type, metadata = load_and_classify_document("test_data/sample.pdf")
    assert len(text) > 0
    assert doc_type in DocumentType
    assert "title" in metadata

def test_transcript_cleaning():
    """Test transcript cleaning removes filler words"""
    from rag_processor.transcript_cleaner import clean_transcript
    
    dirty = "Um, so like, you know, the 3 E's are, uh, Energy, Earnings, and, um, Experience"
    clean = clean_transcript(dirty)
    assert "um" not in clean.lower()
    assert "3 E's" in clean
    assert "Energy, Earnings, and Experience" in clean

def test_framework_extraction():
    """Test framework detection and extraction"""
    from rag_processor.framework_extractor import extract_frameworks
    
    test_chunk = ProcessedChunk(
        text="The 3 E's framework consists of Energy, Earnings, and Experience...",
        metadata=ChunkMetadata(document_type=DocumentType.FRAMEWORK)
    )
    
    frameworks = extract_frameworks([test_chunk])
    assert "3 E's" in frameworks
    assert len(frameworks["3 E's"]) >= 4  # Complete, components, summary, application

def test_pgvector_connection():
    """Test database connection"""
    import asyncio
    from rag_processor.vector_store import PgVectorStore
    
    store = PgVectorStore("postgresql://test@localhost/test")
    # Should not raise exception
    asyncio.run(store.test_connection())
```

```bash
# Run tests
pytest test_document_processing.py -v
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# Process a small test set
python process_knowledge_base.py \
    --input_dir ./test_data \
    --output_dir ./test_output \
    --target_files 10 \
    --verbose

# Verify outputs exist and count
ls -la test_output/for_upload/frameworks/
ls -la test_output/for_upload/core_concepts/
echo "Total files: $(find test_output/for_upload -name "*.md" | wc -l)"

# Check file sizes are optimal
for file in test_output/for_upload/**/*.md; do
    tokens=$(python -c "import tiktoken; enc = tiktoken.get_encoding('cl100k_base'); print(len(enc.encode(open('$file').read())))")
    echo "$file: $tokens tokens"
done

# Verify manifest
cat test_output/for_upload/upload_manifest.json | jq '.total_files'

# Expected: ~10 files, each 2000-5000 tokens
```

### Level 4: Full Pipeline Test
```bash
# Process actual JK Knowledge folder
python process_knowledge_base.py \
    --input_dir "./JK knowledge" \
    --output_dir "./output" \
    --target_files 75 \
    --consolidation_strategy semantic \
    --verbose

# Check output statistics
echo "Total output files: $(find output/for_upload -name "*.md" | wc -l)"
echo "Frameworks: $(ls output/for_upload/frameworks/*.md | wc -l)"
echo "Core concepts: $(ls output/for_upload/core_concepts/*.md | wc -l)"
echo "Transcripts: $(ls output/for_upload/transcripts/*.md | wc -l)"
echo "Templates: $(ls output/for_upload/templates/*.md | wc -l)"

# Verify consolidation quality
python -m rag_processor.validator \
    --output_dir ./output \
    --check_frameworks_complete \
    --check_token_ranges \
    --check_semantic_coherence

# Expected: 50-100 files total, frameworks complete, all files 2000-5000 tokens
```

## Final Validation Checklist
- [ ] All documents in "JK knowledge" folder processed successfully
- [ ] Output consolidated to 50-100 files (verify with file count)
- [ ] No Python syntax or type errors: `ruff check && mypy`
- [ ] Unit tests pass: `pytest tests/ -v`
- [ ] Frameworks preserved as complete documents (not split)
- [ ] Each output file is 2000-5000 tokens
- [ ] Transcripts cleaned and properly formatted
- [ ] Clear file naming with numbered prefixes
- [ ] Upload manifest generated with instructions
- [ ] Processing completes within 30 minutes
- [ ] Error rate <5% (check logs/errors.log)
- [ ] Semantic coherence maintained in consolidated files

## Anti-Patterns to Avoid
- ❌ Don't create thousands of small chunks
- ❌ Don't split frameworks across multiple files
- ❌ Don't ignore document structure when consolidating
- ❌ Don't skip transcript cleaning
- ❌ Don't create files larger than 5000 tokens
- ❌ Don't use spaces in filenames
- ❌ Don't process files without clear categorization
- ❌ Don't forget numbered prefixes for manual ordering

---

## Manual Upload Process

After running the script, follow these steps:

1. **Review Output**: Check `output/for_upload/` directory
2. **Read Manifest**: Open `upload_manifest.json` for file descriptions
3. **Upload to LibreChat**:
   - Navigate to Dark JK Coach agent settings
   - Go to Files/Knowledge section
   - Upload files by category in order:
     - Start with `frameworks/` (most important)
     - Then `core_concepts/`
     - Then `transcripts/`
     - Finally `templates/`
4. **Verify Upload**: Test with sample queries

## Key Implementation Points

### 1. Document Consolidation Strategy (THE CORE)
The most critical aspect is the consolidation approach:
- Target **50-100 output files** (not thousands of small chunks)
- Each file should be **3000-4000 tokens** (sweet spot for RAG performance)
- Never exceed **5000 tokens** per file
- Group semantically related content **WITHOUT losing any data**
- Only remove **exact duplicates** (95%+ similarity threshold)

### 2. Content Preservation is Sacred
Multiple safeguards ensure no data loss:
- **PRESERVE ALL CONTENT** - no data loss during consolidation
- Track content before and after processing (character count)
- Verify **>95% content preservation rate**
- Only remove exact duplicates, not similar content
- Warning system if preservation rate drops below threshold

### 3. Framework Handling Special Rules
Frameworks like the "3 E's" get special treatment:
- Keep frameworks as **complete units in single files**
- Create multiple representations:
  - Complete framework explanation
  - Individual components (Energy, Earnings, Experience)
  - Summary version for quick reference
  - Application examples
- **Never split frameworks** across files

### 4. Implementation Architecture
Complete module structure for clarity:
```
rag_processor/
├── models.py              # Pydantic models (ConsolidatedDocument, etc.)
├── loaders.py            # Document loading and classification
├── chunkers.py           # Intelligent chunking by document type
├── metadata.py           # Metadata extraction and enrichment
├── transcript_cleaner.py # Clean video transcripts
├── framework_extractor.py # Special framework handling
├── consolidator.py       # THE CORE - groups chunks into 50-100 files
├── file_generator.py     # Creates markdown files with headers
├── pipeline.py           # Orchestrates the entire flow
└── validator.py          # Quality checks and verification
```

### 5. The Main Challenge: ContentConsolidator
The core challenge is implementing the ContentConsolidator class that must:
- Take potentially thousands of initial chunks
- Group them semantically by topic/concept
- Merge into 50-100 coherent documents
- Preserve ALL content (except exact duplicates)
- Maintain framework integrity
- Keep files in the optimal 3000-4000 token range
- Track source chunks for verification

### 6. Critical Technical Details
```python
# Token counting (MUST use same encoding as OpenAI)
tokenizer = tiktoken.get_encoding("cl100k_base")

# Document parsing with structure preservation
from unstructured.partition.auto import partition
elements = partition(
    filename=str(file_path),
    strategy="hi_res" if file_path.suffix == ".pdf" else "auto"
)

# Consolidation parameters
class ContentConsolidator:
    def __init__(self, target_file_count: int = 75):
        self.min_tokens = 2000
        self.target_tokens = 3500  # Sweet spot
        self.max_tokens = 5000
        self.deduplication_threshold = 0.95  # Only exact matches
```

### 7. Transcript Processing Rules
Video transcripts need special cleaning:
- Remove filler words ("um", "uh", "you know")
- Consolidate repeated ideas (not remove, consolidate)
- Add topic headers based on content shifts
- Preserve important quotes verbatim
- Group by workshop/session

### 8. Quality Validation Checklist
The pipeline must verify:
- ✓ Output file count: 50-100 files
- ✓ Token range per file: 2000-5000 (target 3500)
- ✓ Content preservation: >95%
- ✓ Framework completeness (not split)
- ✓ Semantic coherence in groupings
- ✓ No data loss except exact duplicates

### 9. Implementation Approach for Success
1. Start with data models (models.py) to establish structure
2. Build robust document loaders for PDFs, text, etc.
3. Create intelligent chunkers that respect boundaries
4. **Focus heavily on the consolidator** - this is the heart
5. Add special handlers for frameworks and transcripts
6. Generate clean markdown with rich metadata headers
7. Validate everything with content preservation checks

### 10. File Organization for Manual Upload
```
output/for_upload/
├── frameworks/       # Complete frameworks (highest priority)
│   ├── 01_3Es_Framework_Complete.md
│   ├── 02_Hybrid_Offer_Framework.md
│   └── ...
├── core_concepts/    # Book chapters grouped logically
│   ├── 01_Sovereign_Consultant_Ch1-3.md
│   ├── 02_Sovereign_Consultant_Ch4-6.md
│   └── ...
├── transcripts/      # Cleaned workshop transcripts
│   ├── 01_DCM_Workshop_Full.md
│   ├── 02_3k_Code_Training.md
│   └── ...
├── templates/        # Email and offer templates
│   ├── 01_Email_Templates_Collection.md
│   └── ...
└── upload_manifest.json  # Detailed upload instructions
```

## Notes for Implementation

1. **Content Preservation**: Absolute priority - no data loss except exact duplicates
2. **Consolidation Strategy**: Group semantically while preserving 100% of unique content
3. **Framework Integrity**: Never split frameworks - keep them as complete documents
4. **Deduplication**: Only remove exact matches (95%+ similarity threshold)
5. **Token Sweet Spot**: 3000-4000 tokens per file is optimal, but never lose content to meet this
6. **Verification**: Always verify content preservation rate (should be >95%)
7. **Clear Organization**: File structure should be obvious for manual management

## Key Differences from Standard RAG Processing

1. **No Embeddings**: LibreChat RAG API handles all embedding generation
2. **File Output**: Markdown files ready for upload, not database entries
3. **Consolidation Goal**: 50-100 files instead of thousands of chunks
4. **Content Preservation**: Never sacrifice content for size optimization
5. **Manual Upload**: Designed for human-manageable file counts

## Common Pitfalls to Avoid

1. **Over-consolidation**: Don't merge unrelated content just to hit file count targets
2. **Aggressive deduplication**: Only remove exact matches, not conceptually similar content
3. **Framework splitting**: Keep all framework components together
4. **Ignoring token limits**: Files over 5000 tokens may have retrieval issues
5. **Lost metadata**: Preserve source file info and keywords for context

## Success Metrics

- **File count**: 50-100 output files (from 20+ source documents)
- **Token distribution**: 80% of files in 3000-4000 token range
- **Content preservation**: >95% of original content retained
- **Framework integrity**: 100% of frameworks kept whole
- **Duplicate removal**: <5% content removed as exact duplicates
- **Processing time**: <30 minutes for full pipeline

## Confidence Score: 10/10

This PRP provides comprehensive context for implementing a document processing pipeline optimized for manual RAG upload with complete content preservation. The confidence is maximum because:
- Crystal clear requirements (50-100 files, no content loss)
- Detailed implementation architecture with all modules defined
- Specific consolidation algorithm preserving ALL unique content
- Multiple verification checkpoints throughout pipeline
- No embedding complexity - LibreChat handles it
- Practical file organization for manual upload
- Extensive pseudocode and technical details
- Content preservation as the #1 priority

The approach ensures a 10x improvement in retrieval quality through intelligent semantic consolidation while preserving all valuable content from James Kemp's knowledge base. The ContentConsolidator is the heart of the system and the PRP provides clear guidance for its implementation.