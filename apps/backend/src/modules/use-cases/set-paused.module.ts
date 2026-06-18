import { Module } from '@nestjs/common'
import { SetPausedService } from '../../application/use-cases/set-paused/set-paused.service'
import { SetPausedUseCase } from '../../application/use-cases/set-paused/set-paused.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'

@Module({
	imports: [RipsModule, PrismaModule],
	providers: [{ provide: SetPausedUseCase, useClass: SetPausedService }],
	exports: [SetPausedUseCase],
})
export class SetPausedModule {}
