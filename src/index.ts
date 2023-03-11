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
import Instakill from "./modules/Instakill";

const Glotus = {
    ObjectManager,
    PlayerManager,
    ProjectileManager,
    SocketManager,
    Controller,
    GameUI,
    Hooker,
    UI,
    myPlayer,
    settings,
    Renderer,
    Instakill,
    hooks: {
        renderEntity,
        renderObject,
    }
} as const;
export default Glotus;
window.Glotus = Glotus;

Injector.init();

window.addEventListener("DOMContentLoaded", () => {
    Controller.init();
    UI.createMenu();
});

window.addEventListener("keydown", (event) => Controller.handleKeydown(event));
window.addEventListener("keyup", (event) => Controller.handleKeyup(event));
DefaultHooks();