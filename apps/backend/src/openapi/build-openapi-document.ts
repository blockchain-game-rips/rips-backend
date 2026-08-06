import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { TelegramIdHeaderDto } from '../presentation/shared/telegram-id.header'

const extraModels = [TelegramIdHeaderDto]

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
	const config = new DocumentBuilder()
		.setTitle('Rips API')
		.setVersion('1.0')
		.setOpenAPIVersion('3.0.0')
		.build()

	const document = SwaggerModule.createDocument(app, config, { extraModels })

	return cleanupOpenApiDoc(document)
}
