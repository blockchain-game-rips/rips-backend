import { Controller, UseGuards } from '@nestjs/common'
import { AdminApiKeyGuard } from './admin-api-key.guard'

@Controller('admin')
@UseGuards(AdminApiKeyGuard)
export class AdminController {}
