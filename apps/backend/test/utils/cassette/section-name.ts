/**
 * The key a describe block's interactions live under inside its tape.
 *
 * Taken from vitest's own full name for the suite, which already spells out
 * every block a test is nested in, so nothing here has to walk the tree.
 */
export function sectionNameFrom(suiteFullName: string): string {
	const [, ...blocks] = suiteFullName.split(SUITE_SEPARATOR)

	if (blocks.length === 0) {
		throw new Error(
			'useVcr() must be called inside a describe block: its tape section is named after one.',
		)
	}

	return blocks.join(SUITE_SEPARATOR)
}

// How vitest spells a nested suite in `fullName`, spec path included.
const SUITE_SEPARATOR = ' > '
