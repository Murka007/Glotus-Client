import { Items, Weapons } from "../constants/Items";
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

export const ItemGroup = {
    WALL: 1,
    SPIKE: 2,
    WINDMILL: 3,
    MINE: 4,
    TRAP: 5,
    BOOST: 6,
    TURRET: 7,
    PLATFORM: 8,
    HEAL_PAD: 9,
    SPAWN: 10,
    SAPLING: 11,
    BLOCKER: 12,
    TELEPORTER: 13,
} as const;

export type TItemGroup = ValueOf<typeof ItemGroup>;

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

export const EWeaponVariant = {
    STONE: 0,
    GOLD: 1,
    DIAMOND: 2,
    RUBY: 3,
} as const;

export type TWeaponVariant = ValueOf<typeof EWeaponVariant>;

export type TItems = typeof Items;
export type TWeapons = typeof Weapons;

export type ExtractType<
    T extends TWeapons | TItems,
    K extends TWeaponType | TItemType
> = Extract<T[number], { itemType: K }>

export type TWeaponData = {
    [WeaponType.PRIMARY]: ExtractType<TWeapons, 0>["id"],
    [WeaponType.SECONDARY]: ExtractType<TWeapons, 1>["id"] | null,
}

export type TItemData = {
    [ItemType.FOOD]: ExtractType<TItems, 2>["id"],
    [ItemType.WALL]: ExtractType<TItems, 3>["id"],
    [ItemType.SPIKE]: ExtractType<TItems, 4>["id"],
    [ItemType.WINDMILL]: ExtractType<TItems, 5>["id"],
    [ItemType.FARM]: ExtractType<TItems, 6>["id"] | null,
    [ItemType.TRAP]: ExtractType<TItems, 7>["id"] | null,
    [ItemType.TURRET]: ExtractType<TItems, 8>["id"] | null,
    [ItemType.SPAWN]: ExtractType<TItems, 9>["id"] | null,
};

export type TData<T> = T extends TWeaponType ? TWeaponData[T] : T extends TItemType ? TItemData[T] : never;

export type TShootable = Extract<TWeapons[TWeapon], { projectile: number }>["id"];