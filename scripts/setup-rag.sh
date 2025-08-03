#!/bin/bash

# LibreChat RAG System Setup Script
# Automated setup for pgVector and RAG API with LibreChat

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LIBRECHAT_DIR="$PROJECT_ROOT/LibreChat"
ENV_FILE="$LIBRECHAT_DIR/.env"
ENV_PRODUCTION="$LIBRECHAT_DIR/.env.production"
COMPOSE_FILE="$LIBRECHAT_DIR/docker-compose.yml"
OVERRIDE_FILE="$LIBRECHAT_DIR/docker-compose.override.yml"

# Default values
SETUP_MODE="development"
VECTOR_STORE_NAME="JK Knowledge Base"

# Functions
print_header() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║      LibreChat RAG System Setup           ║${NC}"
    echo -e "${CYAN}║      Automated Installation Script         ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}" >&2
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='⣾⣽⣻⢿⡿⣟⣯⣷'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and run again."
        exit 1
    fi
    
    # Check if LibreChat directory exists
    if [ ! -d "$LIBRECHAT_DIR" ]; then
        print_error "LibreChat directory not found at: $LIBRECHAT_DIR"
        exit 1
    fi
    
    print_success "All prerequisites met"
    echo ""
}

select_setup_mode() {
    echo "Select setup mode:"
    echo "1) Development (local setup)"
    echo "2) Production (with security hardening)"
    echo ""
    read -p "Enter your choice (1-2): " choice
    
    case $choice in
        1)
            SETUP_MODE="development"
            ENV_FILE="$LIBRECHAT_DIR/.env"
            ;;
        2)
            SETUP_MODE="production"
            ENV_FILE="$ENV_PRODUCTION"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    print_info "Setup mode: $SETUP_MODE"
    echo ""
}

check_existing_setup() {
    print_step "Checking for existing RAG setup..."
    
    # Check if services are already running
    if docker ps | grep -q "librechat-vectordb\|librechat-rag-api"; then
        print_warning "RAG services are already running"
        read -p "Do you want to stop and reconfigure them? (y/N): " response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            print_step "Stopping existing services..."
            cd "$LIBRECHAT_DIR"
            docker-compose down vectordb rag_api 2>/dev/null || true
            cd - > /dev/null
        else
            print_info "Keeping existing services"
            return 1
        fi
    fi
    
    return 0
}

setup_environment() {
    print_step "Setting up environment configuration..."
    
    # Check if env file exists
    if [ ! -f "$ENV_FILE" ]; then
        if [ "$SETUP_MODE" = "production" ] && [ -f "$LIBRECHAT_DIR/.env.production" ]; then
            print_info "Using existing .env.production"
        else
            print_error "Environment file not found: $ENV_FILE"
            echo "Creating from template..."
            
            if [ -f "$LIBRECHAT_DIR/.env.example" ]; then
                cp "$LIBRECHAT_DIR/.env.example" "$ENV_FILE"
            else
                print_error "No .env.example found"
                exit 1
            fi
        fi
    fi
    
    # Check for required RAG variables
    local missing_vars=()
    
    if ! grep -q "^RAG_OPENAI_API_KEY=" "$ENV_FILE"; then
        missing_vars+=("RAG_OPENAI_API_KEY")
    fi
    
    if ! grep -q "^POSTGRES_PASSWORD=" "$ENV_FILE"; then
        missing_vars+=("POSTGRES_PASSWORD")
    fi
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_warning "Missing required environment variables"
        echo "Please add the following to your $ENV_FILE:"
        echo ""
        
        for var in "${missing_vars[@]}"; do
            case $var in
                "RAG_OPENAI_API_KEY")
                    echo "RAG_OPENAI_API_KEY=your-openai-api-key"
                    ;;
                "POSTGRES_PASSWORD")
                    echo "POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '=')"
                    ;;
            esac
        done
        
        echo ""
        read -p "Press Enter after adding these variables..." 
    fi
    
    print_success "Environment configured"
    echo ""
}

verify_docker_compose_files() {
    print_step "Verifying Docker Compose configuration..."
    
    if [ ! -f "$OVERRIDE_FILE" ]; then
        print_error "docker-compose.override.yml not found"
        echo "This file should have been created by the PRP implementation"
        exit 1
    fi
    
    # Verify RAG services are defined
    if ! grep -q "vectordb:" "$OVERRIDE_FILE"; then
        print_error "vectordb service not found in override file"
        exit 1
    fi
    
    if ! grep -q "rag_api:" "$OVERRIDE_FILE"; then
        print_error "rag_api service not found in override file"
        exit 1
    fi
    
    print_success "Docker Compose files verified"
    echo ""
}

start_rag_services() {
    print_step "Starting RAG services..."
    
    cd "$LIBRECHAT_DIR"
    
    # Start only the RAG-related services first
    print_info "Starting pgVector database..."
    docker-compose up -d vectordb &
    spinner $!
    
    # Wait for PostgreSQL to be ready
    print_info "Waiting for database initialization..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose exec -T vectordb pg_isready -U ${POSTGRES_USER:-librechat} &>/dev/null; then
            print_success "Database is ready"
            break
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Database failed to start"
        docker-compose logs vectordb
        exit 1
    fi
    
    # Start RAG API
    print_info "Starting RAG API service..."
    docker-compose up -d rag_api &
    spinner $!
    
    # Wait for RAG API to be ready
    print_info "Waiting for RAG API initialization..."
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:${RAG_PORT:-8000}/health" &>/dev/null; then
            print_success "RAG API is ready"
            break
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "RAG API failed to start"
        docker-compose logs rag_api
        exit 1
    fi
    
    cd - > /dev/null
    print_success "RAG services started successfully"
    echo ""
}

