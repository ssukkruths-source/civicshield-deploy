export function errorHandler(err, req, res, next) {
  console.error('[CivicShield Server Error]:', err.message || err);

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const isDev = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal municipal server error',
    ...(isDev && { stack: err.stack })
  });
}
