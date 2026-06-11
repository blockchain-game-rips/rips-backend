import { PricedCurrency } from './priced-currency'

/**
 * Iterative depth-first walk that gathers every PricedCurrency in a response
 * tree. A stack is used instead of recursion to stay safe on deep structures.
 */
export function collectPricedNodes(root: unknown): PricedCurrency[] {
	const found: PricedCurrency[] = []
	const stack: unknown[] = [root]

	const seen = new Set<unknown>()

	while (stack.length > 0) {
		const node = stack.pop()

		if (node === null || typeof node !== 'object') continue

		if (seen.has(node)) continue
		seen.add(node)

		if (node instanceof PricedCurrency) {
			found.push(node)

			continue
		}

		if (Array.isArray(node)) {
			for (const item of node) stack.push(item)

			continue
		}

		for (const value of Object.values(node)) stack.push(value)
	}

	return found
}
