import { ItemGroups, Items } from "../constants/Items";
import PlayerManager from "../Managers/PlayerManager";
import Vector from "../modules/Vector";
import { ValueOf } from "../types/Common";
import { EItem, TPlaceable } from "../types/Items";

const EResourceType = {
    WOOD: 0,
    FOOD: 1,
    STONE: 2,
    GOLD: 3,
} as const;
type TResourceType = ValueOf<typeof EResourceType>;

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

    /**
     * Current grid location (x_y)
     */
    location: string | null = null;

    constructor(
        id: number,
        x: number,
        y: number,
        angle: number,
        scale: number,
    ) {
        this.id = id;
        this.position = {
            current: new Vector(x, y)
        };
        this.angle = angle;
        this.scale = scale;
    }
}

export class Resource extends ObjectItem {
    readonly type: TResourceType;
    readonly layer: number;
    constructor(
        id: number,
        x: number,
        y: number,
        angle: number,
        scale: number,
        type: TResourceType
    ) {
        super(id, x, y, angle, scale);
        this.type = type;
        this.layer = type === 0 ? 3 : type === 2 ? 0 : 2;
    }

    formatScale(scaleMult = 1) {
        const reduceScale = this.type === 0 || this.type === 1 ? 0.6 * scaleMult : 1;
        return this.scale * reduceScale;
    }

    get arrowScale() {
        return this.formatScale();
    }
}

export class PlayerObject extends ObjectItem {

    readonly type: TPlaceable;

    /**
     * ID of player who placed this item
     */
    readonly ownerID: number;
    readonly colDiv: number;

    /**
     * current health of item
     */
    health: number;
    readonly maxHealth: number;
    reload: number = -1;
    readonly maxReload: number = -1;

    /**
     * true, if my player saw how this item was placed
     */
    readonly seenPlacement: boolean;
    readonly layer: number;
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
        this.colDiv = "colDiv" in item ? item.colDiv : 1;
        this.health = "health" in item ? item.health : Infinity;
        this.maxHealth = this.health;

        if (item.id === EItem.TURRET) {
            this.reload = item.shootRate;
            this.maxReload = this.reload;
        }
        const owner = PlayerManager.players.get(ownerID);
        this.seenPlacement = owner !== undefined && PlayerManager.visiblePlayers.includes(owner);
        this.layer = ItemGroups[item.itemGroup].layer;
    }

    formatScale(isItem = false) {
        return this.scale * (isItem ? 1 : this.colDiv);
    }

    /**
     * true, if it is possible to destroy this item
     */
    isDestroyable() {
        return this.maxHealth !== Infinity;
    }

    /**
     * Returns current scale that matches arrow collision
     */
    get arrowScale() {
        return this.formatScale();
    }
}

export type TObject = Resource | PlayerObject;