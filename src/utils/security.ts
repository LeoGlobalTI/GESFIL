// Utilidades de seguridad y validación de entradas para GESFIL

/**
 * Limpia el texto ingresado para prevenir inyecciones de código o ataques XSS.
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
 * Valida el formato del nombre de usuario (letras, números, guiones, entre 3 y 30 caracteres).
 */
export const isValidUsername = (username: string): boolean => {
  const regex = /^[a-zA-Z0-9_.-]{3,30}$/;
  return regex.test(username);
};

/**
 * Valida el formato del prefijo del servicio (letras mayúsculas, de 1 a 4 caracteres).
 */
export const isValidPrefix = (prefix: string): boolean => {
  const regex = /^[A-Z]{1,4}$/;
  return regex.test(prefix);
};

/**
 * Valida nombres de módulos y operadores (entre 2 y 50 caracteres limpios).
 */
export const isValidName = (name: string): boolean => {
  if (!name || name.trim().length < 2 || name.trim().length > 50) return false;
  // Bloquear etiquetas script o código HTML sospechoso
  const low = name.toLowerCase();
  if (low.includes('<script') || low.includes('javascript:') || low.includes('onerror=')) {
    return false;
  }
  return true;
};

/**
 * Comparación segura de textos en tiempo constante para evitar ataques de temporización.
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
