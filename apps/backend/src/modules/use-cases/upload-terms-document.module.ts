import { Module } from '@nestjs/common'
import { UploadTermsDocumentService } from '../../application/use-cases/upload-terms-document/upload-terms-document.service'
import { UploadTermsDocumentUseCase } from '../../application/use-cases/upload-terms-document/upload-terms-document.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [
		{
			provide: UploadTermsDocumentUseCase,
			useClass: UploadTermsDocumentService,
		},
	],
	exports: [UploadTermsDocumentUseCase],
})
export class UploadTermsDocumentModule {}
