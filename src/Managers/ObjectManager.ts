import Glotus from "..";
import Config from "../constants/Config";
import { Items } from "../constants/Items";
import ObjectItem from "../data/ObjectItem";
import Vector from "../modules/Vector";
import { GetValues } from "../types/Common";
import { TItem } from "../types/Items";
import PlayerManager from "./PlayerManager";

const circleInsideSquare = (
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number
) => {
    return (
        x1 + r1 >= x2 &&
        x1 - r1 <= x2 + r2 &&
        y1 + r1 >= y2 &&
        y1 - r1 <= y2 + r2
    )
}

const tempScale = Config.mapScale / Config.colGrid;
const ObjectManager = new class ObjectManager {
    readonly objects: Map<number, ObjectItem> = new Map;
    private readonly grids: Record<string, ObjectItem[]>;

    constructor() {
        this.grids = {};
    }

    private addObject(object: ObjectItem) {
        const { id, position, scale } = object;
        this.objects.set(id, object);

        const owner = PlayerManager.players.get(object.ownerID);
        if (owner !== undefined) {
            owner.objects.push(object);
        }

        for (let x=0;x<Config.colGrid;x++) {
            const tempX = x * tempScale;
            for (let y=0;y<Config.colGrid;y++) {
                const tempY = y * tempScale;
                if (circleInsideSquare(position.x, position.y, scale, tempX, tempY, tempScale)) {
                    const key = x + "_" + y;
                    if (!this.grids[key]) {
                        this.grids[key] = [];
                    }

                    this.grids[key].push(object);
                    object.gridLocations.push(key);
                }
            }
        }
    }

    createObjects(buffer: any[]) {
        for (let i=0;i<buffer.length;i+=8) {
            this.addObject(new ObjectItem(
                buffer[i + 0],
                buffer[i + 1],
                buffer[i + 2],
                buffer[i + 3],
                buffer[i + 4],
                buffer[i + 5],
                buffer[i + 6],
                buffer[i + 7]
            ))
        }
    }

    private removeObject(object: ObjectItem) {
        const grids = object.gridLocations;
        for (const location of grids) {
            const index = this.grids[location].indexOf(object);
            this.grids[location].splice(index, 1);
        }
        this.objects.delete(object.id);
    }

    removeObjectByID(id: number) {
        const object = this.objects.get(id);
        if (object !== undefined) {
            this.removeObject(object);
        }
    }

    removePlayerObjects(id: number) {
        const player = PlayerManager.players.get(id);
        if (player === undefined) return;

        let i = player.objects.length;
        while (i--) {
            this.removeObject(player.objects[i]);
        }
    }

    getObjects(pos: Vector, scale: number): ObjectItem[] {
        const temp = pos.copy().div(tempScale).floor();
        const objects: ObjectItem[] = [];
        const grids = this.grids;
        let grid: ObjectItem[];
        try {
            grid = grids[temp.x + "_" + temp.y]
            if (grid) objects.push(...grid);
            if (pos.x + scale >= (temp.x + 1) * tempScale) {
                grid = grids[(temp.x + 1) + "_" + temp.y];
                if (grid)  objects.push(...grid);
                if (temp.y && pos.y - scale <= temp.y * tempScale) {
                    grid = grids[(temp.x + 1) + "_" + (temp.y - 1)];
                    if (grid) objects.push(...grid);
                } else if (pos.y + scale >= (temp.y + 1) * tempScale) {
                    grid = grids[(temp.x + 1) + "_" + (temp.y + 1)];
                    if (grid) objects.push(...grid);
                }
            }

            if (temp.x && pos.x - scale <= temp.x * tempScale) {
                grid = grids[(temp.x - 1) + "_" + temp.y];
                if (grid) objects.push(...grid);
                if (temp.y && pos.y - scale <= temp.y * tempScale) {
                    grid = grids[(temp.x - 1) + "_" + (temp.y - 1)];
                    if (grid) objects.push(...grid);
                } else if (pos.y + scale >= (temp.y + 1) * tempScale) {
                    grid = grids[(temp.x - 1) + "_" + (temp.y + 1)];
                    if (grid) objects.push(...grid);
                }
            }
            if (pos.y + scale >= (temp.y + 1) * tempScale) {
                grid = grids[temp.x + "_" + (temp.y + 1)];
                if (grid) objects.push(...grid);
            }
            if (temp.y && pos.y - scale <= temp.y * tempScale) {
                grid = grids[temp.x + "_" + (temp.y - 1)];
                if (grid) objects.push(...grid);
            }
        } catch(err){}
        return [...new Set(objects)];
    }
}

export default ObjectManager;