# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Node.js API gateway that provides authenticated proxy access to an Ollama server. The application acts as a security layer between clients and the Ollama AI model service.

## Architecture
- **Single-file application**: `server.js` contains the entire Express.js server
- **Proxy pattern**: Routes client requests to upstream Ollama server at configurable host
- **Authentication**: Bearer token-based API key authentication
- **Rate limiting**: 100 requests per 15-minute window per IP
- **Security middleware**: Helmet, CORS, request logging

## Environment Configuration
The application uses environment variables:
- `PORT`: Server port (default: 3000)
- `OLLAMA_HOST`: Upstream Ollama server URL (default: "http://IP_DE_TU_VM_OLLAMA:11434")
- `API_KEYS`: Comma-separated list of valid API keys (default: "tu-api-key-super-secreta")

## API Endpoints
- `GET /health` - Health check (no auth required)
- `POST /api/chat` - Proxy to Ollama chat endpoint
- `POST /api/generate` - Proxy to Ollama generate endpoint  
- `GET /api/tags` - List available models
- `POST /api/chat/stream` - Streaming chat responses

All endpoints except `/health` require Bearer token authentication.

## Development Commands
```bash
# Run the server directly
node server.js

# Build Docker image (Dockerfile exists but is empty)
docker build -t ollama-gateway .

# Run with custom environment
PORT=8080 OLLAMA_HOST=http://localhost:11434 node server.js
```

## Dependencies
The application requires these Node.js packages:
- express (web server)
- cors (CORS middleware)
- express-rate-limit (rate limiting)
- helmet (security headers)
- axios (HTTP client for proxying)