import myPlayer from "./data/ClientPlayer";
import renderEntity from "./hooks/renderEntity";
import renderObject from "./hooks/renderObject";
import ObjectManager from "./Managers/ObjectManager";
import PlayerManager from "./Managers/PlayerManager";
import ProjectileManager from "./Managers/ProjectileManager";
import SocketManager from "./Managers/SocketManager";
import Controller from "./modules/Controller";
import DefaultHooks from "./modules/DefaultHooks";
import GameUI from "./modules/GameUI";
import Hooker from "./utility/Hooker";
import Injector from "./modules/Injector";
import settings from "./utility/Settings";
import UI from "./modules/UI";
import Renderer from "./utility/Renderer";

const Glotus = new class Glotus {
    readonly ObjectManager = ObjectManager;
    readonly PlayerManager = PlayerManager;
    readonly ProjectileManager = ProjectileManager;
    readonly SocketManager = SocketManager;
    readonly Controller = Controller;
    readonly GameUI = GameUI;
    readonly Hooker = Hooker;
    readonly UI = UI;
    readonly myPlayer = myPlayer;
    readonly settings = settings;
    readonly Renderer = Renderer;
    readonly hooks = {
        renderEntity,
        renderObject,
    } as const;
}
export default Glotus;
window.Glotus = Glotus;

SocketManager.init();
Injector.init();

window.addEventListener("load", () => {
    Controller.init();
    UI.createMenu();
});

window.addEventListener("keydown", (event) => Controller.handleKeydown(event));
window.addEventListener("keyup", (event) => Controller.handleKeyup(event));
DefaultHooks();