import * as z from 'zod'

export const HexSchema = z
	.string()
	.refine((s): s is `0x${string}` => s.startsWith('0x'))
