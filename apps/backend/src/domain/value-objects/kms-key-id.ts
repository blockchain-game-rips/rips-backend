export type KmsKeyId = string & { readonly __brand: 'KmsKeyId' }

export function toKmsKeyId(value: string): KmsKeyId {
	return value as KmsKeyId
}
