import { Module } from '@nestjs/common'
import { AdminController } from '../../../presentation/admin/admin.controller'
import { SetPausedModule } from '../../use-cases/set-paused.module'

@Module({
	imports: [SetPausedModule],
	controllers: [AdminController],
})
export class AdminApiModule {}
