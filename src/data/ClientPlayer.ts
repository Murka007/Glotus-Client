import { Items } from "../constants/Items";
import Controller from "../modules/Controller";
import { EItem, EWeapon, ItemType, TItem, TItemType, TWeapon, TWeaponType, WeaponType } from "../types/Items";
import Player from "./Player";

const myPlayer = new class ClientPlayer extends Player {
    readonly inventory: (TWeapon | TItem | null)[] = [];
    readonly resources = {
        food: 100,
        wood: 100,
        stone: 100,
        gold: 100,
        kills: 0
    }
    inGame = false;

    constructor() {
        super();
        this.reset();
    }

    hasItem(type: TWeaponType | TItemType) {
        return this.inventory[type] !== null;
    }

    getItem(type: TWeaponType | TItemType) {
        return this.inventory[type]!;
    }

    private hasResources(id: TItem) {
        const resources = this.resources;
        const { food, wood, stone, gold } = Items[id].cost;
        const hasFood = resources.food >= (food || 0);
        const hasWood = resources.wood >= (wood || 0);
        const hasStone = resources.stone >= (stone || 0);
        const hasGold = resources.gold >= (gold || 0);
        return hasFood && hasWood && hasStone && hasGold;
    }

    private get isSandbox() {
        return window.vultr.scheme === "mm_exp";
    }

    hasResourcesForType(type: TItemType) {
        const item = this.getItem(type);
        return this.isSandbox || this.hasResources(item);
    }

    private resetResources() {
        this.resources.food = 100;
        this.resources.wood = 100;
        this.resources.stone = 100;
        this.resources.gold = 100;
        this.resources.kills = 0;
    }

    private resetInventory() {
        this.inventory[WeaponType.PRIMARY] = EWeapon.TOOL_HAMMER;
        this.inventory[WeaponType.SECONDARY] = null;
        this.inventory[ItemType.FOOD] = EItem.APPLE;
        this.inventory[ItemType.WALL] = EItem.WOOD_WALL;
        this.inventory[ItemType.SPIKE] = EItem.SPIKES;
        this.inventory[ItemType.WINDMILL] = EItem.WINDMILL;
        this.inventory[ItemType.FARM] = null;
        this.inventory[ItemType.TRAP] = null;
        this.inventory[ItemType.TURRET] = null;
        this.inventory[ItemType.SPAWN] = null;
    }

    reset() {
        this.resetResources();
        this.resetInventory();
        Controller.reset();
        this.inGame = false;
    }
}

export default myPlayer;