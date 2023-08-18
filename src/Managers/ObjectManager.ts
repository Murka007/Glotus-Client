import { Items } from "../constants/Items";
import { PlayerObject, Resource, TObject } from "../data/ObjectItem";
import Player from "../data/Player";
import Vector from "../modules/Vector";
import { EItem, EProjectile, TPlaceable } from "../types/Items";
import { pointInRiver } from "../utility/Common";
import PlayerManager from "./PlayerManager";
import myPlayer from "../data/ClientPlayer";
import SpatialHashGrid from "../modules/SpatialHashGrid";
import ProjectileManager from "./ProjectileManager";
import SocketManager from "./SocketManager";

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

    inPlacementRange(object: PlayerObject): boolean {
        const owner = PlayerManager.playerData.get(object.ownerID);
        if (owner === undefined || !PlayerManager.players.includes(owner)) return false;

        const { previous: a0, current: a1, future: a2 } = owner.position;
        const b0 = object.position.current;
        const item = Items[object.type];
        const range = item.scale + object.placementScale + 50;
        return (
            a0.distance(b0) <= range ||
            a1.distance(b0) <= range ||
            a2.distance(b0) <= range
        )
    }

    /**
     * Returns true if current turret object can hit myPlayer
     */
    canTurretHitMyPlayer(object: PlayerObject, optimized: boolean): boolean {
        const pos = object.position.current;
        const distance = pos.distance(myPlayer.position.current);
        const shootRange = Items[EItem.TURRET].shootRange;
        
        if (distance > shootRange) return false;
        if (!this.isEnemyObject(object)) return false;
        if (!this.isTurretReloaded(object)) return false;
        
        const angle = pos.angle(myPlayer.position.current);
        const projectile = ProjectileManager.getProjectile(pos, EProjectile.TURRET, true, angle, shootRange);
        if (optimized) {
            return ProjectileManager.projectileCanHitEntity(projectile, myPlayer);
        }
        
        const target = ProjectileManager.getCurrentShootTarget(object, object.ownerID, projectile);
        return target === myPlayer;
    }
}

export default ObjectManager;