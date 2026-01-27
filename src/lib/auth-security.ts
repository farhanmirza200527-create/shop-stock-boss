/**
 * Auth Security Utilities
 * 
 * Provides security features for authentication:
 * - Generic error message mapping to prevent account enumeration
 * - Rate limiting with exponential backoff
 */

// Rate limiting state stored in memory (per session)
interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  lockedUntil: number;
}

const rateLimitStore: Record<string, RateLimitState> = {};

const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,           // Max attempts before lockout
  lockoutDuration: 30000,   // Initial lockout: 30 seconds
  maxLockoutDuration: 300000, // Max lockout: 5 minutes
  windowMs: 60000,          // Reset window: 1 minute
};

/**
 * Sanitizes Supabase Auth error messages to prevent account enumeration
 * Maps detailed error messages to generic ones
 */
export const getGenericAuthMessage = (errorMessage: string, action: 'login' | 'signup'): string => {
  const lowerMessage = errorMessage.toLowerCase();
  
  // Login-specific generic messages
  if (action === 'login') {
    // All credential-related errors get the same message
    if (
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('credentials') ||
      lowerMessage.includes('password') ||
      lowerMessage.includes('email') ||
      lowerMessage.includes('user not found') ||
      lowerMessage.includes('not found')
    ) {
      return 'Invalid email or password';
    }
    
    if (lowerMessage.includes('email not confirmed')) {
      return 'Please check your email to confirm your account';
    }
    
    if (lowerMessage.includes('too many requests') || lowerMessage.includes('rate limit')) {
      return 'Too many attempts. Please try again later';
    }
  }
  
  // Signup-specific generic messages
  if (action === 'signup') {
    // Don't reveal if email exists
    if (
      lowerMessage.includes('already registered') ||
      lowerMessage.includes('already exists') ||
      lowerMessage.includes('user already')
    ) {
      return 'If this email is available, your account will be created. Please check your email.';
    }
    
    // Password validation can be shown (not enumerable)
    if (lowerMessage.includes('password') && lowerMessage.includes('6')) {
      return 'Password must be at least 6 characters';
    }
    
    // Email format can be shown (not enumerable)
    if (lowerMessage.includes('valid email') || lowerMessage.includes('email format')) {
      return 'Please enter a valid email address';
    }
  }
  
  // Generic fallback for any other error
  return action === 'login' 
    ? 'Unable to sign in. Please try again.' 
    : 'Unable to create account. Please try again.';
};

/**
 * Checks if the user is rate limited
 * Returns remaining lockout time in ms, or 0 if not limited
 */
export const checkRateLimit = (key: string): number => {
  const state = rateLimitStore[key];
  const now = Date.now();
  
  if (!state) return 0;
  
  // Check if locked out
  if (state.lockedUntil > now) {
    return state.lockedUntil - now;
  }
  
  // Reset if outside window
  if (now - state.lastAttempt > RATE_LIMIT_CONFIG.windowMs) {
    delete rateLimitStore[key];
    return 0;
  }
  
  return 0;
};

/**
 * Records a failed authentication attempt
 * Returns lockout time if rate limited, 0 otherwise
 */
export const recordFailedAttempt = (key: string): number => {
  const now = Date.now();
  const state = rateLimitStore[key] || { attempts: 0, lastAttempt: now, lockedUntil: 0 };
  
  // Reset if outside window
  if (now - state.lastAttempt > RATE_LIMIT_CONFIG.windowMs) {
    state.attempts = 0;
  }
  
  state.attempts += 1;
  state.lastAttempt = now;
  
  // Apply lockout with exponential backoff
  if (state.attempts >= RATE_LIMIT_CONFIG.maxAttempts) {
    const backoffMultiplier = Math.pow(2, Math.floor(state.attempts / RATE_LIMIT_CONFIG.maxAttempts) - 1);
    const lockoutDuration = Math.min(
      RATE_LIMIT_CONFIG.lockoutDuration * backoffMultiplier,
      RATE_LIMIT_CONFIG.maxLockoutDuration
    );
    state.lockedUntil = now + lockoutDuration;
    rateLimitStore[key] = state;
    return lockoutDuration;
  }
  
  rateLimitStore[key] = state;
  return 0;
};

/**
 * Clears rate limit state after successful authentication
 */
export const clearRateLimit = (key: string): void => {
  delete rateLimitStore[key];
};

/**
 * Gets remaining attempts before lockout
 */
export const getRemainingAttempts = (key: string): number => {
  const state = rateLimitStore[key];
  if (!state) return RATE_LIMIT_CONFIG.maxAttempts;
  return Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - state.attempts);
};

/**
 * Formats lockout time for display
 */
export const formatLockoutTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
};
