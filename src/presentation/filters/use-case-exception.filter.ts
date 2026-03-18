import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common'
import { UserAlreadyExistsError } from 'src/application/use-cases/create-user/create-user.use-case'
import { UserNotFoundError } from 'src/application/use-cases/get-user/get-user.use-case'
import { ContextError } from 'src/utils/common'
import { Response } from 'express'

type ErrorConstructor = new (...args: never[]) => ContextError

const ERROR_STATUS_MAP: Map<ErrorConstructor, HttpStatus> = new Map([
	[UserNotFoundError, HttpStatus.NOT_FOUND],
	[UserAlreadyExistsError, HttpStatus.CONFLICT],
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
