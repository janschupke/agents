import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  truncateText,
  formatRequest,
  formatResponse,
  formatJson,
} from './format-ai-request-log';

describe('formatPrice', () => {
  it('should format number price correctly', () => {
    expect(formatPrice(123.456789)).toBe('$123.456789');
    expect(formatPrice(0)).toBe('$0.000000');
    expect(formatPrice(1000.5)).toBe('$1000.500000');
  });

  it('should format string price correctly', () => {
    expect(formatPrice('123.456789')).toBe('$123.456789');
    expect(formatPrice('0')).toBe('$0.000000');
    expect(formatPrice('1000.5')).toBe('$1000.500000');
  });

  it('should return default for null/undefined', () => {
    expect(formatPrice(null)).toBe('$0.000000');
    expect(formatPrice(undefined)).toBe('$0.000000');
  });

  it('should return default for invalid string', () => {
    expect(formatPrice('invalid')).toBe('$0.000000');
    expect(formatPrice('abc123')).toBe('$0.000000');
  });

  it('should handle negative prices', () => {
    expect(formatPrice(-123.456789)).toBe('$-123.456789');
  });
});

describe('truncateText', () => {
  it('should return text unchanged if shorter than maxLength', () => {
    expect(truncateText('short', 10)).toBe('short');
    expect(truncateText('exact', 5)).toBe('exact');
  });

  it('should truncate text longer than maxLength', () => {
    const longText = 'a'.repeat(100);
    expect(truncateText(longText, 50)).toBe('a'.repeat(50) + '...');
  });

  it('should use default maxLength of 100', () => {
    const longText = 'a'.repeat(150);
    expect(truncateText(longText)).toBe('a'.repeat(100) + '...');
  });

  it('should handle empty string', () => {
    expect(truncateText('', 10)).toBe('');
  });

  it('should handle text exactly at maxLength', () => {
    const text = 'a'.repeat(50);
    expect(truncateText(text, 50)).toBe(text);
  });
});

describe('formatRequest', () => {
  it('should format request JSON and truncate if needed', () => {
    const request = {
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'test' }],
    };
    const formatted = formatRequest(request);
    expect(formatted).toContain('model');
    expect(formatted).toContain('gpt-4');
  });

  it('should truncate long request JSON', () => {
    const request = { content: 'a'.repeat(200) };
    const formatted = formatRequest(request);
    expect(formatted.length).toBeLessThanOrEqual(103); // 100 + '...'
    expect(formatted.endsWith('...')).toBe(true);
  });

  it('should handle empty request object', () => {
    const request = {};
    const formatted = formatRequest(request);
    expect(formatted).toBe('{}');
  });
});

describe('formatResponse', () => {
  it('should extract and format response content', () => {
    const response = {
      choices: [
        {
          message: {
            content: 'This is a test response',
          },
        },
      ],
    };
    expect(formatResponse(response)).toBe('This is a test response');
  });

  it('should truncate long response content', () => {
    const response = {
      choices: [
        {
          message: {
            content: 'a'.repeat(150),
          },
        },
      ],
    };
    const formatted = formatResponse(response);
    expect(formatted.length).toBeLessThanOrEqual(103); // 100 + '...'
    expect(formatted.endsWith('...')).toBe(true);
  });

  it('should return empty string for response without content', () => {
    const response = {
      choices: [
        {
          message: {},
        },
      ],
    };
    expect(formatResponse(response)).toBe('');
  });

  it('should return empty string for response without choices', () => {
    const response = {};
    expect(formatResponse(response)).toBe('');
  });

  it('should return empty string for response without message', () => {
    const response = {
      choices: [{}],
    };
    expect(formatResponse(response)).toBe('');
  });
});

describe('formatJson', () => {
  it('should format JSON with proper indentation', () => {
    const data = { key: 'value', number: 123 };
    const formatted = formatJson(data);
    expect(formatted).toContain('"key"');
    expect(formatted).toContain('"value"');
    expect(formatted).toContain('"number"');
    expect(formatted).toContain('123');
  });

  it('should handle nested objects', () => {
    const data = {
      outer: {
        inner: {
          value: 'test',
        },
      },
    };
    const formatted = formatJson(data);
    expect(formatted).toContain('"outer"');
    expect(formatted).toContain('"inner"');
    expect(formatted).toContain('"value"');
  });

  it('should handle arrays', () => {
    const data = { items: [1, 2, 3] };
    const formatted = formatJson(data);
    expect(formatted).toContain('"items"');
    expect(formatted).toContain('1');
    expect(formatted).toContain('2');
    expect(formatted).toContain('3');
  });

  it('should handle empty object', () => {
    const data = {};
    const formatted = formatJson(data);
    expect(formatted).toBe('{}');
  });
});
