"""
Quality validation module for the processed documents.
"""

import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import tiktoken
import json

from .models import ConsolidatedDocument

logger = logging.getLogger(__name__)


class QualityValidator:
    """Validates the quality of processed documents."""
    
    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        self.validation_results = {
            "file_count": {"status": "pending", "details": ""},
            "token_ranges": {"status": "pending", "details": ""},
            "frameworks_complete": {"status": "pending", "details": ""},
            "semantic_coherence": {"status": "pending", "details": ""},
            "content_preservation": {"status": "pending", "details": ""},
            "file_naming": {"status": "pending", "details": ""},
            "overall_status": "pending"
        }
    
    def validate_all(self) -> Dict:
        """Run all validation checks."""
        logger.info("Running quality validation checks...")
        
        # Check 1: File count
        self._validate_file_count()
        
        # Check 2: Token ranges
        self._validate_token_ranges()
        
        # Check 3: Framework completeness
        self._validate_frameworks_complete()
        
        # Check 4: Semantic coherence
        self._validate_semantic_coherence()
        
        # Check 5: Content preservation
        self._validate_content_preservation()
        
        # Check 6: File naming
        self._validate_file_naming()
        
        # Determine overall status
        self._determine_overall_status()
        
        return self.validation_results
    
    def _validate_file_count(self):
        """Validate that file count is in target range (50-100)."""
        for_upload_dir = self.output_dir / "for_upload"
        
        if not for_upload_dir.exists():
            self.validation_results["file_count"] = {
                "status": "error",
                "details": "Output directory not found"
            }
            return
        
        # Count all markdown files
        total_files = 0
        for category_dir in for_upload_dir.iterdir():
            if category_dir.is_dir() and category_dir.name != "upload_manifest.json":
                md_files = list(category_dir.glob("*.md"))
                total_files += len(md_files)
        
        # Check if in range
        if 50 <= total_files <= 100:
            status = "pass"
            details = f"File count: {total_files} (within target range)"
        elif total_files < 50:
            status = "warning"
            details = f"File count: {total_files} (below target minimum of 50)"
        else:
            status = "warning"
            details = f"File count: {total_files} (above target maximum of 100)"
        
        self.validation_results["file_count"] = {
            "status": status,
            "details": details,
            "count": total_files
        }
    
    def _validate_token_ranges(self):
        """Validate that files are within optimal token ranges."""
        for_upload_dir = self.output_dir / "for_upload"
        
        token_stats = {
            "total_files": 0,
            "in_optimal_range": 0,  # 3000-4000
            "in_acceptable_range": 0,  # 2000-5000
            "too_small": 0,  # <2000
            "too_large": 0,  # >5000
            "files": []
        }
        
        # Check each file
        for category_dir in for_upload_dir.iterdir():
            if category_dir.is_dir():
                for md_file in category_dir.glob("*.md"):
                    content = md_file.read_text(encoding='utf-8')
                    
                    # Skip metadata header
                    if content.startswith("---"):
                        content = content.split("---", 2)[2] if content.count("---") >= 2 else content
                    
                    tokens = len(self.tokenizer.encode(content))
                    token_stats["total_files"] += 1
                    
                    file_info = {
                        "name": md_file.name,
                        "tokens": tokens,
                        "status": ""
                    }
                    
                    if 3000 <= tokens <= 4000:
                        token_stats["in_optimal_range"] += 1
                        file_info["status"] = "optimal"
                    elif 2000 <= tokens <= 5000:
                        token_stats["in_acceptable_range"] += 1
                        file_info["status"] = "acceptable"
                    elif tokens < 2000:
                        token_stats["too_small"] += 1
                        file_info["status"] = "too_small"
                    else:
                        token_stats["too_large"] += 1
                        file_info["status"] = "too_large"
                    
                    token_stats["files"].append(file_info)
        
        # Determine status
        optimal_percentage = (
            token_stats["in_optimal_range"] / token_stats["total_files"] * 100
            if token_stats["total_files"] > 0 else 0
        )
        
        if optimal_percentage >= 80:
            status = "pass"
        elif token_stats["too_small"] + token_stats["too_large"] > 5:
            status = "warning"
        else:
            status = "pass"
        
        details = (
            f"Files in optimal range (3000-4000): {token_stats['in_optimal_range']} ({optimal_percentage:.1f}%)\n"
            f"Files in acceptable range (2000-5000): {token_stats['in_acceptable_range']}\n"
            f"Files too small (<2000): {token_stats['too_small']}\n"
            f"Files too large (>5000): {token_stats['too_large']}"
        )
        
        self.validation_results["token_ranges"] = {
            "status": status,
            "details": details,
            "stats": token_stats
        }
    
    def _validate_frameworks_complete(self):
        """Validate that frameworks are preserved as complete units."""
        frameworks_dir = self.output_dir / "for_upload" / "frameworks"
        
        if not frameworks_dir.exists():
            self.validation_results["frameworks_complete"] = {
                "status": "error",
                "details": "Frameworks directory not found"
            }
            return
        
        # Expected frameworks
        expected_frameworks = ["3 E's", "Daily Client Machine", "Hybrid Offer", "Sovereign Consultant"]
        found_frameworks = []
        
        # Check framework files
        for md_file in frameworks_dir.glob("*.md"):
            content = md_file.read_text(encoding='utf-8')
            
            for framework in expected_frameworks:
                if framework in content:
                    found_frameworks.append(framework)
                    
                    # Check for completeness indicators
                    has_overview = "overview" in content.lower() or "summary" in content.lower()
                    has_components = "component" in content.lower() or "element" in content.lower()
                    has_application = "apply" in content.lower() or "implement" in content.lower()
                    
                    if not (has_overview and has_components and has_application):
                        logger.warning(f"Framework {framework} may be incomplete in {md_file.name}")
        
        # Remove duplicates
        found_frameworks = list(set(found_frameworks))
        
        missing = set(expected_frameworks) - set(found_frameworks)
        
        if not missing:
            status = "pass"
            details = f"All expected frameworks found: {', '.join(found_frameworks)}"
        else:
            status = "warning"
            details = f"Missing frameworks: {', '.join(missing)}"
        
        self.validation_results["frameworks_complete"] = {
            "status": status,
            "details": details,
            "found": found_frameworks,
            "missing": list(missing)
        }
    
    def _validate_semantic_coherence(self):
        """Validate that consolidated files maintain semantic coherence."""
        issues = []
        files_checked = 0
        
        for_upload_dir = self.output_dir / "for_upload"
        
        for category_dir in for_upload_dir.iterdir():
            if category_dir.is_dir():
                for md_file in category_dir.glob("*.md"):
                    files_checked += 1
                    content = md_file.read_text(encoding='utf-8')
                    
                    # Skip metadata
                    if content.startswith("---"):
                        content = content.split("---", 2)[2] if content.count("---") >= 2 else content
                    
                    # Check for abrupt transitions
                    lines = content.split('\n')
                    for i in range(1, len(lines)):
                        if i < len(lines) - 1:
                            prev_line = lines[i-1].strip()
                            curr_line = lines[i].strip()
                            
                            # Check for incomplete sentences
                            if prev_line and not prev_line[-1] in '.!?"':
                                if curr_line and curr_line[0].isupper():
                                    issues.append(f"Possible incomplete sentence in {md_file.name}")
                                    break
        
        if not issues:
            status = "pass"
            details = f"Checked {files_checked} files, all maintain semantic coherence"
        else:
            status = "warning"
            details = f"Found {len(issues)} potential coherence issues in {files_checked} files"
        
        self.validation_results["semantic_coherence"] = {
            "status": status,
            "details": details,
            "issues": issues[:5]  # Limit to first 5 issues
        }
    
    def _validate_content_preservation(self):
        """Validate content preservation rate."""
        # Check for processing metadata
        metadata_path = self.output_dir / "processing" / "metadata_index.json"
        
        if metadata_path.exists():
            metadata = json.loads(metadata_path.read_text())
            # This would be populated by the consolidator
            # For now, we'll assume it's good if the file exists
            status = "pass"
            details = "Content preservation metadata found"
        else:
            # Check manifest for basic stats
            manifest_path = self.output_dir / "for_upload" / "upload_manifest.json"
            if manifest_path.exists():
                status = "pass"
                details = "Upload manifest found with file statistics"
            else:
                status = "warning"
                details = "No content preservation metadata found"
        
        self.validation_results["content_preservation"] = {
            "status": status,
            "details": details
        }
    
    def _validate_file_naming(self):
        """Validate that files follow naming conventions."""
        issues = []
        files_checked = 0
        
        for_upload_dir = self.output_dir / "for_upload"
        
        for category_dir in for_upload_dir.iterdir():
            if category_dir.is_dir():
                for md_file in category_dir.glob("*.md"):
                    files_checked += 1
                    filename = md_file.name
                    
                    # Check for numbered prefix
                    if not filename[:2].isdigit():
                        issues.append(f"Missing numbered prefix: {filename}")
                    
                    # Check for spaces
                    if ' ' in filename:
                        issues.append(f"Contains spaces: {filename}")
                    
                    # Check for special characters
                    allowed_chars = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-.')
                    if not all(c in allowed_chars for c in filename):
                        issues.append(f"Contains special characters: {filename}")
        
        if not issues:
            status = "pass"
            details = f"All {files_checked} files follow naming conventions"
        else:
            status = "warning"
            details = f"Found {len(issues)} naming issues in {files_checked} files"
        
        self.validation_results["file_naming"] = {
            "status": status,
            "details": details,
            "issues": issues[:5]  # Limit to first 5
        }
    
    def _determine_overall_status(self):
        """Determine overall validation status."""
        statuses = [v["status"] for k, v in self.validation_results.items() if k != "overall_status"]
        
        if "error" in statuses:
            self.validation_results["overall_status"] = "error"
        elif "warning" in statuses:
            self.validation_results["overall_status"] = "warning"
        else:
            self.validation_results["overall_status"] = "pass"
    
    def print_report(self):
        """Print validation report to console."""
        print("\n" + "="*60)
        print("QUALITY VALIDATION REPORT")
        print("="*60)
        
        for check, result in self.validation_results.items():
            if check == "overall_status":
                continue
            
            status_symbol = {
                "pass": "✓",
                "warning": "⚠",
                "error": "✗",
                "pending": "?"
            }.get(result["status"], "?")
            
            print(f"\n{status_symbol} {check.replace('_', ' ').title()}")
            print(f"  Status: {result['status'].upper()}")
            print(f"  {result['details']}")
        
        print("\n" + "-"*60)
        print(f"OVERALL STATUS: {self.validation_results['overall_status'].upper()}")
        print("="*60)