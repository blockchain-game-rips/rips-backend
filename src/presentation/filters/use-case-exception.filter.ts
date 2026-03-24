import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'
import { InsufficientBalanceError } from 'src/domain/errors/insufficient-balance.error'
import { TicketNotFoundError } from 'src/domain/errors/stake-not-found.error'
import { TransactionFailedError } from 'src/domain/errors/transaction-failed.error'
import { UserAlreadyExistsError } from 'src/domain/errors/user-already-exists.error'
import { UserNotFoundError } from 'src/domain/errors/user-not-found.error'
import { ContextError } from 'src/utils/common'

type ErrorConstructor = new (...args: never[]) => ContextError

const ERROR_STATUS_MAP: Map<ErrorConstructor, HttpStatus> = new Map([
	[UserNotFoundError, HttpStatus.NOT_FOUND],
	[TicketNotFoundError, HttpStatus.NOT_FOUND],
	[UserAlreadyExistsError, HttpStatus.CONFLICT],
	[InsufficientBalanceError, HttpStatus.UNPROCESSABLE_ENTITY],
	[TransactionFailedError, HttpStatus.BAD_GATEWAY],
])

@Catch()
export class UseCaseExceptionFilter implements ExceptionFilter {
	catch(error: unknown, host: ArgumentsHost): void {
		const ctx = host.switchToHttp()
		const response = ctx.getResponse<Response>()

		console.log(error)

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
