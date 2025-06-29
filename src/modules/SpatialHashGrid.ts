import { TObject } from "../data/ObjectItem";
import { TTarget } from "../types/Common";
import Vector from "./Vector";

/** Improved data structure for objects */
class SpatialHashGrid<T extends TTarget> {
    private readonly cellSize: number;
    private readonly cells: T[][][];

    constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.cells = [];
    }

    private hashPosition(x: number, y: number) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return [cellX, cellY] as const;
    }

    clear() {
        this.cells.length = 0;
    }

    insert(object: T) {
        const { x, y } = object.position.current;
        const [cellX, cellY] = this.hashPosition(x, y);

        if (!this.cells[cellX]) {
            this.cells[cellX] = [];
        }

        if (!this.cells[cellX][cellY]) {
            this.cells[cellX][cellY] = [];
        }

        this.cells[cellX][cellY].push(object);
    }

    retrieve(position: Vector, radius: number): T[] {
        const { x, y } = position;
        const [startX, startY] = this.hashPosition(x - radius, y - radius);
        const [endX, endY] = this.hashPosition(x + radius, y + radius);
        const results: T[] = [];

        for (let cellX = startX - 1; cellX <= endX + 1; cellX++) {
            for (let cellY = startY - 1; cellY <= endY + 1; cellY++) {
                if (this.cells[cellX] && this.cells[cellX][cellY]) {
                    const objects = this.cells[cellX][cellY];
                    for (const object of objects) {
                        results.push(object);
                    }
                }
            }
        }

        return results;
    }

    remove(object: T): boolean {
        const { x, y } = object.position.current;
        const [cellX, cellY] = this.hashPosition(x, y);

        if (this.cells[cellX] && this.cells[cellX][cellY]) {
            const objects = this.cells[cellX][cellY];
            const index = objects.indexOf(object);
            if (index !== -1) {
                const lastIndex = objects.length - 1;
                if (index === lastIndex) {
                    objects.pop();
                } else {
                    objects[index] = objects.pop()!;
                }
                return true;
            }
        }
        return false;
    }
}

export default SpatialHashGrid;