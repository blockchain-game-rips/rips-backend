import { Module } from '@nestjs/common'
import { AdminController } from '../../../presentation/admin/admin.controller'

@Module({
	imports: [],
	controllers: [AdminController],
})
export class AdminApiModule {}
