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
}

const defaultSettings: Readonly<ISettings> = {
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
}

const settings = { ...defaultSettings, ...Storage.get<ISettings>("Glotus") };
for (const iterator in settings) {
    const key = iterator as keyof ISettings;
    if (!defaultSettings.hasOwnProperty(key)) {
        delete settings[key];
    }
}
Storage.set("Glotus", settings);

export default settings;