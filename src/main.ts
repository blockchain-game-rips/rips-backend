import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod'
import { AppModule } from './app.module'
import { UseCaseExceptionFilter } from './presentation/filters/use-case-exception.filter'
import { ConfigDto } from './presentation/rips/shared/config.dto'
import { RoundDto } from './presentation/rips/shared/round.dto'
import { ChainAddressDto } from './presentation/shared/chain-address.dto'
import { CurrencyAmountDto } from './presentation/shared/currency-amount.dto'
import { CurrencyDto } from './presentation/shared/currency.dto'
import { TelegramIdHeaderDto } from './presentation/shared/telegram-id.header'
import { TransactionDto } from './presentation/shared/transaction.dto'
import { UserDto } from './presentation/users/shared/user.dto'

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
			TelegramIdHeaderDto,
			ConfigDto,
			RoundDto,
			UserDto,
		],
	})

	SwaggerModule.setup('api', app, cleanupOpenApiDoc(document))

	await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
