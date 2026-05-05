import { Module } from '@nestjs/common'
import { AdminController } from '../../../presentation/admin/admin.controller'
import { SetPausedModule } from '../../use-cases/set-paused.module'
import { SetReferrerFrozenModule } from '../../use-cases/set-referrer-frozen.module'

@Module({
	imports: [SetPausedModule, SetReferrerFrozenModule],
	controllers: [AdminController],
})
export class AdminApiModule {}
