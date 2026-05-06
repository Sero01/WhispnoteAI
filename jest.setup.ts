jest.mock('@expo-google-fonts/fraunces', () => ({ useFonts: () => [true, null], Fraunces_600SemiBold: 'Fraunces_600SemiBold', Fraunces_700Bold: 'Fraunces_700Bold' }));
jest.mock('@expo-google-fonts/caveat', () => ({ useFonts: () => [true, null], Caveat_400Regular: 'Caveat_400Regular', Caveat_700Bold: 'Caveat_700Bold' }));
jest.mock('@expo-google-fonts/inter', () => ({ useFonts: () => [true, null], Inter_400Regular: 'Inter_400Regular', Inter_500Medium: 'Inter_500Medium', Inter_600SemiBold: 'Inter_600SemiBold' }));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (Component: unknown) => Component,
      useSharedValue: (init: unknown) => ({ value: init }),
      useAnimatedStyle: (fn: () => unknown) => fn(),
      withTiming: (val: unknown) => val,
      withSpring: (val: unknown) => val,
      withDecay: (val: unknown) => val,
      cancelAnimation: () => {},
      runOnUI: (fn: unknown) => fn,
      runOnJS: (fn: unknown) => fn,
    },
    useSharedValue: (init: unknown) => ({ value: init }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withTiming: (val: unknown) => val,
    withSpring: (val: unknown) => val,
    withDecay: (val: unknown) => val,
    cancelAnimation: () => {},
    runOnUI: (fn: unknown) => fn,
    runOnJS: (fn: unknown) => fn,
    createAnimatedComponent: (Component: unknown) => Component,
    Animated: {
      View,
      createAnimatedComponent: (Component: unknown) => Component,
    },
  };
});

// Silence Reanimated warning if present
if (typeof global.performance === 'undefined') {
  (global as Record<string, unknown>).performance = {} as Performance;
}

// react-native-gesture-handler native module doesn't exist in test env
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    ...jest.requireActual('react-native-gesture-handler'),
    GestureHandlerRootView: View,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children, style, testID, ...rest }: { children: React.ReactNode; style?: unknown; testID?: string }) =>
      require('react').createElement(require('react-native').View, { style, testID, ...rest }, children),
    useSafeAreaInsets: () => inset,
  };
});

jest.mock('nativewind', () => ({
  cssInterop: () => undefined,
  remapProps: () => undefined,
  styled: (Component: unknown) => Component,
  useColorScheme: () => ({ colorScheme: 'light', setColorScheme: () => {}, toggleColorScheme: () => {} }),
  vars: () => ({}),
}));

jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (k: string) => store[k] ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => { store[k] = v; }),
    deleteItemAsync: jest.fn(async (k: string) => { delete store[k]; }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store[k] ?? null),
      setItem: jest.fn(async (k: string, v: string) => { store[k] = v; }),
      removeItem: jest.fn(async (k: string) => { delete store[k]; }),
      clear: jest.fn(async () => { Object.keys(store).forEach(k => delete store[k]); }),
    },
  };
});

const mockBetterSqlite3 = require('better-sqlite3');
const mockExpoSqliteDbs: Record<string, ReturnType<typeof mockBetterSqlite3>> = {};
jest.mock('expo-sqlite', () => {
  const makeDb = () => {
    const db = new mockBetterSqlite3(':memory:');
    return {
      execAsync: jest.fn(async (sql: string) => { db.exec(sql); }),
      runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        return { changes: result.changes, lastInsertRowId: Number(result.lastInsertRowid) };
      }),
      getAllAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
        const stmt = db.prepare(sql);
        return params.length > 0 ? stmt.all(...params) : stmt.all();
      }),
      getFirstAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
        const stmt = db.prepare(sql);
        const row = params.length > 0 ? stmt.get(...params) : stmt.get();
        return row ?? null;
      }),
      withTransactionAsync: jest.fn(async (fn: () => Promise<void>) => {
        db.exec('BEGIN');
        try {
          await fn();
          db.exec('COMMIT');
        } catch (e) {
          db.exec('ROLLBACK');
          throw e;
        }
      }),
    };
  };
  return {
    openDatabaseAsync: jest.fn(async (name: string) => (mockExpoSqliteDbs[name] ??= makeDb())),
    deleteDatabaseAsync: jest.fn(async (name: string) => { delete mockExpoSqliteDbs[name]; }),
  };
});

let mockRecorder: any = null;
jest.mock('expo-audio', () => ({
  AudioModule: { requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })) },
  RecordingPresets: { HIGH_QUALITY: {} as any },
  useAudioRecorder: jest.fn((_preset: any) => {
    if (!mockRecorder) {
      mockRecorder = {
        id: crypto.randomUUID(),
        currentTime: 0,
        isRecording: false,
        uri: 'file:///mock/temp/recording.m4a',
        prepareToRecordAsync: jest.fn(async () => {}),
        record: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(async () => { mockRecorder.isRecording = false; }),
        getStatus: jest.fn(() => ({
          canRecord: true,
          isRecording: mockRecorder.isRecording,
          durationMillis: 0,
          mediaServicesDidReset: false,
          metering: -10,
          url: mockRecorder.uri,
        })),
        getAvailableInputs: jest.fn(() => []),
        getCurrentInput: jest.fn(async () => ({ name: 'Default', type: 'Built-in', uid: 'default' })),
        setInput: jest.fn(),
      };
    }
    return mockRecorder;
  }),
  setAudioModeAsync: jest.fn(async () => {}),
  requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getRecordingPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted', expires: 'never', canAskAgain: true })),
  useAudioPlayer: jest.fn(),
  useAudioPlayerStatus: jest.fn(),
  useAudioRecorderState: jest.fn(() => ({ canRecord: true, isRecording: false, durationMillis: 0, mediaServicesDidReset: false, url: null })),
  setIsAudioActiveAsync: jest.fn(async () => {}),
}));

const mockExpoFileSystem = {
  documentDirectory: 'file:///mock/doc/',
  cacheDirectory: 'file:///mock/cache/',
  makeDirectoryAsync: jest.fn(async () => {}),
  moveAsync: jest.fn(async () => {}),
  deleteAsync: jest.fn(async () => {}),
  getInfoAsync: jest.fn(async () => ({ exists: true, isDirectory: false, size: 1024 })),
  writeAsStringAsync: jest.fn(async () => {}),
  readAsStringAsync: jest.fn(async () => ''),
};
jest.mock('expo-file-system', () => mockExpoFileSystem);
jest.mock('expo-file-system/legacy', () => mockExpoFileSystem);

const mockSpeechListeners: Record<string, ((e: any) => void)[]> = {};
jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    start: jest.fn(),
    stop: jest.fn(() => {
      setTimeout(() => mockSpeechListeners.end?.forEach(fn => fn({})), 0);
    }),
    abort: jest.fn(),
  },
  ExpoSpeechRecognitionModuleEmitter: {
    addListener: jest.fn((event: string, fn: (e: any) => void) => {
      mockSpeechListeners[event] = [...(mockSpeechListeners[event] ?? []), fn];
      return { remove: jest.fn() };
    }),
    removeAllListeners: jest.fn(),
  },
  addSpeechRecognitionListener: jest.fn((event: string, fn: (e: any) => void) => {
    mockSpeechListeners[event] = [...(mockSpeechListeners[event] ?? []), fn];
    return { remove: jest.fn() };
  }),
  __mockEmit: (event: string, payload: any) => {
    mockSpeechListeners[event]?.forEach(fn => fn(payload));
  },
}));
