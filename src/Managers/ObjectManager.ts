import { Items } from "../constants/Items";
import { PlayerObject, Resource, TObject } from "../data/ObjectItem";
import Player from "../data/Player";
import Vector from "../modules/Vector";
import { EItem, TPlaceable } from "../types/Items";
import { findPlacementAngles, getAngleOffset, inView, pointInRiver } from "../utility/Common";
import SpatialHashGrid from "../modules/SpatialHashGrid";
import Sorting from "../utility/Sorting";
import { IAngle } from "../types/Common";
import PlayerClient from "../PlayerClient";
import settings from "../utility/Settings";
import NotificationRenderer from "../rendering/NotificationRenderer";

class ObjectManager {

    /**
     * A Map that stores all game objects
     */
    readonly objects = new Map<number, TObject>();
    private readonly grid = new SpatialHashGrid<TObject>(100);

    /**
     * A Map which stores all turret objects that are currently reloading
     */
    readonly reloadingTurrets = new Map<number, PlayerObject>();

    /**
     * A Map of attacked objects at current tick
     */
    readonly attackedObjects = new Map<number, [number, TObject]>();

    private readonly client: PlayerClient;
    constructor(client: PlayerClient) {
        this.client = client;
    }

    private insertObject(object: TObject) {
        this.grid.insert(object);
        this.objects.set(object.id, object);

        if (object instanceof PlayerObject) {

            const { PlayerManager } = this.client;
            const owner = (
                PlayerManager.playerData.get(object.ownerID) ||
                PlayerManager.createPlayer({ id: object.ownerID })
            );
            object.seenPlacement = this.inPlacementRange(object);
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
            const player = this.client.PlayerManager.playerData.get(object.ownerID);
            if (player !== undefined) {
                player.handleObjectDeletion(object);
            }
        }
    }

    removeObjectByID(id: number) {
        const object = this.objects.get(id);
        if (object !== undefined) {
            this.removeObject(object);

            if (this.client.isOwner) {
                const pos = object.position.current.copy().sub(this.client.myPlayer.offset);
                if (settings.notificationTracers && !inView(pos.x, pos.y, object.scale)) {
                    NotificationRenderer.add(object);
                }
            }
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

    /** Returns true, if object was placed by an enemy */
    isEnemyObject(object: TObject): boolean {
        if (object instanceof PlayerObject && !this.client.myPlayer.isEnemyByID(object.ownerID)) {
            return false;
        }
        return true;
    }

    isTurretReloaded(object: TObject): boolean {
        const turret = this.reloadingTurrets.get(object.id);
        if (turret === undefined) return true;

        const tick = this.client.SocketManager.TICK;
        return turret.reload > turret.maxReload - tick;
    }

    /**
     * Called after all packet received
     */
    postTick() {
        for (const [id, turret] of this.reloadingTurrets) {
            turret.reload += this.client.PlayerManager.step;
            if (turret.reload >= turret.maxReload) {
                turret.reload = turret.maxReload;
                this.reloadingTurrets.delete(id);
            }
        }
    }

    retrieveObjects(pos: Vector, radius: number): TObject[] {
        return this.grid.retrieve(pos, radius);
    }

    canPlaceItem(id: TPlaceable, position: Vector, addRadius = 0) {
        if (id !== EItem.PLATFORM && pointInRiver(position)) {
            return false;
        }

        const item = Items[id];
        const objects = this.retrieveObjects(position, item.scale);
        for (const object of objects) {
            const scale = item.scale + object.placementScale + addRadius;
            if (position.distance(object.position.current) < scale) {
                return false;
            }
        }

        return true;
    }

    inPlacementRange(object: PlayerObject): boolean {
        const owner = this.client.PlayerManager.playerData.get(object.ownerID);
        if (owner === undefined || !this.client.PlayerManager.players.includes(owner)) return false;

        const { previous: a0, current: a1, future: a2 } = owner.position;
        const b0 = object.position.current;
        const item = Items[object.type];
        const range = owner.scale * 2 + item.scale + item.placeOffset;
        return (
            a0.distance(b0) <= range ||
            a1.distance(b0) <= range ||
            a2.distance(b0) <= range
        )
    }
    
    private getAngleOffset(angle: number, distance: number, scale: number) {
        
    }

    getBestPlacementAngles(position: Vector, id: TPlaceable, sortAngle: number = 0): Set<number> {
        const item = Items[id];
        const length = this.client.myPlayer.getItemPlaceScale(id);
        const objects = this.retrieveObjects(position, length + item.scale);

        const angles: IAngle[] = [];
        for (const object of objects) {
            // if (object instanceof PlayerObject && object.health <= 88.5 * 2) continue;

            const angle = position.angle(object.position.current);
            const distance = position.distance(object.position.current);
            const a = object.placementScale + item.scale;
            const b = distance;
            const c = length;
            const offset = Math.acos((a ** 2 - b ** 2 - c ** 2) / (-2 * b * c));
            if (!isNaN(offset)) {
                angles.push({ angle, offset });
            }/*  else {
                const angleData = getAngleOffset(position, object.position.current, object.collisionScale);
                angles.push(angleData);
            } */
        }
        return findPlacementAngles(angles);//.sort(Sorting.byAngleDistance(sortAngle));
    }
}

export default ObjectManager;