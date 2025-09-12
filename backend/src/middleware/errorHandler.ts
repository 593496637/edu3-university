import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = '服务器内部错误';
  let isOperational = false;

  // Handle ApiError
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  }

  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '数据验证失败';
  }

  // Handle duplicate key errors (MySQL)
  else if (error.message.includes('ER_DUP_ENTRY')) {
    statusCode = 409;
    message = '数据已存在';
  }

  // Handle foreign key constraint errors (MySQL)
  else if (error.message.includes('ER_NO_REFERENCED_ROW')) {
    statusCode = 400;
    message = '关联数据不存在';
  }

  // Log error for debugging (only log operational errors in production)
  if (process.env.NODE_ENV === 'development' || !isOperational) {
    console.error('Error:', error);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message
    })
  });
};

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Catch uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  // Application specific logging, throwing an error, or other logic here
  process.exit(1); // Exit the process as it's in an unknown state
});