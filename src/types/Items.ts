import { ValueOf } from "./Common";

/**
 * Weapon types that exist in the game
 */
export const WeaponType = {
    PRIMARY: 0,
    SECONDARY: 1,
} as const;

export type TWeaponType = ValueOf<typeof WeaponType>;

/**
 * Item types that exist in the game
 */
export const ItemType = {
    FOOD: 2,
    WALL: 3,
    SPIKE: 4,
    WINDMILL: 5,
    FARM: 6,
    TRAP: 7,
    TURRET: 8,
    SPAWN: 9,
} as const;

export type TItemType = ValueOf<typeof ItemType>;

/**
 * Default weapon ID's
 */
export const EWeapon = {
    TOOL_HAMMER: 0,
    HAND_AXE: 1,
    GREAT_AXE: 2,
    SHORT_SWORD: 3,
    KATANA: 4,
    POLEARM: 5,
    BAT: 6,
    DAGGERS: 7,
    STICK: 8,
    HUNTING_BOW: 9,
    GREAT_HAMMER: 10,
    WOODEN_SHIELD: 11,
    CROSSBOW: 12,
    REPEATER_CROSSBOW: 13,
    MC_GRABBY: 14,
    MUSKET: 15,
} as const;

export type TWeapon = ValueOf<typeof EWeapon>;

export const EItem = {
    APPLE: 0,
    COOKIE: 1,
    CHEESE: 2,
    WOOD_WALL: 3,
    STONE_WALL: 4,
    CASTLE_WALL: 5,
    SPIKES: 6,
    GREATER_SPIKES: 7,
    POISON_SPIKES: 8,
    SPINNING_SPIKES: 9,
    WINDMILL: 10,
    FASTER_WINDMILL: 11,
    POWER_MILL: 12,
    MINE: 13,
    SAPLING: 14,
    PIT_TRAP: 15,
    BOOST_PAD: 16,
    TURRET: 17,
    PLATFORM: 18,
    HEALING_PAD: 19,
    SPAWN_PAD: 20,
    BLOCKER: 21,
    TELEPORTER: 22,
} as const;

export type TItem = ValueOf<typeof EItem>;

// export interface IWeapon {
//     id: TWeapon;
//     itemType: TWeaponType;
//     type?: 1 | 0;
//     name: string;
//     description: string;
//     src: string;
//     age?: number;
//     spdMult?: number;
//     pre?: number;
//     iPad?: number;
//     knock?: number;
//     hitSlow?: number;
//     cost?: {
//         food?: number;
//         wood?: number;
//         stone?: number;
//         gold?: number;
//     }
//     projectile?: number;
//     sDmg?: number;
//     shield?: number;
//     length: number;
//     width: number;
//     xOffset: number;
//     yOffset: number;
//     damage?: number;
//     range?: number;
//     gather?: number;
//     speed?: number;
//     aboveHand?: boolean;
//     armS?: number;
//     steal?: number;
//     rec?: number;
//     hndS?: number;
//     hndD?: number;
//     hideProjectile?: boolean;
// }

// export interface IItem {
//     id: TItem;
//     itemType: TItemType;
//     name: string;
//     description: string;
//     cost: {
//         food?: number;
//         wood?: number;
//         stone?: number;
//         gold?: number;
//     },
//     restore?: number;
//     scale: number;
//     holdOffset: number;
//     age?: number;
//     projDmg?: boolean;
//     health?: number;
//     placeOffset?: number;
//     pre?: number;
//     damage?: number;
//     spritePadding?: number;
//     poisonDamage?: number;
//     turnSpeed?: number;
//     pps?: number;
//     iconLineMult?: number;
//     type?: number;
//     colDiv?: number;
//     trap?: boolean;
//     ignoreCollision?: boolean;
//     doUpdate?: boolean;
//     hideFromEnemy?: boolean;
//     boostSpeed?: number;
//     projectile?: number;
//     zIndex?: number;

//     shootRange?: number;
//     healCol?: number;

//     shootRate?: number;
//     spawnPoint?: boolean;
//     blocker?: number;
//     teleport?: boolean;
// }

export const EWeaponVariant = {
    STONE: 0,
    GOLD: 1,
    DIAMOND: 2,
    RUBY: 3,
} as const;

export type TWeaponVariant = ValueOf<typeof EWeaponVariant>;

// export interface IEWeaponVariant {
//     id: TWeaponVariant;
//     src: string;
//     xp: number;
//     val: number;
//     poison?: boolean;
// }