import { EItem, EWeapon, ItemGroup, TMelee } from "./Items";
import { EStoreAction, EStoreType } from "./Store";

// export const enum SocketServer {
//     CONNECTION_ESTABLISHED = "io-init",
//     CLAN_INFO_INIT = "id",
//     PING_RESPONSE = "pp",
//     ADD_ALLIANCE = "ac",
//     REMOVE_PLAYER = "4",
//     MY_PLAYER_SPAWN = "1",
//     MY_PLAYER_DEATH = "11",
//     CREATE_PLAYER = "2",
//     MOVE_UPDATE = "33",
//     LOAD_AI = "a",
//     UPDATE_MINIMAP = "mm",
//     NEW_UPGRADE = "16",
//     UPDATE_ITEMS = "17",
//     UPDATE_LEADERBOARD = "5",
//     UPDATE_AGE = "15",
//     UPDATE_RESOURCES = "9",
//     PLAYER_CLAN_JOIN_REQUEST = "an",
//     UPDATE_CLAN_MEMBERS = "sa",
//     UPDATE_MY_CLAN = "st",
//     ATTACK_ANIMATION = "7",
//     CREATE_PROJECTILE = "18",
//     REMOVE_PROJECTILE = "19",
//     ADD_OBJECT = "6",
//     REMOVE_OBJECT = "12",
//     REMOVE_ALL_OBJECTS = "13",
//     ITEM_COUNT = "14",
//     UPDATE_PLAYER_HEALTH = "h",
//     HIT_OBJECT = "8",
//     SHOOT_TURRET = "sp",
//     UPDATE_STORE = "us",
// }

export const enum SocketServer {
    CONNECTION_ESTABLISHED   = "io-init",
    CLAN_INFO_INIT           = "A",
    DISCONNECT               = "B",
    MY_PLAYER_SPAWN          = "C",
    CREATE_PLAYER            = "D",
    REMOVE_PLAYER            = "E",
    MOVE_UPDATE              = "a",
    UPDATE_LEADERBOARD       = "G",
    ADD_OBJECT               = "H",
    LOAD_AI                  = "I",
    ANIMATE_AI               = "J",
    ATTACK_ANIMATION         = "K",
    HIT_OBJECT               = "L",
    SHOOT_TURRET             = "M",
    UPDATE_RESOURCES         = "N",
    UPDATE_PLAYER_HEALTH     = "O",
    MY_PLAYER_DEATH          = "P",
    REMOVE_OBJECT            = "Q",
    REMOVE_ALL_OBJECTS       = "R",
    ITEM_COUNT               = "S",
    UPDATE_AGE               = "T",
    NEW_UPGRADE              = "U",
    UPDATE_ITEMS             = "V",
    CREATE_PROJECTILE        = "X",
    REMOVE_PROJECTILE        = "Y",
    SHUTDOWN_SERVER          = "Z",
    ADD_ALLIANCE             = "g",
    REMOVE_ALLIANCE          = "1",
    PLAYER_CLAN_JOIN_REQUEST = "2",
    UPDATE_MY_CLAN           = "3",
    UPDATE_CLAN_MEMBERS      = "4",
    UPDATE_STORE             = "5",
    RECEIVE_CHAT             = "6",
    UPDATE_MINIMAP           = "7",
    SHOW_TEXT                = "8",
    PING_MAP                 = "9",
    PING_RESPONSE            = "0",
}

// const data = {
//     "io-init": "CONNECTION_ESTABLISHED",
//     "id": "CLAN_INFO_INIT",
//     "d": "DISCONNECT",
//     "1": "MY_PLAYER_SPAWN",
//     "2": "CREATE_PLAYER",
//     "4": "REMOVE_PLAYER",
//     "33": "MOVE_UPDATE",
//     "5": "UPDATE_LEADERBOARD",
//     "6": "ADD_OBJECT",
//     "a": "LOAD_AI",
//     "aa": "ANIMATE_AI",
//     "7": "ATTACK_ANIMATION",
//     "8": "HIT_OBJECT",
//     "sp": "SHOOT_TURRET",
//     "9": "UPDATE_RESOURCES",
//     "h": "UPDATE_PLAYER_HEALTH",
//     "11": "MY_PLAYER_DEATH",
//     "12": "REMOVE_OBJECT",
//     "13": "REMOVE_ALL_OBJECTS",
//     "14": "ITEM_COUNT",
//     "15": "UPDATE_AGE",
//     "16": "NEW_UPGRADE",
//     "17": "UPDATE_ITEMS",
//     "18": "CREATE_PROJECTILE",
//     "19": "REMOVE_PROJECTILE",
//     "20": "SHUTDOWN_SERVER",
//     "ac": "ADD_ALLIANCE",
//     "ad": "REMOVE_ALLIANCE",
//     "an": "PLAYER_CLAN_JOIN_REQUEST",
//     "st": "UPDATE_MY_CLAN",
//     "sa": "UPDATE_CLAN_MEMBERS",
//     "us": "UPDATE_STORE",
//     "ch": "RECEIVE_CHAT",
//     "mm": "UPDATE_MINIMAP",
//     "t": "SHOW_TEXT",
//     "p": "PING_MAP",
//     "pp": "PING_RESPONSE",
// };

