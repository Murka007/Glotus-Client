import { Projectiles } from "../constants/Items";
import Animal from "../data/Animal";
import { TObject } from "../data/ObjectItem";
import Player from "../data/Player";
import Projectile from "../data/Projectile";
import PlayerClient from "../PlayerClient";
import Vector from "../modules/Vector";
import { EProjectile } from "../types/Items";
import { getAngleDist, lineIntersectsRect } from "../utility/Common";

class ProjectileManager {

    private readonly client: PlayerClient;

    /**
     * Contains players projectiles. Extraction is performed using bullet speed
     */
    readonly projectiles = new Map<number, Projectile[]>();

    /**
     * Contains hashes of turret objects that need to be excluded when a turret projectile appears
     */
    readonly ignoreCreation = new Set<string>();

    constructor(client: PlayerClient) {
        this.client = client;
    }

    createProjectile(projectile: Projectile) {
        const key = projectile.speed;
        if (!this.projectiles.has(key)) {
            this.projectiles.set(key, []);
        }

        const list = this.projectiles.get(key)!;
        list.push(projectile);
    }

    shootingAt(owner: Player, target: Player) {

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

    // private intersectsInAnyWay(projectile: Projectile, target: Player | Animal, object: TObject, addRadius: number): boolean {
    //     const s = Math.max(0, object.collisionScale + addRadius);
    //     const { x, y } = object.position.current;
    //     const topLeft = new Vector(x - s, y - s);
    //     const bottomRight = new Vector(x + s, y + s);
    //     const { previous: a0, current: a1, future: a2 } = projectile.position;
    //     const { previous: b0, current: b1, future: b2 } = target.position;

    //     if (lineIntersectsRect(a0, b0, topLeft, bottomRight)) return true;
    //     if (lineIntersectsRect(a0, b1, topLeft, bottomRight)) return true;
    //     if (lineIntersectsRect(a0, b2, topLeft, bottomRight)) return true;

    //     if (lineIntersectsRect(a1, b0, topLeft, bottomRight)) return true;
    //     if (lineIntersectsRect(a1, b1, topLeft, bottomRight)) return true;
    //     if (lineIntersectsRect(a1, b2, topLeft, bottomRight)) return true;

    //     if (lineIntersectsRect(a2, b0, topLeft, bottomRight)) return true;
    //     if (lineIntersectsRect(a2, b1, topLeft, bottomRight)) return true;
    //     if (lineIntersectsRect(a2, b2, topLeft, bottomRight)) return true;
    //     return false;
    // }

    // projectileCanHitEntity(projectile: Projectile, target: Player | Animal, addRadius: number): boolean {
    //     const pos1 = projectile.position.current;
    //     const pos2 = target.position.current;

    //     const objects = this.client.ObjectManager.retrieveObjects(pos1, projectile.maxRange);
    //     for (const object of objects) {
    //         const pos3 = object.position.current;

    //         // Skip objects that are further away than the target
    //         if (pos1.distance(pos3) > pos1.distance(pos2)) continue;
    //         if (projectile.onPlatform > object.layer) continue;

    //         if (this.intersectsInAnyWay(projectile, target, object, addRadius)) {
    //             return false;
    //         }
    //     }

    //     return true;
    // }

    // getFreeAttackAngles(projectile: Projectile, target: Player | Animal) {
    //     const { ObjectManager } = this.client;
    //     const pos1 = projectile.position.current;
    //     const pos2 = target.position.current;
    //     const distance = pos1.distance(pos2);
    //     if (distance > 700) return [];
    //     const objects = ObjectManager.retrieveObjects(pos1, 700);
    //     const dir1 = ObjectManager.getAngleOffset(pos1, pos2, target.collisionScale);

    //     const angles: [number, number][] = [];
    //     if (isNaN(dir1.offset)) return angles;
    //     const { angle, offset } = dir1;
    //     for (const object of objects) {
    //         if (angles.length) return angles;

    //         const pos3 = object.position.current;
    //         if (pos1.distance(pos3) > pos1.distance(pos2)) continue;
    //         if (projectile.onPlatform > object.layer) continue;

    //         const dir2 = ObjectManager.getAngleOffset(pos1, pos3, object.collisionScale);
    //         if (!isNaN(dir2.offset)) {
    //             const start = dir2.angle - dir2.offset;
    //             const end = dir2.angle + dir2.offset;
    //             if (getAngleDist(start, angle) <= offset) angles.push([start, distance]);
    //             if (getAngleDist(end, angle) <= offset) angles.push([end, distance]);
    //         }

    //         if (!this.intersectsInAnyWay(projectile, target, object, 0)) {
    //             angles.push([angle, distance]);
    //             return angles;
    //         }
    //     }
    //     return angles;
    // }

    // projectileCanHitEntity(owner: Player, projectile: Projectile, target: Player | Animal) {
    //     const { previous: a0, current: a1, future: a2 } = owner.position;
    //     const { previous: b0, current: b1, future: b2 } = target.position;
    //     const distance = a1.distance(b1);
    //     const angle = a1.angle(b1);

    //     const objects = ObjectManager.retrieveObjects(a1, projectile.maxRange);
    //     for (const object of objects) {
    //         const pos = object.position.current;
    //         const dist = a1.distance(pos);
    //         if (dist > distance) continue;
    //         if (projectile.onPlatform > object.layer) continue;
    //         const dir = a1.angle(pos);
    //         const offset = Math.asin((2 * object.collisionScale) / (2 * dist));
    //         const angleDist = getAngleDist(dir, angle);
    //     }
    // }
}

export default ProjectileManager;