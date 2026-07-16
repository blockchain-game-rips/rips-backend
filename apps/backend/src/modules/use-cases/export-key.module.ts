import { Module } from '@nestjs/common'
import { ExportKeyService } from '../../application/use-cases/export-key/export-key.service'
import { ExportKeyUseCase } from '../../application/use-cases/export-key/export-key.use-case'
import { EncryptionModule } from '../../infrastructure/encryption/encryption.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [EncryptionModule, PrismaModule],
	providers: [{ provide: ExportKeyUseCase, useClass: ExportKeyService }],
	exports: [ExportKeyUseCase],
})
export class ExportKeyModule {}
