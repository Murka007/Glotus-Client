import { Projectiles } from "../constants/Items";
import PlayerManager from "../Managers/PlayerManager";
import SocketManager from "../Managers/SocketManager";
import Vector from "../modules/Vector";
import Animal from "./Animal";
import myPlayer from "./ClientPlayer";
import { TObject } from "./ObjectItem";
import Player from "./Player";

class Projectile {
    readonly position: {
        readonly current: Vector;
        readonly end: Vector;
    }
    readonly angle: number;
    readonly range: number;
    readonly speed: number;
    readonly type: number;
    readonly onPlatform: 1 | 0;
    readonly id: number;
    readonly isTurret: boolean;
    readonly scale: typeof Projectiles[number]["scale"];
    readonly length: number;

    constructor(
        x: number,
        y: number,
        angle: number,
        range: number,
        speed: number,
        type: number,
        onPlatform: 1 | 0,
        id: number
    ) {
        this.isTurret = type === 1 && range === 700 && speed === 1.5;
        const current = this.isTurret ? new Vector(x, y) : new Vector(x, y).direction(angle, -70);
        this.position = {
            current,
            end: current.direction(angle, 2200),
        }
        this.angle = angle;
        this.range = range;
        this.speed = speed;
        this.type = type;
        this.onPlatform = onPlatform;
        this.id = id;
        this.scale = Projectiles[type].scale;
        this.length = current.distance(this.position.end);
    }
}

export default Projectile;