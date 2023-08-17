import { Projectiles } from "../constants/Items";
import Vector from "../modules/Vector";
import { fixTo } from "../utility/Common";

class Projectile {
    readonly position: {

        // readonly initial: Vector;

        /**
         * When received a packet, position is ahead of the length 70. We subtract this length to equalize the position of player and projectile
         */
        readonly current: Vector;

        // /**
        //  * The longest possible point for the projectile
        //  */
        // readonly end: Vector;
    }
    readonly angle: number;
    readonly range: number;
    readonly speed: number;
    readonly type: number;

    /**
     * 1 if projectile can move above some buildings
     */
    readonly onPlatform: 1 | 0;
    readonly id: number;
    readonly isTurret: boolean;
    readonly scale: typeof Projectiles[number]["scale"];
    readonly maxRange: number;

    constructor(
        x: number,
        y: number,
        angle: number,
        range: number,
        speed: number,
        type: number,
        onPlatform: 1 | 0,
        id: number,
        maxRange?: number,
    ) {
        this.isTurret = type === 1;
        const current = new Vector(x, y);
        this.position = {
            current: this.isTurret ? current : current.direction(angle, - 70),
        }
        this.angle = angle;
        this.range = range;
        this.speed = speed;
        this.type = type;
        this.onPlatform = onPlatform;
        this.id = id;
        this.scale = Projectiles[type].scale;
        this.maxRange = maxRange || 0;
    }
}

export default Projectile;