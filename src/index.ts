import GameUI from "./UI/GameUI";
import Hooker from "./utility/Hooker";
import Injector from "./modules/Injector";
import settings from "./utility/Settings";
import UI from "./UI/UI";
import Renderer from "./rendering/Renderer";
import ZoomHandler from "./modules/ZoomHandler";
import ObjectRenderer from "./rendering/ObjectRenderer";
import EntityRenderer from "./rendering/EntityRenderer";
import DefaultHooks from "./modules/DefaultHooks";
import PlayerClient from "./PlayerClient";
import StoreHandler from "./UI/StoreHandler";

export const connection = DefaultHooks();
export const myClient = new PlayerClient(connection, true);

console.log("RUNNING CLIENT...");
const Glotus = {
    myClient,
    GameUI,
    Hooker,
    UI,
    settings,
    Renderer,
    ZoomHandler,
    hooks: {
        EntityRenderer,
        ObjectRenderer,
    }
} as const;
export default Glotus;
window.Glotus = Glotus;

Injector.init();

window.addEventListener("DOMContentLoaded", () => {
    UI.createMenu();
    GameUI.init();
    StoreHandler.init();
});

window.addEventListener("load", () => {
    GameUI.load();
});

window.addEventListener("keydown", (event) => myClient.ModuleHandler.handleKeydown(event), false);
window.addEventListener("keyup", (event) => myClient.ModuleHandler.handleKeyup(event), false);