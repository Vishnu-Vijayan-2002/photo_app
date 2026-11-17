/**
 * AeroShutter Persistent Storage Service
 * Provides permanent key-value persistence across app restarts, reboots, and updates
 * using Android SharedPreferences via NativeStorageModule with graceful in-memory fallback.
 */

import { NativeModules } from 'react-native';

const { NativeStorageModule } = NativeModules;
const memoryStore: Record<string, string> = {};

export class PersistentStorageService {
  private static instance: PersistentStorageService;

  public static getInstance(): PersistentStorageService {
    if (!PersistentStorageService.instance) {
      PersistentStorageService.instance = new PersistentStorageService();
    }
    return PersistentStorageService.instance;
  }

  public async setItem(key: string, value: string): Promise<void> {
    memoryStore[key] = value;
    try {
      if (NativeStorageModule && typeof NativeStorageModule.setItem === 'function') {
        await NativeStorageModule.setItem(key, value);
      }
    } catch (e) {
      // Memory fallback active
    }
  }

  public async getItem(key: string): Promise<string | null> {
    try {
      if (NativeStorageModule && typeof NativeStorageModule.getItem === 'function') {
        const val = await NativeStorageModule.getItem(key);
        if (val !== null && val !== undefined) {
          memoryStore[key] = val;
          return val;
        }
      }
    } catch (e) {
      // Memory fallback active
    }
    return memoryStore[key] ?? null;
  }

  public async removeItem(key: string): Promise<void> {
    delete memoryStore[key];
    try {
      if (NativeStorageModule && typeof NativeStorageModule.removeItem === 'function') {
        await NativeStorageModule.removeItem(key);
      }
    } catch (e) {
      // Memory fallback active
    }
  }

  public async setSecureItem(key: string, value: string): Promise<void> {
    memoryStore[key] = value;
    try {
      if (NativeStorageModule && typeof NativeStorageModule.setSecureItem === 'function') {
        await NativeStorageModule.setSecureItem(key, value);
        return;
      }
      await this.setItem(key, value);
    } catch {
      await this.setItem(key, value);
    }
  }

  public async getSecureItem(key: string): Promise<string | null> {
    try {
      if (NativeStorageModule && typeof NativeStorageModule.getSecureItem === 'function') {
        const val = await NativeStorageModule.getSecureItem(key);
        if (val !== null && val !== undefined) {
          memoryStore[key] = val;
          return val;
        }
      }
      return await this.getItem(key);
    } catch {
      return await this.getItem(key);
    }
  }

  public async removeSecureItem(key: string): Promise<void> {
    delete memoryStore[key];
    try {
      if (NativeStorageModule && typeof NativeStorageModule.removeSecureItem === 'function') {
        await NativeStorageModule.removeSecureItem(key);
      }
      await this.removeItem(key);
    } catch {
      await this.removeItem(key);
    }
  }

  public async clear(): Promise<void> {
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  }
}

export const persistentStorage = PersistentStorageService.getInstance();

