export interface SuccessResponse {
  success: boolean;
}

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | { message: string } | string[];
}
