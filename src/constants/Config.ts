/**
 * Constant game config
 */
const Config = {
    maxScreenWidth: 1920,
    maxScreenHeight: 1080,
    serverUpdateRate: 9,
    collisionDepth: 6,
    minimapRate: 3000,
    colGrid: 10,
    clientSendRate: 5,
    barWidth: 50,
    barHeight: 17,
    barPad: 4.5,
    iconPadding: 15,
    iconPad: 0.9,
    deathFadeout: 3000,
    crownIconScale: 60,
    crownPad: 35,
    chatCountdown: 3000,
    chatCooldown: 500,
    maxAge: 100,
    gatherAngle: Math.PI / 2.6,
    gatherWiggle: 10,
    hitReturnRatio: 0.25,
    hitAngle: Math.PI / 2,
    playerScale: 35,
    playerSpeed: 0.0016,
    playerDecel: 0.993,
    nameY: 34,
    animalCount: 7,
    aiTurnRandom: 0.06,
    shieldAngle: Math.PI / 3,

    resourceTypes: ["wood", "food", "stone", "points"],
    areaCount: 7,
    treesPerArea: 9,
    bushesPerArea: 3,
    totalRocks: 32,
    goldOres: 7,
    riverWidth: 724,
    riverPadding: 114,
    waterCurrent: 0.0011,
    waveSpeed: 0.0001,
    waveMax: 1.3,
    treeScales: [150, 160, 165, 175],
    bushScales: [80, 85, 95],
    rockScales: [80, 85, 90],

    // BIOME DATA:
    snowBiomeTop: 2400,
    snowSpeed: 0.75,

    // DATA:
    maxNameLength: 15,

    // MAP:
    mapScale: 14400,
    mapPingScale: 40,
    mapPingTime: 2200,
} as const;

export default Config;