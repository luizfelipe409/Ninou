import type AsyncStorage from '@react-native-async-storage/async-storage';
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  /**
   * Firebase exposes this symbol from its React Native runtime condition, but
   * the firebase/auth facade currently points TypeScript at the generic types.
   */
  export function getReactNativePersistence(storage: typeof AsyncStorage): Persistence;
}
