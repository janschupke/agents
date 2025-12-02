export class SuccessResponseDto {
  success!: boolean;
}

class ErrorResponseDto {
  statusCode!: number;
  timestamp!: string;
  path!: string;
  message!: string | { message: string } | string[];
}
