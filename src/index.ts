import ClientPlayer from "./data/ClientPlayer";
import Player from "./data/Player";
import HookManager from "./Managers/HookManager";
import Injector from "./Managers/Injector";
import WebSocketManager from "./Managers/WebSocketManager";

const Glotus = new class Glotus {
    readonly HookManager = new HookManager();
    readonly WebSocketManager = new WebSocketManager();
    readonly myPlayer = new ClientPlayer;
    readonly players: Map<number, Player> = new Map;
    readonly log = console.log;
    readonly error = console.error;
}
export default Glotus;
window.Glotus = Glotus;

Glotus.WebSocketManager.init();
Injector.init();

window.onbeforeunload = null;