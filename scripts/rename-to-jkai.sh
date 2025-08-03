#!/bin/bash

# Script to rename project folder to JKAI

echo "🔄 Renaming project to JKAI..."
echo ""
echo "This script will:"
echo "1. Create a new JKAI folder"
echo "2. Move all files to the new location"
echo "3. Update git configuration"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Get parent directory
PARENT_DIR=$(dirname "$(pwd)")
CURRENT_DIR=$(basename "$(pwd)")
NEW_DIR="$PARENT_DIR/JKAI"

echo "📁 Creating new directory: $NEW_DIR"

# Check if JKAI already exists
if [ -d "$NEW_DIR" ]; then
    echo "❌ Directory $NEW_DIR already exists!"
    exit 1
fi

# Create new directory
mkdir -p "$NEW_DIR"

# Copy all files (excluding .git initially)
echo "📦 Copying files..."
rsync -av --exclude='.git' --exclude='LibreChat' --exclude='JKAI' ./ "$NEW_DIR/"

# Copy .git directory separately to preserve history
echo "📝 Preserving git history..."
cp -r .git "$NEW_DIR/"

# Update git remote if needed
cd "$NEW_DIR"
if git remote -v | grep -q "origin"; then
    echo "🔗 Current git remote:"
    git remote -v
    echo ""
    echo "To update to your darkjk repo, run:"
    echo "git remote set-url origin https://github.com/dschwartzAI/darkjk.git"
fi

echo ""
echo "✅ Project copied to: $NEW_DIR"
echo ""
echo "Next steps:"
echo "1. Close this Cursor workspace"
echo "2. Open Cursor and navigate to: $NEW_DIR"
echo "3. Delete the old directory: rm -rf '$PARENT_DIR/$CURRENT_DIR'"
echo "4. Run the setup script from the new location"
echo ""
echo "Optional: Update git remote"
echo "cd $NEW_DIR"
echo "git remote set-url origin https://github.com/dschwartzAI/darkjk.git"
echo "git add ."
echo "git commit -m 'Initial JKAI setup'"
echo "git push -u origin main"