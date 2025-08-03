#!/bin/bash

# LibreChat RAG Bulk Upload Script
# Uploads James Kemp's knowledge base content to LibreChat RAG system

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
RAG_API_URL="${RAG_API_URL:-http://localhost:8000}"
RAG_API_KEY="${RAG_API_KEY}"
VECTOR_STORE_NAME="${VECTOR_STORE_NAME:-JK Knowledge Base}"
SUPPORTED_EXTENSIONS=("txt" "md" "pdf" "docx")
MAX_FILE_SIZE_MB=50
BATCH_SIZE=5  # Upload files in batches

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}LibreChat RAG Knowledge Base Uploader${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_requirements() {
    echo "Checking requirements..."
    
    # Check if curl is installed
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed."
        exit 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed. Install with: brew install jq"
        exit 1
    fi
    
    # Check API key
    if [ -z "$RAG_API_KEY" ]; then
        print_error "RAG_API_KEY environment variable is not set"
        echo "Set it with: export RAG_API_KEY=your-api-key"
        exit 1
    fi
    
    # Check if knowledge base directory is provided
    if [ -z "$1" ]; then
        print_error "No knowledge base directory provided"
        echo "Usage: $0 /path/to/knowledge-base [vector-store-id]"
        exit 1
    fi
    
    # Check if directory exists
    if [ ! -d "$1" ]; then
        print_error "Directory '$1' does not exist"
        exit 1
    fi
    
    print_success "All requirements met"
    echo ""
}

test_api_connection() {
    echo "Testing RAG API connection..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X GET "$RAG_API_URL/health" \
        -H "Authorization: Bearer $RAG_API_KEY" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        print_success "RAG API is accessible at $RAG_API_URL"
    else
        print_error "Cannot connect to RAG API at $RAG_API_URL (HTTP $response)"
        echo "Make sure the RAG API service is running"
        exit 1
    fi
    echo ""
}

create_or_get_vector_store() {
    local store_id="$1"
    
    if [ -n "$store_id" ]; then
        echo "Using existing vector store: $store_id"
        VECTOR_STORE_ID="$store_id"
    else
        echo "Creating new vector store: $VECTOR_STORE_NAME"
        
        response=$(curl -s -X POST "$RAG_API_URL/vector-stores" \
            -H "Authorization: Bearer $RAG_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"name\": \"$VECTOR_STORE_NAME\",
                \"description\": \"James Kemp's business coaching knowledge base\",
                \"metadata\": {
                    \"type\": \"knowledge_base\",
                    \"author\": \"James Kemp\",
                    \"category\": \"business_coaching\"
                }
            }")
        
        VECTOR_STORE_ID=$(echo "$response" | jq -r '.id' 2>/dev/null || echo "")
        
        if [ -z "$VECTOR_STORE_ID" ] || [ "$VECTOR_STORE_ID" = "null" ]; then
            print_error "Failed to create vector store"
            echo "Response: $response"
            exit 1
        fi
        
        print_success "Created vector store: $VECTOR_STORE_ID"
    fi
    echo ""
}

count_files() {
    local dir="$1"
    local count=0
    
    for ext in "${SUPPORTED_EXTENSIONS[@]}"; do
        count=$((count + $(find "$dir" -name "*.$ext" -type f 2>/dev/null | wc -l)))
    done
    
    echo "$count"
}

check_file_size() {
    local file="$1"
    local size_mb=$(du -m "$file" | cut -f1)
    
    if [ "$size_mb" -gt "$MAX_FILE_SIZE_MB" ]; then
        return 1
    fi
    return 0
}

get_file_metadata() {
    local file="$1"
    local rel_path="${file#$KNOWLEDGE_BASE_DIR/}"
    local category=$(dirname "$rel_path")
    local topic=$(basename "$file" | sed 's/\.[^.]*$//' | tr '_-' ' ')
    
    if [ "$category" = "." ]; then
        category="general"
    fi
    
    echo "{\"category\": \"$category\", \"topic\": \"$topic\", \"source_file\": \"$(basename "$file")\"}"
}

