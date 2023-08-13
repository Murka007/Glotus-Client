import myPlayer from "./data/ClientPlayer";
import ObjectManager from "./Managers/ObjectManager";
import PlayerManager from "./Managers/PlayerManager";
import ProjectileManager from "./Managers/ProjectileManager";
import SocketManager from "./Managers/SocketManager";
import DefaultHooks from "./modules/DefaultHooks";
import GameUI from "./UI/GameUI";
import Hooker from "./utility/Hooker";
import Injector from "./modules/Injector";
import settings from "./utility/Settings";
import UI from "./UI/UI";
import Renderer from "./rendering/Renderer";
import ZoomHandler from "./modules/ZoomHandler";
import ModuleHandler from "./features/ModuleHandler";
import ObjectRenderer from "./rendering/ObjectRenderer";
import EntityRenderer from "./rendering/EntityRenderer";

const Glotus = {
    ObjectManager,
    PlayerManager,
    ProjectileManager,
    SocketManager,
    ModuleHandler,
    GameUI,
    Hooker,
    UI,
    myPlayer,
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
});

window.addEventListener("keydown", (event) => ModuleHandler.handleKeydown(event));
window.addEventListener("keyup", (event) => ModuleHandler.handleKeyup(event));
DefaultHooks();