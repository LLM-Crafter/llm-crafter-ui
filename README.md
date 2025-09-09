# LLM Crafter UI

> ⚠️ **Alpha Version** - This project is currently in active development and not finalized yet. Features and APIs may change.

A modern SvelteKit frontend for the [LLM Crafter](https://github.com/LLM-Crafter/llm-crafter) platform - a collaborative environment for managing and executing LLM prompts with intelligent agents.

## Overview

This UI provides a clean, responsive interface for:

- Managing organizations and projects
- Creating and configuring AI agents
- Real-time conversations with chatbot agents
- Executing task agents
- API key and user management
- Organization administration

## Quick Start

### Prerequisites

- Node.js 18+
- A running [LLM Crafter API server](https://github.com/LLM-Crafter/llm-crafter)

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
npm run dev -- --open
```

The UI will be available at `http://localhost:5173`.

### Building

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **SvelteKit** - Full-stack framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## Project Structure

- `src/routes/` - Page components and API routes
- `src/lib/` - Shared components and utilities
- `src/lib/ui/` - Reusable UI components
- `src/lib/stores/` - Application state management

## Related Projects

- [LLM Crafter API](https://github.com/LLM-Crafter/llm-crafter) - Backend API server
