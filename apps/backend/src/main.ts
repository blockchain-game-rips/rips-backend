import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod'
import { AppModule } from './app.module'
import { UseCaseExceptionFilter } from './presentation/filters/use-case-exception.filter'
import { AvailablePresetDto } from './presentation/rips/shared/available-preset.dto'
import { ConfigDto } from './presentation/rips/shared/config.dto'
import { PayoutDto } from './presentation/rips/shared/payout.dto'
import { RipDto } from './presentation/rips/shared/rip.dto'
import { ChainAddressDto } from './presentation/shared/chain-address.dto'
import { CurrencyAmountDto } from './presentation/shared/currency-amount.dto'
import { CurrencyDto } from './presentation/shared/currency.dto'
import { TelegramIdHeaderDto } from './presentation/shared/telegram-id.header'
import { TransactionDto } from './presentation/shared/transaction.dto'
import { UserDto } from './presentation/users/shared/user.dto'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bufferLogs: true })

	app.useLogger(app.get(Logger))

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
			RipDto,
			AvailablePresetDto,
			UserDto,
			PayoutDto,
		],
	})

	SwaggerModule.setup('api', app, cleanupOpenApiDoc(document))

	await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
