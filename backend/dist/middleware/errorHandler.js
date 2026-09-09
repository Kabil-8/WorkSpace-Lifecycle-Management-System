import { logger } from '../config/logger.js';
export const errorHandler = (err, req, res, next) => {
    logger.error({
        err: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
    }, '[ErrorHandler] Unhandled error');
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};
export const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.url}`,
    });
};
