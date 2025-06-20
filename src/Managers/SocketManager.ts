import { Resource } from "../data/ObjectItem";
import Projectile from "../data/Projectile";
import GameUI from "../UI/GameUI";
import { IncomingPacket, OutcomingPacket, SocketClient, SocketServer } from "../types/Socket";
import { getUniqueID } from "../utility/Common";
import { EItem, EWeapon } from "../types/Items";
import { EStoreAction, EStoreType } from "../types/Store";
import Vector from "../modules/Vector";
import PlayerClient from "../PlayerClient";
import { clearInterval } from "timers";
import StoreHandler from "../UI/StoreHandler";

class SocketManager {
    private readonly client: PlayerClient;

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

    packetCount = 0;
    tickTimeout: ReturnType<typeof setTimeout> | undefined;

    constructor(client: PlayerClient) {
        this.message = this.message.bind(this);
        this.client = client;

        const attachMessage = (socket: WebSocket) => {
            socket.addEventListener("message", this.message);
            socket.onclose = () => {
                socket.removeEventListener("message", this.message);
            }

            // let count = 0;
            // const send = socket.send;
            // socket.send = function(data) {
            //     count += 1;
            //     return send.call(this, data);
            // }

            // setInterval(() => {
            //     // if (count === 0) return;
            //     console.log("COUNT: ", count);
            //     count = 0;
            // }, 1000);
        }

        const connection = client.connection;
        if (connection.socket === undefined) {
            Object.defineProperty(connection, "socket", {
                set(value: WebSocket) {
                    delete connection.socket;
                    connection.socket = value;
                    attachMessage(value);
                },
                configurable: true
            })
            return;
        }
        attachMessage(connection.socket);
    }

    private handlePing() {
        this.pong = (Date.now() - this.startPing);
        this.ping = this.pong / 2;
        
        if (this.client.isOwner) {
            GameUI.updatePing(this.pong);
        }

        setTimeout(() => {
            this.pingRequest();
        }, 3000);
    }

    private message(event: MessageEvent<ArrayBuffer>) {
        const decoder = this.client.connection.Decoder;
        if (decoder === null) return;
        
        const data = event.data;
        const decoded = decoder.decode(new Uint8Array(data));
        const temp = [decoded[0], ...decoded[1]] as IncomingPacket;
        const { myPlayer, PlayerManager, ObjectManager, ProjectileManager, LeaderboardManager } = this.client;
        switch (temp[0]) {

            case SocketServer.PING_RESPONSE: {
                this.handlePing();
                break;
            }

            case SocketServer.CONNECTION_ESTABLISHED: {
                this.pingRequest();
                this.client.stableConnection = true;
                if (this.client.isOwner) {
                    GameUI.loadGame();
                } else {
                    this.client.myPlayer.spawn();
                    this.client.connection.socket!.dispatchEvent(new Event("connected"));
                }

                break;
            }

            case SocketServer.MY_PLAYER_SPAWN:
                myPlayer.playerInit(temp[1]);
                break;

            case SocketServer.MY_PLAYER_DEATH:
                myPlayer.reset();
                break;

            case SocketServer.UPDATE_RESOURCES: {
                this.PacketQueue.push(
                    () => {
                        const type = temp[1] === "points" ? "gold" : temp[1];
                        myPlayer.updateResources(type, temp[2]);
                    }
                )
                break;
            }

            case SocketServer.CREATE_PLAYER: {
                const data = temp[1];
                PlayerManager.createPlayer({
                    socketID: data[0],
                    id: data[1],
                    nickname: data[2],
                    health: data[6],
                    skinID: data[9],
                })
                break;
            }
            
            case SocketServer.UPDATE_PLAYER_HEALTH: {
                const player = PlayerManager.playerData.get(temp[1]);
                if (player !== undefined) {
                    player.updateHealth(temp[2]);
                }
                break;
            }

            case SocketServer.MOVE_UPDATE: {
                PlayerManager.updatePlayer(temp[1]);
                for (let i=0;i<this.PacketQueue.length;i++) {
                    this.PacketQueue[i]();
                }
                this.PacketQueue.length = 0;
                ObjectManager.attackedObjects.clear();
                break;
            }
            
            case SocketServer.LOAD_AI: {
                PlayerManager.updateAnimal(temp[1] || []);
                clearTimeout(this.tickTimeout);
                this.tickTimeout = setTimeout(() => {
                    PlayerManager.postTick();
                }, 5);
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

            case SocketServer.HIT_OBJECT: {
                const object = ObjectManager.objects.get(temp[2]);
                if (object instanceof Resource || object && object.isDestroyable) {
                    ObjectManager.attackedObjects.set(getUniqueID(), [temp[1], object]);
                }
                break;
            }

            case SocketServer.ATTACK_ANIMATION: {
                this.PacketQueue.push(
                    () => PlayerManager.attackPlayer(temp[1], temp[2], temp[3])
                )
                break;
            }

            case SocketServer.SHOOT_TURRET: {
                const id = temp[1];
                const angle = temp[2];

                const turret = ObjectManager.objects.get(id);
                if (turret !== undefined) {
                    const creations = ProjectileManager.ignoreCreation;
                    const pos = turret.position.current.stringify();
                    creations.add(pos + ":" + angle);
                }

                this.PacketQueue.push(
                    () => ObjectManager.resetTurret(id)
                )
                break;
            }

            case SocketServer.CREATE_PROJECTILE: {
                const x = temp[1];
                const y = temp[2];
                const angle = temp[3];

                const key = `${x}:${y}:${angle}`;
                if (ProjectileManager.ignoreCreation.delete(key)) {
                    return;
                }

                const projectile = new Projectile(
                    angle,
                    temp[4],
                    temp[5],
                    temp[6],
                    temp[7],
                    temp[8]
                );
                projectile.position.current = projectile.formatFromCurrent(new Vector(x, y), false);
                ProjectileManager.createProjectile(projectile);
                break;
            }

            // case SocketServer.REMOVE_PROJECTILE: {
            //     console.log(temp);
            //     break;
            // }

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

            case SocketServer.PLAYER_CLAN_JOIN_REQUEST: {
                myPlayer.handleJoinRequest(temp[1], temp[2]);
                break;
            }

            case SocketServer.UPDATE_AGE: {
                if (temp.length === 4) {
                    myPlayer.updateAge(temp[3]);
                }
                break;
            }

            case SocketServer.NEW_UPGRADE: {
                myPlayer.newUpgrade(temp[1], temp[2]);
                break;
            }

            case SocketServer.ITEM_COUNT: {
                myPlayer.updateItemCount(temp[1], temp[2]);
                break;
            }

            case SocketServer.UPDATE_LEADERBOARD:
                LeaderboardManager.update(temp[1]);
                break;

            case SocketServer.UPDATE_STORE: {
                const action = temp[1] === 0 ? 1 : 0;
                StoreHandler.updateStoreState(temp[3], action, temp[2]);
                break;
            }
        }
    }

    private send(data: OutcomingPacket) {
        const connection = this.client.connection;
        if (
            connection.socket === undefined ||
            connection.socket.readyState !== connection.socket.OPEN ||
            connection.Encoder === null
        ) return;

        const [type, ...args] = data;
        const encoded = connection.Encoder.encode([type, args]);
        connection.socket.send(encoded);
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
        this.client.myPlayer.joinRequests.length = 0;
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

    spawn(name: string, moofoll: 1 | 0, skin: any) {
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