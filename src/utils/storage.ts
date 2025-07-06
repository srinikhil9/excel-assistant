export function setStorageValue(key: string, value: string) {
  Office.context.document.settings.set(key, value);
  Office.context.document.settings.saveAsync();
}

export function getStorageValue(key: string): string | null {
  return Office.context.document.settings.get(key) || null;
} 