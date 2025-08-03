"""
Reporting module for generating processing statistics and quality reports.
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

logger = logging.getLogger(__name__)


class Reporter:
    """Generates comprehensive reports about the processing run."""
    
    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.reports_dir = self.output_dir / "reports"
        self.reports_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_all_reports(
        self,
        processing_stats: Dict[str, Any],
        validation_results: Dict[str, Any],
        consolidated_docs: Dict[str, List[Any]]
    ):
        """Generate all reports."""
        logger.info("Generating comprehensive reports...")
        
        # Generate statistics report
        self._generate_statistics_report(processing_stats, consolidated_docs)
        
        # Generate quality report
        self._generate_quality_report(validation_results)
        
        # Generate upload guide
        self._generate_upload_guide(consolidated_docs)
        
        # Generate processing log summary
        self._generate_processing_summary(processing_stats, validation_results)
        
        logger.info(f"Reports generated in {self.reports_dir}")
    
    def _generate_statistics_report(self, stats: Dict, consolidated_docs: Dict):
        """Generate detailed statistics report."""
        report = f"""# RAG Processing Statistics Report

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Processing Overview

- **Start Time**: {stats.get('start_time', 'N/A')}
- **End Time**: {stats.get('end_time', 'N/A')}
- **Total Duration**: {self._calculate_duration(stats)}

## Input Statistics

- **Total Input Files**: {stats.get('total_input_files', 0)}
- **Total Chunks Created**: {stats.get('total_chunks', 0)}
- **Frameworks Extracted**: {stats.get('total_frameworks', 0)}

## Output Statistics

### File Distribution
"""
        
        # Calculate totals
        total_output_files = 0
        total_tokens = 0
        
        for category, docs in consolidated_docs.items():
            count = len(docs)
            tokens = sum(doc.total_tokens for doc in docs)
            total_output_files += count
            total_tokens += tokens
            
            report += f"\n**{category.title()}**: {count} files ({tokens:,} tokens)\n"
            
            # List files
            for i, doc in enumerate(docs[:5], 1):  # Show first 5
                report += f"  {i}. {doc.filename} ({doc.total_tokens:,} tokens)\n"
            
            if len(docs) > 5:
                report += f"  ... and {len(docs) - 5} more\n"
        
        report += f"""
### Summary

