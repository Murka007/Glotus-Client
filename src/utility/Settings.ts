import Storage from "./Storage";

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
    toggleChat: string;
    toggleShop: string;
    toggleClan: string;
    toggleMenu: string;

    // Combat
    autoheal: boolean;
    antiboostpad: boolean;

    // Visuals
    enemyTracers: boolean;
    enemyTracersColor: string;
    teammateTracers: boolean;
    teammateTracersColor: string;
    animalTracers: boolean;
    animalTracersColor: string;
    arrows: boolean;
    rainbow: boolean;

    itemMarkers: boolean;
    itemMarkersColor: string;
    teammateMarkers: boolean;
    teammateMarkersColor: string;
    enemyMarkers: boolean;
    enemyMarkersColor: string;

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
    toggleChat: "Enter",
    toggleShop: "ShiftLeft",
    toggleClan: "ControlLeft",
    toggleMenu: "Escape",
    autoheal: true,
    antiboostpad: true,
    enemyTracers: true,
    enemyTracersColor: "#cc5151",
    teammateTracers: true,
    teammateTracersColor: "#8ecc51",
    animalTracers: true,
    animalTracersColor: "#518ccc",
    arrows: true,
    rainbow: false,
    itemMarkers: true,
    itemMarkersColor: "#84bd4b",
    teammateMarkers: true,
    teammateMarkersColor: "#bdb14b",
    enemyMarkers: true,
    enemyMarkersColor: "#ba4949",
    playerTurretReloadBar: true,
    playerTurretReloadBarColor: "#cf7148",
    weaponReloadBar: true,
    weaponReloadBarColor: "#5155cc",
    renderHP: true,
    objectTurretReloadBar: true,
    objectTurretReloadBarColor: "#66d9af",
    itemHealthBar: true,
    itemHealthBarColor: "#6b449e",
    itemCounter: true,
    renderGrid: false,
} as const satisfies ISettings;

const settings = { ...defaultSettings, ...Storage.get<ISettings>("Glotus") };
for (const iterator in settings) {
    const key = iterator as keyof ISettings;
    if (!defaultSettings.hasOwnProperty(key)) {
        delete settings[key];
    }
}
Storage.set("Glotus", settings);

export default settings;