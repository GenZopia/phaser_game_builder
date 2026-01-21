# Phaser Game Builder

A visual game development tool built with React, TypeScript, and Phaser.js, deployed on Vercel.

## Features

- Visual drag-and-drop game editor
- AI-powered code generation
- Real-time game preview
- Asset management
- Export functionality

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Deployment with Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/phaser-game-builder)

### Manual Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Environment Variables

Set these in your Vercel dashboard:

- `VITE_OPENROUTER_API_KEY`: Your OpenRouter API key
- `VITE_API_BASE_URL`: Your production API URL

## Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── services/      # API and business logic
├── game/          # Phaser.js game engine code
├── utils/         # Utility functions
└── types/         # TypeScript type definitions
```

## API Routes

- `/api/health` - Health check endpoint

## Technologies

- **Frontend**: React 19, TypeScript, Vite
- **Game Engine**: Phaser.js 3.90
- **Deployment**: Vercel
- **Testing**: Vitest, Testing Library
- **Linting**: ESLint