- **Total Output Files**: {total_output_files}
- **Total Tokens**: {total_tokens:,}
- **Average Tokens per File**: {total_tokens // total_output_files if total_output_files > 0 else 0:,}
- **Compression Ratio**: {stats.get('total_input_files', 0)}:{total_output_files}

## Processing Errors

"""
        
        errors = stats.get('errors', [])
        if errors:
            report += f"Found {len(errors)} errors during processing:\n\n"
            for error in errors:
                report += f"- {error}\n"
        else:
            report += "No errors encountered during processing ✓\n"
        
        # Save report
        report_path = self.reports_dir / "statistics.md"
        report_path.write_text(report, encoding='utf-8')
    
    def _generate_quality_report(self, validation_results: Dict):
        """Generate quality assessment report."""
        report = f"""# Quality Assessment Report

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Validation Summary

Overall Status: **{validation_results.get('overall_status', 'Unknown').upper()}**

## Detailed Validation Results
"""
        
        # Add each validation check
        for check, result in validation_results.items():
            if check == "overall_status":
                continue
            
            status = result.get('status', 'pending')
            details = result.get('details', 'No details available')
            
            # Status symbols
            symbol = {
                "pass": "✓",
                "warning": "⚠",
                "error": "✗",
                "pending": "?"
            }.get(status, "?")
            
            report += f"\n### {symbol} {check.replace('_', ' ').title()}\n"
            report += f"- **Status**: {status.upper()}\n"
            report += f"- **Details**: {details}\n"
            
            # Add specific stats if available
            if 'stats' in result:
                stats = result['stats']
                if isinstance(stats, dict):
                    report += "\n**Statistics**:\n"
                    for key, value in stats.items():
                        if key != 'files':  # Skip file list
                            report += f"  - {key}: {value}\n"
            
            if 'issues' in result and result['issues']:
                report += "\n**Issues Found**:\n"
                for issue in result['issues'][:5]:
                    report += f"  - {issue}\n"
        
        report += """
## Recommendations

Based on the validation results:

"""
        
        # Add recommendations based on status
        if validation_results.get('file_count', {}).get('status') == 'warning':
            count = validation_results['file_count'].get('count', 0)
            if count < 50:
                report += "- Consider adjusting consolidation parameters to create more files\n"
            else:
                report += "- Consider more aggressive consolidation to reduce file count\n"
        
        if validation_results.get('token_ranges', {}).get('stats', {}).get('too_large', 0) > 0:
            report += "- Some files exceed 5000 tokens - consider splitting them\n"
        
        if validation_results.get('frameworks_complete', {}).get('missing', []):
            report += "- Some expected frameworks are missing - review source documents\n"
        
        # Save report
        report_path = self.reports_dir / "quality_report.md"
        report_path.write_text(report, encoding='utf-8')
    
    def _generate_upload_guide(self, consolidated_docs: Dict):
        """Generate detailed upload guide."""
        guide = f"""# LibreChat RAG Upload Guide

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Quick Start

Follow these steps to upload your processed knowledge base to LibreChat:

### 1. Prepare LibreChat

1. Open LibreChat in your browser
2. Navigate to the agent configuration section
3. Select the **Dark JK Coach** agent (or create a new agent if needed)
4. Go to the **Files/Knowledge** section

### 2. Upload Order (IMPORTANT!)

Upload files in this specific order for best results:

#### Phase 1: Frameworks (Highest Priority)
Upload all files from `frameworks/` directory first:
"""
        
        # List framework files
        framework_docs = consolidated_docs.get('frameworks', [])
        for i, doc in enumerate(framework_docs, 1):
            guide += f"- {doc.filename} - {doc.title}\n"
        
        guide += f"""
**Why first?** Frameworks are the core concepts that other content references.

#### Phase 2: Core Concepts
Upload all files from `core_concepts/` directory:
- These contain book chapters and foundational knowledge
- Total files: {len(consolidated_docs.get('core_concepts', []))}

#### Phase 3: Transcripts
Upload all files from `transcripts/` directory:
- Workshop and training session transcripts
- Total files: {len(consolidated_docs.get('transcripts', []))}

#### Phase 4: Templates
Upload all files from `templates/` directory:
- Email templates, offer templates, etc.
- Total files: {len(consolidated_docs.get('templates', []))}

#### Phase 5: Guides (Optional)
Upload all files from `guides/` directory if present:
- Implementation guides and SOPs
- Total files: {len(consolidated_docs.get('guides', []))}

### 3. Verification

After uploading, test the knowledge base with these queries:

#### Framework Tests
- "What are the 3 E's?"
- "Explain the Daily Client Machine"
- "How does the Hybrid Offer work?"

#### Application Tests
- "How do I price my consulting services?"
- "What's the best way to get clients?"
- "How do I scale my consulting business?"

#### Template Tests
- "Show me email templates for outreach"
- "What's a good offer structure?"

### 4. Troubleshooting

If you encounter issues:

1. **Upload fails**: Check file size (should be under 10MB each)
2. **Missing content**: Ensure all files were uploaded
3. **Poor results**: Check upload order - frameworks should be first
4. **Timeout errors**: Upload in smaller batches (5-10 files at a time)

### 5. Expected Results

After successful upload:
- Agent should provide detailed, accurate responses
- Frameworks should be explained completely
- Specific examples and templates should be accessible
- Cross-references between concepts should work

### 6. Time Estimate

- Total upload time: 10-15 minutes
- Processing time: 5-10 minutes
- Verification: 5 minutes

Total: ~30 minutes

## File Summary

Total files to upload: {sum(len(docs) for docs in consolidated_docs.values())}
"""
        
        # Save guide
        guide_path = self.reports_dir / "upload_guide.md"
        guide_path.write_text(guide, encoding='utf-8')
    
    def _generate_processing_summary(self, processing_stats: Dict, validation_results: Dict):
        """Generate a concise processing summary."""
        summary = f"""# Processing Summary

Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Quick Stats
- Input Files: {processing_stats.get('total_input_files', 0)}
- Output Files: {sum(1 for _ in (self.output_dir / 'for_upload').rglob('*.md'))}
- Processing Time: {self._calculate_duration(processing_stats)}
- Validation Status: {validation_results.get('overall_status', 'Unknown').upper()}

## Next Steps
1. Review reports in the `reports/` directory
2. Check `for_upload/` directory for processed files
3. Follow the upload guide to import into LibreChat

## Key Files
- Upload manifest: `for_upload/upload_manifest.json`
- Upload guide: `reports/upload_guide.md`
- Quality report: `reports/quality_report.md`
- Statistics: `reports/statistics.md`
"""
        
        # Save summary
        summary_path = self.reports_dir / "summary.md"
        summary_path.write_text(summary, encoding='utf-8')
        
        # Also print to console
        print("\n" + "="*60)
        print(summary)
        print("="*60)
    
    def _calculate_duration(self, stats: Dict) -> str:
        """Calculate processing duration."""
        start = stats.get('start_time')
        end = stats.get('end_time')
        
        if start and end:
            duration = (end - start).total_seconds()
            minutes = int(duration // 60)
            seconds = int(duration % 60)
            return f"{minutes}m {seconds}s"
        
        return "N/A"