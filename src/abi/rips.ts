import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    CallbackGasLimitUpdated: event("0x25358b14cd4557629ee75bbccedef47b9c0fe38c159233fb711b4c547692f889", "CallbackGasLimitUpdated(uint32)", {"newLimit": p.uint32}),
    CoordinatorSet: event("0xd1a6a14209a385a964d036e404cb5cfb71f4000cdb03c9366292430787261be6", "CoordinatorSet(address)", {"vrfCoordinator": p.address}),
    DefaultReferralFeeUpdated: event("0x9836739cc8e3f7428a3a9c5f389af27811d11bd3fb136009ff949514f78efd26", "DefaultReferralFeeUpdated(uint16)", {"newDefaultReferralFee": p.uint16}),
    FeeRecipientUpdated: event("0x7a7b5a0a132f9e0581eb8527f66eae9ee89c2a3e79d4ac7e41a1f1f4d48a7fc2", "FeeRecipientUpdated(address)", {"newRecipient": p.address}),
    Paused: event("0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258", "Paused(address)", {"account": p.address}),
    PrizesClaimed: event("0x7147880f565bbe2512461c98f8d927d5d64fbcdf20fb1ea44f45c186980634e3", "PrizesClaimed(uint256,address,address,uint64,uint256)", {"roundId": indexed(p.uint256), "user": indexed(p.address), "referrer": p.address, "ticketCount": p.uint64, "prizeAmount": p.uint256}),
    ProtocolFeeAccrued: event("0xa7d3ed4c08f0a22ed87b5588418154edb430223dc6ecf5acdf1654acac9fbba3", "ProtocolFeeAccrued(uint256,uint256)", {"roundId": indexed(p.uint256), "amount": p.uint256}),
    ProtocolFeeWithdrawn: event("0x5878feeed994dd9f6c62cda75c4fb2fa60eb14dbe85b3f7e7ac2280b13dc365a", "ProtocolFeeWithdrawn(address,address,uint256)", {"recipient": indexed(p.address), "currency": indexed(p.address), "amount": p.uint256}),
    RandomnessFulfilled: event("0xdc21bacb3b6e5d0ab7b2226e949e874de99019db7967e59ee54cc1e830016cab", "RandomnessFulfilled(uint256,uint256,uint256)", {"roundId": indexed(p.uint256), "randomA": p.uint256, "randomB": p.uint256}),
    RandomnessRequested: event("0x3d94fecedaa4f90b8bd459797adb95f5bb11426025c5541390d9ccc1ad1b60a1", "RandomnessRequested(uint256,uint256)", {"roundId": indexed(p.uint256), "vrfRequestId": p.uint256}),
    ReferralFeeAccrued: event("0xf51b8c95ee5eeea91a2309af8a0da1bcadcee2bcf67057f3e5b51358ff9ab969", "ReferralFeeAccrued(uint256,address,uint256)", {"roundId": indexed(p.uint256), "referrer": indexed(p.address), "amount": p.uint256}),
    ReferralStateUpdated: event("0x34e99ac9d35feaad233071dab6f28dcd4b0f1f24154dc61cf47448ca02eb5b82", "ReferralStateUpdated(address,address,(uint16,uint40,uint256))", {"referrer": indexed(p.address), "currency": indexed(p.address), "referrerState": p.struct({"activeFeePercent": p.uint16, "monthStartTimestamp": p.uint40, "currMonthVolume": p.uint256})}),
    ReferralTiersUpdated: event("0x9b96ddfcd49de588ad7127607f1f4315f622a90286e3de2d88f75120bfb1fef4", "ReferralTiersUpdated(address,(uint128,uint16)[])", {"currency": indexed(p.address), "tiers": p.array(p.struct({"minVolume": p.uint128, "feePercent": p.uint16}))}),
    ReferrerCustomFeeUpdated: event("0x5f07c1ff478deb50de9201ce244d1e19586e055862d0588b8b8a07288cf16248", "ReferrerCustomFeeUpdated(address,uint16)", {"referrer": indexed(p.address), "customFeePercent": p.uint16}),
    ReferrerFeeSeized: event("0xc67df585acf738df3324c58148cccf0e0845dde9c7770a2be7bb3f337a459e19", "ReferrerFeeSeized(address,address,uint256)", {"referrer": indexed(p.address), "currency": indexed(p.address), "amount": p.uint256}),
    ReferrerFeeWithdrawn: event("0x1f1a0569e61e4a8573e34abf057b1d530d895d6e95ed5d28cddb4eff6a32d1d8", "ReferrerFeeWithdrawn(address,address,uint256)", {"referrer": indexed(p.address), "currency": indexed(p.address), "amount": p.uint256}),
    ReferrerFreezeUpdated: event("0xf130e492f9609fb734eeae4b625128bcd3efa572f68bd370f208b38dd581130d", "ReferrerFreezeUpdated(address,bool)", {"referrer": indexed(p.address), "frozen": p.bool}),
    RefundIssued: event("0x041abe2f329a2403772cb6d3650f8fac25d2542bfff84be0089c73dff7289424", "RefundIssued(uint256,address,uint64)", {"roundId": indexed(p.uint256), "user": indexed(p.address), "ticketCount": p.uint64}),
    RoleAdminChanged: event("0xbd79b86ffe0ab8e8776151514217cd7cacd52c909f66475c3af44e129f0b00ff", "RoleAdminChanged(bytes32,bytes32,bytes32)", {"role": indexed(p.bytes32), "previousAdminRole": indexed(p.bytes32), "newAdminRole": indexed(p.bytes32)}),
    RoleGranted: event("0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d", "RoleGranted(bytes32,address,address)", {"role": indexed(p.bytes32), "account": indexed(p.address), "sender": indexed(p.address)}),
    RoleRevoked: event("0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b", "RoleRevoked(bytes32,address,address)", {"role": indexed(p.bytes32), "account": indexed(p.address), "sender": indexed(p.address)}),
    RoundCreated: event("0x1b5721fdc0d91f91701eb33af1162938d948bfac559215c075140aefb67a8314", "RoundCreated(uint256,uint64,uint64)", {"roundId": indexed(p.uint256), "stakeId": indexed(p.uint64), "configId": p.uint64}),
    StakeCreated: event("0xe7b7098505b7d799aba79d4623805fcee199374c466a9b834900db69b326c9e9", "StakeCreated(uint64,uint64)", {"stakeId": indexed(p.uint64), "configId": p.uint64}),
    StakeDeleted: event("0xfb6215d515458f497c7f20ba2b25acb06a5b11b5420f30e2f4e9200340991444", "StakeDeleted(uint64)", {"stakeId": indexed(p.uint64)}),
    StakeUpdated: event("0xa0206dd6f1a8b0e3b6a8ae2f9f03f6ebf6edb14617a7b14724e838532bd3309f", "StakeUpdated(uint64,uint64)", {"stakeId": indexed(p.uint64), "configId": p.uint64}),
    TicketsPurchased: event("0x3b4632349295c42d5e81b4ff0ada5356532e1549e109a08d7948aface5cf6400", "TicketsPurchased(uint256,address,uint64,uint256)", {"roundId": indexed(p.uint256), "user": indexed(p.address), "ticketCount": p.uint64, "startTicketIndex": p.uint256}),
    Unpaused: event("0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa", "Unpaused(address)", {"account": p.address}),
    VrfKeyHashUpdated: event("0x5a0c17938b4505d5f8f0cae0ac3e83cea1440c35e8dd54fe3993ee3772f767f2", "VrfKeyHashUpdated(bytes32)", {"newKeyHash": p.bytes32}),
    VrfRequestConfirmationsUpdated: event("0xf37f403a112b0c927ff6e322d7ca9c0d124cca8fbf7584398b7a1f32f2c24f9a", "VrfRequestConfirmationsUpdated(uint16)", {"newConfirmations": p.uint16}),
    VrfSubscriptionIdUpdated: event("0x8f6e94925304fda0fe752ec2cb17f1581598998f684a5b0e8a654d62ecdb9281", "VrfSubscriptionIdUpdated(uint256)", {"newSubscriptionId": p.uint256}),
}

