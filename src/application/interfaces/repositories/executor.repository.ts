import { Executor } from 'src/domain/entities/executor'
import { KmsKeyId } from 'src/domain/value-objects/kms-key-id'

export abstract class ExecutorRepository {
	abstract getAll(): Promise<Executor[]>
	abstract create(address: string, kmsKeyId: KmsKeyId): Promise<Executor>
}
