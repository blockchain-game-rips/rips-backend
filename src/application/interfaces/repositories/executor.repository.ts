import { Executor } from '../../../domain/entities/executor'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { KmsKeyId } from '../../../domain/value-objects/kms-key-id'

export abstract class ExecutorRepository {
	abstract getAll(): Promise<Executor[]>
	abstract create(address: EvmAddress, kmsKeyId: KmsKeyId): Promise<Executor>
}
