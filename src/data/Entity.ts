import ObjectManager from "../Managers/ObjectManager";
import Animals from "../constants/Animals";
import Vector from "../modules/Vector";
import { ItemGroup } from "../types/Items";
import { PlayerObject, Resource } from "./ObjectItem";

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

    /**
     * true, if entity is colliding an item
     * @param itemGroup type of item, that can be placed
     * @param subRadius Subtracts this amount from the item radius
     * @param checkEnemy true, if you want to check if colliding enemy object. Works only for myPlayer
     */
    checkCollision(itemGroup: ItemGroup, subRadius = 0, checkEnemy = false): boolean {
        const objects = ObjectManager.retrieveObjects(this.position.current, this.collisionScale);
        for (const object of objects) {
            const matchItem = object instanceof PlayerObject && object.itemGroup === itemGroup;
            const isCactus = object instanceof Resource && itemGroup === ItemGroup.SPIKE && object.isCactus;

            if (matchItem || isCactus) {
                if (checkEnemy && !ObjectManager.isEnemyObject(object)) continue;

                const current = object.position.current;
                const dist0 = this.position.previous.distance(current);
                const dist1 = this.position.current.distance(current);
                const dist2 = this.position.future.distance(current);
                const radius = this.scale + object.collisionScale - subRadius;
                if (dist0 <= radius || dist1 <= radius || dist2 <= radius) return true;
            }
        }
        return false;
    }
}

export default Entity;