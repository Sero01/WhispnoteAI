import { useSettings } from '@/store/settings';

describe('useSettings', () => {
  beforeEach(() => {
    useSettings.getState().reset();
  });

  it('should have initial state', () => {
    const state = useSettings.getState();
    expect(state.provider).toBeNull();
    expect(state.modelOverride).toBeNull();
    expect(state.onboarded).toBe(false);
  });

  it('setProvider should update provider', () => {
    useSettings.getState().setProvider('openai');
    expect(useSettings.getState().provider).toBe('openai');

    useSettings.getState().setProvider('anthropic');
    expect(useSettings.getState().provider).toBe('anthropic');
  });

  it('setModelOverride should update modelOverride', () => {
    useSettings.getState().setModelOverride('gpt-4');
    expect(useSettings.getState().modelOverride).toBe('gpt-4');

    useSettings.getState().setModelOverride(null);
    expect(useSettings.getState().modelOverride).toBeNull();
  });

  it('setOnboarded should update onboarded', () => {
    useSettings.getState().setOnboarded(true);
    expect(useSettings.getState().onboarded).toBe(true);

    useSettings.getState().setOnboarded(false);
    expect(useSettings.getState().onboarded).toBe(false);
  });

  it('reset should return to initial state', () => {
    useSettings.getState().setProvider('openrouter');
    useSettings.getState().setModelOverride('claude-3');
    useSettings.getState().setOnboarded(true);

    useSettings.getState().reset();

    expect(useSettings.getState().provider).toBeNull();
    expect(useSettings.getState().modelOverride).toBeNull();
    expect(useSettings.getState().onboarded).toBe(false);
  });
});
