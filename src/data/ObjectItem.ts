import { Items } from "../constants/Items";
import Vector from "../modules/Vector";
import { TItem, TItems } from "../types/Items";

const resourceType = {
    WOOD: 0,
    FOOD: 1,
    STONE: 2,
    GOLD: 3,
} as const;

class ObjectItem {
    readonly id: number;
    readonly position: Vector;
    readonly angle: number;
    readonly scale: number;
    readonly resType: number | null;
    readonly objectItemType: number | null;
    readonly ownerID: number;
    readonly gridLocations: string[] = [];
    readonly isItem: boolean;
    readonly colDiv: number;

    constructor(
        id: number,
        x: number,
        y: number,
        angle: number,
        scale: number,
        resType: number | null,
        objectItemType: TItem | null,
        ownerID: number
    ) {
        this.id = id;
        this.position = new Vector(x, y);
        this.angle = angle;
        this.scale = scale;
        this.resType = resType;
        this.objectItemType = objectItemType;
        this.ownerID = ownerID;
        this.isItem = resType === null;
        const item: TItems[number] | {} = objectItemType !== null ? Items[objectItemType] : {};
        this.colDiv = "colDiv" in item ? item.colDiv : 1;
    }

    formatScale(scaleMult = 1, isItem = false) {
        const needFormat = this.resType === 0 || this.resType === 1;
        return this.scale * (needFormat ? (0.6 * scaleMult) : 1) * (isItem ? 1 : this.colDiv);
    }
}

export default ObjectItem;