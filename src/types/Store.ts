import { ValueOf } from "./Common";

export const EHat = {
    UNEQUIP: 0,
    SHAME: 45,
    MOO_CAP: 51,
    APPLE_CAP: 50,
    MOO_HEAD: 28,
    PIG_HEAD: 29,
    FLUFF_HEAD: 30,
    PANDOU_HEAD: 36,
    BEAR_HEAD: 37,
    MONKEY_HEAD: 38,
    POLAR_HEAD: 44,
    FEZ_HAT: 35,
    ENIGMA_HAT: 42,
    BLITZ_HAT: 43,
    BOB_XIII_HAT: 49,
    PUMPKIN: 57,
    BUMMLE_HAT: 8,
    STRAW_HAT: 2,
    WINTER_CAP: 15,
    COWBOY_HAT: 5,
    RANGER_HAT: 4,
    EXPLORER_HAT: 18,
    FLIPPER_HAT: 31,
    MARKSMAN_CAP: 1,
    BUSH_GEAR: 10,
    HALO: 48,
    SOLDIER_HELMET: 6,
    ANTI_VENOM_GEAR: 23,
    MEDIC_GEAR: 13,
    MINERS_HELMET: 9,
    MUSKETEER_HAT: 32,
    BULL_HELMET: 7,
    EMP_HELMET: 22,
    BOOSTER_HAT: 12,
    BARBARIAN_ARMOR: 26,
    PLAGUE_MASK: 21,
    BULL_MASK: 46,
    WINDMILL_HAT: 14,
    SPIKE_GEAR: 11,
    TURRET_GEAR: 53,
    SAMURAI_ARMOR: 20,
    DARK_KNIGHT: 58,
    SCAVENGER_GEAR: 27,
    TANK_GEAR: 40,
    THIEF_GEAR: 52,
    BLOODTHIRSTER: 55,
    ASSASSIN_GEAR: 56,
} as const;
export type THat = ValueOf<typeof EHat>;

export const EAccessory = {
    UNEQUIP: 0,
    SNOWBALL: 12,
    TREE_CAPE: 9,
    STONE_CAPE: 10,
    COOKIE_CAPE: 3,
    COW_CAPE: 8,
    MONKEY_TAIL: 11,
    APPLE_BASKET: 17,
    WINTER_CAPE: 6,
    SKULL_CAPE: 4,
    DASH_CAPE: 5,
    DRAGON_CAPE: 2,
    SUPER_CAPE: 1,
    TROLL_CAPE: 7,
    THORNS: 14,
    BLOCKADES: 15,
    DEVILS_TAIL: 20,
    SAWBLADE: 16,
    ANGEL_WINGS: 13,
    SHADOW_WINGS: 19,
    BLOOD_WINGS: 18,
    CORRUPT_X_WINGS: 21,
} as const;
export type TAccessory = ValueOf<typeof EAccessory>;

export const enum EStoreAction {
    EQUIP,
    BUY,
}

export const enum EStoreType {
    HAT,
    ACCESSORY,
}

export const EEquipType = {
    ACTUAL: "ACTUAL",
    CURRENT: "CURRENT",
    UTILITY: "UTILITY",
} as const;

/**
 * `ACTUAL` - Equipped by the player himself, using shop or hat hotkeys
 * 
 * `CURRENT` - Equipped automatically by algorithm. Has the highest priority
 * 
 * `UTILITY` - A temporary hat that will be unequipped soon
 */
export type TEquipType = ValueOf<typeof EEquipType>;