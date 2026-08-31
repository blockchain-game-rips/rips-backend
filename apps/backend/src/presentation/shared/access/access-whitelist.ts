export const WHITELISTED_PATHS = ['/metrics', '/api']

// Controllers supplied by libraries (not our route handlers) that the access
// model does not annotate; the guard whitelists their paths instead.
export const UNMANAGED_CONTROLLERS = ['PrometheusController']
