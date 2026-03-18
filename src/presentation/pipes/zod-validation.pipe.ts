import { BadRequestException, PipeTransform } from '@nestjs/common'
import { ZodError, ZodType } from 'zod'

export class ZodValidationPipe<T> implements PipeTransform {
	constructor(private readonly schema: ZodType<T>) {}

	transform(value: unknown): T {
		try {
			return this.schema.parse(value)
		} catch (error) {
			if (error instanceof ZodError)
				throw new BadRequestException(error.issues)

			throw error
		}
	}
}
