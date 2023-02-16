import Glotus from "..";
import { Hats, TAccessory, THat } from "../constants/Store";
import myPlayer from "../data/ClientPlayer";
import Projectile from "../data/Projectile";
import Controller from "../modules/Controller";
import { ValueOf } from "../types/Common";
import { TItem, TWeapon, WeaponType } from "../types/Items";
import { IncomingPacket, OutcomingPacket, SocketClient, SocketServer, Store, StoreType } from "../types/Socket";
import ObjectManager from "./ObjectManager";
import PlayerManager from "./PlayerManager";
import ProjectileManager from "./ProjectileManager";

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
            (_this) => true,
            (_this) => {
                this.Encoder = _this;
                return true;
            }
        );

        // Intercept msgpack decoder
        Glotus.Hooker.createRecursiveHook(
            Object.prototype, "maxExtLength",
            (_this) => true,
            (_this) => {
                this.Decoder = _this;
                return true;
            }
        );

        window.WebSocket = new Proxy(WebSocket, {
            construct(target, args: [url: string | URL, protocols?: string | string[]]) {
                const socket: WebSocket = new target(...args);
                that.socket = socket;

                socket.addEventListener("message", that.message);

                // let start = Date.now();
                // socket.send = new Proxy(socket.send, {
                //     apply(target, _this, args: [string | ArrayBufferLike | Blob | ArrayBufferView]) {
                //         if (args[0] instanceof Uint8Array) {
                //             const decoded = that.Decoder?.decode(new Uint8Array(args[0]));
                //             const temp = [decoded[0], ...decoded[1]] as OutcomingPacket;
                //         }
                //         return target.apply(_this, args);
                //     }
                // });

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
            if (temp[0] === SocketServer.UPDATE_MINIMAP) return;
            if (temp[0] === SocketServer.UPDATE_LEADERBOARD) return;

            switch (temp[0]) {

                case SocketServer.MY_PLAYER_SPAWN:
                    myPlayer.spawned(temp[1]);
                    break;

                case SocketServer.MY_PLAYER_DEATH:
                    myPlayer.reset();
                    break;

                case SocketServer.UPDATE_ITEMS: {
                    myPlayer.updateItems(temp[1], temp[2] === 1);
                    break;
                }

                case SocketServer.UPDATE_RESOURCES: {
                    const type = temp[1] === "points" ? "gold" : temp[1];
                    myPlayer.resources[type] = temp[2];
                    break;
                }

                case SocketServer.CREATE_PLAYER: {
                    PlayerManager.createPlayer({
                        id: temp[1][1],
                        nickname: temp[1][2],
                        skinID: temp[1][9],
                    })
                    break;
                }

                case SocketServer.ADD_OBJECT: {
                    ObjectManager.createObjects(temp[1]);
                    break;
                }

                case SocketServer.REMOVE_OBJECT: {
                    ObjectManager.removeObjectByID(temp[1]);
                    break;
                }

                case SocketServer.REMOVE_ALL_OBJECTS: {
                    ObjectManager.removePlayerObjects(temp[1]);
                    break;
                }

                case SocketServer.MOVE_UPDATE: {
                    PlayerManager.updatePosition(temp[1]);
                    break;
                }

                case SocketServer.ATTACK_ANIMATION: {
                    PlayerManager.attackPlayer(temp[1], temp[3]);
                    break;
                }

                case SocketServer.CREATE_PROJECTILE: {
                    ProjectileManager.createProjectile(
                        new Projectile(
                            temp[1],
                            temp[2],
                            temp[3],
                            temp[4],
                            temp[5],
                            temp[6],
                            temp[7] === 1,
                            temp[8]
                        )
                    )
                    break;
                }

                case SocketServer.UPDATE_CLAN_MEMBERS: {
                    myPlayer.updateClanMembers(temp[1]);
                    break;
                }

                case SocketServer.UPDATE_MY_CLAN: {
                    if (typeof temp[1] !== "string") {
                        Controller.teammates.length = 0;
                    }
                    break;
                }

                case SocketServer.LOAD_AI: {
                    PlayerManager.updateAnimal(temp[1] || []);
                }

                default:
                    // Glotus.log(temp);
                    break;

            }
        } catch(err) {
            Glotus.error("Packet decode error: ", data, err);
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

    equip(type: ValueOf<typeof StoreType>, id: THat | TAccessory) {
        this.send([SocketClient.STORE, Store.EQUIP, id, type]);
    }

    buy(type: ValueOf<typeof StoreType>, id: THat | TAccessory) {
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