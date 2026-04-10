import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { GetAvailableStakesModule } from 'src/modules/use-cases/get-available-stakes.module'
import { SeedCardDefinitionsService } from './seed-card-definitions.service'

@Module({
	imports: [GetAvailableStakesModule, PrismaModule],
	providers: [SeedCardDefinitionsService],
	exports: [SeedCardDefinitionsService],
})
export class SeedModule {}
