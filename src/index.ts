import myPlayer from "./data/ClientPlayer";
import Player from "./data/Player";
import SocketManager from "./Managers/SocketManager";
import Controller from "./modules/Controller";
import DefaultHooks from "./modules/DefaultHooks";
import GameUI from "./modules/GameUI";
import Hooker from "./modules/Hooker";
import Injector from "./modules/Injector";
import settings from "./modules/Settings";
import UI from "./modules/UI";

const Glotus = new class Glotus {
    readonly SocketManager = SocketManager;
    readonly Controller = Controller;
    readonly GameUI = GameUI;
    readonly Hooker = Hooker;
    readonly UI = UI;
    readonly myPlayer = myPlayer;
    readonly players: Map<number, Player> = new Map;
    readonly settings = settings;
    readonly log = console.log;
    readonly error = console.error;
}
export default Glotus;
window.Glotus = Glotus;

SocketManager.init();
Injector.init();

window.addEventListener("load", () => {
    Controller.init();
    GameUI.init();
    UI.createMenu();
});

window.addEventListener("keydown", (event) => Controller.handleKeydown(event));
window.addEventListener("keyup", (event) => Controller.handleKeyup(event));
DefaultHooks();