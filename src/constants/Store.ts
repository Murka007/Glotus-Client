export enum EHat {
    SHAME = 45,
    MOO_CAP = 51,
    APPLE_CAP = 50,
    MOO_HEAD = 28,
    PIG_HEAD = 29,
    FLUFF_HEAD = 30,
    PANDOU_HEAD = 36,
    BEAR_HEAD = 37,
    MONKEY_HEAD = 38,
    POLAR_HEAD = 44,
    FEZ_HAT = 35,
    ENIGMA_HAT = 42,
    BLITZ_HAT = 43,
    BOB_XIII_HAT = 49,
    PUMPKIN = 57,
    BUMMLE_HAT = 8,
    STRAW_HAT = 2,
    WINTER_CAP = 15,
    COWBOY_HAT = 5,
    RANGER_HAT = 4,
    EXPLORER_HAT = 18,
    FLIPPER_HAT = 31,
    MARKSMAN_CAP = 1,
    BUSH_GEAR = 10,
    HALO = 48,
    SOLDIER_HELMET = 6,
    ANTI_VENOM_GEAR = 23,
    MEDIC_GEAR = 13,
    MINERS_HELMET = 9,
    MUSKETEER_HAT = 32,
    BULL_HELMET = 7,
    EMP_HELMET = 22,
    BOOSTER_HAT = 12,
    BARBARIAN_ARMOR = 26,
    PLAGUE_MASK = 21,
    BULL_MASK = 46,
    WINDMILL_HAT = 14,
    SPIKE_GEAR = 11,
    TURRET_GEAR = 53,
    SAMURAI_ARMOR = 20,
    DARK_KNIGHT = 58,
    SCAVENGER_GEAR = 27,
    TANK_GEAR = 40,
    THIEF_GEAR = 52,
    BLOODTHIRSTER = 55,
    ASSASSIN_GEAR = 56,
}

export enum EAccessory {
    SNOWBALL = 12,
    TREE_CAPE = 9,
    STONE_CAPE = 10,
    COOKIE_CAPE = 3,
    COW_CAPE = 8,
    MONKEY_TAIL = 11,
    APPLE_BASKET = 17,
    WINTER_CAPE = 6,
    SKULL_CAPE = 4,
    DASH_CAPE = 5,
    DRAGON_CAPE = 2,
    SUPER_CAPE = 1,
    TROLL_CAPE = 7,
    THORNS = 14,
    BLOCKADES = 15,
    DEVILS_TAIL = 20,
    SAWBLADE = 16,
    ANGEL_WINGS = 13,
    SHADOW_WINGS = 19,
    BLOOD_WINGS = 18,
    CORRUPT_X_WINGS = 21,
}

interface IHat {
    id: EHat;
    name: string;
    description: string;
    price: number;
    scale: number;
    dontSell?: boolean;
    coldM?: number;
    watrImm?: boolean;
    aMlt?: number;
    spdMult?: number;
    dmgMult?: number;
    poisonRes?: number;
    healthRegen?: number;
    extraGold?: number;
    projCost?: number;
    dmgMultO?: number;
    antiTurret?: number;
    dmgK?: number;
    poisonDmg?: number;
    poisonTime?: number;
    bullRepel?: number;
    topSprite?: boolean;
    pps?: number;
    dmg?: number;
    turret?: {
        proj: number;
        range: number;
        rate: number;
    }
    atkSpd?: number;
    healD?: number;
    kScrM?: number;
    bDmg?: number;
    goldSteal?: number;
    noEat?: boolean;
    invisTimer?: number;
}