// export const enum SocketClient {
//     ACCEPT_CLAN_JOIN_REQUEST = "11",
//     KICK_FROM_CLAN           = "12",
//     JOIN_CLAN                = "10",
//     CREATE_CLAN              = "8",
//     LEAVE_CLAN               = "9",
//     STORE                    = "13c",
//     CHAT                     = "ch",
//     RESET_MOVE_DIR           = "rmd",
//     ATTACK                   = "c",
//     MOVE                     = "33",
//     PLAYER_CONTROL           = "7",
//     PING_MAP                 = "14",
//     SELECT_ITEM              = "5",
//     SPAWN                    = "sp",
//     UPGRADE_ITEM             = "6",
//     ANGLE                    = "2",
//     PING_REQUEST             = "pp",
// }

export const enum SocketClient {
    ACCEPT_CLAN_JOIN_REQUEST = "P",
    KICK_FROM_CLAN           = "Q",
    JOIN_CLAN                = "b",
    CREATE_CLAN              = "L",
    LEAVE_CLAN               = "N",
    STORE                    = "c",
    CHAT                     = "6",
    RESET_MOVE_DIR           = "e",
    ATTACK                   = "d",
    MOVE                     = "a",
    PLAYER_CONTROL           = "K",
    PING_MAP                 = "S",
    SELECT_ITEM              = "G",
    SPAWN                    = "M",
    UPGRADE_ITEM             = "H",
    ANGLE                    = "D",
    PING_REQUEST             = "0",
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
    [SocketServer.PLAYER_CLAN_JOIN_REQUEST, number, string] |
    [SocketServer.NEW_UPGRADE, number, number] |
    [SocketServer.UPDATE_ITEMS, [EWeapon], 1] |
    [SocketServer.UPDATE_ITEMS, [EItem], undefined] |
    [SocketServer.UPDATE_AGE, number] |
    [SocketServer.UPDATE_AGE, number, number, number] |
    [SocketServer.UPDATE_RESOURCES, "food" | "wood" | "stone" | "points" | "kills", number, 1] |
    [SocketServer.UPDATE_CLAN_MEMBERS, (number | string)[]] |
    [SocketServer.UPDATE_MY_CLAN, string | null, boolean] |
    [SocketServer.ATTACK_ANIMATION, number, 1 | 0, TMelee] |
    [SocketServer.CREATE_PROJECTILE, number, number, number, number, number, number, 0 | 1, number] |
    [SocketServer.REMOVE_PROJECTILE, number, number] |
    [SocketServer.ADD_OBJECT, any[]] |
    [SocketServer.REMOVE_OBJECT, number] |
    [SocketServer.ITEM_COUNT, ItemGroup, number] |
    [SocketServer.UPDATE_PLAYER_HEALTH, number, number] |
    [SocketServer.HIT_OBJECT, number, number] |
    [SocketServer.SHOOT_TURRET, number, number] |
    [SocketServer.UPDATE_STORE, EStoreAction, number, EStoreType];

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
    [SocketClient.STORE, EStoreAction, number, EStoreType] |
    [SocketClient.CHAT, string] |
    [SocketClient.RESET_MOVE_DIR] |
    [SocketClient.ATTACK, 1 | 0, number | null] |
    [SocketClient.MOVE, number | null] |
    [SocketClient.PLAYER_CONTROL, 1 | 0] |
    [SocketClient.PING_MAP] |
    [SocketClient.SELECT_ITEM, EItem | EWeapon, boolean] |
    [SocketClient.SPAWN, ISpawn] |
    [SocketClient.UPGRADE_ITEM, number] |
    [SocketClient.ANGLE, number] |
    [SocketClient.PING_REQUEST];

export interface ISocket {
    socket?: WebSocket;
    Encoder: { readonly encode: ((data: any) => Uint8Array) } | null;
    Decoder: { readonly decode: ((data: Uint8Array) => any) } | null;
}