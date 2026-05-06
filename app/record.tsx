import { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Waveform, IconButton, Button, Card } from '@/components';
import { useRecorder } from '@/features/recording/useRecorder';
import { useTranscriber } from '@/features/transcription/useTranscriber';
import { notesRepo } from '@/lib/db';
import { transcribeAndPersist } from '@/lib/ai/pipeline';
import type { Recording } from '@/features/recording/useRecorder';

function formatElapsed(ms: number): string {
  const mm = Math.floor(ms / 60000);
  const ss = Math.floor((ms % 60000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(mm)}:${pad(ss)}`;
}

type Phase = 'recording' | 'saving' | 'conjuring' | 'idle';

export default function RecordScreen() {
  const router = useRouter();
  const recorder = useRecorder();
  const transcriber = useTranscriber();
  const { status, elapsedMs, amplitudes, discard } = recorder;
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const lastRecordingRef = useRef<Recording | null>(null);
  const lastTranscriptRef = useRef<string | null>(null);

  const handleSave = useCallback(async () => {
    setPhase('saving');
    setError(null);
    try {
      const recording = lastRecordingRef.current ?? (await recorder.stop());
      const transcript = lastTranscriptRef.current ?? (await transcriber.stop().catch(() => ''));
      if (!recording) {
        setPhase('idle');
        return;
      }
      const note = await notesRepo.create({
        audioUri: recording.uri,
        durationMs: recording.durationMs,
      });
      if (transcript) {
        await notesRepo.setTranscript(note.id, transcript);
          setPhase('conjuring');
          try {
            await transcribeAndPersist(note.id, transcript);
          } catch (err) {
            if (err instanceof Error && err.message === 'No LLM client configured') {
              // silently skip — user hasn't configured a key
            } else {
              const msg = err instanceof Error ? err.message : 'Card generation failed';
              setError(msg);
              setTimeout(() => setError(null), 2500);
            }
          }
      }
      router.replace('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setError(msg);
      setTimeout(() => setError(null), 2500);
    } finally {
      setPhase('idle');
    }
  }, [recorder, transcriber, router]);

  const handleDiscard = useCallback(async () => {
    await discard();
    router.back();
  }, [discard, router]);

  const handleToggle = useCallback(async () => {
    if (status === 'recording') {
      const [recording, transcript] = await Promise.all([
        recorder.stop(),
        transcriber.stop(),
      ]);
      lastRecordingRef.current = recording;
      lastTranscriptRef.current = transcript;
    } else {
      await Promise.all([recorder.start(), transcriber.start()]);
    }
  }, [status, recorder, transcriber]);

  return (
    <Screen background="background" padding="lg">
      {phase === 'conjuring' && (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, backgroundColor: 'rgba(31,27,22,0.5)', alignItems: 'center', justifyContent: 'center' }}>
            <Card accent="lavender">
              <Text variant="handwritten">Conjuring a card...</Text>
            </Card>
          </View>
        </View>
      )}

      {error && (
        <View style={{ position: 'absolute', bottom: 40, left: 16, right: 16, zIndex: 100 }}>
          <Card accent="peach">
            <Text>{error}</Text>
          </Card>
        </View>
      )}

      {status === 'denied' ? (
        <Card accent="peach">
          <Text>Microphone permission denied. Open Settings to grant access.</Text>
        </Card>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 40 }}>
          <Text variant="display">{formatElapsed(elapsedMs)}</Text>

          {(transcriber.partial || transcriber.finalTranscript) && (
            <Text variant="handwritten" color="inkMuted">
              {transcriber.partial || transcriber.finalTranscript}
            </Text>
          )}

          <Waveform amplitudes={amplitudes} color="ink" height={120} />

          <IconButton
            size="lg"
            variant="accent"
            accent="peach"
            accessibilityLabel={status === 'recording' ? 'Stop recording' : 'Start recording'}
            onPress={handleToggle}
            testID="record-toggle"
          >
            <Text style={{ fontSize: 24 }}>{status === 'recording' ? '■' : '●'}</Text>
          </IconButton>

          {transcriber.status === 'denied' && (
            <Text variant="eyebrow">Transcription unavailable</Text>
          )}

          {status === 'stopped' && (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Button label="Discard" variant="ghost" onPress={handleDiscard} />
              <Button label="Save" onPress={handleSave} />
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}
