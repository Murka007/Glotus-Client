import Glotus from "..";
import { ItemGroups, Items, Weapons } from "../constants/Items";
import ObjectManager from "../Managers/ObjectManager";
import PlayerManager from "../Managers/PlayerManager";
import SocketManager from "../Managers/SocketManager";
import Controller from "../modules/Controller";
import GameUI from "../modules/GameUI";
import Instakill from "../modules/Instakill";
import Vector from "../modules/Vector";
import { EItem, EWeapon, ItemType, TData, TItem, TItemData, TItemGroup, TItemType, TWeapon, TWeaponData, TWeaponType,  WeaponType } from "../types/Items";
import { EHat, EStoreType, THat } from "../types/Store";
import DataHandler from "../utility/DataHandler";
import Logger from "../utility/Logger";
import settings from "../utility/Settings";
import { PlayerObject } from "./ObjectItem";
import Player from "./Player";

/**
 * Represents my player. Contains all data that are related to the game bundle and websocket
 */
export class ClientPlayer extends Player {

    /**
     * All weapons in my inventory grouped by type
     */
    readonly weaponData = {} as TWeaponData;

    /**
     * All items in my inventory grouped by type
     */
    readonly itemData = {} as TItemData;

    /**
     * Current count of placed items grouped by type
     */
    readonly itemCount: Map<TItemGroup, number> = new Map;

    /**
     * My player's current resources
     */
    readonly resources = {
        food: 100,
        wood: 100,
        stone: 100,
        gold: 100,
        kills: 0
    }
    readonly offset = new Vector;

    /**
     * true if my player is in game
     */
    inGame = false;
    private platformActivated = false;

    /**
     * A Set of teammate IDs
     */
    readonly teammates: Set<number> = new Set;

    constructor() {
        super();
        this.reset();
    }

    /**
     * Checks if ID is ID of my player
     */
    isMyPlayerByID(id: number) {
        return id === myPlayer.id;
    }

    /**
     * Checks if the ID belongs to the teammate
     */
    isTeammateByID(id: number) {
        return this.teammates.has(id);
    }

    /**
     * Checks if the ID belongs to the enemy
     */
    isEnemyByID(id: number) {
        return !this.isMyPlayerByID(id) && !this.isTeammateByID(id);
    }

    /**
     * true if connected to the sandbox
     */
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

    /**
     * Returns current inventory weapon or item by type
     */
    getItemByType<T extends TWeaponType | TItemType>(type: T): NonNullable<TData<T>> {
        if (type <= 1) {
            return this.weaponData[type as TWeaponType] as NonNullable<TData<T>>;
        } else if (type >= 2 && type <= 9) {
            return this.itemData[type as TItemType] as NonNullable<TData<T>>;
        } else {
            throw new Error(`getItemByType Error: "${type}" type is not valid`);
        }
    }

    /**
     * Checks if item has enough resources to be placed
     */
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

    /**
     * Returns current and max count of object
     */
    getItemCount(group: TItemGroup) {
        return {
            count: this.itemCount.get(group) || 0,
            limit: this.isSandbox ? 99 : ItemGroups[group].limit
        } as const;
    }

    /**
     * Checks if my player can place item by type
     */
    hasItemCountForType(type: TItemType): boolean {
        const item = DataHandler.getItemByType(type);
        if ("itemGroup" in item) {
            const { count, limit } = this.getItemCount(item.itemGroup);
            return count < limit;
        }
        return true;
    }

    isReloaded(type: "primary" | "secondary" | "turret"): boolean {
        const reload = this.reload[type];
        return reload.current === reload.max;
    }

    /**
     * Checks if primary, secondary and turret bars are reloaded
     */
    isFullyReloaded(): boolean {
        return (
            myPlayer.isReloaded("primary") &&
            myPlayer.isReloaded("secondary") &&
            myPlayer.isReloaded("turret")
        )
    }

