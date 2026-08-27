import nock from 'nock'

/**
 * Rewrites the origins a recording was made against into the stable ones it
 * will be replayed against, so a tape does not depend on the random port a
 * local process happened to bind.
 */
export type ScopeRewrites = ReadonlyMap<string, string>

export function rewriteScope(
	definition: nock.Definition,
	rewrites: ScopeRewrites,
): nock.Definition {
	const scope = String(definition.scope)
	const rewritten = rewrites.get(scope)

	if (rewritten === undefined) {
		return definition
	}

	return { ...definition, scope: withDefaultPort(rewritten) }
}

export function isRewrittenScope(
	definition: nock.Definition,
	rewrites: ScopeRewrites,
): boolean {
	const scope = String(definition.scope)

	return [...rewrites.values()].some(
		(rewritten) => withDefaultPort(rewritten) === scope,
	)
}

// nock records a scope with its port spelled out, so a rewrite target has to
// carry one for the two to compare equal.
const DEFAULT_HTTP_PORT = 80

function withDefaultPort(origin: string): string {
	return `${origin}:${DEFAULT_HTTP_PORT}`
}
