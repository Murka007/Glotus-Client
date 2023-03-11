import Glotus from "..";
import Config from "../constants/Config";
import { Items } from "../constants/Items";
import { PlayerObject, Resource, TObject } from "../data/ObjectItem";
import Player from "../data/Player";
import Vector from "../modules/Vector";
import { GetValues } from "../types/Common";
import { TItem } from "../types/Items";
import { circleInsideSquare, removeFast } from "../utility/Common";
import Logger from "../utility/Logger";
import PlayerManager from "./PlayerManager";
import Controller from "../modules/Controller";
import myPlayer from "../data/ClientPlayer";

const ObjectManager = new class ObjectManager {

    /**
     * A Map that stores all the game objects
     */
    readonly objects = new Map<number, TObject>();
    private readonly grids: Record<string, TObject[]> = {};

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
        return this.reloadingTurrets.has(object.id) === false;
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
            this.grids[key] = [];
        }
        object.location = key;
        this.grids[key].push(object);
        this.objects.set(id, object);

        if (object instanceof PlayerObject) {
            const owner = PlayerManager.players.get(object.ownerID);
            if (owner !== undefined) {
                owner.objects.push(object);
            }
        }
    }

    private removeObject(object: TObject) {
        const objects = this.grids[object.location];
        const index = objects.indexOf(object);
        if (index >= 0) {
            removeFast(objects, index);
        }
        this.objects.delete(object.id);
    }

    /**
     * Called when received add objects packet
     */
    createObjects(buffer: any[]) {
        for (let i=0;i<buffer.length;i+=8) {
            const isResource = buffer[i + 5] !== null;
            const data = [buffer[i + 0], buffer[i + 1], buffer[i + 2], buffer[i + 3], buffer[i + 4]] as const;

            this.addObject(
                isResource ?
                    new Resource(...data, buffer[i + 5]) :
                    new PlayerObject(...data, buffer[i + 6], buffer[i + 7])
            )
        }
    }

    removeObjectByID(id: number) {
        const object = this.objects.get(id);
        if (object !== undefined) {
            this.removeObject(object);
        }
    }

    removePlayerObjects(player: Player) {
        let i = player.objects.length;
        while (i--) {
            this.removeObject(player.objects[i]);
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
}

export default ObjectManager;