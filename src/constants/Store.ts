import { EProjectile } from "../types/Items";
import { EAccessory, EHat } from "../types/Store";

/**
 * Constant hat data
 */
export const Hats = {
    [EHat.UNEQUIP]: {
        index: 0,
        id: EHat.UNEQUIP,
        name: "Unequip",
        dontSell: true,
        price: 0,
        scale: 0,
        description: "None",
    },
    [EHat.SHAME]: {
        index: 1,
        id: EHat.SHAME,
        name: "Shame!",
        dontSell: true,
        price: 0,
        scale: 120,
        description: "hacks are for losers"
    },
    [EHat.MOO_CAP]: {
        index: 2,
        id: EHat.MOO_CAP,
        name: "Moo Cap",
        price: 0,
        scale: 120,
        description: "coolest mooer around"
    },
    [EHat.APPLE_CAP]: {
        index: 3,
        id: EHat.APPLE_CAP,
        name: "Apple Cap",
        price: 0,
        scale: 120,
        description: "apple farms remembers"
    },
    [EHat.MOO_HEAD]: {
        index: 4,
        id: EHat.MOO_HEAD,
        name: "Moo Head",
        price: 0,
        scale: 120,
        description: "no effect"
    },
    [EHat.PIG_HEAD]: {
        index: 5,
        id: EHat.PIG_HEAD,
        name: "Pig Head",
        price: 0,
        scale: 120,
        description: "no effect"
    },
    [EHat.FLUFF_HEAD]: {
        index: 6,
        id: EHat.FLUFF_HEAD,
        name: "Fluff Head",
        price: 0,
        scale: 120,
        description: "no effect"
    },
    [EHat.PANDOU_HEAD]: {
        index: 7,
        id: EHat.PANDOU_HEAD,
        name: "Pandou Head",
        price: 0,
        scale: 120,
        description: "no effect"
    },
    [EHat.BEAR_HEAD]: {
        index: 8,
        id: EHat.BEAR_HEAD,
        name: "Bear Head",
        price: 0,
        scale: 120,
        description: "no effect"
    },
    [EHat.MONKEY_HEAD]: {
        index: 9,
        id: EHat.MONKEY_HEAD,
        name: "Monkey Head",
        price: 0,
        scale: 120,
        description: "no effect"
    },
    [EHat.POLAR_HEAD]: {
        index: 10,
        id: EHat.POLAR_HEAD,
        name: "Polar Head",
        price: 0,
        scale: 120,
        description: "no effect"
    },
    [EHat.FEZ_HAT]: {
        index: 11,
        id: EHat.FEZ_HAT,
        name: "Fez Hat",
        price: 0,
        scale: 120,
        description: "no effect"
    },
    [EHat.ENIGMA_HAT]: {
        index: 12,
        id: EHat.ENIGMA_HAT,
        name: "Enigma Hat",
        price: 0,
        scale: 120,
        description: "join the enigma army"
    },
    [EHat.BLITZ_HAT]: {
        index: 13,
        id: EHat.BLITZ_HAT,
        name: "Blitz Hat",
        price: 0,
        scale: 120,
        description: "hey everybody i'm blitz"
    },
    [EHat.BOB_XIII_HAT]: {
        index: 14,
        id: EHat.BOB_XIII_HAT,
        name: "Bob XIII Hat",
        price: 0,
        scale: 120,
        description: "like and subscribe"
    },
    [EHat.PUMPKIN]: {
        index: 15,
        id: EHat.PUMPKIN,
        name: "Pumpkin",
        price: 50,
        scale: 120,
        description: "Spooooky"
    },
    [EHat.BUMMLE_HAT]: {
        index: 16,
        id: EHat.BUMMLE_HAT,
        name: "Bummle Hat",
        price: 100,
        scale: 120,
        description: "no effect"
    },
    [EHat.STRAW_HAT]: {
        index: 17,
        id: EHat.STRAW_HAT,
        name: "Straw Hat",
        price: 500,
        scale: 120,
        description: "no effect"
    },
    [EHat.WINTER_CAP]: {
        index: 18,
        id: EHat.WINTER_CAP,
        name: "Winter Cap",
        price: 600,
        scale: 120,
        description: "allows you to move at normal speed in snow",
        coldM: 1
    },
    [EHat.COWBOY_HAT]: {
        index: 19,
        id: EHat.COWBOY_HAT,
        name: "Cowboy Hat",
        price: 1000,
        scale: 120,
        description: "no effect"
    },
    [EHat.RANGER_HAT]: {
        index: 20,
        id: EHat.RANGER_HAT,
        name: "Ranger Hat",
        price: 2000,
        scale: 120,
        description: "no effect"
    },
    [EHat.EXPLORER_HAT]: {
        index: 21,
        id: EHat.EXPLORER_HAT,
        name: "Explorer Hat",
        price: 2000,
        scale: 120,
        description: "no effect"
    },
    [EHat.FLIPPER_HAT]: {
        index: 22,
        id: EHat.FLIPPER_HAT,
        name: "Flipper Hat",
        price: 2500,
        scale: 120,
        description: "have more control while in water",
        watrImm: true
    },
    [EHat.MARKSMAN_CAP]: {
        index: 23,
        id: EHat.MARKSMAN_CAP,
        name: "Marksman Cap",
        price: 3000,
        scale: 120,
        description: "increases arrow speed and range",
        aMlt: 1.3
    },
    [EHat.BUSH_GEAR]: {
        index: 24,
        id: EHat.BUSH_GEAR,
        name: "Bush Gear",
        price: 3000,
        scale: 160,
        description: "allows you to disguise yourself as a bush"
    },
    [EHat.HALO]: {
        index: 25,
        id: EHat.HALO,
        name: "Halo",
        price: 3000,
        scale: 120,
        description: "no effect"
    },
    [EHat.SOLDIER_HELMET]: {
        index: 26,
        id: EHat.SOLDIER_HELMET,
        name: "Soldier Helmet",
        price: 4000,
        scale: 120,
        description: "reduces damage taken but slows movement",
        spdMult: 0.94,
        dmgMult: 0.75
    },
    [EHat.ANTI_VENOM_GEAR]: {
        index: 27,
        id: EHat.ANTI_VENOM_GEAR,
        name: "Anti Venom Gear",
        price: 4000,
        scale: 120,
        description: "makes you immune to poison",
        poisonRes: 1
    },
    [EHat.MEDIC_GEAR]: {
        index: 28,
        id: EHat.MEDIC_GEAR,
        name: "Medic Gear",
        price: 5000,
        scale: 110,
        description: "slowly regenerates health over time",
        healthRegen: 3
    },
    [EHat.MINERS_HELMET]: {
        index: 29,
        id: EHat.MINERS_HELMET,
        name: "Miners Helmet",
        price: 5000,
        scale: 120,
        description: "earn 1 extra gold per resource",
        extraGold: 1
    },
    [EHat.MUSKETEER_HAT]: {
        index: 30,
        id: EHat.MUSKETEER_HAT,
        name: "Musketeer Hat",
        price: 5000,
        scale: 120,
        description: "reduces cost of projectiles",
        projCost: 0.5
    },
    [EHat.BULL_HELMET]: {
        index: 31,
        id: EHat.BULL_HELMET,
        name: "Bull Helmet",
        price: 6000,
        scale: 120,
        description: "increases damage done but drains health",
        healthRegen: -5,
        dmgMultO: 1.5,
        spdMult: 0.96
    },
    [EHat.EMP_HELMET]: {
        index: 32,
        id: EHat.EMP_HELMET,
        name: "Emp Helmet",
        price: 6000,
        scale: 120,
        description: "turrets won't attack but you move slower",
        antiTurret: 1,
        spdMult: 0.7
    },
    [EHat.BOOSTER_HAT]: {
        index: 33,
        id: EHat.BOOSTER_HAT,
        name: "Booster Hat",
        price: 6000,
        scale: 120,
        description: "increases your movement speed",
        spdMult: 1.16
    },
    [EHat.BARBARIAN_ARMOR]: {
        index: 34,
        id: EHat.BARBARIAN_ARMOR,
        name: "Barbarian Armor",
        price: 8000,
        scale: 120,
        description: "knocks back enemies that attack you",
        dmgK: 0.6
    },
    [EHat.PLAGUE_MASK]: {
        index: 35,
        id: EHat.PLAGUE_MASK,
        name: "Plague Mask",
        price: 10000,
        scale: 120,
        description: "melee attacks deal poison damage",
        poisonDmg: 5,
        poisonTime: 6
    },
    [EHat.BULL_MASK]: {
        index: 36,
        id: EHat.BULL_MASK,
        name: "Bull Mask",
        price: 10000,
        scale: 120,
        description: "bulls won't target you unless you attack them",
        bullRepel: 1
    },
    [EHat.WINDMILL_HAT]: {
        index: 37,
        id: EHat.WINDMILL_HAT,
        name: "Windmill Hat",
        topSprite: true,
        price: 10000,
        scale: 120,
        description: "generates points while worn",
        pps: 1.5
    },
    [EHat.SPIKE_GEAR]: {
        index: 38,
        id: EHat.SPIKE_GEAR,
        name: "Spike Gear",
        topSprite: true,
        price: 10000,
        scale: 120,
        description: "deal damage to players that damage you",
        dmg: 0.45
    },
    [EHat.TURRET_GEAR]: {
        index: 39,
        id: EHat.TURRET_GEAR,
        name: "Turret Gear",
        topSprite: true,
        price: 10000,
        scale: 120,
        description: "you become a walking turret",
        turret: {
            projectile: EProjectile.TURRET,
            range: 700,
            rate: 2500
        },
        spdMult: 0.7
    },
    [EHat.SAMURAI_ARMOR]: {
        index: 40,
        id: EHat.SAMURAI_ARMOR,
        name: "Samurai Armor",
        price: 12000,
        scale: 120,
        description: "increased attack speed and fire rate",
        atkSpd: 0.78
    },
    [EHat.DARK_KNIGHT]: {
        index: 41,
        id: EHat.DARK_KNIGHT,
        name: "Dark Knight",
        price: 12000,
        scale: 120,
        description: "restores health when you deal damage",
        healD: 0.4
    },
    [EHat.SCAVENGER_GEAR]: {
        index: 42,
        id: EHat.SCAVENGER_GEAR,
        name: "Scavenger Gear",
        price: 15000,
        scale: 120,
        description: "earn double points for each kill",
        kScrM: 2
    },
    [EHat.TANK_GEAR]: {
        index: 43,
        id: EHat.TANK_GEAR,
        name: "Tank Gear",
        price: 15000,
        scale: 120,
        description: "increased damage to buildings but slower movement",
        spdMult: 0.3,
        bDmg: 3.3
    },
    [EHat.THIEF_GEAR]: {
        index: 44,
        id: EHat.THIEF_GEAR,
        name: "Thief Gear",
        price: 15000,
        scale: 120,
        description: "steal half of a players gold when you kill them",
        goldSteal: 0.5
    },
    [EHat.BLOODTHIRSTER]: {
        index: 45,
        id: EHat.BLOODTHIRSTER,
        name: "Bloodthirster",
        price: 20000,
        scale: 120,
        description: "Restore Health when dealing damage. And increased damage",
        healD: 0.25,
        dmgMultO: 1.2,
    },
    [EHat.ASSASSIN_GEAR]: {
        index: 46,
        id: EHat.ASSASSIN_GEAR,
        name: "Assassin Gear",
        price: 20000,
        scale: 120,
        description: "Go invisible when not moving. Can't eat. Increased speed",
        noEat: true,
        spdMult: 1.1,
        invisTimer: 1000
    }
} as const;

