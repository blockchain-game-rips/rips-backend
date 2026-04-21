import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { AppModule } from './app.module'
import { UseCaseExceptionFilter } from './presentation/filters/use-case-exception.filter'
import { ConfigDto } from './presentation/rips/rips-schemas'
import {
	ChainAddressDto,
	CurrencyAmountDto,
	CurrencyDto,
	TransactionDto,
} from './presentation/to-plain-schemas'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.useGlobalFilters(new UseCaseExceptionFilter())
	app.useGlobalPipes(new ZodValidationPipe())

	const config = new DocumentBuilder()
		.setTitle('Rips API')
		.setVersion('1.0')
		.setOpenAPIVersion('3.0.0')
		.build()

	const document = SwaggerModule.createDocument(app, config, {
		extraModels: [
			ChainAddressDto,
			CurrencyDto,
			CurrencyAmountDto,
			TransactionDto,
			ConfigDto,
		],
	})
	SwaggerModule.setup('api', app, document)

	await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
