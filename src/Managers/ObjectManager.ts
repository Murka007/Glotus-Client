import Glotus from "..";
import Config from "../constants/Config";
import { Items, Projectiles } from "../constants/Items";
import { PlayerObject, Resource, TObject } from "../data/ObjectItem";
import Player from "../data/Player";
import Vector from "../modules/Vector";
import { GetValues, TTarget } from "../types/Common";
import { EItem, TItem, TPlaceable } from "../types/Items";
import { circleInsideSquare, pointInRiver, removeFast } from "../utility/Common";
import Logger from "../utility/Logger";
import PlayerManager from "./PlayerManager";
import Controller from "../modules/Controller";
import myPlayer from "../data/ClientPlayer";
import Projectile from "../data/Projectile";

const ObjectManager = new class ObjectManager {

    /**
     * A Map that stores all the game objects
     */
    readonly objects = new Map<number, TObject>();
    private readonly grids: Record<string, Set<TObject>> = {};

    /**
     * A Map which stores all turret objects that are currently reloading
     */
    readonly reloadingTurrets = new Map<number, PlayerObject>();

    /**
     * A Map of attacked objects at current tick
     */
    readonly attackedObjects = new Map<number, PlayerObject>();
    private readonly gridSize = 16;
    private readonly gridCellSize = Config.mapScale / this.gridSize;

    updateTurret(id: number) {
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

        const tick = 1000 / Config.serverUpdateRate * 2;
        return turret.reload > turret.maxReload - tick;
    }

    /**
     * Called after all packet received
     */
    postTick() {
        for (const [id, turret] of this.reloadingTurrets) {
            turret.reload = Math.min(turret.reload + PlayerManager.step, turret.maxReload);
            if (turret.reload === turret.maxReload) {
                this.reloadingTurrets.delete(id);
            }
        }
    }

    private addObject(object: TObject) {
        const { id, position } = object;
        const pos = position.current.copy().div(this.gridCellSize).floor().clamp(0, this.gridSize);
        const key = pos.x + "_" + pos.y;
        if (!this.grids[key]) {
            this.grids[key] = new Set();
        }
        object.location = key;
        this.grids[key].add(object);
        this.objects.set(id, object);

        if (object instanceof PlayerObject) {
            const owner = (
                PlayerManager.players.get(object.ownerID) ||
                PlayerManager.createPlayer({ id: object.ownerID, nickname: "", skinID: -1 })
            );
            owner.objects.add(object);
        }
    }

    /**
     * Called when received add objects packet
     */
    createObjects(buffer: any[]) {
        for (let i=0;i<buffer.length;i+=8) {
            const isResource = buffer[i + 6] === null;
            const data = [buffer[i + 0], buffer[i + 1], buffer[i + 2], buffer[i + 3], buffer[i + 4]] as const;

            this.addObject(
                isResource ?
                    new Resource(...data, buffer[i + 5]) :
                    new PlayerObject(...data, buffer[i + 6], buffer[i + 7])
            )
        }
    }

    private removeObject(object: TObject) {
        if (object.location === null) return;

        this.grids[object.location].delete(object);
        this.objects.delete(object.id);

        if (object instanceof PlayerObject) {
            const player = PlayerManager.players.get(object.ownerID);
            if (player !== undefined) {
                player.objects.delete(object);
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

    getObjects(pos: Vector, range: number): TObject[] {
        const topLeft = pos.copy().direction(Math.atan2(-1,-1),range).div(this.gridCellSize).floor().clamp(0, this.gridSize);
        const bottomRight = pos.copy().direction(Math.atan2(1,1),range).div(this.gridCellSize).floor().clamp(0, this.gridSize);
        const objects: TObject[] = [];

        for (let x=topLeft.x-1;x<=bottomRight.x+1;x++) {
            for (let y=topLeft.y-1;y<=bottomRight.y+1;y++) {
                const key = x + "_" + y;
                if (this.grids[key] !== undefined) {
                    objects.push(...this.grids[key]);
                }
            }
        }
        return objects;
    }

    canPlaceItem(id: TPlaceable, position: Vector): boolean {
        const item = Items[id];
        const objects = this.getObjects(position, item.scale);
        for (const object of objects) {
            const scale = item.scale + object.placementScale;
            if (position.distance(object.position.current) < scale) return false;
        }

        if (id !== EItem.PLATFORM && pointInRiver(position)) {
            return false;
        }
        return true;
    }

    canTurretHitMyPlayer(object: PlayerObject) {
        const turret = Items[EItem.TURRET];
        const bullet = Projectiles[turret.projectile];

        const pos = object.position.current;
        const angle = pos.angle(myPlayer.position.current);
        const distance = pos.distance(myPlayer.position.current);

        if (distance > turret.shootRange) return false;
        if (!this.isTurretReloaded(object)) return false;
        if (!this.isEnemyObject(object)) return false;

        const projectile = new Projectile(
            pos.x, pos.y, angle,
            bullet.range,
            bullet.speed,
            bullet.index,
            bullet.layer,
            -1
        );

        const shootTarget = PlayerManager.getCurrentShootTarget(object, object.ownerID, projectile);
        return shootTarget === myPlayer;
    }
}

export default ObjectManager;