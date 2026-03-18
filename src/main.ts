import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { UseCaseExceptionFilter } from './presentation/filters/use-case-exception.filter'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	app.useGlobalFilters(new UseCaseExceptionFilter())
	await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
