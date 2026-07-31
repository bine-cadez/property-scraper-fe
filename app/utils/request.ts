export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' ||
      ('cause' in error &&
        error.cause instanceof Error &&
        error.cause.name === 'AbortError'))
  )
}
