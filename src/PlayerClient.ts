import EnemyManager from "./Managers/EnemyManager";
import LeaderboardManager from "./Managers/LeaderboardManager";
import ObjectManager from "./Managers/ObjectManager";
import PlayerManager from "./Managers/PlayerManager";
import ProjectileManager from "./Managers/ProjectileManager";
import SocketManager from "./Managers/SocketManager";
import ClientPlayer from "./data/ClientPlayer";
import ModuleHandler from "./features/ModuleHandler";
import { ISocket } from "./types/Socket";

class PlayerClient {
    id = -1;
    stableConnection = false;
    readonly connection: ISocket;
    readonly isOwner: boolean;
    readonly SocketManager: SocketManager;
    readonly ObjectManager: ObjectManager;
    readonly PlayerManager: PlayerManager;
    readonly ProjectileManager: ProjectileManager;
    readonly LeaderboardManager: LeaderboardManager;
    readonly EnemyManager: EnemyManager;
    readonly ModuleHandler: ModuleHandler;
    readonly myPlayer: ClientPlayer;

    readonly pendingJoins = new Set<number>();
    readonly clientIDList = new Set<number>();
    readonly clients = new Set<PlayerClient>();
    totalKills = 0;
    
    constructor(connection: ISocket, isOwner: boolean) {
        this.connection = connection;
        this.isOwner = isOwner;
        this.SocketManager = new SocketManager(this);
        this.ObjectManager = new ObjectManager(this);
        this.PlayerManager = new PlayerManager(this);
        this.ProjectileManager = new ProjectileManager(this);
        this.LeaderboardManager = new LeaderboardManager(this);
        this.EnemyManager = new EnemyManager(this);
        this.ModuleHandler = new ModuleHandler(this);
        this.myPlayer = new ClientPlayer(this);
    }

    disconnect() {
        const socket = this.connection.socket;
        if (socket !== undefined) {
            socket.close();
        }
    }

    // getTotalKills() {
    //     let kills = this.myPlayer.resources.kills;
    //     for (const client of this.clients) {
    //         kills += client.myPlayer.resources.kills;
    //     }
    //     return kills;

    // }
}

export default PlayerClient;