const Hats = new Map<EHat, IHat>(
    [
        [EHat.SHAME, {
            id: EHat.SHAME,
            name: "Shame!",
            dontSell: true,
            price: 0,
            scale: 120,
            description: "hacks are for losers"
        }],
        [EHat.MOO_CAP, {
            id: EHat.MOO_CAP,
            name: "Moo Cap",
            price: 0,
            scale: 120,
            description: "coolest mooer around"
        }],
        [EHat.APPLE_CAP, {
            id: EHat.APPLE_CAP,
            name: "Apple Cap",
            price: 0,
            scale: 120,
            description: "apple farms remembers"
        }],
        [EHat.MOO_HEAD, {
            id: EHat.MOO_HEAD,
            name: "Moo Head",
            price: 0,
            scale: 120,
            description: "no effect"
        }],
        [EHat.PIG_HEAD, {
            id: EHat.PIG_HEAD,
            name: "Pig Head",
            price: 0,
            scale: 120,
            description: "no effect"
        }],
        [EHat.FLUFF_HEAD, {
            id: EHat.FLUFF_HEAD,
            name: "Fluff Head",
            price: 0,
            scale: 120,
            description: "no effect"
        }],
        [EHat.PANDOU_HEAD, {
            id: EHat.PANDOU_HEAD,
            name: "Pandou Head",
            price: 0,
            scale: 120,
            description: "no effect"
        }],
        [EHat.BEAR_HEAD, {
            id: EHat.BEAR_HEAD,
            name: "Bear Head",
            price: 0,
            scale: 120,
            description: "no effect"
        }],
        [EHat.MONKEY_HEAD, {
            id: EHat.MONKEY_HEAD,
            name: "Monkey Head",
            price: 0,
            scale: 120,
            description: "no effect"
        }],
        [EHat.POLAR_HEAD, {
            id: EHat.POLAR_HEAD,
            name: "Polar Head",
            price: 0,
            scale: 120,
            description: "no effect"
        }],
        [EHat.FEZ_HAT, {
            id: EHat.FEZ_HAT,
            name: "Fez Hat",
            price: 0,
            scale: 120,
            description: "no effect"
        }],
        [EHat.ENIGMA_HAT, {
            id: EHat.ENIGMA_HAT,
            name: "Enigma Hat",
            price: 0,
            scale: 120,
            description: "join the enigma army"
        }],
        [EHat.BLITZ_HAT, {
            id: EHat.BLITZ_HAT,
            name: "Blitz Hat",
            price: 0,
            scale: 120,
            description: "hey everybody i'm blitz"
        }],
        [EHat.BOB_XIII_HAT, {
            id: EHat.BOB_XIII_HAT,
            name: "Bob XIII Hat",
            price: 0,
            scale: 120,
            description: "like and subscribe"
        }],
        [EHat.PUMPKIN, {
            id: EHat.PUMPKIN,
            name: "Pumpkin",
            price: 50,
            scale: 120,
            description: "Spooooky"
        }],
        [EHat.BUMMLE_HAT, {
            id: EHat.BUMMLE_HAT,
            name: "Bummle Hat",
            price: 100,
            scale: 120,
            description: "no effect"
        }],
        [EHat.STRAW_HAT, {
            id: EHat.STRAW_HAT,
            name: "Straw Hat",
            price: 500,
            scale: 120,
            description: "no effect"
        }],
        [EHat.WINTER_CAP, {
            id: EHat.WINTER_CAP,
            name: "Winter Cap",
            price: 600,
            scale: 120,
            description: "allows you to move at normal speed in snow",
            coldM: 1
        }],
        [EHat.COWBOY_HAT, {
            id: EHat.COWBOY_HAT,
            name: "Cowboy Hat",
            price: 1000,
            scale: 120,
            description: "no effect"
        }],
        [EHat.RANGER_HAT, {
            id: EHat.RANGER_HAT,
            name: "Ranger Hat",
            price: 2000,
            scale: 120,
            description: "no effect"
        }],
        [EHat.EXPLORER_HAT, {
            id: EHat.EXPLORER_HAT,
            name: "Explorer Hat",
            price: 2000,
            scale: 120,
            description: "no effect"
        }],
        [EHat.FLIPPER_HAT, {
            id: EHat.FLIPPER_HAT,
            name: "Flipper Hat",
            price: 2500,
            scale: 120,
            description: "have more control while in water",
            watrImm: true
        }],
        [EHat.MARKSMAN_CAP, {
            id: EHat.MARKSMAN_CAP,
            name: "Marksman Cap",
            price: 3000,
            scale: 120,
            description: "increases arrow speed and range",
            aMlt: 1.3
        }],
        [EHat.BUSH_GEAR, {
            id: EHat.BUSH_GEAR,
            name: "Bush Gear",
            price: 3000,
            scale: 160,
            description: "allows you to disguise yourself as a bush"
        }],
        [EHat.HALO, {
            id: EHat.HALO,
            name: "Halo",
            price: 3000,
            scale: 120,
            description: "no effect"
        }],
        [EHat.SOLDIER_HELMET, {
            id: EHat.SOLDIER_HELMET,
            name: "Soldier Helmet",
            price: 4000,
            scale: 120,
            description: "reduces damage taken but slows movement",
            spdMult: 0.94,
            dmgMult: 0.75
        }],
        [EHat.ANTI_VENOM_GEAR, {
            id: EHat.ANTI_VENOM_GEAR,
            name: "Anti Venom Gear",
            price: 4000,
            scale: 120,
            description: "makes you immune to poison",
            poisonRes: 1
        }],
        [EHat.MEDIC_GEAR, {
            id: EHat.MEDIC_GEAR,
            name: "Medic Gear",
            price: 5000,
            scale: 110,
            description: "slowly regenerates health over time",
            healthRegen: 3
        }],
        [EHat.MINERS_HELMET, {
            id: EHat.MINERS_HELMET,
            name: "Miners Helmet",
            price: 5000,
            scale: 120,
            description: "earn 1 extra gold per resource",
            extraGold: 1
        }],
        [EHat.MUSKETEER_HAT, {
            id: EHat.MUSKETEER_HAT,
            name: "Musketeer Hat",
            price: 5000,
            scale: 120,
            description: "reduces cost of projectiles",
            projCost: 0.5
        }],
        [EHat.BULL_HELMET, {
            id: EHat.BULL_HELMET,
            name: "Bull Helmet",
            price: 6000,
            scale: 120,
            description: "increases damage done but drains health",
            healthRegen: -5,
            dmgMultO: 1.5,
            spdMult: 0.96
        }],
        [EHat.EMP_HELMET, {
            id: EHat.EMP_HELMET,
            name: "Emp Helmet",
            price: 6000,
            scale: 120,
            description: "turrets won't attack but you move slower",
            antiTurret: 1,
            spdMult: 0.7
        }],
        [EHat.BOOSTER_HAT, {
            id: EHat.BOOSTER_HAT,
            name: "Booster Hat",
            price: 6000,
            scale: 120,
            description: "increases your movement speed",
            spdMult: 1.16
        }],
        [EHat.BARBARIAN_ARMOR, {
            id: EHat.BARBARIAN_ARMOR,
            name: "Barbarian Armor",
            price: 8000,
            scale: 120,
            description: "knocks back enemies that attack you",
            dmgK: 0.6
        }],
        [EHat.PLAGUE_MASK, {
            id: EHat.PLAGUE_MASK,
            name: "Plague Mask",
            price: 10000,
            scale: 120,
            description: "melee attacks deal poison damage",
            poisonDmg: 5,
            poisonTime: 6
        }],
        [EHat.BULL_MASK, {
            id: EHat.BULL_MASK,
            name: "Bull Mask",
            price: 10000,
            scale: 120,
            description: "bulls won't target you unless you attack them",
            bullRepel: 1
        }],
        [EHat.WINDMILL_HAT, {
            id: EHat.WINDMILL_HAT,
            name: "Windmill Hat",
            topSprite: true,
            price: 10000,
            scale: 120,
            description: "generates points while worn",
            pps: 1.5
        }],
        [EHat.SPIKE_GEAR, {
            id: EHat.SPIKE_GEAR,
            name: "Spike Gear",
            topSprite: true,
            price: 10000,
            scale: 120,
            description: "deal damage to players that damage you",
            dmg: 0.45
        }],
        [EHat.TURRET_GEAR, {
            id: EHat.TURRET_GEAR,
            name: "Turret Gear",
            topSprite: true,
            price: 10000,
            scale: 120,
            description: "you become a walking turret",
            turret: {
                proj: 1,
                range: 700,
                rate: 2500
            },
            spdMult: 0.7
        }],
        [EHat.SAMURAI_ARMOR, {
            id: EHat.SAMURAI_ARMOR,
            name: "Samurai Armor",
            price: 12000,
            scale: 120,
            description: "increased attack speed and fire rate",
            atkSpd: 0.78
        }],
        [EHat.DARK_KNIGHT, {
            id: EHat.DARK_KNIGHT,
            name: "Dark Knight",
            price: 12000,
            scale: 120,
            description: "restores health when you deal damage",
            healD: 0.4
        }],
        [EHat.SCAVENGER_GEAR, {
            id: EHat.SCAVENGER_GEAR,
            name: "Scavenger Gear",
            price: 15000,
            scale: 120,
            description: "earn double points for each kill",
            kScrM: 2
        }],
        [EHat.TANK_GEAR, {
            id: EHat.TANK_GEAR,
            name: "Tank Gear",
            price: 15000,
            scale: 120,
            description: "increased damage to buildings but slower movement",
            spdMult: 0.3,
            bDmg: 3.3
        }],
        [EHat.THIEF_GEAR, {
            id: EHat.THIEF_GEAR,
            name: "Thief Gear",
            price: 15000,
            scale: 120,
            description: "steal half of a players gold when you kill them",
            goldSteal: 0.5
        }],
        [EHat.BLOODTHIRSTER, {
            id: EHat.BLOODTHIRSTER,
            name: "Bloodthirster",
            price: 20000,
            scale: 120,
            description: "Restore Health when dealing damage. And increased damage",
            healD: 0.25,
            dmgMultO: 1.2,
        }],
        [EHat.ASSASSIN_GEAR, {
            id: EHat.ASSASSIN_GEAR,
            name: "Assassin Gear",
            price: 20000,
            scale: 120,
            description: "Go invisible when not moving. Can't eat. Increased speed",
            noEat: true,
            spdMult: 1.1,
            invisTimer: 1000
        }]
    ]
);

