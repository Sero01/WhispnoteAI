# WhispnoteAI — Skills & Reusable Patterns

Reusable code snippets, patterns, and dev utilities discovered during development.

---

## Expo Project Commands

```bash
# Start development
npx expo start

# Run on specific platform
npx expo run:ios
npx expo run:android

# Install an Expo-compatible package
npx expo install <package-name>

# Reset cache
npx expo start --clear
```

## SQLite Patterns (expo-sqlite)

```typescript
// Open database
import * as SQLite from 'expo-sqlite';
const db = await SQLite.openDatabaseAsync('whispnote.db');

// Run migration
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS ...
`);

// Parameterized query
const results = await db.getAllAsync('SELECT * FROM cards WHERE deck_id = ?', [deckId]);

// Insert and get ID
const result = await db.runAsync('INSERT INTO cards (...) VALUES (...)', [...values]);
// result.lastInsertRowId
```

## UUID Generation (React Native)

```typescript
import 'react-native-get-random-values'; // Must import before uuid
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();
```

## OpenAI API Patterns

```typescript
// Whisper transcription
const formData = new FormData();
formData.append('file', { uri: audioUri, type: 'audio/m4a', name: 'recording.m4a' });
formData.append('model', 'whisper-1');

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: formData,
});

// GPT structured output
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: transcript }],
    response_format: { type: 'json_object' },
  }),
});
```

## Testing Patterns

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=db/queries
```

---

*This file is updated as new reusable patterns emerge during development.*
