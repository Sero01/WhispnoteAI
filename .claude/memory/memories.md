# WhispnoteAI — Memory Log

Running log of important findings, learnings, and decisions. Updated during execution.

---

## 2026-03-16 — Architecture Decisions

- **Platform**: React Native + Expo (mobile-first, cross-platform iOS/Android)
- **Database**: SQLite via `expo-sqlite` — local-first, no server needed, native performance
  - Audio files stored on filesystem (not in DB), paths referenced in SQLite
  - Full-text search via SQLite FTS5 extension
  - No multi-device sync for MVP; can add later
- **AI Provider**: OpenAI — Whisper for speech-to-text, GPT-4o for content structuring
- **State Management**: Zustand — lightweight, works well with React Native
- **Styling**: NativeWind (Tailwind for RN) — enables rapid "cutesy" aesthetic development
- **Navigation**: Expo Router with tab-based layout (Home, Record, Search, Pinned)

## 2026-03-16 — Data Model Decisions

- Three core entities: Recording → Deck → Cards
- Each recording produces exactly one deck
- Cards have AI-determined size (small/medium/large) for masonry layout
- Tags stored as JSON array in card row (simpler than join table for local-first)
- Pinning is a boolean flag on the card (is_pinned)

## 2026-03-16 — Project Setup

- Empty repo, starting from scratch on branch `claude/voice-note-app-architecture-638U2`
- Created project meta-files: CLAUDE.md, .claude/memory, .claude/plan, .claude/skills
