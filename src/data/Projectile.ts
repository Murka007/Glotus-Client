import { Projectiles } from "../constants/Items";
import Vector from "../modules/Vector";
import { EProjectile } from "../types/Items";
import Player from "./Player";

class Projectile {
    readonly position = {} as {
        previous: Vector;
        current: Vector;
        future: Vector;
    }

    readonly angle: number;
    readonly range: number;
    readonly speed: number;
    readonly type: EProjectile;

    /**
     * 1 if projectile can move above some buildings
     */
    readonly onPlatform: 1 | 0;
    readonly id: number;
    readonly isTurret: boolean;
    readonly scale: typeof Projectiles[number]["scale"];
    readonly maxRange: number;
    owner: Player | null = null;

    constructor(
        angle: number,
        range: number,
        speed: number,
        type: EProjectile,
        onPlatform: 1 | 0,
        id: number,
        maxRange?: number,
    ) {
        this.isTurret = type === EProjectile.TURRET;
        this.angle = angle;
        this.range = range;
        this.speed = speed;
        this.type = type;
        this.onPlatform = onPlatform;
        this.id = id;
        this.scale = Projectiles[type].scale;
        this.maxRange = maxRange || 0;
    }

    formatFromCurrent(pos: Vector, increase: boolean) {
        if (this.isTurret) return pos;
        return pos.direction(this.angle, increase ? 70 : -70);
    }
}

export default Projectile;