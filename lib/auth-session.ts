import { ApiError } from './api-error';

export function shouldDeleteTokenAfterRestoreFailure(
  error: unknown
): boolean {
  return (
    error instanceof ApiError &&
    error.status === 401
  );
}
