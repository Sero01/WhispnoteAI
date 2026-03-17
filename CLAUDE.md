# WhispnoteAI

## Overview
WhispnoteAI is a mobile-first AI-powered voice note application built with React Native + Expo. Users record voice notes, and AI (OpenAI Whisper + GPT-4o) transforms them into visually organized cards grouped into decks. The goal is to make capturing and revisiting ideas feel magical.

## Tech Stack
- **Framework**: React Native + Expo (managed workflow, SDK 52+)
- **Language**: TypeScript
- **Database**: SQLite via `expo-sqlite` (local-first)
- **Audio**: `expo-av` for recording/playback, `expo-file-system` for storage
- **AI**: OpenAI Whisper API (transcription) + GPT-4o (content structuring)
- **State**: Zustand
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)

## Project Structure
```
WhispnoteAI/
├── app/                    # Expo Router screens (tabs + detail views)
├── src/
│   ├── components/         # UI components (cards/, decks/, recording/, search/, ui/)
│   ├── db/                 # SQLite schema, migrations, query functions
│   ├── services/           # Business logic (audio, transcription, structuring, pipeline)
│   ├── stores/             # Zustand state stores
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Helper functions (cardSizing, formatting)
├── assets/                 # Fonts, images, icons
├── .claude/                # Dev meta-files (not app code)
│   ├── memory/memories.md  # Running log of decisions & findings
│   ├── plan/plan.md        # Architecture & implementation plans
│   └── skills/skill.md     # Reusable patterns & dev utilities
└── CLAUDE.md               # This file
```

## Conventions
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for file names in services/utils
- **Components**: One component per file, co-locate styles
- **Database**: All DB access goes through `src/db/queries.ts`
- **AI calls**: All OpenAI API calls go through `src/services/` — never call APIs directly from components
- **State**: Use Zustand stores for UI state; DB is the source of truth for data

## Key Commands
```bash
npx expo start          # Start dev server
npx expo run:ios        # Run on iOS simulator
npx expo run:android    # Run on Android emulator
npm test                # Run tests
```

## Data Flow
```
Voice Recording → Whisper API → Raw Transcript → GPT-4o → Structured JSON → SQLite (Cards in Decks)
```

## References
- Memory log: `.claude/memory/memories.md`
- Plans: `.claude/plan/plan.md`
- Skills: `.claude/skills/skill.md`
