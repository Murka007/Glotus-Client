import { EItems, EWeapons } from "../constants/Items";

export enum SocketServer {
    CONNECTION_ESTABLISHED = "io-init",
    CLAN_INFO_INIT = "id",
    PING_RESPONSE = "pp",
    ADD_ALLIANCE = "ac",
    REMOVE_PLAYER = "4",
    REMOVE_ALL_OBJECTS = "13",
    MY_PLAYER_SPAWN = "1",
    MY_PLAYER_DEATH = "11",
    CREATE_PLAYER = "2",
    MOVE_UPDATE = "33",
    LOAD_AI = "a",
    UPDATE_MINIMAP = "mm",
    UPDATE_ITEMS = "17",
    UPDATE_LEADERBOARD = "5",
    UPDATE_AGE = "15",
    UPDATE_RESOURCES = "9",
}

interface ITeam {

    /**
     * Name of the clan
     */
    readonly sid: string;

    /**
     * idk for now
     */
    readonly owner: number;
}
interface ITeams {
    readonly teams: ITeam[];
}

type CREATE_PLAYER = [
    playerData: [
        uniqueID: string,
        id: number,
        nickname: string,
        x: number,
        y: number,
        angle: number,
        health: number,
        maxHealth: number,
        radius: number,
        skinID: number
    ],
    isMyPlayer: boolean
]

export type IncomingPacket = 
    [SocketServer.CONNECTION_ESTABLISHED, string] |
    [SocketServer.CLAN_INFO_INIT, ITeams] |
    [SocketServer.PING_RESPONSE] |
    [SocketServer.ADD_ALLIANCE, ITeam[]] |
    [SocketServer.REMOVE_PLAYER, string] |
    [SocketServer.REMOVE_ALL_OBJECTS, number] |
    [SocketServer.MY_PLAYER_SPAWN, number] |
    [SocketServer.MY_PLAYER_DEATH] |
    [SocketServer.CREATE_PLAYER, CREATE_PLAYER] |
    [SocketServer.MOVE_UPDATE, any[]] |
    [SocketServer.UPDATE_LEADERBOARD, any[]] |
    [SocketServer.LOAD_AI] |
    [SocketServer.UPDATE_MINIMAP] |
    [SocketServer.UPDATE_ITEMS, [EWeapons], 1] |
    [SocketServer.UPDATE_ITEMS, [EItems], undefined] |
    [packet: SocketServer.UPDATE_AGE, xp: number] |
    [packet: SocketServer.UPDATE_AGE, xp: number, maxXP: number, age: number] |
    [SocketServer.UPDATE_RESOURCES, "food" | "wood" | "stone" | "points" | "kills", number, 1]