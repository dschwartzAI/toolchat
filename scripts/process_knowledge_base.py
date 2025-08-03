#!/usr/bin/env python3
"""
Main CLI interface for the RAG document processing pipeline.

This script processes James Kemp's knowledge base into optimized documents
for manual upload to LibreChat's RAG system.
"""

import asyncio
import click
import logging
from pathlib import Path
import sys

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from rag_processor.models import ProcessingConfig
from rag_processor.pipeline import DocumentProcessor
from rag_processor.validator import QualityValidator
from rag_processor.reporter import Reporter

# Configure logging
def setup_logging(verbose: bool, quiet: bool = False):
    """Set up logging configuration."""
    if quiet:
        level = logging.WARNING
    elif verbose:
        level = logging.DEBUG
    else:
        level = logging.INFO
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(level)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(console_handler)
    
    # Suppress noisy PDF processing libraries
    noisy_loggers = [
        'unstructured',
        'unstructured.partition',
        'unstructured.partition.auto',
        'unstructured.documents',
        'pdfminer',
        'pdfminer.psparser',
        'pdfminer.pdfparser',
        'pdfminer.converter',
        'pdfminer.pdfinterp',
        'pdfminer.pdfpage',
        'pdfminer.layout',
        'PIL',
        'PIL.Image',
        'matplotlib',
        'pdfplumber'
    ]
    
    for logger_name in noisy_loggers:
        logging.getLogger(logger_name).setLevel(logging.WARNING)
    
    # Also create a file handler for detailed logs
    log_dir = Path("output/logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    
    file_handler = logging.FileHandler(
        log_dir / "processing.log",
        mode='w',
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)  # Always capture debug in file
    root_logger.addHandler(file_handler)


@click.command()
@click.option(
    '--input-dir',
    '-i',
    default='./JK knowledge',
    help='Input directory containing documents to process',
    type=click.Path(exists=True, file_okay=False, dir_okay=True)
)
@click.option(
    '--output-dir',
    '-o',
    default='./output',
    help='Output directory for processed files',
    type=click.Path()
)
@click.option(
    '--target-files',
    '-t',
    default=75,
    help='Target number of output files (default: 75)',
    type=click.IntRange(min=10, max=200)
)
@click.option(
    '--consolidation-strategy',
    '-s',
    default='semantic',
    help='Consolidation strategy to use',
    type=click.Choice(['semantic', 'source', 'hybrid'])
)
@click.option(
    '--verbose',
    '-v',
    is_flag=True,
    help='Enable verbose output'
)
@click.option(
    '--quiet',
    '-q',
    is_flag=True,
    help='Enable quiet mode (minimal output)'
)
@click.option(
    '--validate-only',
    is_flag=True,
    help='Only run validation on existing output'
)
def main(input_dir, output_dir, target_files, consolidation_strategy, verbose, quiet, validate_only):
    """
    Process James Kemp's knowledge base for LibreChat RAG upload.
    
    This tool processes documents from the input directory and creates
    50-100 optimized files ready for manual upload to LibreChat agents.
    """
    # Set up logging
    setup_logging(verbose, quiet)
    logger = logging.getLogger(__name__)
    
    # Print banner (unless quiet mode)
    if not quiet:
        print("\n" + "="*60)
        print("RAG DOCUMENT PROCESSOR FOR LIBRECHAT")
        print("Version 1.0.0")
        print("="*60 + "\n")
    
    # Convert paths
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    # Validate only mode
    if validate_only:
        if not output_path.exists():
            click.echo(click.style("Error: Output directory does not exist!", fg='red'))
            return 1
        
        print("Running validation only...\n")
        validator = QualityValidator(output_path)
        results = validator.validate_all()
        validator.print_report()
        
        return 0 if results['overall_status'] == 'pass' else 1
    
    # Check input directory
    if not input_path.exists():
        click.echo(click.style(f"Error: Input directory '{input_path}' does not exist!", fg='red'))
        return 1
    
    # Count input files
    input_files = list(input_path.glob("*"))
    if not input_files:
        click.echo(click.style(f"Error: No files found in '{input_path}'!", fg='red'))
        return 1
    
    if not quiet:
        print(f"Input directory: {input_path}")
        print(f"Output directory: {output_path}")
        print(f"Target files: {target_files}")
        print(f"Input files found: {len(input_files)}")
        print("\n" + "-"*60 + "\n")
    
    # Create configuration
    config = ProcessingConfig(
        input_dir=str(input_path),
        output_dir=str(output_path),
        target_file_count=target_files,
        verbose=verbose
    )
    
    try:
        # Create and run processor
        processor = DocumentProcessor(config)
        
        # Run async processing
        if not quiet:
            print("Starting document processing...")
        asyncio.run(processor.process_knowledge_base())
        
        if not quiet:
            print("\n" + "-"*60 + "\n")
            print("Running quality validation...")
        
        # Run validation
        validator = QualityValidator(output_path)
        validation_results = validator.validate_all()
        if not quiet:
            validator.print_report()
        
        # Generate final reports
        if not quiet:
            print("\n" + "-"*60 + "\n")
            print("Generating reports...")
        
        reporter = Reporter(output_path)
        
        # Get consolidated docs for reporting
        consolidated_docs = {}
        for_upload_dir = output_path / "for_upload"
        if for_upload_dir.exists():
            for category_dir in for_upload_dir.iterdir():
                if category_dir.is_dir():
                    # Create mock consolidated docs for reporting
                    docs = []
                    for md_file in category_dir.glob("*.md"):
                        # Simple doc object for reporting
                        class SimpleDoc:
                            def __init__(self, filename, tokens):
                                self.filename = filename
                                self.total_tokens = tokens
                                self.title = filename.replace('.md', '').replace('_', ' ')
                        
                        content = md_file.read_text(encoding='utf-8')
                        # Rough token estimate
                        tokens = len(content.split()) * 1.3
                        docs.append(SimpleDoc(md_file.name, int(tokens)))
                    
                    consolidated_docs[category_dir.name] = docs
        
        reporter.generate_all_reports(
            processor.stats,
            validation_results,
            consolidated_docs
        )
        
        # Final success message
        if quiet:
            # Minimal output in quiet mode
            print(f"✓ Complete. Files: {output_path / 'for_upload'}")
        else:
            print("\n" + "="*60)
            print(click.style("✓ PROCESSING COMPLETE!", fg='green', bold=True))
            print("="*60)
            print(f"\nOutput files ready at: {output_path / 'for_upload'}")
            print(f"Upload manifest: {output_path / 'for_upload' / 'upload_manifest.json'}")
            print(f"Reports available in: {output_path / 'reports'}")
            print("\nNext steps:")
            print("1. Review the upload guide: output/reports/upload_guide.md")
            print("2. Check quality report: output/reports/quality_report.md")
            print("3. Upload files to LibreChat following the guide")
            print("\n")
        
        return 0
        
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}", exc_info=True)
        click.echo(click.style(f"\nError: {str(e)}", fg='red'))
        return 1


if __name__ == '__main__':
    sys.exit(main())