export type PriceResponseDto = {
	price: number
}

export function toPriceResponseDto(price: number): PriceResponseDto {
	return { price }
}
