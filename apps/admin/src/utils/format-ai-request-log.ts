/**
 * Utility functions for formatting AI request log data
 */

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export function formatPrice(
  price: number | string | null | undefined
): string {
  if (price === null || price === undefined) {
    return '$0.000000';
  }
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) {
    return '$0.000000';
  }
  return `$${numPrice.toFixed(6)}`;
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function formatRequest(
  requestJson: Record<string, unknown>
): string {
  const requestStr = JSON.stringify(requestJson, null, 2);
  return truncateText(requestStr, 100);
}

export function formatResponse(
  responseJson: Record<string, unknown>
): string {
  const responseContent =
    (
      responseJson as {
        choices?: Array<{ message?: { content?: string } }>;
      }
    )?.choices?.[0]?.message?.content || '';
  return truncateText(responseContent, 100);
}

export function formatJson(json: Record<string, unknown>): string {
  return JSON.stringify(json, null, 2);
}
