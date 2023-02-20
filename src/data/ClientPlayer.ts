import Glotus from "..";
import { ItemGroups, Items, Weapons } from "../constants/Items";
import PlayerManager from "../Managers/PlayerManager";
import SocketManager from "../Managers/SocketManager";
import Controller from "../modules/Controller";
import GameUI from "../modules/GameUI";
import Vector from "../modules/Vector";
import { EItem, EWeapon, ItemType, TData, TItem, TItemData, TItemGroup, TItemType, TWeapon, TWeaponData, TWeaponType, TWeaponVariant, WeaponType } from "../types/Items";
import { EHat, EStoreType, TAccessory, THat } from "../types/Store";
import DataHandler from "../utility/DataHandler";
import settings from "../utility/Settings";
import Player from "./Player";

export class ClientPlayer extends Player {
    readonly weaponData = {} as TWeaponData;
    readonly itemData = {} as TItemData;

    readonly itemCount: Map<TItemGroup, number> = new Map;
    readonly resources = {
        food: 100,
        wood: 100,
        stone: 100,
        gold: 100,
        kills: 0
    }
    readonly offset = new Vector;
    inGame = false;
    private platformActivated = false;

    constructor() {
        super();
        this.reset();
    }

    private get isSandbox() {
        return window.vultr.scheme === "mm_exp";
    }

    /**
     * Checks if item is in inventory by type
     */
    hasItemType(type: TWeaponType | TItemType): boolean {
        if (type < 2) {
            return this.weaponData[type as TWeaponType] !== null;
        }
        return this.itemData[type as TItemType] !== null;
    }

    getItemByType<T extends TWeaponType | TItemType>(type: T): NonNullable<TData<T>> {
        if (type <= 1) {
            return this.weaponData[type as TWeaponType] as NonNullable<TData<T>>;
        } else if (type >= 2 && type <= 9) {
            return this.itemData[type as TItemType] as NonNullable<TData<T>>;
        } else {
            throw new Error(`getItemByType Error: "${type}" type is not valid`);
        }
    }

    hasResourcesForType(type: TItemType) {
        if (this.isSandbox) return true;

        const res = this.resources;
        const { food, wood, stone, gold } = DataHandler.getItemByType(type).cost;
        const hasFood = res.food >= (food || 0);
        const hasWood = res.wood >= (wood || 0);
        const hasStone = res.stone >= (stone || 0);
        const hasGold = res.gold >= (gold || 0);
        return hasFood && hasWood && hasStone && hasGold;
    }

    getItemCount(group: TItemGroup) {
        return {
            count: this.itemCount.get(group) || 0,
            limit: this.isSandbox ? 99 : ItemGroups[group].limit
        } as const;
    }

    hasItemCountForType(type: TItemType): boolean {
        const item = DataHandler.getItemByType(type);
        if ("itemGroup" in item) {
            const { count, limit } = this.getItemCount(item.itemGroup);
            return count < limit;
        }
        return true;
    }

    playerSpawn(id: number) {
        this.id = id;
        this.inGame = true;
        if (!PlayerManager.players.has(id)) {
            PlayerManager.players.set(id, myPlayer);
        }
    }

    updateItems(itemList: [TWeapon | TItem], isWeaponUpdate: boolean) {
        for (const id of itemList) {
            if (isWeaponUpdate) {
                const { itemType } = Weapons[id as TWeapon];
                this.weaponData[itemType] = id as TWeapon & null;
            } else {
                const { itemType } = Items[id];
                this.itemData[itemType] = id as TItem & null;
            }
        }
    }

    updateClanMembers(teammates: (string | number)[]) {
        Controller.teammates.length = 0;
        for (let i=0;i<teammates.length;i+=2) {
            const id = teammates[i + 0] as number;
            const nickname = teammates[i + 1] as string;
            if (!Controller.isMyPlayer(id)) {
                Controller.teammates.push(id);
            }
        }
    }

