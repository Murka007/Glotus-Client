import myPlayer from "../data/ClientPlayer";
import { PlayerObject } from "../data/ObjectItem";
import Projectile from "../data/Projectile";
import GameUI from "../UI/GameUI";
import { IncomingPacket, OutcomingPacket, SocketClient, SocketServer } from "../types/Socket";
import { getUniqueID } from "../utility/Common";
import Hooker from "../utility/Hooker";
import ObjectManager from "./ObjectManager";
import PlayerManager from "./PlayerManager";
import ProjectileManager from "./ProjectileManager";
import { EItem, EWeapon } from "../types/Items";
import { EStoreAction, EStoreType } from "../types/Store";

const SocketManager = new class SocketManager {

    /**
     * Current websocket connection
     */
    private socket: WebSocket | null = null;

    /**
     * Hooked msgpack's Encoder
     */
    private Encoder: null | {
        readonly encode: ((data: any) => Uint8Array);
    } = null;

    /**
     * Hooked msgpacks' Decoder
     */
    private Decoder: null | {
        readonly decode: ((data: Uint8Array) => any);
    } = null;

    /**
     * An array of actions, that should be executed after receiving all packets
     */
    private readonly PacketQueue: (() => void)[] = [];
    startPing = Date.now();

    /**
     * Time in ms between server and client
     */
    ping = 0;

    /**
     * Time in ms between client, server and client
     */
    pong = 0;

    readonly TICK = 1000 / 9;
    startTick = Date.now();
    nextTick = Date.now();

    constructor() {
        this.message = this.message.bind(this);
        const that = this;

        // Intercept msgpack encoder
        Hooker.createRecursiveHook(
            Object.prototype, "initialBufferSize",
            (_this) => {
                this.Encoder = _this;
                return true;
            }
        );

        // Intercept msgpack decoder
        Hooker.createRecursiveHook(
            Object.prototype, "maxExtLength",
            (_this) => {
                this.Decoder = _this;
                return true;
            }
        );

        let packetCount = 0;
        window.WebSocket = new Proxy(WebSocket, {
            construct(target, args: ConstructorParameters<typeof WebSocket>) {
                const socket = new target(...args);
                that.socket = socket;
                const _send = socket.send;
                socket.send = function(data) {
                    packetCount += 1;
                    return _send.call(this, data);
                }
                socket.addEventListener("message", that.message);
                return socket;
            }
        })

        setInterval(() => {
            if (packetCount === 0) return;
            console.log("PacketCount: ", packetCount);
            packetCount = 0;
        }, 1000);
    }

    private handlePing() {
        this.pong = (Date.now() - this.startPing);
        this.ping = this.pong / 2;
        GameUI.updatePing(this.pong);

        setTimeout(() => {
            this.pingRequest();
        }, 2500);
    }

    private message(event: MessageEvent<ArrayBuffer>) {
        if (this.Decoder === null) return;
        
        const data = event.data;
        const decoded = this.Decoder.decode(new Uint8Array(data));
        const temp = [decoded[0], ...decoded[1]] as IncomingPacket;
        if (temp[0] === SocketServer.UPDATE_MINIMAP) return;
        if (temp[0] === SocketServer.UPDATE_LEADERBOARD) return;
        if (temp[0] === SocketServer.UPDATE_AGE) return;
        switch (temp[0]) {

            case SocketServer.PING_RESPONSE: {
                this.handlePing();
                break;
            }

            case SocketServer.CONNECTION_ESTABLISHED: {
                this.pingRequest();
                GameUI.init();
                break;
            }

            case SocketServer.MY_PLAYER_SPAWN:
                myPlayer.playerSpawn(temp[1]);
                break;

            case SocketServer.MY_PLAYER_DEATH:
                myPlayer.reset();
                break;

            case SocketServer.UPDATE_RESOURCES: {
                const type = temp[1] === "points" ? "gold" : temp[1];
                myPlayer.resources[type] = temp[2];
                break;
            }

            case SocketServer.CREATE_PLAYER: {
                const data = temp[1];
                PlayerManager.createPlayer({
                    socketID: data[0],
                    id: data[1],
                    nickname: data[2],
                    skinID: data[9],
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
                const player = PlayerManager.playerData.get(temp[1]);
                if (player !== undefined) {
                    ObjectManager.removePlayerObjects(player);
                }
                break;
            }

            case SocketServer.UPDATE_PLAYER_HEALTH: {
                if (myPlayer.isMyPlayerByID(temp[1])) {
                    myPlayer.updateHealth(temp[2]);
                }
                break;
            }

            case SocketServer.MOVE_UPDATE: {
                this.startTick = Date.now();
                this.nextTick = this.startTick + this.TICK;
                

                PlayerManager.updatePlayer(temp[1]);
                for (let i=0;i<this.PacketQueue.length;i++) {
                    this.PacketQueue[i]();
                }
                this.PacketQueue.length = 0;
                ObjectManager.attackedObjects.clear();
                break;
            }

            case SocketServer.ATTACK_ANIMATION: {
                this.PacketQueue.push(
                    () => PlayerManager.attackPlayer(temp[1], temp[2], temp[3])
                )
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
                        temp[7],
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
                    myPlayer.teammates.clear();
                }
                break;
            }

            case SocketServer.LOAD_AI: {
                PlayerManager.updateAnimal(temp[1] || []);
                break;
            }

            case SocketServer.ITEM_COUNT: {
                myPlayer.updateItemCount(temp[1], temp[2]);
                break;
            }

            case SocketServer.SHOOT_TURRET: {
                this.PacketQueue.push(
                    () => ObjectManager.resetTurret(temp[1])
                )
                break;
            }

            case SocketServer.HIT_OBJECT: {
                const object = ObjectManager.objects.get(temp[2]);
                if (object instanceof PlayerObject && object.isDestroyable()) {
                    ObjectManager.attackedObjects.set(getUniqueID(), object);
                }
                break;
            }

            default:
                // Logger.log(temp);
                break;

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

    equip(type: EStoreType, id: number) {
        this.send([SocketClient.STORE, EStoreAction.EQUIP, id, type]);
    }

    buy(type: EStoreType, id: number) {
        this.send([SocketClient.STORE, EStoreAction.BUY, id, type]);
    }

    chat(message: string) {
        this.send([SocketClient.CHAT, message]);
    }

    attack(angle: number | null) {
        this.send([SocketClient.ATTACK, 1, angle]);
    }

    stopAttack() {
        this.send([SocketClient.ATTACK, 0, null]);
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

    selectItemByID(id: EWeapon | EItem, type: boolean) {
        this.send([SocketClient.SELECT_ITEM, id, type]);
    }

    spawn(name: string, moofoll: 1 | 0, skin: number) {
        this.send([SocketClient.SPAWN, { name, moofoll, skin }]);
    }

    upgradeItem(id: number) {
        this.send([SocketClient.UPGRADE_ITEM, id]);
    }

    updateAngle(radians: number) {
        this.send([SocketClient.ANGLE, radians]);
    }

    pingRequest() {
        this.startPing = Date.now();
        this.send([SocketClient.PING_REQUEST]);
    }
}

export default SocketManager;