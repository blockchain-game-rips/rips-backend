import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'
import { AdminWalletNotFoundError } from '../../domain/errors/admin-wallet-not-found.error'
import { CurrenciesMismatchError } from '../../domain/errors/currencies-mismatch.error'
import { InsufficientBalanceError } from '../../domain/errors/insufficient-balance.error'
import { AvailableStakeNotFoundError } from '../../domain/errors/stake-not-found.error'
import { StakeTierCountMismatchError } from '../../domain/errors/stake-tier-count-mismatch.error'
import { TransactionFailedError } from '../../domain/errors/transaction-failed.error'
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error'
import { UserNotFoundError } from '../../domain/errors/user-not-found.error'
import { ContextError } from '../../utils/common'

type ErrorConstructor = new (...args: never[]) => ContextError

const ERROR_STATUS_MAP: Map<ErrorConstructor, HttpStatus> = new Map([
	[UserNotFoundError, HttpStatus.NOT_FOUND],
	[AvailableStakeNotFoundError, HttpStatus.NOT_FOUND],
	[UserAlreadyExistsError, HttpStatus.CONFLICT],
	[InsufficientBalanceError, HttpStatus.UNPROCESSABLE_ENTITY],
	[CurrenciesMismatchError, HttpStatus.BAD_REQUEST],
	[TransactionFailedError, HttpStatus.BAD_GATEWAY],
	[AdminWalletNotFoundError, HttpStatus.INTERNAL_SERVER_ERROR],
	[StakeTierCountMismatchError, HttpStatus.BAD_REQUEST],
])

@Catch()
export class UseCaseExceptionFilter implements ExceptionFilter {
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

		response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			message: 'Internal server error',
		})
	}
}
