import Animals, { EAnimal } from "../constants/Animals";
import Config from "../constants/Config";
import { ItemGroup } from "../types/Items";
import Entity from "./Entity";

/**
 * Animal class. Represents all animals including bosses
 */
class Animal extends Entity {
    type = -1;
    health = 0;
    nameIndex = 0;
    isDanger = false;

    constructor() {
        super();
    }

    update(
        id: number,
        type: EAnimal,
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

        const animal = Animals[type];
        this.angle = angle;
        this.health = health;
        this.nameIndex = nameIndex;
        this.scale = animal.scale;
        const isHostile = animal.hostile && type !== EAnimal.TREASURE;
        const canBeTrapped = !("noTrap" in animal);
        const isTrapped = canBeTrapped && this.checkCollision(ItemGroup.TRAP);
        this.isDanger = isHostile && !isTrapped;
    }

    get attackRange() {
        if (this.type === EAnimal.MOOSTAFA) {
            return Animals[this.type].hitRange + Config.playerScale;
        }
        return this.scale;
    }
    
    get collisionRange() {
        if (this.type === EAnimal.MOOSTAFA) {
            return Animals[this.type].hitRange + Config.playerScale;
        }
        return this.scale + 60;
    }
}

export default Animal;