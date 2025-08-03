#!/bin/bash

# AI Business Tools Platform - MongoDB Backup Script
# Creates backups of MongoDB Atlas data

set -e  # Exit on error

# Load environment variables
if [ -f "../LibreChat/.env" ]; then
    export $(cat ../LibreChat/.env | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="ai_business_tools_backup_${TIMESTAMP}"

# MongoDB connection string
MONGO_URI="${MONGO_URI:-mongodb+srv://dschwartz06:6ZMOgKoMsuYVq8Ub@sovereignai.fgbvfyn.mongodb.net/?retryWrites=true&appName=SovereignAI}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🚀 AI Business Tools Platform - Database Backup"
echo "=============================================="
echo ""
echo "📅 Timestamp: $TIMESTAMP"
echo "📁 Backup location: $BACKUP_DIR/$BACKUP_NAME"
echo ""

# Function to backup specific collections
backup_collection() {
    local collection=$1
    echo "📦 Backing up collection: $collection..."
    
    mongodump \
        --uri="$MONGO_URI" \
        --collection="$collection" \
        --out="$BACKUP_DIR/$BACKUP_NAME" \
        --quiet
    
    if [ $? -eq 0 ]; then
        echo "   ✅ $collection backed up successfully"
    else
        echo "   ❌ Failed to backup $collection"
        return 1
    fi
}

# Function to backup entire database
backup_database() {
    echo "🗄️  Starting full database backup..."
    echo ""
    
    # Key collections to backup
    collections=(
        "users"
        "assistants"
        "conversations"
        "messages"
        "presets"
        "files"
    )
    
    # Backup each collection
    for collection in "${collections[@]}"; do
        backup_collection "$collection"
    done
    
    echo ""
    echo "📊 Creating backup metadata..."
    
    # Create backup metadata
    cat > "$BACKUP_DIR/$BACKUP_NAME/backup_info.json" << EOF
{
    "timestamp": "$TIMESTAMP",
    "date": "$(date)",
    "collections": $(printf '"%s",' "${collections[@]}" | sed 's/,$//' | sed 's/^/[/' | sed 's/$/]/'),
    "mongoUri": "REDACTED",
    "platform": "AI Business Tools Platform",
    "version": "1.0.0"
}
EOF
    
    echo "   ✅ Metadata created"
}

# Function to compress backup
compress_backup() {
    echo ""
    echo "🗜️  Compressing backup..."
    
    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Backup compressed successfully"
        echo "   📦 Archive: ${BACKUP_NAME}.tar.gz"
        
        # Calculate size
        SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
        echo "   📏 Size: $SIZE"
        
        # Remove uncompressed backup
        rm -rf "$BACKUP_NAME"
        echo "   🧹 Cleaned up uncompressed files"
    else
        echo "   ❌ Failed to compress backup"
        return 1
    fi
    
    cd - > /dev/null
}

# Function to cleanup old backups
cleanup_old_backups() {
    local keep_days=${1:-7}
    
    echo ""
    echo "🧹 Cleaning up backups older than $keep_days days..."
    
    # Find and remove old backups
    find "$BACKUP_DIR" -name "ai_business_tools_backup_*.tar.gz" -mtime +$keep_days -type f -delete
    
    echo "   ✅ Old backups cleaned up"
}

# Function to list existing backups
list_backups() {
    echo ""
    echo "📋 Existing backups:"
    echo ""
    
    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'
    else
        echo "   No backups found"
    fi
}

# Function to restore from backup
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        echo "❌ Please specify a backup file to restore"
        echo "Usage: $0 restore <backup_file.tar.gz>"
        return 1
    fi
    
    if [ ! -f "$BACKUP_DIR/$backup_file" ]; then
        echo "❌ Backup file not found: $BACKUP_DIR/$backup_file"
        return 1
    fi
    
    echo "⚠️  WARNING: This will restore data from backup!"
    echo "   Backup file: $backup_file"
    read -p "   Are you sure you want to continue? (yes/no) " -n 3 -r
    echo
    
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo "   Restore cancelled"
        return 0
    fi
    
    # Extract backup
    echo "📦 Extracting backup..."
    cd "$BACKUP_DIR"
    tar -xzf "$backup_file"
    local backup_dir="${backup_file%.tar.gz}"
    
    # Restore to MongoDB
    echo "🔄 Restoring to MongoDB..."
    mongorestore \
        --uri="$MONGO_URI" \
        --dir="$backup_dir" \
        --drop
    
    if [ $? -eq 0 ]; then
        echo "✅ Restore completed successfully"
    else
        echo "❌ Restore failed"
    fi
    
    # Cleanup
    rm -rf "$backup_dir"
    cd - > /dev/null
}

# Main script logic
case "${1:-backup}" in
    backup)
        backup_database
        compress_backup
        cleanup_old_backups ${2:-7}  # Keep backups for 7 days by default
        list_backups
        ;;
    
    restore)
        restore_backup "$2"
        ;;
    
    list)
        list_backups
        ;;
    
    cleanup)
        cleanup_old_backups ${2:-7}
        list_backups
        ;;
    
    *)
        echo "Usage: $0 {backup|restore|list|cleanup} [options]"
        echo ""
        echo "Commands:"
        echo "  backup [days]     - Create a new backup (keep for N days, default: 7)"
        echo "  restore <file>    - Restore from a backup file"
        echo "  list             - List existing backups"
        echo "  cleanup [days]   - Remove backups older than N days (default: 7)"
        echo ""
        echo "Examples:"
        echo "  $0 backup              # Create backup, keep for 7 days"
        echo "  $0 backup 30           # Create backup, keep for 30 days"
        echo "  $0 restore backup.tar.gz  # Restore from backup"
        echo "  $0 list                # List all backups"
        echo "  $0 cleanup 14          # Remove backups older than 14 days"
        exit 1
        ;;
esac

echo ""
echo "✨ Operation complete!"
echo ""

# Add to crontab for automated backups:
# 0 2 * * * /path/to/backup.sh backup 7 >> /var/log/ai_business_tools_backup.log 2>&1