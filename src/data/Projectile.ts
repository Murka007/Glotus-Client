import Vector from "../modules/Vector";

class Projectile {
    readonly position: Vector;
    readonly angle: number;
    readonly range: number;
    readonly speed: number;
    readonly type: number;
    readonly onPlatform: boolean;
    readonly id: number;
    readonly isTurret: boolean;

    constructor(
        x: number,
        y: number,
        angle: number,
        range: number,
        speed: number,
        type: number,
        onPlatform: boolean,
        id: number
    ) {
        this.isTurret = type === 1 && range === 700 && speed === 1.5;
        const vec = new Vector(x, y);
        if (this.isTurret) {
            this.position = vec;
        } else {
            this.position = vec.direction(angle, -70);
        }
        this.angle = angle;
        this.range = range;
        this.speed = speed;
        this.type = type;
        this.onPlatform = onPlatform;
        this.id = id;
    }
}

export default Projectile;