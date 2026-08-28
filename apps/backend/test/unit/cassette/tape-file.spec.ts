import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readSection, writeSection } from '../../utils/cassette/tape-file'

const A_SECTION = 'quoteEnterSamechain with USDC on Base'
const ANOTHER_SECTION = 'enterSamechain with USDC on Base'

const anInteraction = (path: string) => ({
	scope: 'https://li.quest:443',
	method: 'GET',
	path,
})

describe('tape file', () => {
	let dir: string
	let path: string

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'tape-'))
		path = join(dir, 'li-fi.spec.json')
	})

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true })
	})

	it('reads back the section it wrote', () => {
		writeSection(path, A_SECTION, [anInteraction('/one')])

		expect(readSection(path, A_SECTION)).toEqual([anInteraction('/one')])
	})

	// Recording a single test with .only must not cost the other sections.
	it('leaves the sections it did not write alone', () => {
		writeSection(path, A_SECTION, [anInteraction('/one')])
		writeSection(path, ANOTHER_SECTION, [anInteraction('/two')])

		writeSection(path, A_SECTION, [anInteraction('/rerecorded')])

		expect(readSection(path, ANOTHER_SECTION)).toEqual([
			anInteraction('/two'),
		])
		expect(readSection(path, A_SECTION)).toEqual([
			anInteraction('/rerecorded'),
		])
	})

	// A renamed describe leaves its old section behind rather than silently
	// dropping a recording that took real network traffic to make.
	it('keeps a section whose describe is gone', () => {
		writeSection(path, A_SECTION, [anInteraction('/one')])
		writeSection(path, 'renamed', [anInteraction('/two')])

		expect(readSection(path, A_SECTION)).toEqual([anInteraction('/one')])
	})

	it('has no section to offer when the file is absent', () => {
		expect(
			readSection(join(dir, 'missing.json'), A_SECTION),
		).toBeUndefined()
	})

	it('has no section to offer when the file has no such key', () => {
		writeSection(path, A_SECTION, [anInteraction('/one')])

		expect(readSection(path, 'never recorded')).toBeUndefined()
	})

	it('refuses a file that is not a set of sections', () => {
		writeFileSync(path, JSON.stringify([anInteraction('/one')]))

		expect(() => readSection(path, A_SECTION)).toThrow('sections')
	})

	// A committed tape is reviewed by eye and grepped for leaked secrets.
	it('writes json a reviewer can read', () => {
		writeSection(path, A_SECTION, [anInteraction('/one')])

		const written = readFileSync(path, 'utf8')

		expect(written).toContain('\n  ')
		expect(written.endsWith('\n')).toBe(true)
	})
})
