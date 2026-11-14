/**
 * In-memory localStorage для unit-тестов.
 * jsdom в vitest не предоставляет localStorage (Node 22+ занимает слот
 * глобала experimental-флагом), поэтому сервисы, читающие bare `localStorage`,
 * получают эту заглушку.
 */
export function installMemoryLocalStorage(): void {
  const store = new Map<string, string>();
  const shim: Storage = {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => { store.delete(key); },
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: shim,
    configurable: true,
    writable: true,
  });
}
