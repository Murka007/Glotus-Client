import PlayerClient from "../PlayerClient";
import { ItemGroups, Items } from "../constants/Items";
import Vector from "../modules/Vector";
import { EResourceType } from "../types/Enums";
import { EItem, ItemGroup, TPlaceable } from "../types/Items";
import { pointInDesert } from "../utility/Common";
import Animal from "./Animal";
import Player from "./Player";

/**
 * Represents resources and player objects
 */
abstract class ObjectItem {
    readonly id: number;
    readonly position: {
        readonly current: Vector;
    }
    readonly angle: number;
    readonly scale: number;

    constructor(
        id: number,
        x: number,
        y: number,
        angle: number,
        scale: number,
    ) {
        this.id = id;
        this.position = {
            current: new Vector(x, y),
        };
        this.angle = angle;
        this.scale = scale;
    }

    get hitScale() {
        return this.scale;
    }
}

export class Resource extends ObjectItem {
    readonly type: EResourceType;
    readonly layer: number;
    constructor(
        id: number,
        x: number,
        y: number,
        angle: number,
        scale: number,
        type: EResourceType
    ) {
        super(id, x, y, angle, scale);
        this.type = type;
        this.layer = type === 0 ? 3 : type === 2 ? 0 : 2;
    }

    formatScale(scaleMult = 1) {
        const reduceScale = this.type === 0 || this.type === 1 ? 0.6 * scaleMult : 1;
        return this.scale * reduceScale;
    }

    get collisionScale() {
        return this.formatScale();
    }

    get placementScale() {
        return this.formatScale(0.6);
    }

    get isCactus() {
        return this.type === EResourceType.FOOD && pointInDesert(this.position.current);
    }
}

export class PlayerObject extends ObjectItem {
    readonly type: TPlaceable;

    /**
     * ID of player who placed this item
     */
    readonly ownerID: number;
    readonly collisionDivider: number;

    /**
     * current health of item
     */
    health: number;
    readonly maxHealth: number;
    reload: number = -1;
    readonly maxReload: number = -1;
    readonly isDestroyable: boolean;

    /**
     * true, if my player saw how this item was placed
     */
    seenPlacement = false;
    readonly layer: number;
    readonly itemGroup: ItemGroup;
    constructor(
        id: number,
        x: number,
        y: number,
        angle: number,
        scale: number,
        type: TPlaceable,
        ownerID: number
    ) {
        super(id, x, y, angle, scale);
        this.type = type;
        this.ownerID = ownerID;
        
        const item = Items[type];
        this.collisionDivider = "colDiv" in item ? item.colDiv : 1;
        this.health = "health" in item ? item.health : Infinity;
        this.maxHealth = this.health;
        this.isDestroyable = this.maxHealth !== Infinity;

        if (item.id === EItem.TURRET) {
            this.reload = item.shootRate;
            this.maxReload = this.reload;
        }
        this.layer = ItemGroups[item.itemGroup].layer;
        this.itemGroup = item.itemGroup;
    }

    formatScale(placeCollision = false): number {
        return this.scale * (placeCollision ? 1 : this.collisionDivider);
    }

    get collisionScale(): number {
        return this.formatScale();
    }

    get placementScale() {
        const item = Items[this.type];
        if (item.id === EItem.BLOCKER) return item.blocker;
        return this.scale;
    }
}

export type TObject = Resource | PlayerObject;