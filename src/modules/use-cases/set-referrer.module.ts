import { Module } from '@nestjs/common'
import { SetReferrerService } from '../../application/use-cases/set-referrer/set-referrer.service'
import { SetReferrerUseCase } from '../../application/use-cases/set-referrer/set-referrer.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [{ provide: SetReferrerUseCase, useClass: SetReferrerService }],
	exports: [SetReferrerUseCase],
})
export class SetReferrerModule {}
