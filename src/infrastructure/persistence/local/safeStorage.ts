// Safe local storage abstraction supporting both browser and server/testing runtimes
class MemoryStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const memoryStore = new MemoryStorage();

export const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryStore.getItem(key);
      }
    }
    return memoryStore.getItem(key);
  },

  setItem(key: string, value: string): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        memoryStore.setItem(key, value);
        return;
      }
    }
    memoryStore.setItem(key, value);
  },

  removeItem(key: string): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        memoryStore.removeItem(key);
        return;
      }
    }
    memoryStore.removeItem(key);
  },

  clear(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.clear();
      } catch {
        // ignore
      }
    }
    memoryStore.clear();
  }
};
