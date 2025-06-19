import { EAccessory, EHat } from "../types/Store";
import { Cookie } from "./Storage";

export interface ISettings {
    // Keybinds
    primary: string;
    secondary: string;
    food: string;
    wall: string;
    spike: string;
    windmill: string;
    farm: string;
    trap: string;
    turret: string;
    spawn: string;

    up: string;
    left: string;
    down: string;
    right: string;
    autoattack: string;
    lockrotation: string;
    lockBotPosition: string;
    toggleChat: string;
    toggleShop: string;
    toggleClan: string;
    toggleMenu: string;

    // Combat
    biomehats: boolean;
    autoemp: boolean;
    antienemy: boolean;
    antianimal: boolean;
    antispike: boolean;

    autoheal: boolean;
    healingSpeed: number;

    automill: boolean;
    autoplacer: boolean;
    autobreak: boolean;

    // Visuals
    enemyTracers: boolean;
    enemyTracersColor: string;
    teammateTracers: boolean;
    teammateTracersColor: string;
    animalTracers: boolean;
    animalTracersColor: string;
    notificationTracers: boolean;
    notificationTracersColor: string;
    arrows: boolean;

    itemMarkers: boolean;
    itemMarkersColor: string;
    teammateMarkers: boolean;
    teammateMarkersColor: string;
    enemyMarkers: boolean;
    enemyMarkersColor: string;

    weaponXPBar: boolean;
    playerTurretReloadBar: boolean;
    playerTurretReloadBarColor: string;
    weaponReloadBar: boolean;
    weaponReloadBarColor: string;
    renderHP: boolean;

    objectTurretReloadBar: boolean;
    objectTurretReloadBarColor: string;
    itemHealthBar: boolean;
    itemHealthBarColor: string;

    itemCounter: boolean;
    renderGrid: boolean;
    windmillRotation: boolean;
    entityDanger: boolean;

    displayPlayerAngle: boolean;
    projectileHitbox: boolean;
    possibleShootTarget: boolean;
    weaponHitbox: boolean;
    collisionHitbox: boolean
    placementHitbox: boolean;
    turretHitbox: boolean;
    possiblePlacement: boolean;

    autospawn: boolean;
    autoaccept: boolean;
    menuTransparency: boolean;
    storeItems: [EHat[], EAccessory[]];
}

export const defaultSettings = {
    primary: "Digit1",
    secondary: "Digit2",
    food: "KeyQ",
    wall: "Digit4",
    spike: "KeyC",
    windmill: "KeyR",
    farm: "KeyT",
    trap: "Space",
    turret: "KeyF",
    spawn: "KeyG",
    up: "KeyW",
    left: "KeyA",
    down: "KeyS",
    right: "KeyD",
    autoattack: "KeyE",
    lockrotation: "KeyX",
    lockBotPosition: "KeyZ",
    toggleChat: "Enter",
    toggleShop: "ShiftLeft",
    toggleClan: "ControlLeft",
    toggleMenu: "Escape",
    biomehats: true,
    autoemp: true,
    antienemy: true,
    antianimal: true,
    antispike: true,
    autoheal: true,
    healingSpeed: 25,
    automill: true,
    autoplacer: true,
    autobreak: true,
    enemyTracers: false,
    enemyTracersColor: "#cc5151",
    teammateTracers: false,
    teammateTracersColor: "#8ecc51",
    animalTracers: false,
    animalTracersColor: "#518ccc",
    notificationTracers: true,
    notificationTracersColor: "#f5d951",
    arrows: true,
    itemMarkers: true,
    itemMarkersColor: "#84bd4b",
    teammateMarkers: true,
    teammateMarkersColor: "#bdb14b",
    enemyMarkers: true,
    enemyMarkersColor: "#ba4949",
    weaponXPBar: true,
    playerTurretReloadBar: true,
    playerTurretReloadBarColor: "#cf7148",
    weaponReloadBar: true,
    weaponReloadBarColor: "#5155cc",
    renderHP: true,
    objectTurretReloadBar: false,
    objectTurretReloadBarColor: "#66d9af",
    itemHealthBar: false,
    itemHealthBarColor: "#6b449e",
    itemCounter: true,
    renderGrid: false,
    windmillRotation: false,
    entityDanger: true,
    displayPlayerAngle: false,
    projectileHitbox: false,
    possibleShootTarget: false,
    weaponHitbox: false,
    collisionHitbox: false,
    placementHitbox: false,
    turretHitbox: false,
    possiblePlacement: true,
    autospawn: false,
    autoaccept: false,
    menuTransparency: false,
    storeItems: [[
        EHat.WINTER_CAP,
        EHat.FLIPPER_HAT,
        EHat.SOLDIER_HELMET,
        EHat.BULL_HELMET,
        EHat.EMP_HELMET,
        EHat.BOOSTER_HAT,
        EHat.BARBARIAN_ARMOR,
        EHat.SPIKE_GEAR,
        EHat.TURRET_GEAR,
        EHat.SAMURAI_ARMOR,
        EHat.TANK_GEAR,
        EHat.ASSASSIN_GEAR
    ], [
        EAccessory.MONKEY_TAIL,
        EAccessory.APPLE_BASKET,
        EAccessory.SAWBLADE,
        EAccessory.ANGEL_WINGS,
        EAccessory.SHADOW_WINGS,
        EAccessory.BLOOD_WINGS,
        EAccessory.CORRUPT_X_WINGS,
    ]],
} satisfies ISettings;

defaultSettings.storeItems

const settings = { ...defaultSettings, ...Cookie.get<ISettings>("Glotus") };
for (const iterator in settings) {
    const key = iterator as keyof ISettings;
    if (!defaultSettings.hasOwnProperty(key)) {
        delete settings[key];
    }
}

export const SaveSettings = () => {
    Cookie.set("Glotus", JSON.stringify(settings), 365);
}
SaveSettings();

export default settings;