export const functions = {
    DEFAULT_ADMIN_ROLE: viewFun("0xa217fddf", "DEFAULT_ADMIN_ROLE()", {}, p.bytes32),
    FEE_BASE: viewFun("0xecefc705", "FEE_BASE()", {}, p.uint256),
    MAX_REFERRAL_TIER_COUNT: viewFun("0x74826c8b", "MAX_REFERRAL_TIER_COUNT()", {}, p.uint256),
    MAX_TICKETS_PER_RANGE: viewFun("0x13c4bce1", "MAX_TICKETS_PER_RANGE()", {}, p.uint64),
    MAX_TIER_COUNT: viewFun("0xfa998af2", "MAX_TIER_COUNT()", {}, p.uint256),
    OPERATOR_ROLE: viewFun("0xf5b541a6", "OPERATOR_ROLE()", {}, p.bytes32),
    REFERRAL_PERIOD: viewFun("0xa8207578", "REFERRAL_PERIOD()", {}, p.uint40),
    VRF_COORDINATOR_ROLE: viewFun("0x233e341d", "VRF_COORDINATOR_ROLE()", {}, p.bytes32),
    VRF_NUM_WORDS: viewFun("0x5c900a1a", "VRF_NUM_WORDS()", {}, p.uint32),
    buyTickets: fun("0x4c57c153", "buyTickets(uint64,uint64,address)", {"stakeId": p.uint64, "ticketCount": p.uint64, "recipient": p.address}, ),
    callbackGasLimit: viewFun("0x24f74697", "callbackGasLimit()", {}, p.uint32),
    claimPrizes: fun("0x8c8afe62", "claimPrizes(uint256,uint256,uint256,address,address)", {"roundId": p.uint256, "startIndex": p.uint256, "maxRanges": p.uint256, "recipient": p.address, "referrer": p.address}, ),
    configIdToConfig: viewFun("0xdc661ce2", "configIdToConfig(uint64)", {"configId": p.uint64}, {"currency": p.address, "ticketCap": p.uint64, "duration": p.uint32, "ticketCost": p.uint256, "feePercent": p.uint16}),
    configIdToTierBoundaries: viewFun("0x2528df22", "configIdToTierBoundaries(uint64,uint256)", {"configId": p.uint64, "_1": p.uint256}, p.uint64),
    createStake: fun("0x0b823796", "createStake(((uint64,uint128,uint128)[],address,uint64,uint32,uint256,uint16))", {"config": p.struct({"tiers": p.array(p.struct({"prizeCount": p.uint64, "minPrize": p.uint128, "maxPrize": p.uint128})), "currency": p.address, "ticketCap": p.uint64, "duration": p.uint32, "ticketCost": p.uint256, "feePercent": p.uint16})}, p.uint64),
    defaultReferralFee: viewFun("0x80eaf094", "defaultReferralFee()", {}, p.uint16),
    deleteStake: fun("0x975433a3", "deleteStake(uint64)", {"stakeId": p.uint64}, ),
    feeRecipient: viewFun("0x46904840", "feeRecipient()", {}, p.address),
    getReferralTiers: viewFun("0x10cbb6b5", "getReferralTiers(address)", {"currency": p.address}, p.array(p.struct({"minVolume": p.uint128, "feePercent": p.uint16}))),
    getRoleAdmin: viewFun("0x248a9ca3", "getRoleAdmin(bytes32)", {"role": p.bytes32}, p.bytes32),
    getUserTickets: viewFun("0xe7a7f65c", "getUserTickets(uint256,address)", {"roundId": p.uint256, "user": p.address}, p.array(p.struct({"start": p.uint64, "count": p.uint64, "claimed": p.bool}))),
    grantRole: fun("0x2f2ff15d", "grantRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, ),
    hasRefunded: viewFun("0xc9de59ef", "hasRefunded(uint256,address)", {"roundId": p.uint256, "user": p.address}, p.bool),
    hasRole: viewFun("0x91d14854", "hasRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, p.bool),
    isReferrerFrozen: viewFun("0xc2581e67", "isReferrerFrozen(address)", {"referrer": p.address}, p.bool),
    isStakeDeleted: viewFun("0x6b143438", "isStakeDeleted(uint64)", {"stakeId": p.uint64}, p.bool),
    pause: fun("0x8456cb59", "pause()", {}, ),
    paused: viewFun("0x5c975abb", "paused()", {}, p.bool),
    protocolFeeAccrued: viewFun("0xd0d55129", "protocolFeeAccrued(address)", {"currency": p.address}, p.uint256),
    rawFulfillRandomWords: fun("0x1fe543e3", "rawFulfillRandomWords(uint256,uint256[])", {"requestId": p.uint256, "randomWords": p.array(p.uint256)}, ),
    referrerCustomFee: viewFun("0x36de5bf0", "referrerCustomFee(address)", {"referrer": p.address}, p.uint16),
    referrerFeeAccrued: viewFun("0x334091ab", "referrerFeeAccrued(address,address)", {"referrer": p.address, "currency": p.address}, p.uint256),
    referrerToReferrerState: viewFun("0x87431db1", "referrerToReferrerState(address,address)", {"referrer": p.address, "currency": p.address}, {"activeFeePercent": p.uint16, "monthStartTimestamp": p.uint40, "currMonthVolume": p.uint256}),
    refund: fun("0x7ad226dc", "refund(uint256,address)", {"roundId": p.uint256, "recipient": p.address}, ),
    renounceRole: fun("0x36568abe", "renounceRole(bytes32,address)", {"role": p.bytes32, "callerConfirmation": p.address}, ),
    requestRandomness: fun("0x7363ae1f", "requestRandomness(uint256)", {"roundId": p.uint256}, p.uint256),
    revokeRole: fun("0xd547741f", "revokeRole(bytes32,address)", {"role": p.bytes32, "account": p.address}, ),
    roundIdToRound: viewFun("0x3dad4311", "roundIdToRound(uint256)", {"roundId": p.uint256}, {"stakeId": p.uint64, "configId": p.uint64, "startTime": p.uint40, "ticketsSold": p.uint64, "vrfRequestStatus": p.uint8, "randomA": p.uint64, "randomB": p.uint64}),
    seizeReferrerFee: fun("0xe07b2a64", "seizeReferrerFee(address,address)", {"referrer": p.address, "currency": p.address}, ),
    setCoordinator: fun("0x8ea98117", "setCoordinator(address)", {"newVrfCoordinator": p.address}, ),
    setDefaultReferralFee: fun("0xe4b35fcf", "setDefaultReferralFee(uint16)", {"newDefaultReferralFee": p.uint16}, ),
    setFeeRecipient: fun("0xe74b981b", "setFeeRecipient(address)", {"newRecipient": p.address}, ),
    setReferralTiers: fun("0x2b64e56e", "setReferralTiers(address,(uint128,uint16)[])", {"currency": p.address, "tiers": p.array(p.struct({"minVolume": p.uint128, "feePercent": p.uint16}))}, ),
    setReferrerCustomFee: fun("0x0cd15fc0", "setReferrerCustomFee(address,uint16)", {"referrer": p.address, "customFeePercent": p.uint16}, ),
    setReferrerFrozen: fun("0x53372947", "setReferrerFrozen(address,bool)", {"referrer": p.address, "frozen": p.bool}, ),
    stakeIdToCurrentConfigId: viewFun("0x237373ce", "stakeIdToCurrentConfigId(uint64)", {"stakeId": p.uint64}, p.uint64),
    stakeIdToCurrentRoundId: viewFun("0xe0738d8c", "stakeIdToCurrentRoundId(uint64)", {"stakeId": p.uint64}, p.uint256),
    supportsInterface: viewFun("0x01ffc9a7", "supportsInterface(bytes4)", {"interfaceId": p.bytes4}, p.bool),
    unpause: fun("0x3f4ba83a", "unpause()", {}, ),
    updateCallbackGasLimit: fun("0xb0e8d086", "updateCallbackGasLimit(uint32)", {"newLimit": p.uint32}, ),
    updateStake: fun("0x53067ea7", "updateStake(uint64,((uint64,uint128,uint128)[],address,uint64,uint32,uint256,uint16))", {"stakeId": p.uint64, "config": p.struct({"tiers": p.array(p.struct({"prizeCount": p.uint64, "minPrize": p.uint128, "maxPrize": p.uint128})), "currency": p.address, "ticketCap": p.uint64, "duration": p.uint32, "ticketCost": p.uint256, "feePercent": p.uint16})}, ),
    updateVrfKeyHash: fun("0x98264fa6", "updateVrfKeyHash(bytes32)", {"newKeyHash": p.bytes32}, ),
    updateVrfRequestConfirmations: fun("0xe496d045", "updateVrfRequestConfirmations(uint16)", {"newConfirmations": p.uint16}, ),
    updateVrfSubscriptionId: fun("0x4ac925cb", "updateVrfSubscriptionId(uint256)", {"newSubscriptionId": p.uint256}, ),
    userTicketCount: viewFun("0x2a4f588b", "userTicketCount(uint256,address)", {"roundId": p.uint256, "buyer": p.address}, p.uint64),
    vrfCoordinator: viewFun("0xa3e56fa8", "vrfCoordinator()", {}, p.address),
    vrfKeyHash: viewFun("0x041d443e", "vrfKeyHash()", {}, p.bytes32),
    vrfRequestConfirmations: viewFun("0x598bc486", "vrfRequestConfirmations()", {}, p.uint16),
    vrfSubscriptionId: viewFun("0xed647d21", "vrfSubscriptionId()", {}, p.uint256),
    withdrawProtocolFee: fun("0x668fb6dc", "withdrawProtocolFee(address)", {"currency": p.address}, ),
    withdrawReferrerFee: fun("0x8c11d63e", "withdrawReferrerFee(address,address)", {"referrer": p.address, "currency": p.address}, ),
}

export class Contract extends ContractBase {

    DEFAULT_ADMIN_ROLE() {
        return this.eth_call(functions.DEFAULT_ADMIN_ROLE, {})
    }

    FEE_BASE() {
        return this.eth_call(functions.FEE_BASE, {})
    }

    MAX_REFERRAL_TIER_COUNT() {
        return this.eth_call(functions.MAX_REFERRAL_TIER_COUNT, {})
    }

    MAX_TICKETS_PER_RANGE() {
        return this.eth_call(functions.MAX_TICKETS_PER_RANGE, {})
    }

    MAX_TIER_COUNT() {
        return this.eth_call(functions.MAX_TIER_COUNT, {})
    }

    OPERATOR_ROLE() {
        return this.eth_call(functions.OPERATOR_ROLE, {})
    }

    REFERRAL_PERIOD() {
        return this.eth_call(functions.REFERRAL_PERIOD, {})
    }

    VRF_COORDINATOR_ROLE() {
        return this.eth_call(functions.VRF_COORDINATOR_ROLE, {})
    }

    VRF_NUM_WORDS() {
        return this.eth_call(functions.VRF_NUM_WORDS, {})
    }

    callbackGasLimit() {
        return this.eth_call(functions.callbackGasLimit, {})
    }

    configIdToConfig(configId: ConfigIdToConfigParams["configId"]) {
        return this.eth_call(functions.configIdToConfig, {configId})
    }

    configIdToTierBoundaries(configId: ConfigIdToTierBoundariesParams["configId"], _1: ConfigIdToTierBoundariesParams["_1"]) {
        return this.eth_call(functions.configIdToTierBoundaries, {configId, _1})
    }

    defaultReferralFee() {
        return this.eth_call(functions.defaultReferralFee, {})
    }

    feeRecipient() {
        return this.eth_call(functions.feeRecipient, {})
    }

    getReferralTiers(currency: GetReferralTiersParams["currency"]) {
        return this.eth_call(functions.getReferralTiers, {currency})
    }

    getRoleAdmin(role: GetRoleAdminParams["role"]) {
        return this.eth_call(functions.getRoleAdmin, {role})
    }

    getUserTickets(roundId: GetUserTicketsParams["roundId"], user: GetUserTicketsParams["user"]) {
        return this.eth_call(functions.getUserTickets, {roundId, user})
    }

    hasRefunded(roundId: HasRefundedParams["roundId"], user: HasRefundedParams["user"]) {
        return this.eth_call(functions.hasRefunded, {roundId, user})
    }

    hasRole(role: HasRoleParams["role"], account: HasRoleParams["account"]) {
        return this.eth_call(functions.hasRole, {role, account})
    }

    isReferrerFrozen(referrer: IsReferrerFrozenParams["referrer"]) {
        return this.eth_call(functions.isReferrerFrozen, {referrer})
    }

    isStakeDeleted(stakeId: IsStakeDeletedParams["stakeId"]) {
        return this.eth_call(functions.isStakeDeleted, {stakeId})
    }

    paused() {
        return this.eth_call(functions.paused, {})
    }

    protocolFeeAccrued(currency: ProtocolFeeAccruedParams["currency"]) {
        return this.eth_call(functions.protocolFeeAccrued, {currency})
    }

    referrerCustomFee(referrer: ReferrerCustomFeeParams["referrer"]) {
        return this.eth_call(functions.referrerCustomFee, {referrer})
    }

    referrerFeeAccrued(referrer: ReferrerFeeAccruedParams["referrer"], currency: ReferrerFeeAccruedParams["currency"]) {
        return this.eth_call(functions.referrerFeeAccrued, {referrer, currency})
    }

    referrerToReferrerState(referrer: ReferrerToReferrerStateParams["referrer"], currency: ReferrerToReferrerStateParams["currency"]) {
        return this.eth_call(functions.referrerToReferrerState, {referrer, currency})
    }

    roundIdToRound(roundId: RoundIdToRoundParams["roundId"]) {
        return this.eth_call(functions.roundIdToRound, {roundId})
    }

    stakeIdToCurrentConfigId(stakeId: StakeIdToCurrentConfigIdParams["stakeId"]) {
        return this.eth_call(functions.stakeIdToCurrentConfigId, {stakeId})
    }

    stakeIdToCurrentRoundId(stakeId: StakeIdToCurrentRoundIdParams["stakeId"]) {
        return this.eth_call(functions.stakeIdToCurrentRoundId, {stakeId})
    }

    supportsInterface(interfaceId: SupportsInterfaceParams["interfaceId"]) {
        return this.eth_call(functions.supportsInterface, {interfaceId})
    }

    userTicketCount(roundId: UserTicketCountParams["roundId"], buyer: UserTicketCountParams["buyer"]) {
        return this.eth_call(functions.userTicketCount, {roundId, buyer})
    }

    vrfCoordinator() {
        return this.eth_call(functions.vrfCoordinator, {})
    }

    vrfKeyHash() {
        return this.eth_call(functions.vrfKeyHash, {})
    }

    vrfRequestConfirmations() {
        return this.eth_call(functions.vrfRequestConfirmations, {})
    }

    vrfSubscriptionId() {
        return this.eth_call(functions.vrfSubscriptionId, {})
    }
}

/// Event types
export type CallbackGasLimitUpdatedEventArgs = EParams<typeof events.CallbackGasLimitUpdated>
export type CoordinatorSetEventArgs = EParams<typeof events.CoordinatorSet>
export type DefaultReferralFeeUpdatedEventArgs = EParams<typeof events.DefaultReferralFeeUpdated>
export type FeeRecipientUpdatedEventArgs = EParams<typeof events.FeeRecipientUpdated>
export type PausedEventArgs = EParams<typeof events.Paused>
export type PrizesClaimedEventArgs = EParams<typeof events.PrizesClaimed>
export type ProtocolFeeAccruedEventArgs = EParams<typeof events.ProtocolFeeAccrued>
export type ProtocolFeeWithdrawnEventArgs = EParams<typeof events.ProtocolFeeWithdrawn>
export type RandomnessFulfilledEventArgs = EParams<typeof events.RandomnessFulfilled>
export type RandomnessRequestedEventArgs = EParams<typeof events.RandomnessRequested>
export type ReferralFeeAccruedEventArgs = EParams<typeof events.ReferralFeeAccrued>
export type ReferralStateUpdatedEventArgs = EParams<typeof events.ReferralStateUpdated>
export type ReferralTiersUpdatedEventArgs = EParams<typeof events.ReferralTiersUpdated>
export type ReferrerCustomFeeUpdatedEventArgs = EParams<typeof events.ReferrerCustomFeeUpdated>
export type ReferrerFeeSeizedEventArgs = EParams<typeof events.ReferrerFeeSeized>
export type ReferrerFeeWithdrawnEventArgs = EParams<typeof events.ReferrerFeeWithdrawn>
export type ReferrerFreezeUpdatedEventArgs = EParams<typeof events.ReferrerFreezeUpdated>
export type RefundIssuedEventArgs = EParams<typeof events.RefundIssued>
export type RoleAdminChangedEventArgs = EParams<typeof events.RoleAdminChanged>
export type RoleGrantedEventArgs = EParams<typeof events.RoleGranted>
export type RoleRevokedEventArgs = EParams<typeof events.RoleRevoked>
export type RoundCreatedEventArgs = EParams<typeof events.RoundCreated>
export type StakeCreatedEventArgs = EParams<typeof events.StakeCreated>
export type StakeDeletedEventArgs = EParams<typeof events.StakeDeleted>
export type StakeUpdatedEventArgs = EParams<typeof events.StakeUpdated>
export type TicketsPurchasedEventArgs = EParams<typeof events.TicketsPurchased>
export type UnpausedEventArgs = EParams<typeof events.Unpaused>
export type VrfKeyHashUpdatedEventArgs = EParams<typeof events.VrfKeyHashUpdated>
export type VrfRequestConfirmationsUpdatedEventArgs = EParams<typeof events.VrfRequestConfirmationsUpdated>
export type VrfSubscriptionIdUpdatedEventArgs = EParams<typeof events.VrfSubscriptionIdUpdated>

/// Function types
export type DEFAULT_ADMIN_ROLEParams = FunctionArguments<typeof functions.DEFAULT_ADMIN_ROLE>
export type DEFAULT_ADMIN_ROLEReturn = FunctionReturn<typeof functions.DEFAULT_ADMIN_ROLE>

export type FEE_BASEParams = FunctionArguments<typeof functions.FEE_BASE>
export type FEE_BASEReturn = FunctionReturn<typeof functions.FEE_BASE>

export type MAX_REFERRAL_TIER_COUNTParams = FunctionArguments<typeof functions.MAX_REFERRAL_TIER_COUNT>
export type MAX_REFERRAL_TIER_COUNTReturn = FunctionReturn<typeof functions.MAX_REFERRAL_TIER_COUNT>

export type MAX_TICKETS_PER_RANGEParams = FunctionArguments<typeof functions.MAX_TICKETS_PER_RANGE>
export type MAX_TICKETS_PER_RANGEReturn = FunctionReturn<typeof functions.MAX_TICKETS_PER_RANGE>

export type MAX_TIER_COUNTParams = FunctionArguments<typeof functions.MAX_TIER_COUNT>
export type MAX_TIER_COUNTReturn = FunctionReturn<typeof functions.MAX_TIER_COUNT>

export type OPERATOR_ROLEParams = FunctionArguments<typeof functions.OPERATOR_ROLE>
export type OPERATOR_ROLEReturn = FunctionReturn<typeof functions.OPERATOR_ROLE>

export type REFERRAL_PERIODParams = FunctionArguments<typeof functions.REFERRAL_PERIOD>
export type REFERRAL_PERIODReturn = FunctionReturn<typeof functions.REFERRAL_PERIOD>

export type VRF_COORDINATOR_ROLEParams = FunctionArguments<typeof functions.VRF_COORDINATOR_ROLE>
export type VRF_COORDINATOR_ROLEReturn = FunctionReturn<typeof functions.VRF_COORDINATOR_ROLE>

export type VRF_NUM_WORDSParams = FunctionArguments<typeof functions.VRF_NUM_WORDS>
export type VRF_NUM_WORDSReturn = FunctionReturn<typeof functions.VRF_NUM_WORDS>

export type BuyTicketsParams = FunctionArguments<typeof functions.buyTickets>
export type BuyTicketsReturn = FunctionReturn<typeof functions.buyTickets>

export type CallbackGasLimitParams = FunctionArguments<typeof functions.callbackGasLimit>
export type CallbackGasLimitReturn = FunctionReturn<typeof functions.callbackGasLimit>

export type ClaimPrizesParams = FunctionArguments<typeof functions.claimPrizes>
export type ClaimPrizesReturn = FunctionReturn<typeof functions.claimPrizes>

export type ConfigIdToConfigParams = FunctionArguments<typeof functions.configIdToConfig>
export type ConfigIdToConfigReturn = FunctionReturn<typeof functions.configIdToConfig>

export type ConfigIdToTierBoundariesParams = FunctionArguments<typeof functions.configIdToTierBoundaries>
export type ConfigIdToTierBoundariesReturn = FunctionReturn<typeof functions.configIdToTierBoundaries>

export type CreateStakeParams = FunctionArguments<typeof functions.createStake>
export type CreateStakeReturn = FunctionReturn<typeof functions.createStake>

export type DefaultReferralFeeParams = FunctionArguments<typeof functions.defaultReferralFee>
export type DefaultReferralFeeReturn = FunctionReturn<typeof functions.defaultReferralFee>

export type DeleteStakeParams = FunctionArguments<typeof functions.deleteStake>
export type DeleteStakeReturn = FunctionReturn<typeof functions.deleteStake>

export type FeeRecipientParams = FunctionArguments<typeof functions.feeRecipient>
export type FeeRecipientReturn = FunctionReturn<typeof functions.feeRecipient>

export type GetReferralTiersParams = FunctionArguments<typeof functions.getReferralTiers>
export type GetReferralTiersReturn = FunctionReturn<typeof functions.getReferralTiers>

export type GetRoleAdminParams = FunctionArguments<typeof functions.getRoleAdmin>
export type GetRoleAdminReturn = FunctionReturn<typeof functions.getRoleAdmin>

export type GetUserTicketsParams = FunctionArguments<typeof functions.getUserTickets>
export type GetUserTicketsReturn = FunctionReturn<typeof functions.getUserTickets>

export type GrantRoleParams = FunctionArguments<typeof functions.grantRole>
export type GrantRoleReturn = FunctionReturn<typeof functions.grantRole>

export type HasRefundedParams = FunctionArguments<typeof functions.hasRefunded>
export type HasRefundedReturn = FunctionReturn<typeof functions.hasRefunded>

export type HasRoleParams = FunctionArguments<typeof functions.hasRole>
export type HasRoleReturn = FunctionReturn<typeof functions.hasRole>

export type IsReferrerFrozenParams = FunctionArguments<typeof functions.isReferrerFrozen>
export type IsReferrerFrozenReturn = FunctionReturn<typeof functions.isReferrerFrozen>

export type IsStakeDeletedParams = FunctionArguments<typeof functions.isStakeDeleted>
export type IsStakeDeletedReturn = FunctionReturn<typeof functions.isStakeDeleted>

export type PauseParams = FunctionArguments<typeof functions.pause>
export type PauseReturn = FunctionReturn<typeof functions.pause>

export type PausedParams = FunctionArguments<typeof functions.paused>
export type PausedReturn = FunctionReturn<typeof functions.paused>

export type ProtocolFeeAccruedParams = FunctionArguments<typeof functions.protocolFeeAccrued>
export type ProtocolFeeAccruedReturn = FunctionReturn<typeof functions.protocolFeeAccrued>

export type RawFulfillRandomWordsParams = FunctionArguments<typeof functions.rawFulfillRandomWords>
export type RawFulfillRandomWordsReturn = FunctionReturn<typeof functions.rawFulfillRandomWords>

export type ReferrerCustomFeeParams = FunctionArguments<typeof functions.referrerCustomFee>
export type ReferrerCustomFeeReturn = FunctionReturn<typeof functions.referrerCustomFee>

export type ReferrerFeeAccruedParams = FunctionArguments<typeof functions.referrerFeeAccrued>
export type ReferrerFeeAccruedReturn = FunctionReturn<typeof functions.referrerFeeAccrued>

export type ReferrerToReferrerStateParams = FunctionArguments<typeof functions.referrerToReferrerState>
export type ReferrerToReferrerStateReturn = FunctionReturn<typeof functions.referrerToReferrerState>

export type RefundParams = FunctionArguments<typeof functions.refund>
export type RefundReturn = FunctionReturn<typeof functions.refund>

export type RenounceRoleParams = FunctionArguments<typeof functions.renounceRole>
export type RenounceRoleReturn = FunctionReturn<typeof functions.renounceRole>

export type RequestRandomnessParams = FunctionArguments<typeof functions.requestRandomness>
export type RequestRandomnessReturn = FunctionReturn<typeof functions.requestRandomness>

export type RevokeRoleParams = FunctionArguments<typeof functions.revokeRole>
export type RevokeRoleReturn = FunctionReturn<typeof functions.revokeRole>

export type RoundIdToRoundParams = FunctionArguments<typeof functions.roundIdToRound>
export type RoundIdToRoundReturn = FunctionReturn<typeof functions.roundIdToRound>

export type SeizeReferrerFeeParams = FunctionArguments<typeof functions.seizeReferrerFee>
export type SeizeReferrerFeeReturn = FunctionReturn<typeof functions.seizeReferrerFee>

export type SetCoordinatorParams = FunctionArguments<typeof functions.setCoordinator>
export type SetCoordinatorReturn = FunctionReturn<typeof functions.setCoordinator>

export type SetDefaultReferralFeeParams = FunctionArguments<typeof functions.setDefaultReferralFee>
export type SetDefaultReferralFeeReturn = FunctionReturn<typeof functions.setDefaultReferralFee>

export type SetFeeRecipientParams = FunctionArguments<typeof functions.setFeeRecipient>
export type SetFeeRecipientReturn = FunctionReturn<typeof functions.setFeeRecipient>

export type SetReferralTiersParams = FunctionArguments<typeof functions.setReferralTiers>
export type SetReferralTiersReturn = FunctionReturn<typeof functions.setReferralTiers>

export type SetReferrerCustomFeeParams = FunctionArguments<typeof functions.setReferrerCustomFee>
export type SetReferrerCustomFeeReturn = FunctionReturn<typeof functions.setReferrerCustomFee>

export type SetReferrerFrozenParams = FunctionArguments<typeof functions.setReferrerFrozen>
export type SetReferrerFrozenReturn = FunctionReturn<typeof functions.setReferrerFrozen>

export type StakeIdToCurrentConfigIdParams = FunctionArguments<typeof functions.stakeIdToCurrentConfigId>
export type StakeIdToCurrentConfigIdReturn = FunctionReturn<typeof functions.stakeIdToCurrentConfigId>

export type StakeIdToCurrentRoundIdParams = FunctionArguments<typeof functions.stakeIdToCurrentRoundId>
export type StakeIdToCurrentRoundIdReturn = FunctionReturn<typeof functions.stakeIdToCurrentRoundId>

export type SupportsInterfaceParams = FunctionArguments<typeof functions.supportsInterface>
export type SupportsInterfaceReturn = FunctionReturn<typeof functions.supportsInterface>

export type UnpauseParams = FunctionArguments<typeof functions.unpause>
export type UnpauseReturn = FunctionReturn<typeof functions.unpause>

export type UpdateCallbackGasLimitParams = FunctionArguments<typeof functions.updateCallbackGasLimit>
export type UpdateCallbackGasLimitReturn = FunctionReturn<typeof functions.updateCallbackGasLimit>

export type UpdateStakeParams = FunctionArguments<typeof functions.updateStake>
export type UpdateStakeReturn = FunctionReturn<typeof functions.updateStake>

export type UpdateVrfKeyHashParams = FunctionArguments<typeof functions.updateVrfKeyHash>
export type UpdateVrfKeyHashReturn = FunctionReturn<typeof functions.updateVrfKeyHash>

export type UpdateVrfRequestConfirmationsParams = FunctionArguments<typeof functions.updateVrfRequestConfirmations>
export type UpdateVrfRequestConfirmationsReturn = FunctionReturn<typeof functions.updateVrfRequestConfirmations>

export type UpdateVrfSubscriptionIdParams = FunctionArguments<typeof functions.updateVrfSubscriptionId>
export type UpdateVrfSubscriptionIdReturn = FunctionReturn<typeof functions.updateVrfSubscriptionId>

export type UserTicketCountParams = FunctionArguments<typeof functions.userTicketCount>
export type UserTicketCountReturn = FunctionReturn<typeof functions.userTicketCount>

export type VrfCoordinatorParams = FunctionArguments<typeof functions.vrfCoordinator>
export type VrfCoordinatorReturn = FunctionReturn<typeof functions.vrfCoordinator>

export type VrfKeyHashParams = FunctionArguments<typeof functions.vrfKeyHash>
export type VrfKeyHashReturn = FunctionReturn<typeof functions.vrfKeyHash>

export type VrfRequestConfirmationsParams = FunctionArguments<typeof functions.vrfRequestConfirmations>
export type VrfRequestConfirmationsReturn = FunctionReturn<typeof functions.vrfRequestConfirmations>

export type VrfSubscriptionIdParams = FunctionArguments<typeof functions.vrfSubscriptionId>
export type VrfSubscriptionIdReturn = FunctionReturn<typeof functions.vrfSubscriptionId>

export type WithdrawProtocolFeeParams = FunctionArguments<typeof functions.withdrawProtocolFee>
export type WithdrawProtocolFeeReturn = FunctionReturn<typeof functions.withdrawProtocolFee>

export type WithdrawReferrerFeeParams = FunctionArguments<typeof functions.withdrawReferrerFee>
export type WithdrawReferrerFeeReturn = FunctionReturn<typeof functions.withdrawReferrerFee>

