import { Projectiles } from "../constants/Items";
import Animal from "../data/Animal";
import { TObject } from "../data/ObjectItem";
import Player from "../data/Player";
import Projectile from "../data/Projectile";
import Vector from "../modules/Vector";
import { TTarget } from "../types/Common";
import { EProjectile } from "../types/Items";
import { EHat } from "../types/Store";
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

    getProjectile(owner: Player, projectile: EProjectile, onPlatform: boolean, angle: number, range: number): Projectile {
        const bullet = Projectiles[projectile];
        const isTurret = projectile === EProjectile.TURRET;
        const { previous: a0, current: a1, future: a2 } = owner.position;

        const arrow = new Projectile(
            angle,
            bullet.range,
            bullet.speed,
            projectile,
            onPlatform || isTurret ? 1 : 0,
            -1, range
        );
        arrow.position.previous = arrow.formatFromCurrent(a0, true);
        arrow.position.current = arrow.formatFromCurrent(a1, true);
        arrow.position.future = arrow.formatFromCurrent(a2, true);
        return arrow;
    }

    // /**
    //  * Returns a target that can be shot at the current tick
    //  */
    // getCurrentShootTarget(owner: TTarget, ownerID: number, projectile: Projectile, subRadius = 0): TTarget | null {
    //     const pos1 = projectile.position.current;
    //     const pos2 = pos1.direction(projectile.angle, projectile.maxRange);
    //     const targets: TTarget[] = [];

    //     const entities = PlayerManager.getEntities();
    //     for (const entity of entities) {
    //         if (entity === owner) continue;

    //         const pos3 = entity.position.current;
    //         if (pos1.distance(pos3) > projectile.maxRange) continue;
    //         if (!PlayerManager.canShoot(ownerID, entity)) continue;
    //         if (projectile.isTurret && entity instanceof Player && entity.hatID === EHat.EMP_HELMET) continue;

    //         const s = entity.collisionScale;
    //         const { x, y } = pos3;
    //         if (
    //             lineIntersectsRect(
    //                 pos1, pos2,
    //                 new Vector(x - s, y - s),
    //                 new Vector(x + s, y + s)
    //             )
    //         ) {
    //             targets.push(entity);
    //         }
    //     }

    //     const objects = ObjectManager.retrieveObjects(pos1, projectile.maxRange);
    //     for (const object of objects) {
    //         if (object === owner) continue;

    //         const pos3 = object.position.current;
    //         if (pos1.distance(pos3) > projectile.maxRange) continue;
    //         if (projectile.onPlatform > object.layer) continue;

    //         const s = object.collisionScale - subRadius;
    //         const { x, y } = pos3;
    //         if (
    //             lineIntersectsRect(
    //                 pos1, pos2,
    //                 new Vector(x - s, y - s),
    //                 new Vector(x + s, y + s)
    //             )
    //         ) {
    //             targets.push(object);
    //         }
    //     }
        
    //     return targets.sort(Sorting.byDistance(owner, "current", "current"))[0] || null;
    // }

    private intersectsInAnyWay(projectile: Projectile, target: Player | Animal, object: TObject, addRadius: number): boolean {
        const s = Math.max(0, object.collisionScale + addRadius);
        const { x, y } = object.position.current;
        const topLeft = new Vector(x - s, y - s);
        const bottomRight = new Vector(x + s, y + s);
        const { previous: a0, current: a1, future: a2 } = projectile.position;
        const { previous: b0, current: b1, future: b2 } = target.position;

        if (lineIntersectsRect(a0, b0, topLeft, bottomRight)) return true;
        if (lineIntersectsRect(a0, b1, topLeft, bottomRight)) return true;
        if (lineIntersectsRect(a0, b2, topLeft, bottomRight)) return true;

        if (lineIntersectsRect(a1, b0, topLeft, bottomRight)) return true;
        if (lineIntersectsRect(a1, b1, topLeft, bottomRight)) return true;
        if (lineIntersectsRect(a1, b2, topLeft, bottomRight)) return true;

        if (lineIntersectsRect(a2, b0, topLeft, bottomRight)) return true;
        if (lineIntersectsRect(a2, b1, topLeft, bottomRight)) return true;
        if (lineIntersectsRect(a2, b2, topLeft, bottomRight)) return true;
        return false;
    }

    projectileCanHitEntity(projectile: Projectile, target: Player | Animal, addRadius: number): boolean {
        const pos1 = projectile.position.current;
        const pos2 = target.position.current;

        const objects = ObjectManager.retrieveObjects(pos1, projectile.maxRange);
        for (const object of objects) {
            const pos3 = object.position.current;

            // Skip objects that are further away than the target
            if (pos1.distance(pos3) > pos1.distance(pos2)) continue;
            if (projectile.onPlatform > object.layer) continue;

            if (this.intersectsInAnyWay(projectile, target, object, addRadius)) {
                return false;
            }
        }

        return true;
    }
}

export default ProjectileManager;