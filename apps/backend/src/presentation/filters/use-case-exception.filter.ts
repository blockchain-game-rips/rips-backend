import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common'
import { Response } from 'express'
import { AdminWalletNotFoundError } from '../../domain/errors/admin-wallet-not-found.error'
import { CurrenciesMismatchError } from '../../domain/errors/currencies-mismatch.error'
import { EligibilityNotFoundError } from '../../domain/errors/eligibility-not-found.error'
import { EligibilityPolicyNotFoundError } from '../../domain/errors/eligibility-policy-not-found.error'
import { InsufficientBalanceError } from '../../domain/errors/insufficient-balance.error'
import { AvailablePresetNotFoundError } from '../../domain/errors/preset-not-found.error'
import { PresetTierCountMismatchError } from '../../domain/errors/preset-tier-count-mismatch.error'
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error'
import { UserNotFoundError } from '../../domain/errors/user-not-found.error'
import { WalletAlreadyExistsError } from '../../domain/errors/wallet-already-exists.error'
import { ContextError } from '../../utils/common'

type ErrorConstructor = new (...args: never[]) => ContextError

const ERROR_STATUS_MAP: Map<ErrorConstructor, HttpStatus> = new Map([
	[UserNotFoundError, HttpStatus.NOT_FOUND],
	[AvailablePresetNotFoundError, HttpStatus.NOT_FOUND],
	[EligibilityNotFoundError, HttpStatus.NOT_FOUND],
	// A missing policy singleton is a broken deployment, not a bad request:
	// initial setup creates it, so its absence means setup never ran.
	[EligibilityPolicyNotFoundError, HttpStatus.INTERNAL_SERVER_ERROR],
	[UserAlreadyExistsError, HttpStatus.CONFLICT],
	[WalletAlreadyExistsError, HttpStatus.CONFLICT],
	[InsufficientBalanceError, HttpStatus.UNPROCESSABLE_ENTITY],
	[CurrenciesMismatchError, HttpStatus.BAD_REQUEST],
	[AdminWalletNotFoundError, HttpStatus.INTERNAL_SERVER_ERROR],
	[PresetTierCountMismatchError, HttpStatus.BAD_REQUEST],
])

@Catch()
export class UseCaseExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(UseCaseExceptionFilter.name)

	catch(error: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()

		if (error instanceof HttpException) {
			response.status(error.getStatus()).json(error.getResponse())
			return
		}

		for (const [ErrorClass, status] of ERROR_STATUS_MAP) {
			if (error instanceof ErrorClass) {
				response.status(status).json({
					statusCode: status,
					message: (error as Error).message,
				})
				return
			}
		}

		this.logger.error({ err: error }, 'Unhandled exception')

		response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			message: 'Internal server error',
		})
	}
}
