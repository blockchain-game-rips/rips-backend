import { Executor } from '../../../domain/entities/executor'
import { KmsKeyId } from '../../../domain/value-objects/kms-key-id'

export abstract class ExecutorRepository {
	abstract getAll(): Promise<Executor[]>
	abstract create(address: string, kmsKeyId: KmsKeyId): Promise<Executor>
}
