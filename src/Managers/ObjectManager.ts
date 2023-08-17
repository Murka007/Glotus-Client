import Config from "../constants/Config";
import { Items, Projectiles } from "../constants/Items";
import { PlayerObject, Resource, TObject } from "../data/ObjectItem";
import Player from "../data/Player";
import Vector from "../modules/Vector";
import { EItem, ItemType, TPlaceable } from "../types/Items";
import { pointInRiver } from "../utility/Common";
import PlayerManager from "./PlayerManager";
import myPlayer from "../data/ClientPlayer";
import Projectile from "../data/Projectile";
import SpatialHashGrid from "../modules/SpatialHashGrid";
import ProjectileManager from "./ProjectileManager";
import SocketManager from "./SocketManager";
import Entity from "../data/Entity";

const ObjectManager = new class ObjectManager {

    /**
     * A Map that stores all game objects
     */
    readonly objects = new Map<number, TObject>();
    private readonly grid = new SpatialHashGrid(100);

    /**
     * A Map which stores all turret objects that are currently reloading
     */
    readonly reloadingTurrets = new Map<number, PlayerObject>();

    /**
     * A Map of attacked objects at current tick
     */
    readonly attackedObjects = new Map<number, [number, TObject]>();

    private insertObject(object: TObject) {
        this.grid.insert(object);
        this.objects.set(object.id, object);

        if (object instanceof PlayerObject) {

            const owner = (
                PlayerManager.playerData.get(object.ownerID) ||
                PlayerManager.createPlayer({ id: object.ownerID })
            );
            owner.handleObjectPlacement(object);
        }
    }

    /**
     * Called when received add objects packet
     */
    createObjects(buffer: any[]) {
        for (let i=0;i<buffer.length;i+=8) {
            const isResource = buffer[i + 6] === null;
            const data = [buffer[i + 0], buffer[i + 1], buffer[i + 2], buffer[i + 3], buffer[i + 4]] as const;

            this.insertObject(
                isResource ?
                    new Resource(...data, buffer[i + 5]) :
                    new PlayerObject(...data, buffer[i + 6], buffer[i + 7])
            )
        }
    }

    private removeObject(object: TObject) {
        this.grid.remove(object);
        this.objects.delete(object.id);

        if (object instanceof PlayerObject) {
            const player = PlayerManager.playerData.get(object.ownerID);
            if (player !== undefined) {
                player.handleObjectDeletion(object);
            }
        }
    }

    removeObjectByID(id: number) {
        const object = this.objects.get(id);
        if (object !== undefined) {
            this.removeObject(object);
        }
    }

    removePlayerObjects(player: Player) {
        for (const object of player.objects) {
            this.removeObject(object);
        }
    }

    resetTurret(id: number) {
        const object = this.objects.get(id);
        if (object instanceof PlayerObject) {
            object.reload = 0;
            this.reloadingTurrets.set(id, object);
        }
    }

    /**
     * true, if object was placed by an enemy
     */
    isEnemyObject(object: TObject): boolean {
        if (object instanceof PlayerObject && !myPlayer.isEnemyByID(object.ownerID)) {
            return false;
        }
        return true;
    }

    isTurretReloaded(object: TObject): boolean {
        const turret = this.reloadingTurrets.get(object.id);
        if (turret === undefined) return true;

        const tick = SocketManager.TICK;
        return turret.reload > turret.maxReload - tick;
    }

    /**
     * Called after all packet received
     */
    postTick() {
        for (const [id, turret] of this.reloadingTurrets) {
            turret.reload += PlayerManager.step;
            if (turret.reload >= turret.maxReload) {
                turret.reload = turret.maxReload;
                this.reloadingTurrets.delete(id);
            }
        }
    }

    retrieveObjects(pos: Vector, radius: number): TObject[] {
        return this.grid.retrieve(pos, radius);
    }

    retrieveObjectsByAngle(pos: Vector, radius: number, angle: number, angleRange: number): TObject[] {
        return this.grid.retrieveByAngle(pos, radius, angle, angleRange);
    }

    canPlaceItem(id: TPlaceable, position: Vector) {
        if (id !== EItem.PLATFORM && pointInRiver(position)) {
            return false;
        }

        const item = Items[id];
        const objects = this.retrieveObjects(position, item.scale);
        for (const object of objects) {
            const scale = item.scale + object.placementScale;
            if (position.distance(object.position.current) < scale) {
                return false;
            }
        }

        return true;
    }

    /**
     * Returns true if current turret object can hit myPlayer
     */
    canTurretHitMyPlayer(object: PlayerObject, optimized: boolean): boolean {
        const turret = Items[EItem.TURRET];
        const bullet = Projectiles[turret.projectile];

        const pos = object.position.current;
        const angle = pos.angle(myPlayer.position.current);
        const distance = pos.distance(myPlayer.position.current);

        if (distance > turret.shootRange) return false;
        if (!this.isEnemyObject(object)) return false;
        if (!this.isTurretReloaded(object)) return false;

        const projectile = new Projectile(
            pos.x, pos.y, angle,
            bullet.range,
            bullet.speed,
            bullet.index,
            bullet.layer,
            -1,
            turret.shootRange
        )

        if (optimized) {
            return ProjectileManager.projectileCanHitEntity(projectile, myPlayer);
        }
        
        const target = ProjectileManager.getCurrentShootTarget(object, object.ownerID, projectile);
        return target === myPlayer;
    }
    
    // canTurretHitMyPlayer(object: PlayerObject) {
    //     const turret = Items[EItem.TURRET];
    //     const bullet = Projectiles[turret.projectile];

    //     const pos = object.position.current;
    //     const angle = pos.angle(myPlayer.position.current);
    //     const distance = pos.distance(myPlayer.position.current);

    //     if (distance > turret.shootRange) return false;
    //     if (!this.isEnemyObject(object)) return false;
    //     if (!this.isTurretReloaded(object)) return false;

    //     const projectile = new Projectile(
    //         pos.x, pos.y, angle,
    //         bullet.range,
    //         bullet.speed,
    //         bullet.index,
    //         bullet.layer,
    //         -1
    //     );

    //     // Turrets attacks exactly on the player, so this function works perfect.
    //     const shootTarget = ProjectileManager.getCurrentShootTarget(object, object.ownerID, projectile);
    //     return shootTarget === myPlayer;
    // }

    entityColliding(entity: Entity, object: TObject, subRadius: number) {
        const current = object.position.current;
        const dist0 = entity.position.previous.distance(current);
        const dist1 = entity.position.current.distance(current);
        const dist2 = entity.position.future.distance(current);
        const radius = entity.scale + object.collisionScale - subRadius;
        return dist0 <= radius || dist1 <= radius || dist2 <= radius;
    }
}

export default ObjectManager;