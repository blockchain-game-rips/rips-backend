import { HttpStatus } from '@nestjs/common'
import { HTTP_CODE_METADATA } from '@nestjs/common/constants'
import { RipsController } from '../../../src/presentation/rips/rips.controller'
import { WalletsController } from '../../../src/presentation/wallets/wallets.controller'

/**
 * A transaction outcome is data, not a server failure, so every endpoint that
 * reports one answers 200 rather than the 201 Nest defaults POST to.
 */
describe('transaction outcome endpoints', () => {
	const endpoints: Record<string, (...args: never[]) => Promise<unknown>> = {
		'swap samechain': WalletsController.prototype.swapSamechain,
		'swap crosschain': WalletsController.prototype.swapCrosschain,
		'enter samechain': RipsController.prototype.buyEntriesZapSamechain,
		'enter crosschain': RipsController.prototype.buyEntriesZapCrosschain,
	}

	it.each(Object.entries(endpoints))(
		'answers 200 for %s',
		(_name, handler) => {
			expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(
				HttpStatus.OK,
			)
		},
	)
})