upload_file() {
    local file="$1"
    local filename=$(basename "$file")
    local metadata=$(get_file_metadata "$file")
    
    echo -n "  Uploading $filename... "
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$RAG_API_URL/files" \
        -H "Authorization: Bearer $RAG_API_KEY" \
        -F "file=@$file" \
        -F "vector_store_id=$VECTOR_STORE_ID" \
        -F "metadata=$metadata" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        file_id=$(echo "$body" | jq -r '.id' 2>/dev/null || echo "")
        if [ -n "$file_id" ] && [ "$file_id" != "null" ]; then
            echo -e "${GREEN}✓${NC} (ID: $file_id)"
            return 0
        else
            echo -e "${RED}✗${NC} (Invalid response)"
            return 1
        fi
    else
        error_msg=$(echo "$body" | jq -r '.error // .message // .detail' 2>/dev/null || echo "Unknown error")
        echo -e "${RED}✗${NC} ($error_msg)"
        return 1
    fi
}

upload_files() {
    local dir="$1"
    local total_files=$(count_files "$dir")
    local uploaded=0
    local failed=0
    local skipped=0
    local current=0
    
    echo "Found $total_files supported files to upload"
    echo ""
    
    # Process files
    for ext in "${SUPPORTED_EXTENSIONS[@]}"; do
        while IFS= read -r -d '' file; do
            current=$((current + 1))
            echo "[$current/$total_files] Processing: $(basename "$file")"
            
            # Check file size
            if ! check_file_size "$file"; then
                print_warning "  File too large (>$MAX_FILE_SIZE_MB MB), skipping"
                skipped=$((skipped + 1))
                continue
            fi
            
            # Upload file
            if upload_file "$file"; then
                uploaded=$((uploaded + 1))
            else
                failed=$((failed + 1))
            fi
            
            # Rate limiting - pause between uploads
            sleep 0.5
            
        done < <(find "$dir" -name "*.$ext" -type f -print0 2>/dev/null)
    done
    
    echo ""
    echo "Upload Summary:"
    print_success "Uploaded: $uploaded files"
    if [ "$failed" -gt 0 ]; then
        print_error "Failed: $failed files"
    fi
    if [ "$skipped" -gt 0 ]; then
        print_warning "Skipped: $skipped files (too large)"
    fi
}

verify_upload() {
    echo ""
    echo "Verifying vector store..."
    
    response=$(curl -s -X GET "$RAG_API_URL/vector-stores/$VECTOR_STORE_ID" \
        -H "Authorization: Bearer $RAG_API_KEY")
    
    file_count=$(echo "$response" | jq -r '.file_count // 0' 2>/dev/null || echo "0")
    status=$(echo "$response" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
    
    print_info "Vector store status: $status"
    print_info "Total files in store: $file_count"
    
    # Test search
    echo ""
    echo "Testing search functionality..."
    search_response=$(curl -s -X POST "$RAG_API_URL/search" \
        -H "Authorization: Bearer $RAG_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"query\": \"business coaching\",
            \"vector_store_id\": \"$VECTOR_STORE_ID\",
            \"max_results\": 3
        }")
    
    result_count=$(echo "$search_response" | jq -r '.results | length' 2>/dev/null || echo "0")
    
    if [ "$result_count" -gt 0 ]; then
        print_success "Search test passed - found $result_count results"
    else
        print_warning "Search test returned no results - embeddings may still be processing"
    fi
}

print_completion_instructions() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Upload Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Add this to your .env file:"
    echo -e "   ${YELLOW}DARKJK_VECTOR_STORE_ID=$VECTOR_STORE_ID${NC}"
    echo ""
    echo "2. Restart LibreChat services:"
    echo "   docker-compose down"
    echo "   docker-compose up -d"
    echo ""
    echo "3. Test the Dark JK Coach agent with queries like:"
    echo "   - \"What does James say about hybrid offers?\""
    echo "   - \"How should I price my consulting services?\""
    echo "   - \"What's the best way to scale my business?\""
    echo ""
    echo "Vector Store ID: ${YELLOW}$VECTOR_STORE_ID${NC}"
    echo ""
}

# Main execution
main() {
    print_header
    
    KNOWLEDGE_BASE_DIR="$1"
    EXISTING_STORE_ID="$2"
    
    check_requirements "$KNOWLEDGE_BASE_DIR"
    test_api_connection
    create_or_get_vector_store "$EXISTING_STORE_ID"
    
    echo "Starting bulk upload from: $KNOWLEDGE_BASE_DIR"
    echo "Supported file types: ${SUPPORTED_EXTENSIONS[*]}"
    echo ""
    
    upload_files "$KNOWLEDGE_BASE_DIR"
    verify_upload
    print_completion_instructions
}

# Run main function
main "$@"