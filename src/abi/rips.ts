import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    CallbackGasLimitUpdated: event("0x25358b14cd4557629ee75bbccedef47b9c0fe38c159233fb711b4c547692f889", "CallbackGasLimitUpdated(uint32)", {"newLimit": p.uint32}),
    CoordinatorSet: event("0xd1a6a14209a385a964d036e404cb5cfb71f4000cdb03c9366292430787261be6", "CoordinatorSet(address)", {"vrfCoordinator": p.address}),
    FeeRecipientUpdated: event("0x7a7b5a0a132f9e0581eb8527f66eae9ee89c2a3e79d4ac7e41a1f1f4d48a7fc2", "FeeRecipientUpdated(address)", {"newRecipient": p.address}),
    OwnershipTransferRequested: event("0xed8889f560326eb138920d842192f0eb3dd22b4f139c87a2c57538e05bae1278", "OwnershipTransferRequested(address,address)", {"from": indexed(p.address), "to": indexed(p.address)}),
    OwnershipTransferred: event("0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0", "OwnershipTransferred(address,address)", {"from": indexed(p.address), "to": indexed(p.address)}),
    Paused: event("0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258", "Paused(address)", {"account": p.address}),
    PrizesClaimed: event("0x690f8107ef1e5605994d2052a8bbba34645b2e2e21dfc9d34b7bad6a19ea1d53", "PrizesClaimed(uint256,address,address,uint256,uint256)", {"roundId": indexed(p.uint256), "user": indexed(p.address), "referrer": p.address, "ticketCount": p.uint256, "prizeAmount": p.uint256}),
    RandomnessRequested: event("0x3d94fecedaa4f90b8bd459797adb95f5bb11426025c5541390d9ccc1ad1b60a1", "RandomnessRequested(uint256,uint256)", {"roundId": indexed(p.uint256), "vrfRequestId": p.uint256}),
    RefundIssued: event("0x7a482fdeb6bc9a1376f597068a214a7a39472bb2eff1b8cad21ba04f49ddca1b", "RefundIssued(uint256,address,uint256)", {"roundId": indexed(p.uint256), "user": indexed(p.address), "ticketCount": p.uint256}),
    RoundCreated: event("0xe934619c48e1b0b21b662adf6b7c08ad37e6f0d120f40a505503b4fd3bcfec58", "RoundCreated(uint256,uint256)", {"roundId": indexed(p.uint256), "stakeId": indexed(p.uint256)}),
    RoundFinalized: event("0x50175b23949579f5a257c33ccacf5689f481c882821df6a2a9294c7b5c67fc55", "RoundFinalized(uint256,uint256,uint256)", {"roundId": indexed(p.uint256), "randomA": p.uint256, "randomB": p.uint256}),
    StakeCreated: event("0xcb3e2345f6a570dd7e2ea4e558b0f4891ac509659eec8db8f805b23c2376ebbe", "StakeCreated(uint256)", {"stakeId": indexed(p.uint256)}),
    StakeDeleted: event("0xce97243d24406722abc44bd316a8f3a630a3fa4f8178be225d2c224154d022ec", "StakeDeleted(uint256)", {"stakeId": indexed(p.uint256)}),
    StakeUpdated: event("0x6a36d9ae14e63a7e1b6dd689b4ffd4ac78affeeb8c92036819ae062d6f8d940f", "StakeUpdated(uint256)", {"stakeId": indexed(p.uint256)}),
    TicketsPurchased: event("0x830c4a183800e86da29c219cdb1ad8e51a4924fd549d8d2ee32d641c3b4e25a5", "TicketsPurchased(uint256,address,uint256,uint256)", {"roundId": indexed(p.uint256), "user": indexed(p.address), "ticketCount": p.uint256, "startTicketIndex": p.uint256}),
    Unpaused: event("0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa", "Unpaused(address)", {"account": p.address}),
}