    updateItemCount(group: TItemGroup, count: number) {
        this.itemCount.set(group, count);
        GameUI.updateItemCount(group);
    }

    private getBestCurrentHat(): THat {
        const { current, future } = this.position;

        const inRiver = current.y > 6837 && current.y < 7562;
        if (inRiver) {
            const platformActivated = this.checkCollision(EItem.PLATFORM, 30);
            const stillStandingOnPlatform = this.checkCollision(EItem.PLATFORM, -15);

            if (!this.platformActivated && platformActivated) {
                this.platformActivated = true;
            }

            if (this.platformActivated && !stillStandingOnPlatform) {
                this.platformActivated = false;
            }

            if (!this.platformActivated) {
                return EHat.FLIPPER_HAT;
            }
        }

        // Add turret detection


        const nearestEntity = PlayerManager.getNearestEntity(this);
        if (
            nearestEntity !== null &&
            nearestEntity.position.future.distance(future) < 300
        ) return EHat.SOLDIER_HELMET;

        const inWinter = current.y <= 2400;
        if (inWinter) return EHat.WINTER_CAP;
        return Controller.store[EStoreType.HAT].actual;
    }

    tickUpdate() {
        const type = DataHandler.isPrimary(this.weapon.current) ? "primary" : "secondary";
        const target = this.reload[type];
        if (
            this.currentItem === -1 &&
            Controller.breaking &&
            !Controller.wasBreaking &&
            target.current === target.max
        ) {
            Controller.wasBreaking = true;
            Controller.equip(EStoreType.HAT, EHat.TANK_GEAR, "UTILITY");
            SocketManager.attack(Controller.mouse.angle);
        }

        const store = Controller.store[EStoreType.HAT];
        const hat = this.getBestCurrentHat();

        if (store.current !== hat && store.utility === 0) {
            Controller.equip(EStoreType.HAT, hat, "CURRENT");
        }
    }

    updateHealth(health: number) {
        this.previousHealth = this.currentHealth;
        this.currentHealth = health;

        if (settings.autoheal && health < 100) {
            const difference = Math.abs(health - this.previousHealth);
            const delay = difference <= 10 ? 150 : 80;
            setTimeout(() => {
                Controller.heal(true);
            }, delay);
        }

        // const item = DataHandler.getItemByType(ItemType.FOOD);
        // item.name
        // const id = this.getItemType(ItemType.FOOD);
        // const itemFood = Items[id];
        // if (!("restore" in itemFood)) return;
        // const times = Math.ceil((this.maxHealth - this.currentHealth) / itemFood.restore);
        // for (let i=0;i<=times;i++) {
        //     this.healthQueue.push(Math.min(this.currentHealth + itemFood.restore, this.maxHealth));
        //     Controller.heal(i === times);
        // }
    }

    private resetResources() {
        this.resources.food = 100;
        this.resources.wood = 100;
        this.resources.stone = 100;
        this.resources.gold = 100;
        this.resources.kills = 0;
    }

    private resetInventory() {
        this.weaponData[WeaponType.PRIMARY] = EWeapon.TOOL_HAMMER;
        this.weaponData[WeaponType.SECONDARY] = null;
        this.itemData[ItemType.FOOD] = EItem.APPLE;
        this.itemData[ItemType.WALL] = EItem.WOOD_WALL;
        this.itemData[ItemType.SPIKE] = EItem.SPIKES;
        this.itemData[ItemType.WINDMILL] = EItem.WINDMILL;
        this.itemData[ItemType.FARM] = null;
        this.itemData[ItemType.TRAP] = null;
        this.itemData[ItemType.TURRET] = null;
        this.itemData[ItemType.SPAWN] = null;
    }

    reset() {
        this.resetResources();
        this.resetInventory();
        Controller.reset();
        this.inGame = false;

        const { primary, secondary } = this.reload;
        primary.max = primary.current = -1;
        secondary.max = secondary.current = -1;
    }
}

const myPlayer = new ClientPlayer();
export default myPlayer;