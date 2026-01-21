/**
 * Generates a unique identifier for game objects, projects, and other entities
 */

export interface IdOptions {
  prefix?: string;
  length?: number;
  includeTimestamp?: boolean;
}

/**
 * Generate a unique ID with optional prefix and customizable length
 */
const generateId = (options: IdOptions = {}): string => {
  const {
    prefix = '',
    length = 8,
    includeTimestamp = true
  } = options;

  // Generate random string
  const randomString = Math.random()
    .toString(36)
    .substring(2, 2 + length);

  // Add timestamp if requested
  const timestamp = includeTimestamp ? Date.now().toString(36) : '';

  // Combine parts
  const parts = [prefix, timestamp, randomString].filter(Boolean);
  return parts.join('_');
};

/**
 * Generate a UUID v4 (more robust but longer)
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generate a short ID (6 characters, good for display)
 */
export const generateShortId = (): string => {
  return Math.random().toString(36).substring(2, 8);
};

/**
 * Generate an ID for a specific entity type
 */
export const generateEntityId = (entityType: string): string => {
  return generateId({
    prefix: entityType,
    length: 6,
    includeTimestamp: true
  });
};

/**
 * Generate a project ID
 */
export const generateProjectId = (): string => {
  return generateEntityId('project');
};

/**
 * Generate a scene ID
 */
export const generateSceneId = (): string => {
  return generateEntityId('scene');
};

/**
 * Generate a game object ID
 */
export const generateGameObjectId = (objectType: string): string => {
  return generateEntityId(objectType);
};

/**
 * Generate an asset ID
 */
export const generateAssetId = (): string => {
  return generateEntityId('asset');
};

/**
 * Validate if a string is a valid ID format
 */
export const isValidId = (id: string): boolean => {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Check for minimum length
  if (id.length < 3) {
    return false;
  }

  // Check for valid characters (alphanumeric, underscore, hyphen)
  const validIdRegex = /^[a-zA-Z0-9_-]+$/;
  return validIdRegex.test(id);
};

/**
 * Sanitize a string to be used as an ID
 */
export const sanitizeId = (input: string): string => {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

/**
 * Generate a human-readable ID from a name
 */
export const generateReadableId = (name: string, suffix?: string): string => {
  const sanitized = sanitizeId(name);
  const shortId = generateShortId();
  
  const parts = [sanitized, suffix, shortId].filter(Boolean);
  return parts.join('_');
};

export default generateId;