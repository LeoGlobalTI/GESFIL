// Security & Input Sanitization Utilities for GESFIL

/**
 * Sanitizes text input to prevent XSS and script injection.
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates username format (alphanumeric, underscores, hyphens, 3-30 chars).
 */
export const isValidUsername = (username: string): boolean => {
  const regex = /^[a-zA-Z0-9_.-]{3,30}$/;
  return regex.test(username);
};

/**
 * Validates service prefix format (uppercase letters, 1-4 chars).
 */
export const isValidPrefix = (prefix: string): boolean => {
  const regex = /^[A-Z]{1,4}$/;
  return regex.test(prefix);
};

/**
 * Validates station name and operator name.
 */
export const isValidName = (name: string): boolean => {
  if (!name || name.trim().length < 2 || name.trim().length > 50) return false;
  // Disallow suspicious script tags or HTML injection
  const low = name.toLowerCase();
  if (low.includes('<script') || low.includes('javascript:') || low.includes('onerror=')) {
    return false;
  }
  return true;
};

/**
 * Secure string comparison to prevent timing attacks for local credentials.
 */
export const secureCompare = (a: string, b: string): boolean => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
};
