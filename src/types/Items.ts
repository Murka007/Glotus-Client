import { Items, Weapons } from "../constants/Items";

/**
 * Weapon types that exist in the game
 */
export const enum WeaponType {
    PRIMARY,
    SECONDARY,
}

export const WeaponTypeString = [
    "primary",
    "secondary",
] as const;

export type TWeaponType = typeof WeaponTypeString[number];

/**
 * Item types that exist in the game
 */
export const enum ItemType {
    FOOD = 2,
    WALL,
    SPIKE,
    WINDMILL,
    FARM,
    TRAP,
    TURRET,
    SPAWN,
}

export const enum ItemGroup {
    WALL = 1,
    SPIKE,
    WINDMILL,
    MINE,
    TRAP,
    BOOST,
    TURRET,
    PLATFORM,
    HEAL_PAD,
    SPAWN,
    SAPLING,
    BLOCKER,
    TELEPORTER,
}

/**
 * Default weapon ID's
 */
export const enum EWeapon {
    TOOL_HAMMER,
    HAND_AXE,
    GREAT_AXE,
    SHORT_SWORD,
    KATANA,
    POLEARM,
    BAT,
    DAGGERS,
    STICK,
    HUNTING_BOW,
    GREAT_HAMMER,
    WOODEN_SHIELD,
    CROSSBOW,
    REPEATER_CROSSBOW,
    MC_GRABBY,
    MUSKET,
}

export const enum EItem {
    APPLE,
    COOKIE,
    CHEESE,
    WOOD_WALL,
    STONE_WALL,
    CASTLE_WALL,
    SPIKES,
    GREATER_SPIKES,
    POISON_SPIKES,
    SPINNING_SPIKES,
    WINDMILL,
    FASTER_WINDMILL,
    POWER_MILL,
    MINE,
    SAPLING,
    PIT_TRAP,
    BOOST_PAD,
    TURRET,
    PLATFORM,
    HEALING_PAD,
    SPAWN_PAD,
    BLOCKER,
    TELEPORTER,
}

export const enum WeaponVariant {
    STONE,
    GOLD,
    DIAMOND,
    RUBY,
}

type ExtractWeapon<T> = Extract<typeof Weapons[number], T>["id"];
type ExtractItem<T> = Extract<typeof Items[number], T>["id"];

export type TPrimary = ExtractWeapon<{ itemType: 0 }>;
export type TSecondary = ExtractWeapon<{ itemType: 1 }>;
export type TMelee = ExtractWeapon<{ damage: number }>;
export type TAttackable = ExtractWeapon<{ range: number }>;
export type TShootable = ExtractWeapon<{ projectile: number }>;
export type TPlaceable = ExtractItem<{ itemGroup: number }>;
export type THealable = ExtractItem<{ restore: number }>;
export type TDestroyable = ExtractItem<{ health: number }>;

export type TInventory = {
    [WeaponType.PRIMARY]: TPrimary,
    [WeaponType.SECONDARY]: TSecondary | null,
    [ItemType.FOOD]: ExtractItem<{ itemType: 2 }>,
    [ItemType.WALL]: ExtractItem<{ itemType: 3 }>,
    [ItemType.SPIKE]: ExtractItem<{ itemType: 4 }>,
    [ItemType.WINDMILL]: ExtractItem<{ itemType: 5 }>,
    [ItemType.FARM]: ExtractItem<{ itemType: 6 }> | null,
    [ItemType.TRAP]: ExtractItem<{ itemType: 7 }> | null,
    [ItemType.TURRET]: ExtractItem<{ itemType: 8 }> | null,
    [ItemType.SPAWN]: ExtractItem<{ itemType: 9 }> | null,
}