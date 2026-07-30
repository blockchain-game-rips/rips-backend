import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { AvailablePresetDto } from '../presentation/rips/shared/available-preset.dto'
import { ConfigDto } from '../presentation/rips/shared/config.dto'
import { PayoutDto } from '../presentation/rips/shared/payout.dto'
import { RipDto } from '../presentation/rips/shared/rip.dto'
import { ChainAddressDto } from '../presentation/shared/chain-address.dto'
import { CurrencyAmountDto } from '../presentation/shared/currency-amount.dto'
import { CurrencyDto } from '../presentation/shared/currency.dto'
import { TelegramIdHeaderDto } from '../presentation/shared/telegram-id.header'
import { TransactionDto } from '../presentation/shared/transaction.dto'
import { UserDto } from '../presentation/users/shared/user.dto'

const extraModels = [
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
]

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
	const config = new DocumentBuilder()
		.setTitle('Rips API')
		.setVersion('1.0')
		.setOpenAPIVersion('3.0.0')
		.build()

	const document = SwaggerModule.createDocument(app, config, { extraModels })

	return cleanupOpenApiDoc(document)
}