interface IAccessory {
    id: EAccessory;
    name: string;
    description: string;
    price: number;
    scale: number;
    xOffset?: number;
    spdMult?: number;
    dmgMultO?: number;
    healthRegen?: number;
    spin?: boolean;
    dmg?: number;
    healD?: number;
}

const Accessories = new Map<EAccessory, IAccessory>(
    [
        [EAccessory.SNOWBALL, {
            id: EAccessory.SNOWBALL,
            name: "Snowball",
            price: 1000,
            scale: 105,
            xOffset: 18,
            description: "no effect"
        }],
        [EAccessory.TREE_CAPE, {
            id: EAccessory.TREE_CAPE,
            name: "Tree Cape",
            price: 1000,
            scale: 90,
            description: "no effect"
        }],
        [EAccessory.STONE_CAPE, {
            id: EAccessory.STONE_CAPE,
            name: "Stone Cape",
            price: 1000,
            scale: 90,
            description: "no effect"
        }],
        [EAccessory.COOKIE_CAPE, {
            id: EAccessory.COOKIE_CAPE,
            name: "Cookie Cape",
            price: 1500,
            scale: 90,
            description: "no effect"
        }],
        [EAccessory.COW_CAPE, {
            id: EAccessory.COW_CAPE,
            name: "Cow Cape",
            price: 2000,
            scale: 90,
            description: "no effect"
        }],
        [EAccessory.MONKEY_TAIL, {
            id: EAccessory.MONKEY_TAIL,
            name: "Monkey Tail",
            price: 2000,
            scale: 97,
            xOffset: 25,
            description: "Super speed but reduced damage",
            spdMult: 1.35,
            dmgMultO: 0.2
        }],
        [EAccessory.APPLE_BASKET, {
            id: EAccessory.APPLE_BASKET,
            name: "Apple Basket",
            price: 3000,
            scale: 80,
            xOffset: 12,
            description: "slowly regenerates health over time",
            healthRegen: 1
        }],
        [EAccessory.WINTER_CAPE, {
            id: EAccessory.WINTER_CAPE,
            name: "Winter Cape",
            price: 3000,
            scale: 90,
            description: "no effect"
        }],
        [EAccessory.SKULL_CAPE, {
            id: EAccessory.SKULL_CAPE,
            name: "Skull Cape",
            price: 4000,
            scale: 90,
            description: "no effect"
        }],
        [EAccessory.DASH_CAPE, {
            id: EAccessory.DASH_CAPE,
            name: "Dash Cape",
            price: 5000,
            scale: 90,
            description: "no effect"
        }],
        [EAccessory.DRAGON_CAPE, {
            id: EAccessory.DRAGON_CAPE,
            name: "Dragon Cape",
            price: 6000,
            scale: 90,
            description: "no effect"
        }],
        [EAccessory.SUPER_CAPE, {
            id: EAccessory.SUPER_CAPE,
            name: "Super Cape",
            price: 8000,
            scale: 90,
            description: "no effect"
        }],
        [EAccessory.TROLL_CAPE, {
            id: EAccessory.TROLL_CAPE,
            name: "Troll Cape",
            price: 8000,
            scale: 90,
            description: "no effect"
        }],
        [EAccessory.THORNS, {
            id: EAccessory.THORNS,
            name: "Thorns",
            price: 10000,
            scale: 115,
            xOffset: 20,
            description: "no effect"
        }],
        [EAccessory.BLOCKADES, {
            id: EAccessory.BLOCKADES,
            name: "Blockades",
            price: 10000,
            scale: 95,
            xOffset: 15,
            description: "no effect"
        }],
        [EAccessory.DEVILS_TAIL, {
            id: EAccessory.DEVILS_TAIL,
            name: "Devils Tail",
            price: 10000,
            scale: 95,
            xOffset: 20,
            description: "no effect"
        }],
        [EAccessory.SAWBLADE, {
            id: EAccessory.SAWBLADE,
            name: "Sawblade",
            price: 12000,
            scale: 90,
            spin: true,
            xOffset: 0,
            description: "deal damage to players that damage you",
            dmg: 0.15
        }],
        [EAccessory.ANGEL_WINGS, {
            id: EAccessory.ANGEL_WINGS,
            name: "Angel Wings",
            price: 15000,
            scale: 138,
            xOffset: 22,
            description: "slowly regenerates health over time",
            healthRegen: 3
        }],
        [EAccessory.SHADOW_WINGS, {
            id: EAccessory.SHADOW_WINGS,
            name: "Shadow Wings",
            price: 15000,
            scale: 138,
            xOffset: 22,
            description: "increased movement speed",
            spdMult: 1.1
        }],
        [EAccessory.BLOOD_WINGS, {
            id: EAccessory.BLOOD_WINGS,
            name: "Blood Wings",
            price: 20000,
            scale: 178,
            xOffset: 26,
            description: "restores health when you deal damage",
            healD: 0.2
        }],
        [EAccessory.CORRUPT_X_WINGS, {
            id: EAccessory.CORRUPT_X_WINGS,
            name: "Corrupt X Wings",
            price: 20000,
            scale: 178,
            xOffset: 26,
            description: "deal damage to players that damage you",
            dmg: 0.25
        }]
    ]
);

export { Hats, Accessories };