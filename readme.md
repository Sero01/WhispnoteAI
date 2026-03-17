# WhispnoteAI

## Overview
WhispnoteAI is a mobile-first AI-powered voice note application built with React Native + Expo. Users record voice notes, and AI (OpenAI Whisper + GPT-4o) transforms them into visually organized cards grouped into decks. The goal is to make capturing and revisiting ideas feel magical.

## Tech Stack
- **Framework**: React Native + Expo (managed workflow, SDK 52+)
- **Language**: TypeScript
- **Database**: SQLite via `expo-sqlite` (local-first)
- **Audio**: `expo-av` for recording/playback, `expo-file-system` for storage
- **AI**: To be decided
- **State**: Zustand
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)


## Conventions
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for file names in services/utils
- **Components**: One component per file, co-locate styles
- **Database**: All DB access goes through `src/db/queries.ts`
- **AI calls**: All AI API calls go through `src/services/` — never call APIs directly from components
- **State**: Use Zustand stores for UI state; DB is the source of truth for data


## Data Flow
```
Voice Recording → Voice AI API → Raw Transcript → LLM → Structured JSON → SQLite (Cards in Decks)
```

