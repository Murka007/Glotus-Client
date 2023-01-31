import { EItems, EWeapons, ItemType } from "../constants/Items";
import Player from "./Player";

class ClientPlayer extends Player {
    readonly inventory: (EWeapons | EItems | null)[] = [];
    readonly resources = {
        food: 100,
        wood: 100,
        stone: 100,
        gold: 100,
        kills: 0
    }

    constructor() {
        super();
        this.reset();
    }

    private resetResources() {
        this.resources.food = 100;
        this.resources.wood = 100;
        this.resources.stone = 100;
        this.resources.gold = 100;
        this.resources.kills = 0;
    }

    private resetInventory() {
        this.inventory[ItemType.PRIMARY] = EWeapons.STICK;
        this.inventory[ItemType.SECONDARY] = null;
        this.inventory[ItemType.FOOD] = EItems.APPLE;
        this.inventory[ItemType.WALL] = EItems.WOOD_WALL;
        this.inventory[ItemType.SPIKE] = EItems.SPIKES;
        this.inventory[ItemType.WINDMILL] = EItems.WINDMILL;
        this.inventory[ItemType.FARM] = null;
        this.inventory[ItemType.TRAP] = null;
        this.inventory[ItemType.TURRET] = null;
        this.inventory[ItemType.SPAWN] = null;
    }

    reset() {
        this.resetResources();
        this.resetInventory();
    }
}

export default ClientPlayer;