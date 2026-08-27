/**
 * External APIs the backend talks to. Shared across every spec: a test never
 * lists hosts itself.
 *
 * Anything not named here is neither recorded nor matched, so the test
 * infrastructure that also speaks HTTP — the Docker API over its unix socket,
 * which Node reports as `localhost:80` — never comes into view. Filtering it
 * out after the fact would mean guessing at an open-ended list of channels.
 *
 * localhost is absent on purpose: Postgres, Docker and supertest live there.
 */
const RECORDED_HOSTS = [
	'li.quest',
	'dln.debridge.finance',
	'api.geckoterminal.com',
	/\.alchemy\.com$/,
]

export function isRecordedHost(host: string): boolean {
	return RECORDED_HOSTS.some((recorded) =>
		typeof recorded === 'string' ? host === recorded : recorded.test(host),
	)
}
