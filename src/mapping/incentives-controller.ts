import { log } from '@graphprotocol/graph-ts';
import {
  AssetConfigUpdated,
  AssetIndexUpdated,
  RewardsAccrued,
  RewardsClaimed,
  UserIndexUpdated,
} from '../../generated/AaveIncentivesController/AaveIncentivesController';
import {
  ClaimIncentiveCall,
  IncentivizedAction,
  MapAssetPool,
  Reserve,
  UserReserve,
} from '../../generated/schema';
import { getOrInitUser } from '../helpers/initializers';
import { getReserveId } from '../utils/id-generation';

export function handleAssetConfigUpdated(event: AssetConfigUpdated): void {
  let emissionsPerSecond = event.params.emission;
  let asset = event.params.asset; // a / v / s token

  let mapAssetPool = MapAssetPool.load(asset.toHexString());
  if (!mapAssetPool) {
    log.error('Mapping not initiated for asset: {}', [asset.toHexString()]);
    return;
  }
  let pool = mapAssetPool.pool;
  let underlyingAsset = mapAssetPool.underlyingAsset;

  // get reserve
  let reserveId = getReserveId(underlyingAsset, pool.toHexString());
  let reserve = Reserve.load(reserveId);

  if (asset.toHexString() == reserve.aToken) {
    reserve.aEmissionPerSecond = emissionsPerSecond;
    reserve.aIncentivesLastUpdateTimestamp = event.block.timestamp.toI32();
  } else if (asset.toHexString() == reserve.vToken) {
    reserve.vEmissionPerSecond = emissionsPerSecond;
    reserve.vIncentivesLastUpdateTimestamp = event.block.timestamp.toI32();
  } else if (asset.toHexString() == reserve.sToken) {
    reserve.sEmissionPerSecond = emissionsPerSecond;
    reserve.sIncentivesLastUpdateTimestamp = event.block.timestamp.toI32();
  }

  reserve.save();
}

export function handleRewardsAccrued(event: RewardsAccrued): void {
  let userAddress = event.params.user;
  let amount = event.params.amount;
  let incentivesController = event.address;

  let user = getOrInitUser(userAddress);
  user.incentivesRewardsAccrued = user.incentivesRewardsAccrued.plus(amount);
  user.incentivesLastUpdated = event.block.timestamp.toI32();

  let incentivizedAction = new IncentivizedAction(event.transaction.hash.toHexString());
  incentivizedAction.incentivesController = incentivesController.toHexString();
  incentivizedAction.user = userAddress.toHexString();
  incentivizedAction.amount = amount;
  incentivizedAction.save();
}

export function handleRewardsClaimed(event: RewardsClaimed): void {
  let userAddress = event.params.user;
  let amount = event.params.amount;
  let incentivesController = event.address;

  let user = getOrInitUser(userAddress);
  user.incentivesRewardsAccrued = user.incentivesRewardsAccrued.minus(amount);
  user.incentivesLastUpdated = event.block.timestamp.toI32();

  let claimIncentive = new ClaimIncentiveCall(event.transaction.hash.toHexString());
  claimIncentive.incentivesController = incentivesController.toHexString();
  claimIncentive.user = userAddress.toHexString();
  claimIncentive.amount = amount;
  claimIncentive.save();
}

export function handleAssetIndexUpdated(event: AssetIndexUpdated): void {
  let asset = event.params.asset;
  let index = event.params.index;
  let incentiveAssetIndexLastUpdated = event.block.timestamp.toI32();

  let mapAssetPool = MapAssetPool.load(asset.toHexString());
  if (!mapAssetPool) {
    log.error('Mapping not initiated for asset: {}', [asset.toHexString()]);
    return;
  }
  let pool = mapAssetPool.pool;
  let underlyingAsset = mapAssetPool.underlyingAsset;
  // get reserve
  let reserveId = getReserveId(underlyingAsset, pool.toHexString());
  let reserve = Reserve.load(reserveId);

  if (asset.toHexString() == reserve.aToken) {
    reserve.aTokenIncentivesIndex = index;
    reserve.aIncentivesLastUpdateTimestamp = incentiveAssetIndexLastUpdated;
  } else if (asset.toHexString() == reserve.vToken) {
    reserve.vTokenIncentivesIndex = index;
    reserve.vIncentivesLastUpdateTimestamp = incentiveAssetIndexLastUpdated;
  } else if (asset.toHexString() == reserve.sToken) {
    reserve.sTokenIncentivesIndex = index;
    reserve.sIncentivesLastUpdateTimestamp = incentiveAssetIndexLastUpdated;
  }

  reserve.save();
}

export function handleUserIndexUpdated(event: UserIndexUpdated): void {
  let user = event.params.user;
  let asset = event.params.asset;
  let index = event.params.index;
  let incentivesUserIndexLastUpdated = event.block.timestamp.toI32();

  let mapAssetPool = MapAssetPool.load(asset.toHexString());
  if (!mapAssetPool) {
    log.error('Mapping not initiated for asset: {}', [asset.toHexString()]);
    return;
  }
  let pool = mapAssetPool.pool;
  let underlyingAsset = mapAssetPool.underlyingAsset;

  let reserveId = getReserveId(underlyingAsset, pool.toHexString());
  let userReserveId = user.toHexString() + reserveId;
  let userReserve = UserReserve.load(userReserveId);

  let reserve = Reserve.load(reserveId);

  if (asset.toHexString() == reserve.aToken) {
    userReserve.aTokenincentivesUserIndex = index;
    userReserve.aIncentivesLastUpdateTimestamp = incentivesUserIndexLastUpdated;
  } else if (asset.toHexString() == reserve.vToken) {
    userReserve.aTokenincentivesUserIndex = index;
    userReserve.vIncentivesLastUpdateTimestamp = incentivesUserIndexLastUpdated;
  } else if (asset.toHexString() == reserve.sToken) {
    userReserve.aTokenincentivesUserIndex = index;
    userReserve.sIncentivesLastUpdateTimestamp = incentivesUserIndexLastUpdated;
  }

  userReserve.save();
}
