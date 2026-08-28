import nock from 'nock'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative } from 'node:path'
import { isDefinition } from './tape'

/**
 * A tape holds one section per describe block, rather than one flat list per
 * file.
 *
 * Sections are what makes `.only` usable: a run records the block it was
 * pointed at and leaves every other section as it found it, so narrowing a run
 * down to one test does not cost the recordings of the rest.
 *
 * Nothing is ever dropped. A section whose describe was renamed keeps sitting
 * in the file, because a recording costs real network traffic to make and
 * guessing that it is dead is not this layer's call.
 */
export type TapeSections = Record<string, nock.Definition[]>

export function readSection(
	path: string,
	section: string,
): nock.Definition[] | undefined {
	if (!existsSync(path)) {
		return undefined
	}

	return readSections(path)[section]
}

export function writeSection(
	path: string,
	section: string,
	interactions: nock.Definition[],
): void {
	const sections = existsSync(path) ? readSections(path) : {}

	mkdirSync(dirname(path), { recursive: true })

	writeFileSync(
		path,
		`${JSON.stringify({ ...sections, [section]: interactions }, null, JSON_INDENT)}\n`,
	)
}

const JSON_INDENT = 2

function readSections(path: string): TapeSections {
	const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))

	if (!isSections(parsed)) {
		throw new Error(
			`Tape ${relative(process.cwd(), path)} is not a set of sections keyed by describe block.`,
		)
	}

	return parsed
}

function isSections(candidate: unknown): candidate is TapeSections {
	return (
		typeof candidate === 'object' &&
		candidate !== null &&
		!Array.isArray(candidate) &&
		Object.values(candidate).every(
			(section) => Array.isArray(section) && section.every(isDefinition),
		)
	)
}
