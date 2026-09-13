import { Module } from '@nestjs/common'
import { GetTermsDocumentService } from '../../application/use-cases/get-terms-document/get-terms-document.service'
import { GetTermsDocumentUseCase } from '../../application/use-cases/get-terms-document/get-terms-document.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [
		{
			provide: GetTermsDocumentUseCase,
			useClass: GetTermsDocumentService,
		},
	],
	exports: [GetTermsDocumentUseCase],
})
export class GetTermsDocumentModule {}
