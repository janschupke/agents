import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from './extract-error-message';

describe('extractErrorMessage', () => {
  it('should return default message for null/undefined error', () => {
    expect(extractErrorMessage(null, 'Default error')).toBe('Default error');
    expect(extractErrorMessage(undefined, 'Default error')).toBe(
      'Default error'
    );
  });

  it('should extract message from Error object', () => {
    const error = new Error('Test error message');
    expect(extractErrorMessage(error, 'Default error')).toBe(
      'Test error message'
    );
  });

  it('should return default message for Error without message', () => {
    const error = new Error();
    expect(extractErrorMessage(error, 'Default error')).toBe('Default error');
  });

  it('should extract message from object with message property', () => {
    const error = { message: 'Object error message' };
    expect(extractErrorMessage(error, 'Default error')).toBe(
      'Object error message'
    );
  });

  it('should handle HTTP 403 error', () => {
    const error = { status: 403 };
    expect(extractErrorMessage(error, 'Default error')).toBe('Access denied');
  });

  it('should handle HTTP 401 error', () => {
    const error = { status: 401 };
    expect(extractErrorMessage(error, 'Default error')).toBe('Unauthorized');
  });

  it('should handle HTTP 404 error', () => {
    const error = { status: 404 };
    expect(extractErrorMessage(error, 'Default error')).toBe('Not found');
  });

  it('should handle HTTP 500+ errors', () => {
    const error500 = { status: 500 };
    const error502 = { status: 502 };
    expect(extractErrorMessage(error500, 'Default error')).toBe('Server error');
    expect(extractErrorMessage(error502, 'Default error')).toBe('Server error');
  });

  it('should extract message from HTTP error object with message', () => {
    const error = { status: 400, message: 'Bad request message' };
    expect(extractErrorMessage(error, 'Default error')).toBe(
      'Bad request message'
    );
  });

  it('should return default message for HTTP error without message', () => {
    const error = { status: 400 };
    expect(extractErrorMessage(error, 'Default error')).toBe('Default error');
  });

  it('should handle string errors', () => {
    const error = 'String error message';
    expect(extractErrorMessage(error, 'Default error')).toBe(
      'String error message'
    );
  });

  it('should return default message for unknown error types', () => {
    const error = { someProperty: 'value' };
    expect(extractErrorMessage(error, 'Default error')).toBe('Default error');
  });

  it('should handle number errors', () => {
    const error = 123;
    expect(extractErrorMessage(error, 'Default error')).toBe('Default error');
  });

  it('should handle boolean errors', () => {
    const error = true;
    expect(extractErrorMessage(error, 'Default error')).toBe('Default error');
  });
});
