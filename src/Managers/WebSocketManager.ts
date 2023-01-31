import Glotus from "..";
import { Items, Weapons } from "../constants/Items";
import Player from "../data/Player";
import { IncomingPacket, SocketServer } from "../types/WebSocket";

class WebSocketManager {
    socket: WebSocket | null;
    Encoder: null | {
        readonly encode: ((data: any) => Uint8Array);
    }
    Decoder: null | {
        readonly decode: ((data: Uint8Array) => any);
    }

    constructor() {
        this.socket = null;
        this.Encoder = null;
        this.Decoder = null;
    }

    init() {
        const that = this;

        // Intercept msgpack encoder
        Glotus.HookManager.createRecursiveHook(
            Object.prototype, "initialBufferSize",
            (_this) => (
                typeof _this === "object" &&
                typeof _this.encode === "function" &&
                _this.encode.length === 1
            ),
            (_this) => {
                this.Encoder = _this;
                return true;
            }
        );

        // Intercept msgpack decoder
        Glotus.HookManager.createRecursiveHook(
            Object.prototype, "maxExtLength",
            (_this) => (
                typeof _this === "object" &&
                typeof _this.decode === "function" &&
                _this.decode.length === 1
            ),
            (_this) => {
                this.Decoder = _this;
                return true;
            }
        );

        window.WebSocket = new Proxy(WebSocket, {
            construct(target, args: [url: string | URL, protocols?: string | string[]]) {
                const ws = new target(...args);
                that.socket = ws;

                ws.addEventListener("message", event => {
                    that.message(event.data);
                })

                return ws;
            }
        })
    }

    message(data: ArrayBuffer) {
        if (this.Decoder === null) return;

        const decoded = this.Decoder.decode(new Uint8Array(data));
        try {
            const temp = [decoded[0], ...decoded[1]] as IncomingPacket;
            if (temp[0] === SocketServer.PING_RESPONSE) return;
            if (temp[0] === SocketServer.LOAD_AI) return;
            if (temp[0] === SocketServer.UPDATE_MINIMAP) return;
            if (temp[0] === SocketServer.UPDATE_LEADERBOARD) return;
            switch (temp[0]) {

                case SocketServer.MY_PLAYER_SPAWN:
                    Glotus.myPlayer.id = temp[1];
                    if (!Glotus.players.has(temp[1])) {
                        Glotus.players.set(temp[1], Glotus.myPlayer);
                    }
                    break;

                case SocketServer.MY_PLAYER_DEATH:
                    Glotus.myPlayer.reset();
                    break;

                case SocketServer.UPDATE_ITEMS: {
                    const isWeaponUpdate = temp[2] === 1;
                    const InventoryItems = isWeaponUpdate ? Weapons : Items;
                    for (const id of temp[1]) {
                        const item = InventoryItems[id];
                        Glotus.myPlayer.inventory[item.itemType] = id;
                    }
                    break;
                }

                case SocketServer.UPDATE_RESOURCES: {
                    const type = temp[1] === "points" ? "gold" : temp[1];
                    Glotus.myPlayer.resources[type] = temp[2];
                    break;
                }

                case SocketServer.CREATE_PLAYER: {
                    const data = temp[1][0];
                    const player = Glotus.players.get(data[1]) || new Player;
                    if (!Glotus.players.has(data[1])) {
                        Glotus.players.set(data[1], player);
                    }
                    player.nickname = data[2];
                    player.skinID = data[9];
                }

                case SocketServer.MOVE_UPDATE: {
                    const buffer = temp[1];
                    for (let i=0;i<buffer.length;i+=13) {
                        const player = Glotus.players.get(buffer[i]);
                        if (!player) continue;
                        player.update(
                            buffer[i],
                            buffer[i + 1],
                            buffer[i + 2],
                            buffer[i + 3],
                            buffer[i + 4],
                            buffer[i + 5],
                            buffer[i + 6],
                            buffer[i + 7],
                            buffer[i + 8],
                            buffer[i + 9],
                            buffer[i + 10],
                            buffer[i + 11]
                        )
                    }
                    break;
                }

            }
        } catch(err) {
            Glotus.error("Packet decode error: ", decoded);
        }
    }

    private send() {
        if (
            this.socket === null ||
            this.socket.readyState !== this.socket.OPEN ||
            this.Encoder === null
        ) return;
    }
}

export default WebSocketManager;