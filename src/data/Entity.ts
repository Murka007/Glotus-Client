import ObjectManager from "../Managers/ObjectManager";
import Animals from "../constants/Animals";
import Vector from "../modules/Vector";
import { ItemGroup } from "../types/Items";
import { PlayerObject, Resource, TObject } from "./ObjectItem";

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
    
    collidingObject(object: TObject, addRadius = 0) {
        const { previous: a0, current: a1, future: a2 } = this.position;
        const b0 = object.position.current;
        const radius = this.collisionScale + object.collisionScale + addRadius;
        return (
            a0.distance(b0) <= radius ||
            a1.distance(b0) <= radius ||
            a2.distance(b0) <= radius
        )
    }
        
    collidingEntity(entity: Entity, range: number) {
        const { previous: a0, current: a1, future: a2 } = this.position;
        const { previous: b0, current: b1, future: b2 } = entity.position;
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
    checkCollision(itemGroup: ItemGroup, addRadius = 0, checkEnemy = false): boolean {
        const objects = ObjectManager.retrieveObjects(this.position.current, this.collisionScale);
        for (const object of objects) {
            const matchItem = object instanceof PlayerObject && object.itemGroup === itemGroup;
            const isCactus = object instanceof Resource && itemGroup === ItemGroup.SPIKE && object.isCactus;
    
            if (matchItem || isCactus) {
                if (checkEnemy && !ObjectManager.isEnemyObject(object)) continue;
                if (this.collidingObject(object, addRadius)) {
                    return true;
                }
            }
        }
        return false;
    }
}

export default Entity;