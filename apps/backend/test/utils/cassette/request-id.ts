import nock from 'nock'

/**
 * Makes a taped JSON-RPC call match regardless of the request id it carries.
 *
 * viem numbers its requests from a counter that lives in the module rather
 * than in the test, so the id a call gets depends on how many requests the
 * worker already made. A spec run on its own and the same spec run after
 * another therefore send different bodies for the same exchange, and matching
 * the id verbatim would tie a tape to the order it happened to be recorded in.
 *
 * The id is answered rather than ignored: a JSON-RPC client pairs a response
 * to a request by id, so the reply has to carry the id that was asked, not the
 * one on the tape.
 */
export function ignoringRequestId(
	definition: nock.Definition,
): nock.Definition {
	const taped = definition.body

	if (!isJsonRpcCall(taped)) {
		return definition
	}

	let respondWithId: JsonRpcId = taped.id

	return {
		...definition,

		body: (candidate: unknown) => {
			if (!isJsonRpcCall(candidate) || !sameCall(taped, candidate)) {
				return false
			}

			respondWithId = candidate.id

			return true
		},

		response: withResponseId(definition.response, () => respondWithId),
	}
}

type JsonRpcId = string | number | null

type JsonRpcCall = {
	readonly id: JsonRpcId
	readonly method: string
}

function isJsonRpcCall(candidate: unknown): candidate is JsonRpcCall {
	return (
		typeof candidate === 'object' &&
		candidate !== null &&
		'method' in candidate &&
		'id' in candidate
	)
}

/** The same call, once the id both sides disagree on is set aside. */
function sameCall(taped: JsonRpcCall, candidate: JsonRpcCall): boolean {
	return equalJson(withoutId(taped), withoutId(candidate))
}

function withoutId(call: JsonRpcCall): Record<string, unknown> {
	const { id: _id, ...rest } = { ...call }

	return rest
}

function equalJson(left: unknown, right: unknown): boolean {
	return JSON.stringify(left) === JSON.stringify(right)
}

/**
 * The taped response, restamped with the id the live call asked under.
 *
 * nock takes a function here per request, so the id is read at reply time —
 * after the body matcher above has seen the call it belongs to.
 */
function withResponseId(
	response: nock.Definition['response'],
	idOf: () => JsonRpcId,
) {
	if (!carriesRequestId(response)) {
		return response
	}

	return () => ({ ...response, id: idOf() })
}

/**
 * A reply that answers under an id. Unlike a call it carries no method, so it
 * is recognised by the id alone.
 */
function carriesRequestId(
	candidate: unknown,
): candidate is Record<string, unknown> {
	return (
		typeof candidate === 'object' && candidate !== null && 'id' in candidate
	)
}
