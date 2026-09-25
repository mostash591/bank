// Simple encryption/decryption for localStorage data
// Uses a combination of base64 encoding and XOR cipher for basic protection

const SECRET_KEY = 'db-tree-2024-secure';

export function encrypt(data: string): string {
  try {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(unescape(encodeURIComponent(result)));
  } catch {
    return data;
  }
}

export function decrypt(data: string): string {
  try {
    const decoded = decodeURIComponent(escape(atob(data)));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return data;
  }
}

export function saveToStorage(key: string, data: unknown): void {
  try {
    const json = JSON.stringify(data);
    const encrypted = encrypt(json);
    localStorage.setItem(key, encrypted);
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

export function loadFromStorage<T>(key: string): T | null {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    const decrypted = decrypt(encrypted);
    return JSON.parse(decrypted) as T;
  } catch (e) {
    console.error('Storage load error:', e);
    return null;
  }
}