export const functions = {
    MAX_TICKETS_PER_RANGE: viewFun("0x13c4bce1", "MAX_TICKETS_PER_RANGE()", {}, p.uint256),
    VRF_NUM_WORDS: viewFun("0x5c900a1a", "VRF_NUM_WORDS()", {}, p.uint32),
    VRF_REQUEST_CONFIRMATIONS: viewFun("0x1e27580e", "VRF_REQUEST_CONFIRMATIONS()", {}, p.uint16),
    acceptOwnership: fun("0x79ba5097", "acceptOwnership()", {}, ),
    buyTickets: fun("0xa792813c", "buyTickets(uint256,uint256,address)", {"stakeId": p.uint256, "ticketCount": p.uint256, "recipient": p.address}, ),
    claimPrizes: fun("0x8c8afe62", "claimPrizes(uint256,uint256,uint256,address,address)", {"roundId": p.uint256, "startIndex": p.uint256, "maxRanges": p.uint256, "recipient": p.address, "referrer": p.address}, ),
    createStake: fun("0x55039261", "createStake(((uint64,uint128,uint128)[],address,uint256,uint256,uint256,uint256))", {"config": p.struct({"prizeDistribution": p.array(p.struct({"prizeCount": p.uint64, "minPrize": p.uint128, "maxPrize": p.uint128})), "currency": p.address, "ticketCap": p.uint256, "duration": p.uint256, "ticketCost": p.uint256, "feePercent": p.uint256})}, p.uint256),
    deleteStake: fun("0xed5e8d7e", "deleteStake(uint256)", {"stakeId": p.uint256}, ),
    feeRecipient: viewFun("0x46904840", "feeRecipient()", {}, p.address),
    getUserTickets: viewFun("0xe7a7f65c", "getUserTickets(uint256,address)", {"roundId": p.uint256, "user": p.address}, p.array(p.struct({"start": p.uint96, "count": p.uint96, "claimed": p.bool}))),
    owner: viewFun("0x8da5cb5b", "owner()", {}, p.address),
    pause: fun("0x8456cb59", "pause()", {}, ),
    paused: viewFun("0x5c975abb", "paused()", {}, p.bool),
    rawFulfillRandomWords: fun("0x1fe543e3", "rawFulfillRandomWords(uint256,uint256[])", {"requestId": p.uint256, "randomWords": p.array(p.uint256)}, ),
    refund: fun("0x7ad226dc", "refund(uint256,address)", {"roundId": p.uint256, "recipient": p.address}, ),
    requestRandomness: fun("0x7363ae1f", "requestRandomness(uint256)", {"roundId": p.uint256}, p.uint256),
    s_vrfCoordinator: viewFun("0x9eccacf6", "s_vrfCoordinator()", {}, p.address),
    setCoordinator: fun("0x8ea98117", "setCoordinator(address)", {"_vrfCoordinator": p.address}, ),
    setFeeRecipient: fun("0xe74b981b", "setFeeRecipient(address)", {"newRecipient": p.address}, ),
    transferOwnership: fun("0xf2fde38b", "transferOwnership(address)", {"to": p.address}, ),
    unpause: fun("0x3f4ba83a", "unpause()", {}, ),
    updateCallbackGasLimit: fun("0xb0e8d086", "updateCallbackGasLimit(uint32)", {"newLimit": p.uint32}, ),
    updateStake: fun("0x6c4ae35f", "updateStake(uint256,((uint64,uint128,uint128)[],address,uint256,uint256,uint256,uint256))", {"stakeId": p.uint256, "config": p.struct({"prizeDistribution": p.array(p.struct({"prizeCount": p.uint64, "minPrize": p.uint128, "maxPrize": p.uint128})), "currency": p.address, "ticketCap": p.uint256, "duration": p.uint256, "ticketCost": p.uint256, "feePercent": p.uint256})}, ),
    vrfKeyHash: viewFun("0x041d443e", "vrfKeyHash()", {}, p.bytes32),
    vrfSubscriptionId: viewFun("0xed647d21", "vrfSubscriptionId()", {}, p.uint256),
}

export class Contract extends ContractBase {

    MAX_TICKETS_PER_RANGE() {
        return this.eth_call(functions.MAX_TICKETS_PER_RANGE, {})
    }

    VRF_NUM_WORDS() {
        return this.eth_call(functions.VRF_NUM_WORDS, {})
    }

    VRF_REQUEST_CONFIRMATIONS() {
        return this.eth_call(functions.VRF_REQUEST_CONFIRMATIONS, {})
    }

    feeRecipient() {
        return this.eth_call(functions.feeRecipient, {})
    }

    getUserTickets(roundId: GetUserTicketsParams["roundId"], user: GetUserTicketsParams["user"]) {
        return this.eth_call(functions.getUserTickets, {roundId, user})
    }

    owner() {
        return this.eth_call(functions.owner, {})
    }

    paused() {
        return this.eth_call(functions.paused, {})
    }

    s_vrfCoordinator() {
        return this.eth_call(functions.s_vrfCoordinator, {})
    }

    vrfKeyHash() {
        return this.eth_call(functions.vrfKeyHash, {})
    }

    vrfSubscriptionId() {
        return this.eth_call(functions.vrfSubscriptionId, {})
    }
}

/// Event types
export type CallbackGasLimitUpdatedEventArgs = EParams<typeof events.CallbackGasLimitUpdated>
export type CoordinatorSetEventArgs = EParams<typeof events.CoordinatorSet>
export type FeeRecipientUpdatedEventArgs = EParams<typeof events.FeeRecipientUpdated>
export type OwnershipTransferRequestedEventArgs = EParams<typeof events.OwnershipTransferRequested>
export type OwnershipTransferredEventArgs = EParams<typeof events.OwnershipTransferred>
export type PausedEventArgs = EParams<typeof events.Paused>
export type PrizesClaimedEventArgs = EParams<typeof events.PrizesClaimed>
export type RandomnessRequestedEventArgs = EParams<typeof events.RandomnessRequested>
export type RefundIssuedEventArgs = EParams<typeof events.RefundIssued>
export type RoundCreatedEventArgs = EParams<typeof events.RoundCreated>
export type RoundFinalizedEventArgs = EParams<typeof events.RoundFinalized>
export type StakeCreatedEventArgs = EParams<typeof events.StakeCreated>
export type StakeDeletedEventArgs = EParams<typeof events.StakeDeleted>
export type StakeUpdatedEventArgs = EParams<typeof events.StakeUpdated>
export type TicketsPurchasedEventArgs = EParams<typeof events.TicketsPurchased>
export type UnpausedEventArgs = EParams<typeof events.Unpaused>

