#!/usr/bin/env python3
"""
Consolidate RAG files to fit within LibreChat's file limit.
Combines multiple small files into larger files while preserving context.
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Tuple

def read_file_content(file_path: Path) -> str:
    """Read content from a file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def get_file_size(content: str) -> int:
    """Get approximate token count for content."""
    return len(content.split()) * 1.3  # Rough token estimate

def consolidate_files(input_dir: Path, output_dir: Path, target_files: int = 25):
    """Consolidate files to meet LibreChat's limit."""
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Categories and their priorities
    categories = {
        'frameworks': {'priority': 1, 'files': []},
        'core_concepts': {'priority': 2, 'files': []},
        'transcripts': {'priority': 3, 'files': []},
        'templates': {'priority': 4, 'files': []},
        'guides': {'priority': 5, 'files': []}
    }
    
    # Collect all files by category
    for category in categories:
        category_dir = input_dir / category
        if category_dir.exists():
            files = sorted(category_dir.glob('*.txt'))
            categories[category]['files'] = files
    
    # Calculate total files and distribution
    total_files = sum(len(cat['files']) for cat in categories.values())
    print(f"Total files to consolidate: {total_files}")
    print(f"Target consolidated files: {target_files}")
    
    # Consolidation strategy
    consolidated_files = []
    file_counter = 1
    
    # Priority 1: Keep frameworks relatively separated (they're most important)
    framework_files = categories['frameworks']['files']
    if framework_files:
        # Group frameworks into ~8-10 files
        frameworks_per_file = max(len(framework_files) // 8, 5)
        
        for i in range(0, len(framework_files), frameworks_per_file):
            batch = framework_files[i:i+frameworks_per_file]
            combined_content = []
            combined_content.append(f"# JK Business Frameworks Collection {file_counter}\n")
            combined_content.append(f"This file contains {len(batch)} business frameworks from James Kemp's methodology.\n\n")
            combined_content.append("=" * 80 + "\n\n")
            
            for file_path in batch:
                content = read_file_content(file_path)
                combined_content.append(f"## FILE: {file_path.name}\n\n")
                combined_content.append(content)
                combined_content.append("\n\n" + "=" * 80 + "\n\n")
            
            output_file = output_dir / f"{file_counter:02d}_Frameworks_Collection_{i//frameworks_per_file + 1}.txt"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(''.join(combined_content))
            
            consolidated_files.append(output_file)
            file_counter += 1
            print(f"Created: {output_file.name} ({len(batch)} frameworks)")
    
    # Priority 2: Core concepts (usually just 1 file, keep as is)
    core_files = categories['core_concepts']['files']
    if core_files:
        for file_path in core_files:
            content = read_file_content(file_path)
            output_file = output_dir / f"{file_counter:02d}_Core_Concepts.txt"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"# JK Core Business Concepts\n\n")
                f.write(content)
            consolidated_files.append(output_file)
            file_counter += 1
            print(f"Created: {output_file.name}")
    
    # Priority 3: Transcripts (group into ~8-10 files)
    transcript_files = categories['transcripts']['files']
    if transcript_files:
        transcripts_per_file = max(len(transcript_files) // 8, 6)
        
        for i in range(0, len(transcript_files), transcripts_per_file):
            batch = transcript_files[i:i+transcripts_per_file]
            combined_content = []
            combined_content.append(f"# JK Training Transcripts Collection {file_counter - 10}\n")
            combined_content.append(f"This file contains {len(batch)} transcripts from James Kemp's training sessions.\n\n")
            combined_content.append("=" * 80 + "\n\n")
            
            for file_path in batch:
                content = read_file_content(file_path)
                combined_content.append(f"## TRANSCRIPT: {file_path.stem.replace('_', ' ')}\n\n")
                combined_content.append(content)
                combined_content.append("\n\n" + "=" * 80 + "\n\n")
            
            output_file = output_dir / f"{file_counter:02d}_Transcripts_Collection_{i//transcripts_per_file + 1}.txt"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(''.join(combined_content))
            
            consolidated_files.append(output_file)
            file_counter += 1
            print(f"Created: {output_file.name} ({len(batch)} transcripts)")
    
    # Priority 4: Templates (combine into 1 file)
    template_files = categories['templates']['files']
    if template_files:
        combined_content = []
        combined_content.append(f"# JK Email and Offer Templates\n")
        combined_content.append(f"This file contains all email and offer templates.\n\n")
        combined_content.append("=" * 80 + "\n\n")
        
        for file_path in template_files:
            content = read_file_content(file_path)
            combined_content.append(f"## TEMPLATE SET: {file_path.stem.replace('_', ' ')}\n\n")
            combined_content.append(content)
            combined_content.append("\n\n" + "=" * 80 + "\n\n")
        
        output_file = output_dir / f"{file_counter:02d}_All_Templates.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(''.join(combined_content))
        
        consolidated_files.append(output_file)
        file_counter += 1
        print(f"Created: {output_file.name} ({len(template_files)} template sets)")
    
    # Priority 5: Guides (combine into 1 file)
    guide_files = categories['guides']['files']
    if guide_files:
        combined_content = []
        combined_content.append(f"# JK Implementation Guides\n")
        combined_content.append(f"This file contains all implementation guides and SOPs.\n\n")
        combined_content.append("=" * 80 + "\n\n")
        
        for file_path in guide_files:
            content = read_file_content(file_path)
            combined_content.append(f"## GUIDE: {file_path.stem.replace('_', ' ')}\n\n")
            combined_content.append(content)
            combined_content.append("\n\n" + "=" * 80 + "\n\n")
        
        output_file = output_dir / f"{file_counter:02d}_All_Guides.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(''.join(combined_content))
        
        consolidated_files.append(output_file)
        file_counter += 1
        print(f"Created: {output_file.name} ({len(guide_files)} guides)")
    
    # Create new manifest
    manifest = {
        "generated": "2025-07-07",
        "description": "Consolidated files for LibreChat upload (within 30 file limit)",
        "total_files": len(consolidated_files),
        "original_files": total_files,
        "files": []
    }
    
    for file_path in consolidated_files:
        content = read_file_content(file_path)
        manifest["files"].append({
            "filename": file_path.name,
            "approximate_tokens": int(len(content.split()) * 1.3),
            "description": file_path.stem.replace('_', ' ')
        })
    
    # Save manifest
    manifest_path = output_dir / "consolidated_manifest.json"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"\nConsolidation complete!")
    print(f"Original files: {total_files}")
    print(f"Consolidated into: {len(consolidated_files)} files")
    print(f"Manifest saved to: {manifest_path}")
    
    return consolidated_files

if __name__ == "__main__":
    input_dir = Path("output/for_upload")
    output_dir = Path("output/consolidated_for_librechat")
    
    # Run consolidation
    consolidated_files = consolidate_files(input_dir, output_dir, target_files=25)
    
    print("\nFiles ready for upload to LibreChat:")
    for i, file_path in enumerate(consolidated_files, 1):
        print(f"{i}. {file_path.name}")