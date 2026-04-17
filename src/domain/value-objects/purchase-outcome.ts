import { PurchaseReceipt } from './purchase-receipt'
import { PendingZap } from './zap'

export type PurchaseOutcome =
	| { type: 'purchased'; purchaseReceipt: PurchaseReceipt }
	| { type: 'zap'; pendingZap: PendingZap }
