import { Config } from '../../../src/domain/entities/config'
import { Rip, RipStatus } from '../../../src/domain/entities/rip'
import {
	availablePresetSchema,
	PresetAvailability,
	toAvailablePresetDto,
} from '../../../src/presentation/rips/shared/available-preset.dto'
import { MOCK_CURRENCY } from '../../fixtures/entities'

const PRESET_ID = 7
const RIP_ID = 99
const ENTRY_CAP = 100
const FEE_BPS = 250
const DURATION_SECONDS = 3600
const ENTRY_PRICE = 5000000000000000n

const CONFIG: Config = {
	id: 1,
	entryCap: ENTRY_CAP,
	feeBps: FEE_BPS,
	entryPrice: { currency: MOCK_CURRENCY, amount: ENTRY_PRICE },
	durationSeconds: DURATION_SECONDS,
	payoutDistribution: [],
}

const FILLING_RIP: Rip & { status: RipStatus.FILLING } = {
	id: RIP_ID,
	preset: { id: PRESET_ID, currentConfig: CONFIG },
	config: CONFIG,
	currency: MOCK_CURRENCY,
	actions: { purchases: [], claims: [], refunds: [] },
	status: RipStatus.FILLING,
	startTime: new Date('2026-05-01T12:00:00.000Z'),
}

describe('toAvailablePresetDto', () => {
	it('tags a preset with a filling rip as live', () => {
		const dto = toAvailablePresetDto({
			preset: { id: PRESET_ID, currentConfig: CONFIG },
			fillingRip: FILLING_RIP,
		})

		expect(dto.availability).toBe(PresetAvailability.LIVE)
		expect(dto.fillingRip).not.toBeNull()
	})

	it('omits the current config when a rip is already filling', () => {
		const dto = toAvailablePresetDto({
			preset: { id: PRESET_ID, currentConfig: CONFIG },
			fillingRip: FILLING_RIP,
		})

		expect(dto.preset).not.toHaveProperty('currentConfig')
	})

	it('tags a preset without a filling rip as ready', () => {
		const dto = toAvailablePresetDto({
			preset: { id: PRESET_ID, currentConfig: CONFIG },
			fillingRip: null,
		})

		expect(dto.availability).toBe(PresetAvailability.READY)
		expect(dto.fillingRip).toBeNull()
	})

	it('carries the current config a ready preset creates its rip from', () => {
		const dto = toAvailablePresetDto({
			preset: { id: PRESET_ID, currentConfig: CONFIG },
			fillingRip: null,
		})

		expect(dto).toMatchObject({
			availability: PresetAvailability.READY,
			preset: { currentConfig: { entryCap: ENTRY_CAP } },
		})
	})

	it.each([
		[PresetAvailability.LIVE, FILLING_RIP],
		[PresetAvailability.READY, null],
	])('produces a %s shape the response schema accepts', (_, fillingRip) => {
		const dto = toAvailablePresetDto({
			preset: { id: PRESET_ID, currentConfig: CONFIG },
			fillingRip,
		})

		expect(availablePresetSchema.safeParse(dto).success).toBe(true)
	})
})

describe('availablePresetSchema', () => {
	it('rejects a live preset that carries no filling rip', () => {
		const result = availablePresetSchema.safeParse({
			availability: PresetAvailability.LIVE,
			preset: { id: PRESET_ID },
			fillingRip: null,
		})

		expect(result.success).toBe(false)
	})

	it('rejects a ready preset that carries a filling rip', () => {
		const result = availablePresetSchema.safeParse({
			availability: PresetAvailability.READY,
			preset: { id: PRESET_ID, currentConfig: CONFIG },
			fillingRip: FILLING_RIP,
		})

		expect(result.success).toBe(false)
	})

	it('rejects a ready preset with no current config to create a rip from', () => {
		const result = availablePresetSchema.safeParse({
			availability: PresetAvailability.READY,
			preset: { id: PRESET_ID },
			fillingRip: null,
		})

		expect(result.success).toBe(false)
	})
})
