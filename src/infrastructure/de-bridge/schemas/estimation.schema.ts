import { z } from 'zod'

export const estimationResponseSchema = z.object({
	estimation: z.object({
		srcChainTokenIn: z.object({
			amount: z.string(),
		}),
	}),
})
