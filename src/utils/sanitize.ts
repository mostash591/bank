// XSS Prevention utilities

export function sanitizeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_');
}

export function validateFile(file: File, allowedTypes: string[], maxSizeMB: number): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `نوع فایل مجاز نیست. انواع مجاز: ${allowedTypes.join(', ')}` };
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `حجم فایل نباید بیشتر از ${maxSizeMB} مگابایت باشد` };
  }
  return { valid: true };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
