# WhispnoteAI — Implementation Plan

## Current Phase: Initial Architecture Setup

### Implementation Order

0. [x] Project meta-files (CLAUDE.md, memory, plan, skills)
1. [ ] Project scaffolding — Initialize Expo project, install dependencies, configure TypeScript & NativeWind
2. [ ] Database layer — SQLite schema, migrations, query functions
3. [ ] Audio recording — expo-av recording service, save to filesystem
4. [ ] AI pipeline — Whisper transcription + GPT structuring services
5. [ ] Pipeline orchestration — Wire record → transcribe → structure → save flow
6. [ ] Home screen — Display decks and cards in masonry grid
7. [ ] Card components — Small/Medium/Large card variants with styling
8. [ ] Deck detail screen — View all cards in a deck
9. [ ] Search — FTS5 search, search screen UI
10. [ ] Pinning — Toggle pin on cards, pinned view screen
11. [ ] Polish — Animations, transitions, "cutesy" theme, loading states

### Architecture Summary

See `CLAUDE.md` for full project overview and tech stack.

**Data flow**: Voice → Whisper API → Transcript → GPT-4o → Cards JSON → SQLite

**Key entities**: Recording (1) → Deck (1) → Cards (N)

**Screens**: Home (tabs) | Record | Search | Pinned | Deck Detail | Card Detail
