import ObjectManager from "../Managers/ObjectManager";
import PlayerManager from "../Managers/PlayerManager";
import Animals, { EAnimal } from "../constants/Animals";
import Config from "../constants/Config";
import { EItem, ItemGroup } from "../types/Items";
import Entity from "./Entity";

/**
 * Animal class. Represents all animals including bosses
 */
class Animal extends Entity {
    type = -1;
    health = 0;
    nameIndex = 0;
    isHostile = false;
    canBeTrapped = false;
    isTrapped = false;

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

        const animal = Animals[type];
        this.angle = angle;
        this.health = health;
        this.nameIndex = nameIndex;
        this.scale = animal.scale;
        this.isHostile = animal.hostile;
        this.canBeTrapped = !("noTrap" in animal);
        this.isTrapped = this.canBeTrapped && this.checkCollision(ItemGroup.TRAP);
    }

    get attackRange() {
        return this.type === EAnimal.MOOSTAFA ? Animals[this.type].hitRange : this.scale;
    }

    get collisionRange() {
        if (this.type === EAnimal.MOOSTAFA) {
            return Animals[this.type].hitRange + Config.playerScale;
        }
        return this.scale + 40;
    }
}

export default Animal;