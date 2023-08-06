import ObjectManager from "../Managers/ObjectManager";
import Animals from "../constants/Animals";
import Vector from "../modules/Vector";
import { ItemGroup, TItemGroup, TPlaceable } from "../types/Items";
import { EResourceType, PlayerObject, Resource } from "./ObjectItem";

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
    checkCollision(itemGroup: TItemGroup, subRadius = 0, checkEnemy = false): boolean {
        const objects = ObjectManager.retrieveObjects(this.position.future, this.scale);
        for (const object of objects) {
            const current = object.position.current;
            const matchItem = object instanceof PlayerObject && object.itemGroup === itemGroup;
            const isCactus = object instanceof Resource && itemGroup === ItemGroup.SPIKE && object.isCactus;

            if (matchItem || isCactus) {
                if (checkEnemy && !ObjectManager.isEnemyObject(object)) continue;

                const currentDistance = this.position.current.distance(current);
                const futureDistance = this.position.future.distance(current);
                const radius = this.scale + object.formatScale() - subRadius;
                if (currentDistance <= radius || futureDistance <= radius) return true;
            }
        }
        return false;
    }
}

export default Entity;