/// Function types
export type MAX_TICKETS_PER_RANGEParams = FunctionArguments<typeof functions.MAX_TICKETS_PER_RANGE>
export type MAX_TICKETS_PER_RANGEReturn = FunctionReturn<typeof functions.MAX_TICKETS_PER_RANGE>

export type VRF_NUM_WORDSParams = FunctionArguments<typeof functions.VRF_NUM_WORDS>
export type VRF_NUM_WORDSReturn = FunctionReturn<typeof functions.VRF_NUM_WORDS>

export type VRF_REQUEST_CONFIRMATIONSParams = FunctionArguments<typeof functions.VRF_REQUEST_CONFIRMATIONS>
export type VRF_REQUEST_CONFIRMATIONSReturn = FunctionReturn<typeof functions.VRF_REQUEST_CONFIRMATIONS>

export type AcceptOwnershipParams = FunctionArguments<typeof functions.acceptOwnership>
export type AcceptOwnershipReturn = FunctionReturn<typeof functions.acceptOwnership>

export type BuyTicketsParams = FunctionArguments<typeof functions.buyTickets>
export type BuyTicketsReturn = FunctionReturn<typeof functions.buyTickets>

export type ClaimPrizesParams = FunctionArguments<typeof functions.claimPrizes>
export type ClaimPrizesReturn = FunctionReturn<typeof functions.claimPrizes>

export type CreateStakeParams = FunctionArguments<typeof functions.createStake>
export type CreateStakeReturn = FunctionReturn<typeof functions.createStake>

export type DeleteStakeParams = FunctionArguments<typeof functions.deleteStake>
export type DeleteStakeReturn = FunctionReturn<typeof functions.deleteStake>

export type FeeRecipientParams = FunctionArguments<typeof functions.feeRecipient>
export type FeeRecipientReturn = FunctionReturn<typeof functions.feeRecipient>

export type GetUserTicketsParams = FunctionArguments<typeof functions.getUserTickets>
export type GetUserTicketsReturn = FunctionReturn<typeof functions.getUserTickets>

export type OwnerParams = FunctionArguments<typeof functions.owner>
export type OwnerReturn = FunctionReturn<typeof functions.owner>

export type PauseParams = FunctionArguments<typeof functions.pause>
export type PauseReturn = FunctionReturn<typeof functions.pause>

export type PausedParams = FunctionArguments<typeof functions.paused>
export type PausedReturn = FunctionReturn<typeof functions.paused>

export type RawFulfillRandomWordsParams = FunctionArguments<typeof functions.rawFulfillRandomWords>
export type RawFulfillRandomWordsReturn = FunctionReturn<typeof functions.rawFulfillRandomWords>

export type RefundParams = FunctionArguments<typeof functions.refund>
export type RefundReturn = FunctionReturn<typeof functions.refund>

export type RequestRandomnessParams = FunctionArguments<typeof functions.requestRandomness>
export type RequestRandomnessReturn = FunctionReturn<typeof functions.requestRandomness>

export type S_vrfCoordinatorParams = FunctionArguments<typeof functions.s_vrfCoordinator>
export type S_vrfCoordinatorReturn = FunctionReturn<typeof functions.s_vrfCoordinator>

export type SetCoordinatorParams = FunctionArguments<typeof functions.setCoordinator>
export type SetCoordinatorReturn = FunctionReturn<typeof functions.setCoordinator>

export type SetFeeRecipientParams = FunctionArguments<typeof functions.setFeeRecipient>
export type SetFeeRecipientReturn = FunctionReturn<typeof functions.setFeeRecipient>

export type TransferOwnershipParams = FunctionArguments<typeof functions.transferOwnership>
export type TransferOwnershipReturn = FunctionReturn<typeof functions.transferOwnership>

export type UnpauseParams = FunctionArguments<typeof functions.unpause>
export type UnpauseReturn = FunctionReturn<typeof functions.unpause>

export type UpdateCallbackGasLimitParams = FunctionArguments<typeof functions.updateCallbackGasLimit>
export type UpdateCallbackGasLimitReturn = FunctionReturn<typeof functions.updateCallbackGasLimit>

export type UpdateStakeParams = FunctionArguments<typeof functions.updateStake>
export type UpdateStakeReturn = FunctionReturn<typeof functions.updateStake>

export type VrfKeyHashParams = FunctionArguments<typeof functions.vrfKeyHash>
export type VrfKeyHashReturn = FunctionReturn<typeof functions.vrfKeyHash>

export type VrfSubscriptionIdParams = FunctionArguments<typeof functions.vrfSubscriptionId>
export type VrfSubscriptionIdReturn = FunctionReturn<typeof functions.vrfSubscriptionId>

