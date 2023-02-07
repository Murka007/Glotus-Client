import { EItem, EWeapon, EWeaponVariant, IEWeaponVariant, IItem, ItemType, IWeapon, WeaponType } from "../types/Items";

export const Weapons: ReadonlyArray<Readonly<IWeapon>> = [{
    id: EWeapon.TOOL_HAMMER,
    itemType: WeaponType.PRIMARY,
    type: 0,
    name: "tool hammer",
    description: "tool for gathering all resources",
    src: "hammer_1",
    length: 140,
    width: 140,
    xOffset: -3,
    yOffset: 18,
    damage: 25,
    range: 65,
    gather: 1,
    speed: 300
}, {
    id: EWeapon.HAND_AXE,
    itemType: WeaponType.PRIMARY,
    type: 0,
    age: 2,
    name: "hand axe",
    description: "gathers resources at a higher rate",
    src: "axe_1",
    length: 140,
    width: 140,
    xOffset: 3,
    yOffset: 24,
    damage: 30,
    spdMult: 1,
    range: 70,
    gather: 2,
    speed: 400
}, {
    id: EWeapon.GREAT_AXE,
    itemType: WeaponType.PRIMARY,
    type: 0,
    age: 8,
    pre: 1,
    name: "great axe",
    description: "deal more damage and gather more resources",
    src: "great_axe_1",
    length: 140,
    width: 140,
    xOffset: -8,
    yOffset: 25,
    damage: 35,
    spdMult: 1,
    range: 75,
    gather: 4,
    speed: 400
}, {
    id: EWeapon.SHORT_SWORD,
    itemType: WeaponType.PRIMARY,
    type: 0,
    age: 2,
    name: "short sword",
    description: "increased attack power but slower move speed",
    src: "sword_1",
    iPad: 1.3,
    length: 130,
    width: 210,
    xOffset: -8,
    yOffset: 46,
    damage: 35,
    spdMult: .85,
    range: 110,
    gather: 1,
    speed: 300
}, {
    id: EWeapon.KATANA,
    itemType: WeaponType.PRIMARY,
    type: 0,
    age: 8,
    pre: 3,
    name: "katana",
    description: "greater range and damage",
    src: "samurai_1",
    iPad: 1.3,
    length: 130,
    width: 210,
    xOffset: -8,
    yOffset: 59,
    damage: 40,
    spdMult: .8,
    range: 118,
    gather: 1,
    speed: 300
}, {
    id: EWeapon.POLEARM,
    itemType: WeaponType.PRIMARY,
    type: 0,
    age: 2,
    name: "polearm",
    description: "long range melee weapon",
    src: "spear_1",
    iPad: 1.3,
    length: 130,
    width: 210,
    xOffset: -8,
    yOffset: 53,
    damage: 45,
    knock: .2,
    spdMult: .82,
    range: 142,
    gather: 1,
    speed: 700
}, {
    id: EWeapon.BAT,
    itemType: WeaponType.PRIMARY,
    type: 0,
    age: 2,
    name: "bat",
    description: "fast long range melee weapon",
    src: "bat_1",
    iPad: 1.3,
    length: 110,
    width: 180,
    xOffset: -8,
    yOffset: 53,
    damage: 20,
    knock: .7,
    range: 110,
    gather: 1,
    speed: 300
}, {
    id: EWeapon.DAGGERS,
    itemType: WeaponType.PRIMARY,
    type: 0,
    age: 2,
    name: "daggers",
    description: "really fast short range weapon",
    src: "dagger_1",
    iPad: .8,
    length: 110,
    width: 110,
    xOffset: 18,
    yOffset: 0,
    damage: 20,
    knock: .1,
    range: 65,
    gather: 1,
    hitSlow: .1,
    spdMult: 1.13,
    speed: 100
}, {
    id: EWeapon.STICK,
    itemType: WeaponType.PRIMARY,
    type: 0,
    age: 2,
    name: "stick",
    description: "great for gathering but very weak",
    src: "stick_1",
    length: 140,
    width: 140,
    xOffset: 3,
    yOffset: 24,
    damage: 1,
    spdMult: 1,
    range: 70,
    gather: 7,
    speed: 400
}, {
    id: EWeapon.HUNTING_BOW,
    itemType: WeaponType.SECONDARY,
    type: 1,
    age: 6,
    name: "hunting bow",
    description: "bow used for ranged combat and hunting",
    src: "bow_1",
    cost: {
        wood: 4
    },
    length: 120,
    width: 120,
    xOffset: -6,
    yOffset: 0,
    projectile: 0,
    spdMult: .75,
    speed: 600
}, {
    id: EWeapon.GREAT_HAMMER,
    itemType: WeaponType.SECONDARY,
    type: 1,
    age: 6,
    name: "great hammer",
    description: "hammer used for destroying structures",
    src: "great_hammer_1",
    length: 140,
    width: 140,
    xOffset: -9,
    yOffset: 25,
    damage: 10,
    spdMult: .88,
    range: 75,
    sDmg: 7.5,
    gather: 1,
    speed: 400
}, {
    id: EWeapon.WOODEN_SHIELD,
    itemType: WeaponType.SECONDARY,
    type: 1,
    age: 6,
    name: "wooden shield",
    description: "blocks projectiles and reduces melee damage",
    src: "shield_1",
    length: 120,
    width: 120,
    shield: .2,
    xOffset: 6,
    yOffset: 0,
    spdMult: .7
}, {
    id: EWeapon.CROSSBOW,
    itemType: WeaponType.SECONDARY,
    type: 1,
    age: 8,
    pre: 9,
    name: "crossbow",
    description: "deals more damage and has greater range",
    src: "crossbow_1",
    cost: {
        wood: 5
    },
    aboveHand: true,
    armS: .75,
    length: 120,
    width: 120,
    xOffset: -4,
    yOffset: 0,
    projectile: 2,
    spdMult: .7,
    speed: 700
}, {
    id: EWeapon.REPEATER_CROSSBOW,
    itemType: WeaponType.SECONDARY,
    type: 1,
    age: 9,
    pre: 12,
    name: "repeater crossbow",
    description: "high firerate crossbow with reduced damage",
    src: "crossbow_2",
    cost: {
        wood: 10
    },
    aboveHand: true,
    armS: .75,
    length: 120,
    width: 120,
    xOffset: -4,
    yOffset: 0,
    projectile: 3,
    spdMult: .7,
    speed: 230
}, {
    id: EWeapon.MC_GRABBY,
    itemType: WeaponType.SECONDARY,
    type: 1,
    age: 6,
    name: "mc grabby",
    description: "steals resources from enemies",
    src: "grab_1",
    length: 130,
    width: 210,
    xOffset: -8,
    yOffset: 53,
    damage: 0,
    steal: 250,
    knock: .2,
    spdMult: 1.05,
    range: 125,
    gather: 0,
    speed: 700
}, {
    id: EWeapon.MUSKET,
    itemType: WeaponType.SECONDARY,
    type: 1,
    age: 9,
    pre: 12,
    name: "musket",
    description: "slow firerate but high damage and range",
    src: "musket_1",
    cost: {
        stone: 10
    },
    aboveHand: true,
    rec: .35,
    armS: .6,
    hndS: .3,
    hndD: 1.6,
    length: 205,
    width: 205,
    xOffset: 25,
    yOffset: 0,
    projectile: 5,
    hideProjectile: true,
    spdMult: .6,
    speed: 1500
}]

