import Vector from "../modules/Vector";

class Entity {
    id = -1;

    readonly position = {
        previous: new Vector,
        current: new Vector,
        future: new Vector
    } as const

    angle = 0;

    protected setFuturePosition() {
        const { previous, current, future } = this.position;
        const distance = previous.distance(current);
        const angle = previous.angle(current);
        future.setVec(current.direction(angle, distance));
    }
}

export default Entity;