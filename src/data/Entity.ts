import PlayerClient from "../PlayerClient";
import Animals from "../constants/Animals";
import Vector from "../modules/Vector";
import { ItemGroup } from "../types/Items";
import { getAngleDist } from "../utility/Common";
import { PlayerObject, Resource, TObject } from "./ObjectItem";

interface IPos {
    readonly previous: Vector;
    readonly current: Vector;
    readonly future: Vector;
}

/**
 * Abstract entity class. Represents players and animals
 */
abstract class Entity {
    id = -1;

    readonly position: IPos = {
        previous: new Vector,
        current: new Vector,
        future: new Vector
    }

    angle = 0;
    scale: (typeof Animals[number])["scale"] | 35 | 0 = 0;

    protected setFuturePosition() {
        const { previous, current, future } = this.position;
        const distance = previous.distance(current);
        const angle = previous.angle(current);
        future.setVec(current.direction(angle, distance));
    }

    get collisionScale() {
        return this.scale;
    }

    get hitScale() {
        return this.scale * 1.8;
    }

    protected readonly client: PlayerClient;
    constructor(client: PlayerClient) {
        this.client = client;
    }
    
    colliding(object: TObject, radius: number) {
        const { previous: a0, current: a1, future: a2 } = this.position;
        const b0 = object.position.current;
        return (
            a0.distance(b0) <= radius ||
            a1.distance(b0) <= radius ||
            a2.distance(b0) <= radius
        )
    }

    collidingObject(object: TObject, addRadius = 0, checkPrevious = true) {
        const { previous: a0, current: a1, future: a2 } = this.position;
        const b0 = object.position.current;
        const radius = this.collisionScale + object.collisionScale + addRadius;
        return (
            checkPrevious && a0.distance(b0) <= radius ||
            a1.distance(b0) <= radius ||
            a2.distance(b0) <= radius
        )
    }
        
    collidingEntity(entity: Entity, range: number, checkBased = false, prev = true) {
        const { previous: a0, current: a1, future: a2 } = this.position;
        const { previous: b0, current: b1, future: b2 } = entity.position;
        if (checkBased) {
            return (
                prev && a0.distance(b0) <= range ||
                a1.distance(b1) <= range ||
                a2.distance(b2) <= range
            )
        }

        return (
            a0.distance(b0) <= range ||
            a0.distance(b1) <= range ||
            a0.distance(b2) <= range ||
            
            a1.distance(b0) <= range ||
            a1.distance(b1) <= range ||
            a1.distance(b2) <= range ||

            a2.distance(b0) <= range ||
            a2.distance(b1) <= range ||
            a2.distance(b2) <= range
        )
    }

    /**
     * true, if entity is colliding an item
     * @param itemGroup type of item, that can be placed
     * @param addRadius Adds this amount to the item radius
     * @param checkEnemy true, if you want to check if colliding enemy object. Works only for myPlayer
     */
    checkCollision(itemGroup: ItemGroup, addRadius = 0, checkEnemy = false, checkPrevious = true): boolean {
        const { ObjectManager } = this.client;
        const objects = ObjectManager.retrieveObjects(this.position.current, this.collisionScale);

        for (const object of objects) {
            const matchItem = object instanceof PlayerObject && object.itemGroup === itemGroup;
            const isCactus = object instanceof Resource && itemGroup === ItemGroup.SPIKE && object.isCactus;
    
            if (matchItem || isCactus) {
                if (checkEnemy && !ObjectManager.isEnemyObject(object)) continue;
                if (this.collidingObject(object, addRadius, checkPrevious)) {
                    return true;
                }
            }
        }
        return false;
    }

    runningAwayFrom(entity: Entity, angle: number | null): boolean {

        // We just stay
        if (angle === null) return false;

        const pos1 = this.position.current;
        const pos2 = entity.position.current;
        const angleTo = pos1.angle(pos2);

        // Running towards entity
        if (getAngleDist(angle, angleTo) <= Math.PI / 2) return false;
        return true;
    }
}

export default Entity;