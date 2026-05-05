import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { AdminWallet } from '../../../domain/value-objects/wallet'

const adminWalletSchema = z.object({
	kind: z.literal('admin'),
	namespaceToAddress: z.record(z.string(), z.string()),
})

const adminWalletResponseSchema = z.object({
	wallet: adminWalletSchema,
})

export class AdminWalletResponseDto extends createZodDto(
	adminWalletResponseSchema,
) {}

export function toAdminWalletResponseDto(
	wallet: AdminWallet,
): AdminWalletResponseDto {
	return { wallet }
}
