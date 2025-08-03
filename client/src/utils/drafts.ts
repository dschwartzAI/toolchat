// Draft utility functions for handling message drafts in localStorage

/**
 * Clear a draft from localStorage
 */
export const clearDraft = (conversationId: string | null | undefined) => {
  if (conversationId) {
    localStorage.removeItem(`draft-${conversationId}`);
  }
};

/**
 * Encode text to base64
 */
const encodeBase64 = (text: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch (error) {
    console.error('Error encoding to base64:', error);
    return '';
  }
};

/**
 * Decode base64 to text
 */
const decodeBase64 = (base64: string): string => {
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    console.error('Error decoding from base64:', error);
    return '';
  }
};

/**
 * Save a draft to localStorage with base64 encoding
 */
export const setDraft = (conversationId: string | null | undefined, text: string) => {
  if (!conversationId || !text.trim()) {
    return;
  }
  
  try {
    const encoded = encodeBase64(text);
    localStorage.setItem(`draft-${conversationId}`, encoded);
  } catch (error) {
    console.error('Error saving draft:', error);
  }
};

/**
 * Get a draft from localStorage and decode it
 */
export const getDraft = (conversationId: string | null | undefined): string => {
  if (!conversationId) {
    return '';
  }
  
  try {
    const encoded = localStorage.getItem(`draft-${conversationId}`);
    if (!encoded) {
      return '';
    }
    
    // Try to decode as base64 first
    const decoded = decodeBase64(encoded);
    if (decoded) {
      return decoded;
    }
    
    // Fallback to raw value for backwards compatibility
    return encoded;
  } catch (error) {
    console.error('Error retrieving draft:', error);
    return '';
  }
};