export const Items: ReadonlyArray<Readonly<IItem>> = [{
    // group: e.exports.groups[0],
    id: EItem.APPLE,
    itemType: ItemType.FOOD,
    name: "apple",
    description: "restores 20 health when consumed",
    cost: {
        food: 10
    },
    restore: 20,
    scale: 22,
    holdOffset: 15
}, {
    age: 3,
    // group: e.exports.groups[0],
    id: EItem.COOKIE,
    itemType: ItemType.FOOD,
    name: "cookie",
    description: "restores 40 health when consumed",
    cost: {
        food: 15
    },
    restore: 40,
    scale: 27,
    holdOffset: 15
}, {
    age: 7,
    // group: e.exports.groups[0],
    id: EItem.CHEESE,
    itemType: ItemType.FOOD,
    name: "cheese",
    description: "restores 30 health and another 50 over 5 seconds",
    cost: {
        food: 25
    },
    restore: 30,
    scale: 27,
    holdOffset: 15
}, {
    // group: e.exports.groups[1],
    id: EItem.WOOD_WALL,
    itemType: ItemType.WALL,
    name: "wood wall",
    description: "provides protection for your village",
    cost: {
        wood: 10
    },
    projDmg: true,
    health: 380,
    scale: 50,
    holdOffset: 20,
    placeOffset: -5
}, {
    age: 3,
    // group: e.exports.groups[1],
    id: EItem.STONE_WALL,
    itemType: ItemType.WALL,
    name: "stone wall",
    description: "provides improved protection for your village",
    cost: {
        stone: 25
    },
    health: 900,
    scale: 50,
    holdOffset: 20,
    placeOffset: -5
}, {
    age: 7,
    pre: 1,
    // group: e.exports.groups[1],
    id: EItem.CASTLE_WALL,
    itemType: ItemType.WALL,
    name: "castle wall",
    description: "provides powerful protection for your village",
    cost: {
        stone: 35
    },
    health: 1500,
    scale: 52,
    holdOffset: 20,
    placeOffset: -5
}, {
    // group: e.exports.groups[2],
    id: EItem.SPIKES,
    itemType: ItemType.SPIKE,
    name: "spikes",
    description: "damages enemies when they touch them",
    cost: {
        wood: 20,
        stone: 5
    },
    health: 400,
    damage: 20,
    scale: 49,
    spritePadding: -23,
    holdOffset: 8,
    placeOffset: -5
}, {
    age: 5,
    // group: e.exports.groups[2],
    id: EItem.GREATER_SPIKES,
    itemType: ItemType.SPIKE,
    name: "greater spikes",
    description: "damages enemies when they touch them",
    cost: {
        wood: 30,
        stone: 10
    },
    health: 500,
    damage: 35,
    scale: 52,
    spritePadding: -23,
    holdOffset: 8,
    placeOffset: -5
}, {
    age: 9,
    pre: 1,
    // group: e.exports.groups[2],
    id: EItem.POISON_SPIKES,
    itemType: ItemType.SPIKE,
    name: "poison spikes",
    description: "poisons enemies when they touch them",
    cost: {
        wood: 35,
        stone: 15
    },
    health: 600,
    damage: 30,
    poisonDamage: 5,
    scale: 52,
    spritePadding: -23,
    holdOffset: 8,
    placeOffset: -5
}, {
    age: 9,
    pre: 2,
    // group: e.exports.groups[2],
    id: EItem.SPINNING_SPIKES,
    itemType: ItemType.SPIKE,
    name: "spinning spikes",
    description: "damages enemies when they touch them",
    cost: {
        wood: 30,
        stone: 20
    },
    health: 500,
    damage: 45,
    turnSpeed: .003,
    scale: 52,
    spritePadding: -23,
    holdOffset: 8,
    placeOffset: -5
}, {
    // group: e.exports.groups[3],
    id: EItem.WINDMILL,
    itemType: ItemType.WINDMILL,
    name: "windmill",
    description: "generates gold over time",
    cost: {
        wood: 50,
        stone: 10
    },
    health: 400,
    pps: 1,
    turnSpeed: .0016,
    spritePadding: 25,
    iconLineMult: 12,
    scale: 45,
    holdOffset: 20,
    placeOffset: 5
}, {
    age: 5,
    pre: 1,
    // group: e.exports.groups[3],
    id: EItem.FASTER_WINDMILL,
    itemType: ItemType.WINDMILL,
    name: "faster windmill",
    description: "generates more gold over time",
    cost: {
        wood: 60,
        stone: 20
    },
    health: 500,
    pps: 1.5,
    turnSpeed: .0025,
    spritePadding: 25,
    iconLineMult: 12,
    scale: 47,
    holdOffset: 20,
    placeOffset: 5
}, {
    age: 8,
    pre: 1,
    // group: e.exports.groups[3],
    id: EItem.POWER_MILL,
    itemType: ItemType.WINDMILL,
    name: "power mill",
    description: "generates more gold over time",
    cost: {
        wood: 100,
        stone: 50
    },
    health: 800,
    pps: 2,
    turnSpeed: .005,
    spritePadding: 25,
    iconLineMult: 12,
    scale: 47,
    holdOffset: 20,
    placeOffset: 5
}, {
    age: 5,
    // group: e.exports.groups[4],
    type: 2,
    id: EItem.MINE,
    itemType: ItemType.FARM,
    name: "mine",
    description: "allows you to mine stone",
    cost: {
        wood: 20,
        stone: 100
    },
    iconLineMult: 12,
    scale: 65,
    holdOffset: 20,
    placeOffset: 0
}, {
    age: 5,
    // group: e.exports.groups[11],
    type: 0,
    id: EItem.SAPLING,
    itemType: ItemType.FARM,
    name: "sapling",
    description: "allows you to farm wood",
    cost: {
        wood: 150
    },
    iconLineMult: 12,
    colDiv: .5,
    scale: 110,
    holdOffset: 50,
    placeOffset: -15
}, {
    age: 4,
    // group: e.exports.groups[5],
    id: EItem.PIT_TRAP,
    itemType: ItemType.TRAP,
    name: "pit trap",
    description: "pit that traps enemies if they walk over it",
    cost: {
        wood: 30,
        stone: 30
    },
    trap: true,
    ignoreCollision: true,
    hideFromEnemy: true,
    health: 500,
    colDiv: .2,
    scale: 50,
    holdOffset: 20,
    placeOffset: -5
}, {
    age: 4,
    // group: e.exports.groups[6],
    id: EItem.BOOST_PAD,
    itemType: ItemType.TRAP,
    name: "boost pad",
    description: "provides boost when stepped on",
    cost: {
        stone: 20,
        wood: 5
    },
    ignoreCollision: true,
    boostSpeed: 1.5,
    health: 150,
    colDiv: .7,
    scale: 45,
    holdOffset: 20,
    placeOffset: -5
}, {
    age: 7,
    // group: e.exports.groups[7],
    doUpdate: true,
    id: EItem.TURRET,
    itemType: ItemType.TURRET,
    name: "turret",
    description: "defensive structure that shoots at enemies",
    cost: {
        wood: 200,
        stone: 150
    },
    health: 800,
    projectile: 1,
    shootRange: 700,
    shootRate: 2200,
    scale: 43,
    holdOffset: 20,
    placeOffset: -5
}, {
    age: 7,
    // group: e.exports.groups[8],
    id: EItem.PLATFORM,
    itemType: ItemType.TURRET,
    name: "platform",
    description: "platform to shoot over walls and cross over water",
    cost: {
        wood: 20
    },
    ignoreCollision: true,
    zIndex: 1,
    health: 300,
    scale: 43,
    holdOffset: 20,
    placeOffset: -5
}, {
    age: 7,
    // group: e.exports.groups[9],
    id: EItem.HEALING_PAD,
    itemType: ItemType.TURRET,
    name: "healing pad",
    description: "standing on it will slowly heal you",
    cost: {
        wood: 30,
        food: 10
    },
    ignoreCollision: true,
    healCol: 15,
    health: 400,
    colDiv: .7,
    scale: 45,
    holdOffset: 20,
    placeOffset: -5
}, {
    age: 9,
    // group: e.exports.groups[10],
    id: EItem.SPAWN_PAD,
    itemType: ItemType.SPAWN,
    name: "spawn pad",
    description: "you will spawn here when you die but it will dissapear",
    cost: {
        wood: 100,
        stone: 100
    },
    health: 400,
    ignoreCollision: true,
    spawnPoint: true,
    scale: 45,
    holdOffset: 20,
    placeOffset: -5
}, {
    age: 7,
    // group: e.exports.groups[12],
    id: EItem.BLOCKER,
    itemType: ItemType.TURRET,
    name: "blocker",
    description: "blocks building in radius",
    cost: {
        wood: 30,
        stone: 25
    },
    ignoreCollision: true,
    blocker: 300,
    health: 400,
    colDiv: .7,
    scale: 45,
    holdOffset: 20,
    placeOffset: -5
}, {
    age: 7,
    // group: e.exports.groups[13],
    id: EItem.TELEPORTER,
    itemType: ItemType.TURRET,
    name: "teleporter",
    description: "teleports you to a random point on the map",
    cost: {
        wood: 60,
        stone: 60
    },
    ignoreCollision: true,
    teleport: true,
    health: 200,
    colDiv: .7,
    scale: 45,
    holdOffset: 20,
    placeOffset: -5
}];

const weaponVariants: ReadonlyArray<Readonly<IEWeaponVariant>> = [{
    id: EWeaponVariant.STONE,
    src: "",
    xp: 0,
    val: 1
}, {
    id: EWeaponVariant.GOLD,
    src: "_g",
    xp: 3000,
    val: 1.1
}, {
    id: EWeaponVariant.DIAMOND,
    src: "_d",
    xp: 7000,
    val: 1.18
}, {
    id: EWeaponVariant.RUBY,
    src: "_r",
    poison: true,
    xp: 12000,
    val: 1.18
}];