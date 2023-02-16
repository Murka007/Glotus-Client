import Vector from "../modules/Vector";
import Entity from "./Entity";

class Animal extends Entity {
    type = -1;
    health = 0;
    nameIndex = 0;

    constructor() {
        super();
    }

    update(
        id: number,
        type: number,
        x: number,
        y: number,
        angle: number,
        health: number,
        nameIndex: number
    ) {
        this.id = id;
        this.type = type;

        this.position.previous.setVec(this.position.current);
        this.position.current.setXY(x, y);
        this.setFuturePosition();

        this.angle = angle;
        this.health = health;
        this.nameIndex = nameIndex;
    }
}

export default Animal;