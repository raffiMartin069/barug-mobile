/**
 * Development toggles. Use ENV var `DEV_SKIP_SESSION=true` to bypass profile loading in dev.
 * Fallback to __DEV__ for developer convenience.
 */
export const DEV_SKIP_SESSION = (typeof process !== 'undefined' && process.env?.DEV_SKIP_SESSION === 'true') || typeof __DEV__ !== 'undefined' && __DEV__

export default DEV_SKIP_SESSION