create_vector_store() {
    print_step "Creating initial vector store..."
    
    # Get RAG API key from env
    local rag_api_key=$(grep "^RAG_API_KEY=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    
    if [ -z "$rag_api_key" ]; then
        print_warning "RAG_API_KEY not found, using default"
        rag_api_key="your-secure-rag-api-key"
    fi
    
    # Create vector store
    local response=$(curl -s -X POST "http://localhost:${RAG_PORT:-8000}/vector-stores" \
        -H "Authorization: Bearer $rag_api_key" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$VECTOR_STORE_NAME\",
            \"description\": \"Primary knowledge base for business coaching content\",
            \"metadata\": {
                \"created_by\": \"setup_script\",
                \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
            }
        }")
    
    local store_id=$(echo "$response" | jq -r '.id' 2>/dev/null || echo "")
    
    if [ -n "$store_id" ] && [ "$store_id" != "null" ]; then
        print_success "Created vector store: $store_id"
        echo ""
        echo "Add this to your .env file:"
        echo -e "${YELLOW}DARKJK_VECTOR_STORE_ID=$store_id${NC}"
        echo ""
        
        # Optionally update env file
        read -p "Update .env file automatically? (y/N): " response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            if grep -q "^DARKJK_VECTOR_STORE_ID=" "$ENV_FILE"; then
                # Update existing
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    sed -i '' "s/^DARKJK_VECTOR_STORE_ID=.*/DARKJK_VECTOR_STORE_ID=$store_id/" "$ENV_FILE"
                else
                    sed -i "s/^DARKJK_VECTOR_STORE_ID=.*/DARKJK_VECTOR_STORE_ID=$store_id/" "$ENV_FILE"
                fi
            else
                # Add new
                echo "DARKJK_VECTOR_STORE_ID=$store_id" >> "$ENV_FILE"
            fi
            print_success "Updated .env file"
        fi
    else
        print_warning "Could not create vector store automatically"
        echo "You'll need to create it manually through the API or UI"
    fi
    echo ""
}

test_rag_system() {
    print_step "Testing RAG system..."
    
    # Test vector database connection
    if docker exec librechat-vectordb psql -U ${POSTGRES_USER:-librechat} -d ${POSTGRES_DB:-librechat_vectors} -c "SELECT 1;" &>/dev/null; then
        print_success "Vector database connection: OK"
    else
        print_error "Vector database connection: FAILED"
    fi
    
    # Test RAG API health
    local health_response=$(curl -s "http://localhost:${RAG_PORT:-8000}/health")
    if [ $? -eq 0 ]; then
        print_success "RAG API health check: OK"
    else
        print_error "RAG API health check: FAILED"
    fi
    
    # Test file upload capability (with a small test file)
    echo "Test content for RAG system" > /tmp/rag_test.txt
    local upload_response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "http://localhost:${RAG_PORT:-8000}/files" \
        -H "Authorization: Bearer ${RAG_API_KEY:-test}" \
        -F "file=@/tmp/rag_test.txt" \
        -F "vector_store_id=test")
    rm -f /tmp/rag_test.txt
    
    if [[ "$upload_response" =~ ^(200|201|400|401)$ ]]; then
        print_success "RAG API file endpoint: Accessible"
    else
        print_error "RAG API file endpoint: Not accessible"
    fi
    
    echo ""
}

print_next_steps() {
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo -e "${GREEN}RAG System Setup Complete!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Start the main LibreChat application:"
    echo "   cd $LIBRECHAT_DIR"
    echo "   docker-compose up -d"
    echo ""
    echo "2. Upload your knowledge base:"
    echo "   $SCRIPT_DIR/upload-knowledge-base.sh /path/to/knowledge-base"
    echo ""
    echo "3. Configure agents in LibreChat admin panel"
    echo ""
    echo "4. Test the Dark JK Coach with RAG queries"
    echo ""
    
    if [ "$SETUP_MODE" = "production" ]; then
        echo "Production Notes:"
        echo "- Ensure SSL certificates are configured"
        echo "- Set up database backups for pgVector"
        echo "- Monitor OpenAI API usage for embeddings"
        echo "- Review security settings in .env.production"
        echo ""
    fi
    
    echo "Service URLs:"
    echo "- LibreChat: http://localhost:3080"
    echo "- RAG API: http://localhost:${RAG_PORT:-8000}"
    echo "- pgVector: localhost:${POSTGRES_PORT:-5433}"
    echo ""
    
    echo "For troubleshooting, check logs:"
    echo "- docker logs librechat-rag-api"
    echo "- docker logs librechat-vectordb"
    echo ""
}

cleanup_on_error() {
    print_error "Setup failed. Cleaning up..."
    cd "$LIBRECHAT_DIR"
    docker-compose down vectordb rag_api 2>/dev/null || true
    cd - > /dev/null
    exit 1
}

# Trap errors
trap cleanup_on_error ERR

# Main execution
main() {
    print_header
    check_prerequisites
    select_setup_mode
    
    if check_existing_setup; then
        setup_environment
        verify_docker_compose_files
        start_rag_services
        create_vector_store
        test_rag_system
        print_next_steps
    else
        print_info "Setup cancelled"
    fi
}

# Run main function
main "$@"