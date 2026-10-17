import rateLimit from 'express-rate-limit';

// Rate limiter for citizen report creation to prevent automated spam/flooding
export const reportRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 30, // max 30 incident reports per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many incident submissions from this IP. Please wait 15 minutes before submitting further reports.'
  }
});
