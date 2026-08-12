//      _/\_     _/\_
//  ___/    \___/    \___
// <_o_  human fish (olm) _o_>
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' ||
      ('cause' in error &&
        error.cause instanceof Error &&
        error.cause.name === 'AbortError'))
  )
}
