import { NestFactory } from '@nestjs/core'
import { SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { ZodValidationPipe } from 'nestjs-zod'
import { AppModule } from './app.module'
import { buildOpenApiDocument } from './openapi/build-openapi-document'
import { UseCaseExceptionFilter } from './presentation/filters/use-case-exception.filter'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bufferLogs: true })

	app.useLogger(app.get(Logger))

	app.useGlobalFilters(new UseCaseExceptionFilter())
	app.useGlobalPipes(new ZodValidationPipe())

	SwaggerModule.setup('api', app, buildOpenApiDocument(app))

	await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
