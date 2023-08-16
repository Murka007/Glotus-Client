import Animal from "../data/Animal";
import Player from "../data/Player";
import Projectile from "../data/Projectile";
import Vector from "../modules/Vector";
import { TTarget } from "../types/Common";
import { lineIntersectsRect } from "../utility/Common";
import Sorting from "../utility/Sorting";
import ObjectManager from "./ObjectManager";
import PlayerManager from "./PlayerManager";

const ProjectileManager = new class ProjectileManager {

    /**
     * Contains players projectiles. Extraction is performed using bullet speed
     */
    readonly projectiles = new Map<number, Projectile[]>();

    /**
     * Contains hashes of turret objects that need to be excluded when a turret projectile appears
     */
    readonly ignoreCreation = new Set<string>();

    createProjectile(projectile: Projectile) {
        const key = projectile.speed;
        if (!this.projectiles.has(key)) {
            this.projectiles.set(key, []);
        }

        const list = this.projectiles.get(key)!;
        list.push(projectile);
    }

    postTick() {
        this.projectiles.clear();
    }

    /**
     * Returns a target that can be shot at the current tick
     */
    // getCurrentShootTarget(
    //     owner: TTarget,
    //     ownerID: number,
    //     projectile: Projectile
    // ): TTarget | null {
    //     const start = projectile.position.current;
    //     const end = projectile.position.end;
    //     const length = projectile.length;
    //     const layer = projectile.onPlatform;

    //     const targets: TTarget[] = [];

    //     const entities = PlayerManager.getEntities();
    //     for (const entity of entities) {
    //         if (entity === owner) continue;

    //         const s = entity.collisionScale;
    //         const { x, y } = entity.position.current;
    //         if (
    //             PlayerManager.canShoot(ownerID, entity) &&
    //             lineIntersectsRect(
    //                 start, end,
    //                 new Vector(x - s, y - s),
    //                 new Vector(x + s, y + s)
    //             )
    //         ) {
    //             targets.push(entity);
    //         }
    //     }

    //     const objects = ObjectManager.retrieveObjects(start, length);
    //     for (const object of objects) {
    //         if (object === owner) continue;

    //         const s = object.collisionScale;
    //         const { x, y } = object.position.current;
    //         if (
    //             layer <= object.layer &&
    //             lineIntersectsRect(
    //                 start, end,
    //                 new Vector(x - s, y - s),
    //                 new Vector(x + s, y + s)
    //             )
    //         ) {
    //             targets.push(object);
    //         }
    //     }

    //     // The closest target to my player is the only one that can be hit
    //     return targets.sort(Sorting.byDistance(owner, "current", "current"))[0] || null;
    // }

    // projectileCanHitEntity(projectile: Projectile, target: Player | Animal): TTarget | null {
    //     const pos1 = projectile.position.current.copy();
    //     const pos2 = target.position.future.copy();

    //     const objects = ObjectManager.retrieveObjects(pos1, projectile.length);
    //     for (const object of objects) {
    //         const pos3 = object.position.current.copy();

    //         // Skip objects that are further away than the target
    //         if (pos1.distance(pos3) > pos1.distance(pos2)) continue;
    //         if (projectile.onPlatform > object.layer) continue;

    //         const s = object.collisionScale;
    //         const { x, y } = pos3;
    //         if (
    //             lineIntersectsRect(
    //                 pos1, pos2,
    //                 new Vector(x - s, y - s),
    //                 new Vector(x + s, y + s)
    //             )
    //         ) {
    //             return null;
    //         }
    //     }

    //     return target;
    // }
}

export default ProjectileManager;