import Vector from "../modules/Vector";

/**
 * Abstract entity class. Represents players and animals
 */
abstract class Entity {
    id = -1;

    readonly position = {
        previous: new Vector,
        current: new Vector,
        future: new Vector
    } as const

    angle = 0;
    scale = 0;

    protected setFuturePosition() {
        const { previous, current, future } = this.position;
        const distance = previous.distance(current);
        const angle = previous.angle(current);
        future.setVec(current.direction(angle, distance));
    }

    get arrowScale() {
        return this.scale;
    }
}

export default Entity;