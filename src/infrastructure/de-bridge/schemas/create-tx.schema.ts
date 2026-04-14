import * as z from "zod";


export const DetailsSchema = z.object({
    "gasLimit": z.string(),
    "baseFee": z.string(),
    "maxFeePerGas": z.string(),
    "maxPriorityFeePerGas": z.string(),
});
export type Details = z.infer<typeof DetailsSchema>;

export const PayloadSchema = z.object({
    "feeAmount": z.string().optional(),
    "feeBps": z.string().optional(),
    "feeApproximateUsdValue": z.string().optional(),
    "amountOutBeforeCorrection": z.string().optional(),
    "estimatedVolatilityBps": z.string().optional(),
});
export type Payload = z.infer<typeof PayloadSchema>;

export const DstChainTokenOutSchema = z.object({
    "chainId": z.number(),
    "address": z.string(),
    "name": z.string(),
    "symbol": z.string(),
    "decimals": z.number(),
    "amount": z.string(),
    "recommendedAmount": z.string(),
    "maxTheoreticalAmount": z.string(),
    "approximateUsdValue": z.number(),
    "recommendedApproximateUsdValue": z.number(),
    "maxTheoreticalApproximateUsdValue": z.number(),
});
export type DstChainTokenOut = z.infer<typeof DstChainTokenOutSchema>;

export const SrcChainTokenInSchema = z.object({
    "chainId": z.number(),
    "address": z.string(),
    "name": z.string(),
    "symbol": z.string(),
    "decimals": z.number(),
    "amount": z.string(),
    "approximateOperatingExpense": z.string(),
    "mutatedWithOperatingExpense": z.boolean(),
    "approximateUsdValue": z.number(),
    "originApproximateUsdValue": z.number(),
});
export type SrcChainTokenIn = z.infer<typeof SrcChainTokenInSchema>;

export const OrderSchema = z.object({
    "approximateFulfillmentDelay": z.number(),
    "salt": z.number(),
    "metadata": z.string(),
});
export type Order = z.infer<typeof OrderSchema>;

export const TxSchema = z.object({
    "data": z.string(),
    "to": z.string(),
    "value": z.string(),
});
export type Tx = z.infer<typeof TxSchema>;

export const EstimatedTransactionFeeSchema = z.object({
    "total": z.string(),
    "details": DetailsSchema,
});
export type EstimatedTransactionFee = z.infer<typeof EstimatedTransactionFeeSchema>;

export const CostsDetailSchema = z.object({
    "chain": z.string(),
    "tokenIn": z.string(),
    "tokenOut": z.string(),
    "amountIn": z.string(),
    "amountOut": z.string(),
    "type": z.string(),
    "payload": PayloadSchema,
});
export type CostsDetail = z.infer<typeof CostsDetailSchema>;

export const EstimationSchema = z.object({
    "srcChainTokenIn": SrcChainTokenInSchema,
    "dstChainTokenOut": DstChainTokenOutSchema,
    "costsDetails": z.array(CostsDetailSchema),
    "recommendedSlippage": z.number(),
});
export type Estimation = z.infer<typeof EstimationSchema>;

export const CreateTxSchema = z.object({
    "estimation": EstimationSchema,
    "tx": TxSchema,
    "prependedOperatingExpenseCost": z.string(),
    "order": OrderSchema,
    "orderId": z.string(),
    "fixFee": z.string(),
    "protocolFee": z.string(),
    "userPoints": z.number(),
    "integratorPoints": z.number(),
    "estimatedTransactionFee": EstimatedTransactionFeeSchema,
    "protocolFeeApproximateUsdValue": z.number(),
    "usdPriceImpact": z.number(),
});
export type CreateTx = z.infer<typeof CreateTxSchema>;
