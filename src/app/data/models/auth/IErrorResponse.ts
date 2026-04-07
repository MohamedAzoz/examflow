export interface IErrorResponse {
  statusCode: number;
  errorMessage: string;
  errors: string[] | null;
}