/**
 * Constant accessory data
 */
export const Accessories = {
    [EAccessory.UNEQUIP]: {
        index: 0,
        id: EAccessory.UNEQUIP,
        name: "Unequip",
        dontSell: true,
        price: 0,
        scale: 0,
        xOffset: 0,
        description: "None"
    },
    [EAccessory.SNOWBALL]: {
        index: 1,
        id: EAccessory.SNOWBALL,
        name: "Snowball",
        price: 1000,
        scale: 105,
        xOffset: 18,
        description: "no effect"
    },
    [EAccessory.TREE_CAPE]: {
        index: 2,
        id: EAccessory.TREE_CAPE,
        name: "Tree Cape",
        price: 1000,
        scale: 90,
        description: "no effect"
    },
    [EAccessory.STONE_CAPE]: {
        index: 3,
        id: EAccessory.STONE_CAPE,
        name: "Stone Cape",
        price: 1000,
        scale: 90,
        description: "no effect"
    },
    [EAccessory.COOKIE_CAPE]: {
        index: 4,
        id: EAccessory.COOKIE_CAPE,
        name: "Cookie Cape",
        price: 1500,
        scale: 90,
        description: "no effect"
    },
    [EAccessory.COW_CAPE]: {
        index: 5,
        id: EAccessory.COW_CAPE,
        name: "Cow Cape",
        price: 2000,
        scale: 90,
        description: "no effect"
    },
    [EAccessory.MONKEY_TAIL]: {
        index: 6,
        id: EAccessory.MONKEY_TAIL,
        name: "Monkey Tail",
        price: 2000,
        scale: 97,
        xOffset: 25,
        description: "Super speed but reduced damage",
        spdMult: 1.35,
        dmgMultO: 0.2
    },
    [EAccessory.APPLE_BASKET]: {
        index: 7,
        id: EAccessory.APPLE_BASKET,
        name: "Apple Basket",
        price: 3000,
        scale: 80,
        xOffset: 12,
        description: "slowly regenerates health over time",
        healthRegen: 1
    },
    [EAccessory.WINTER_CAPE]: {
        index: 8,
        id: EAccessory.WINTER_CAPE,
        name: "Winter Cape",
        price: 3000,
        scale: 90,
        description: "no effect"
    },
    [EAccessory.SKULL_CAPE]: {
        index: 9,
        id: EAccessory.SKULL_CAPE,
        name: "Skull Cape",
        price: 4000,
        scale: 90,
        description: "no effect"
    },
    [EAccessory.DASH_CAPE]: {
        index: 10,
        id: EAccessory.DASH_CAPE,
        name: "Dash Cape",
        price: 5000,
        scale: 90,
        description: "no effect"
    },
    [EAccessory.DRAGON_CAPE]: {
        index: 11,
        id: EAccessory.DRAGON_CAPE,
        name: "Dragon Cape",
        price: 6000,
        scale: 90,
        description: "no effect"
    },
    [EAccessory.SUPER_CAPE]: {
        index: 12,
        id: EAccessory.SUPER_CAPE,
        name: "Super Cape",
        price: 8000,
        scale: 90,
        description: "no effect"
    },
    [EAccessory.TROLL_CAPE]: {
        index: 13,
        id: EAccessory.TROLL_CAPE,
        name: "Troll Cape",
        price: 8000,
        scale: 90,
        description: "no effect"
    },
    [EAccessory.THORNS]: {
        index: 14,
        id: EAccessory.THORNS,
        name: "Thorns",
        price: 10000,
        scale: 115,
        xOffset: 20,
        description: "no effect"
    },
    [EAccessory.BLOCKADES]: {
        index: 15,
        id: EAccessory.BLOCKADES,
        name: "Blockades",
        price: 10000,
        scale: 95,
        xOffset: 15,
        description: "no effect"
    },
    [EAccessory.DEVILS_TAIL]: {
        index: 16,
        id: EAccessory.DEVILS_TAIL,
        name: "Devils Tail",
        price: 10000,
        scale: 95,
        xOffset: 20,
        description: "no effect"
    },
    [EAccessory.SAWBLADE]: {
        index: 17,
        id: EAccessory.SAWBLADE,
        name: "Sawblade",
        price: 12000,
        scale: 90,
        spin: true,
        xOffset: 0,
        description: "deal damage to players that damage you",
        dmg: 0.15
    },
    [EAccessory.ANGEL_WINGS]: {
        index: 18,
        id: EAccessory.ANGEL_WINGS,
        name: "Angel Wings",
        price: 15000,
        scale: 138,
        xOffset: 22,
        description: "slowly regenerates health over time",
        healthRegen: 3
    },
    [EAccessory.SHADOW_WINGS]: {
        index: 19,
        id: EAccessory.SHADOW_WINGS,
        name: "Shadow Wings",
        price: 15000,
        scale: 138,
        xOffset: 22,
        description: "increased movement speed",
        spdMult: 1.1
    },
    [EAccessory.BLOOD_WINGS]: {
        index: 20,
        id: EAccessory.BLOOD_WINGS,
        name: "Blood Wings",
        price: 20000,
        scale: 178,
        xOffset: 26,
        description: "restores health when you deal damage",
        healD: 0.2
    },
    [EAccessory.CORRUPT_X_WINGS]: {
        index: 21,
        id: EAccessory.CORRUPT_X_WINGS,
        name: "Corrupt X Wings",
        price: 20000,
        scale: 178,
        xOffset: 26,
        description: "deal damage to players that damage you",
        dmg: 0.25
    }
} as const;

export const store = [Hats, Accessories] as const;