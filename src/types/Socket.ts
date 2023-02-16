import { TAccessory, THat } from "../constants/Store";
import { ValueOf } from "./Common";
import { TItem, TWeapon } from "./Items";

export enum SocketServer {
    CONNECTION_ESTABLISHED = "io-init",
    CLAN_INFO_INIT = "id",
    PING_RESPONSE = "pp",
    ADD_ALLIANCE = "ac",
    REMOVE_PLAYER = "4",
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
    PLAYER_CLAN_JOIN_REQUEST = "an",
    UPDATE_CLAN_MEMBERS = "sa",
    UPDATE_MY_CLAN = "st",
    ATTACK_ANIMATION = "7",
    CREATE_PROJECTILE = "18",
    ADD_OBJECT = "6",
    REMOVE_OBJECT = "12",
    REMOVE_ALL_OBJECTS = "13",
}

export enum SocketClient {
    ACCEPT_CLAN_JOIN_REQUEST = "11",
    KICK_FROM_CLAN = "12",
    JOIN_CLAN = "10",
    CREATE_CLAN = "8",
    LEAVE_CLAN = "9",
    STORE = "13c",
    CHAT = "ch",
    RESET_MOVE_DIR = "rmd",
    ATTACK = "c",
    MOVE = "33",
    PLAYER_CONTROL = "7",
    PING_MAP = "14",
    SELECT_ITEM = "5",
    SPAWN = "sp",
    UPGRADE_ITEM = "6",
    ANGLE = "2",
    PING_REQUEST = "pp",
}

interface ITeam {
    readonly sid: string;
    readonly owner: number;
}
interface ITeams {
    readonly teams: ITeam[];
}

export type PLAYER_DATA = [
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
];

export type IncomingPacket = 
    [SocketServer.CONNECTION_ESTABLISHED, string] |
    [SocketServer.CLAN_INFO_INIT, ITeams] |
    [SocketServer.PING_RESPONSE] |
    [SocketServer.ADD_ALLIANCE, ITeam[]] |
    [SocketServer.REMOVE_PLAYER, string] |
    [SocketServer.REMOVE_ALL_OBJECTS, number] |
    [SocketServer.MY_PLAYER_SPAWN, number] |
    [SocketServer.MY_PLAYER_DEATH] |
    [SocketServer.CREATE_PLAYER, PLAYER_DATA, boolean] |
    [SocketServer.MOVE_UPDATE, any[]] |
    [SocketServer.UPDATE_LEADERBOARD, any[]] |
    [SocketServer.LOAD_AI, [number, number, number, number, number, number, number] | undefined] |
    [SocketServer.UPDATE_MINIMAP] |
    [SocketServer.UPDATE_ITEMS, [TWeapon], 1] |
    [SocketServer.UPDATE_ITEMS, [TItem], undefined] |
    [packet: SocketServer.UPDATE_AGE, xp: number] |
    [packet: SocketServer.UPDATE_AGE, xp: number, maxXP: number, age: number] |
    [SocketServer.UPDATE_RESOURCES, "food" | "wood" | "stone" | "points" | "kills", number, 1] |
    [SocketServer.UPDATE_CLAN_MEMBERS, (number | string)[]] |
    [SocketServer.UPDATE_MY_CLAN, string | null, boolean] |
    [SocketServer.ATTACK_ANIMATION, number, 1 | 0, TWeapon] |
    [SocketServer.CREATE_PROJECTILE, number, number, number, number, number, number, 0 | 1, number] |
    [SocketServer.ADD_OBJECT, any[]] |
    [SocketServer.REMOVE_OBJECT, number];

export const Store = {
    EQUIP: 0,
    BUY: 1
} as const;

export const StoreType = {
    HAT: 0,
    ACCESSORY: 1
} as const;

interface ISpawn {
    readonly name: string;
    readonly moofoll: 1 | 0;
    readonly skin: number;
}

export type OutcomingPacket =
    [SocketClient.ACCEPT_CLAN_JOIN_REQUEST, number, number] |
    [SocketClient.KICK_FROM_CLAN, number] |
    [SocketClient.JOIN_CLAN, string] |
    [SocketClient.CREATE_CLAN, string] |
    [SocketClient.LEAVE_CLAN] |
    [SocketClient.STORE, ValueOf<typeof Store>, THat | TAccessory, ValueOf<typeof StoreType>] |
    [SocketClient.CHAT, string] |
    [SocketClient.RESET_MOVE_DIR] |
    [SocketClient.ATTACK, 1 | 0, number | null] |
    [SocketClient.MOVE, number | null] |
    [SocketClient.PLAYER_CONTROL, 1 | 0] |
    [SocketClient.PING_MAP] |
    [SocketClient.SELECT_ITEM, TItem | TWeapon, boolean] |
    [SocketClient.SPAWN, ISpawn] |
    [SocketClient.UPGRADE_ITEM, TItem | TWeapon] |
    [SocketClient.ANGLE, number] |
    [SocketClient.PING_REQUEST];