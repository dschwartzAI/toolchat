# AI Business Tools Platform

A customized LibreChat deployment featuring specialized business AI tools with tier-based access control.

## Features

### Business Tools
1. **Dark JK Business Coach** - Strategic business advice powered by GPT-4o with Dan Kennedy's knowledge base
2. **Hybrid Offer Creator** - Compelling sales letter generator using Claude AI

### User Experience
- Business-friendly interface (no technical jargon)
- Tier-based access (Free, Premium, Admin)
- Document generation and export
- Secure MongoDB Atlas storage

## Prerequisites

1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
2. **Git** (optional) - For cloning the repository
3. **API Keys** - Already configured in .env:
   - OpenAI API key (for Dark JK Coach)
   - Anthropic API key (for Hybrid Offer Creator)

## Quick Start

### 1. Install Docker Desktop
- Download and install Docker Desktop
- Start Docker Desktop
- Wait for it to fully initialize

### 2. Run Local Setup
```bash
cd /Users/danielschwartz/Context\ Engineer/context-engineering-intro
./scripts/local-setup.sh
```

### 3. Access the Platform
- Open your browser to: http://localhost:3080
- Create an account
- Start using the business tools!

## Project Structure

```
.
├── LibreChat/                  # Main LibreChat application
│   ├── docker-compose.yml      # Base Docker configuration
│   ├── docker-compose.override.yml  # Business tools customization
│   ├── librechat.yaml         # Platform configuration
│   ├── .env                   # Environment variables
│   └── [custom files]         # UI translations, middleware, etc.
├── config/                    # Configuration templates
├── scripts/                   # Deployment and setup scripts
├── docs/                      # Documentation
└── examples/                  # Example PRDs and implementations
```

## Configuration Files

### librechat.yaml
- Configures available AI endpoints
- Hides technical settings from users
- Enables business-specific features

### .env
- MongoDB Atlas connection string
- API keys for AI services
- Platform settings

### docker-compose.override.yml
- Custom volume mounts
- Business tool configurations
- SSL/nginx setup

## User Tiers

| Tier | Access | Features |
|------|--------|----------|
| Free | Hybrid Offer Creator (limited) | Basic document generation |
| Premium | Both tools (full access) | Unlimited usage, vector search |
| Admin | Everything + user management | Create/manage users, view analytics |

## Management Commands

### Start the Platform
```bash
docker compose up -d
```

### Stop the Platform
```bash
docker compose down
```

### View Logs
```bash
docker compose logs -f
```

### Restart Services
```bash
docker compose restart
```

## Troubleshooting

### Docker Not Running
- Make sure Docker Desktop is installed and running
- Check system requirements
- Restart your computer if needed

### Port Already in Use
- LibreChat runs on port 3080
- Check if another service is using this port
- Stop conflicting services or change the port in docker-compose

### MongoDB Connection Issues
- Verify the connection string in .env
- Check network connectivity
- Ensure MongoDB Atlas IP whitelist includes your IP

## Development

### Adding New Business Tools
1. Define the tool in librechat.yaml
2. Add tier requirements in tierAccess.js
3. Create agent configuration
4. Update UI translations

### Customizing the UI
- Edit `client/src/localization/custom-en.json`
- Restart the platform to see changes

## Links

- GitHub Repository: https://github.com/dschwartzAI/darkjk
- LibreChat Documentation: https://www.librechat.ai/docs
- MongoDB Atlas: https://cloud.mongodb.com

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review LibreChat documentation
3. Contact your administrator

## License

This project is based on LibreChat and follows its licensing terms.