    /**
     * Returns the best destroying weapon depending on the inventory
     * 
     * `null`, if player have stick and does not have a hammer
     */
    getBestDestroyingWeapon(): TWeaponType | null {
        const secondaryID = myPlayer.getItemByType(WeaponType.SECONDARY);
        if (secondaryID === EWeapon.GREAT_HAMMER) return WeaponType.SECONDARY;

        const primary = DataHandler.getWeaponByType(WeaponType.PRIMARY);
        if (primary.damage !== 1) return WeaponType.PRIMARY;
        return null;
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
        this.teammates.clear();
        for (let i=0;i<teammates.length;i+=2) {
            const id = teammates[i + 0] as number;
            const nickname = teammates[i + 1] as string;
            if (!this.isMyPlayerByID(id)) {
                this.teammates.add(id);
            }
        }
    }

    updateItemCount(group: TItemGroup, count: number) {
        this.itemCount.set(group, count);
        GameUI.updateItemCount(group);
    }

    /**
     * Returns the best hat to be equipped at the tick
     */
    private getBestCurrentHat(): THat {
        const { current, future } = this.position;

        const inRiver = current.y > 6837 && current.y < 7562;
        if (inRiver) {
            // myPlayer is right on the platform
            const platformActivated = this.checkCollision(EItem.PLATFORM, 30);

            // myPlayer almost left the platform
            const stillStandingOnPlatform = this.checkCollision(EItem.PLATFORM, -15);

            if (!this.platformActivated && platformActivated) {
                this.platformActivated = true;
            }

            // myPlayer is not standing on platform
            if (this.platformActivated && !stillStandingOnPlatform) {
                this.platformActivated = false;
            }

            if (!this.platformActivated) {
                return EHat.FLIPPER_HAT;
            }
        }

        // Add turret detection
        // let turretCount = 0;
        // const maxTurretCount = 5;
        // const turret = Items[EItem.TURRET];
        // const range = turret.shootRange + turret.scale;
        // const objects = ObjectManager.getObjects(future, range);
        // for (const object of objects) {
        //     const distance = future.distance(object.position.current);
        //     if (
        //         object instanceof PlayerObject &&
        //         object.type === EItem.TURRET &&
        //         ObjectManager.isEnemyObject(object) &&
        //         distance <= turret.shootRange &&
        //         ObjectManager.isTurretReloaded(object)
        //     ) {
        //         turretCount += 1;
        //         if (turretCount === maxTurretCount) {
        //             return EHat.EMP_HELMET;
        //         }
        //     }
        // }

        const nearestEntity = PlayerManager.getNearestEntity(this);
        if (
            nearestEntity !== null &&
            nearestEntity.position.future.distance(future) < 300
        ) return EHat.SOLDIER_HELMET;

        const inWinter = current.y <= 2400;
        if (inWinter) return EHat.WINTER_CAP;
        return Controller.store[EStoreType.HAT].actual;
    }

    /**
     * Called after all received packets. Player and animal positions have been updated
     */
    tickUpdate() {
        Instakill.postTick();
        const type = DataHandler.isPrimary(this.weapon.current) ? "primary" : "secondary";
        const target = this.reload[type];

        const isReloaded = (
                SocketManager.ping > 125 ?
                PlayerManager.tickStep >= target.max : target.current === target.max
            );

        if (
            this.currentItem === -1 &&
            Controller.breaking &&
            !Controller.wasBreaking &&
            isReloaded
        ) {
            PlayerManager.tickStep = -(SocketManager.ping / 2);
            Controller.wasBreaking = true;
            Controller.equip(EStoreType.HAT, EHat.TANK_GEAR, "UTILITY");
            SocketManager.attack(Controller.mouse.angle);
        } else if (Controller.wasBreaking) {
            Controller.wasBreaking = false;
            SocketManager.stopAttack(Controller.mouse.angle);

            const store = Controller.store[EStoreType.HAT];
            Controller.equip(EStoreType.HAT, store.current, "CURRENT");
            store.utility = 0;
        }

        if (!Controller.breakingState) {
            Controller.breaking = false;
        }

        const store = Controller.store[EStoreType.HAT];
        if (store.utility === 0) {
            const hat = this.getBestCurrentHat();
            if (store.current !== hat) {
                Controller.equip(EStoreType.HAT, hat, "CURRENT");
            }
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

    /**
     * Resets player data. Called when myPlayer died
     */
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