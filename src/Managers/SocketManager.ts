import Glotus from "..";
import { Items, Weapons } from "../constants/Items";
import { EAccessory, EHat } from "../constants/Store";
import Player from "../data/Player";
import { ValueOf } from "../types/Common";
import { TItem, TWeapon } from "../types/Items";
import { IncomingPacket, OutcomingPacket, SocketClient, SocketServer, Store, StoreType } from "../types/Socket";

const SocketManager = new class SocketManager {
    private socket: WebSocket | null = null;
    private Encoder: null | {
        readonly encode: ((data: any) => Uint8Array);
    } = null;
    private Decoder: null | {
        readonly decode: ((data: Uint8Array) => any);
    } = null;

    constructor() {
        this.message = this.message.bind(this);
    }

    init() {
        const that = this;

        // Intercept msgpack encoder
        Glotus.Hooker.createRecursiveHook(
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
        Glotus.Hooker.createRecursiveHook(
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
                const socket = new target(...args);
                that.socket = socket;

                socket.addEventListener("message", that.message);

                // let count = 0;

                // socket.send = new Proxy(socket.send, {
                //     apply(target, _this, args: [string | ArrayBufferLike | Blob | ArrayBufferView]) {
                //         count++;
                //         return target.apply(_this, args);
                //     }
                // });

                // const interval = setInterval(() => {
                //     Glotus.log(`Packet send count: ${count}`);
                //     count = 0;
                // }, 1000);

                return socket;
            }
        })
    }

    message(event: MessageEvent<ArrayBuffer>) {
        if (this.Decoder === null) return;
        
        const data = event.data;
        try {
            const decoded = this.Decoder.decode(new Uint8Array(data));
            const temp = [decoded[0], ...decoded[1]] as IncomingPacket;
            if (temp[0] === SocketServer.PING_RESPONSE) return;
            if (temp[0] === SocketServer.LOAD_AI) return;
            if (temp[0] === SocketServer.UPDATE_MINIMAP) return;
            if (temp[0] === SocketServer.UPDATE_LEADERBOARD) return;

            switch (temp[0]) {

                case SocketServer.MY_PLAYER_SPAWN:
                    Glotus.myPlayer.id = temp[1];
                    Glotus.myPlayer.inGame = true;
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
                    const data = temp[1];
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
            Glotus.error("Packet decode error: ", data);
        }
    }

    private send(data: OutcomingPacket) {
        if (
            this.socket === null ||
            this.socket.readyState !== this.socket.OPEN ||
            this.Encoder === null
        ) return;

        const [type, ...args] = data;
        const encoded = this.Encoder.encode([type, args]);
        this.socket.send(encoded);
    }

    clanRequest(id: number, accept: boolean) {
        this.send([SocketClient.ACCEPT_CLAN_JOIN_REQUEST, id, Number(accept)]);
    }

    kick(id: number) {
        this.send([SocketClient.KICK_FROM_CLAN, id]);
    }

    joinClan(name: string) {
        this.send([SocketClient.JOIN_CLAN, name]);
    }

    createClan(name: string) {
        this.send([SocketClient.CREATE_CLAN, name]);
    }

    leaveClan() {
        this.send([SocketClient.LEAVE_CLAN]);
    }

    equip(type: ValueOf<typeof StoreType>, id: EHat | EAccessory) {
        this.send([SocketClient.STORE, Store.EQUIP, id, type]);
    }

    buy(type: ValueOf<typeof StoreType>, id: EHat | EAccessory) {
        this.send([SocketClient.STORE, Store.BUY, id, type]);
    }

    chat(message: string) {
        this.send([SocketClient.CHAT, message]);
    }

    attack(angle: number | null) {
        this.send([SocketClient.ATTACK, 1, angle]);
    }

    stopAttack(angle: number | null) {
        this.send([SocketClient.ATTACK, 0, angle]);
    }

    resetMoveDir() {
        this.send([SocketClient.RESET_MOVE_DIR]);
    }

    move(angle: number | null) {
        this.send([SocketClient.MOVE, angle]);
    }

    autoAttack() {
        this.send([SocketClient.PLAYER_CONTROL, 1]);
    }

    lockRotation() {
        this.send([SocketClient.PLAYER_CONTROL, 0]);
    }

    pingMap() {
        this.send([SocketClient.PING_MAP]);
    }

    selectItemByID(id: TWeapon | TItem, type: boolean) {
        this.send([SocketClient.SELECT_ITEM, id, type]);
    }

    // selectItemByID(id: EItems) {
    //     this.send([SocketClient.SELECT_ITEM, id, false]);
    // }

    // selectWeaponByID(id: EWeapons) {
    //     this.send([SocketClient.SELECT_ITEM, id, true]);
    // }

    spawn(name: string, moofoll: 1 | 0, skin: number) {
        this.send([SocketClient.SPAWN, { name, moofoll, skin }]);
    }

    upgradeItem(id: TWeapon | TItem) {
        this.send([SocketClient.UPGRADE_ITEM, id]);
    }

    updateAngle(radians: number) {
        this.send([SocketClient.ANGLE, radians]);
    }

    pingRequest() {
        this.send([SocketClient.PING_REQUEST]);
    }
}

export default SocketManager;