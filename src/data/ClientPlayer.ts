import Glotus from "..";
import { EAnimal } from "../constants/Animals";
import Config from "../constants/Config";
import { ItemGroups, Items, Projectiles, Weapons } from "../constants/Items";
import { Accessories, Hats } from "../constants/Store";
import ObjectManager from "../Managers/ObjectManager";
import PlayerManager from "../Managers/PlayerManager";
import Controller from "../modules/Controller";
import GameUI from "../modules/GameUI";
import Vector from "../modules/Vector";
import { ParentMethodParams } from "../types/Common";
import { EItem, EWeapon, ItemGroup, ItemType, TData, TItem, TItemData, TItemGroup, TItemType, TPlaceable, TWeapon, TWeaponData, TWeaponType,  WeaponType } from "../types/Items";
import { EHat, EStoreType, THat } from "../types/Store";
import { clamp, getAngleFromBitmask, pointInRiver } from "../utility/Common";
import DataHandler from "../utility/DataHandler";
import Logger from "../utility/Logger";
import settings from "../utility/Settings";
import { PlayerObject } from "./ObjectItem";
import Player from "./Player";
import Projectile from "./Projectile";

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

    private healDelay = 80;
    private receivedDamage: number | null = null;

    private shameActive = false;
    private shameTimer = 0;
    shameCount = 0;

    /**
     * A Set of teammate IDs
     */
    readonly teammates: Set<number> = new Set;

    constructor() {
        super();
        this.reset(true);
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

    // Skip for now
    // getPlayerSpeed() {
    //     const weaponID = this.weaponData[Controller.weapon]!;
    //     const weapon = Weapons[weaponID];
    //     const hat = Hats[Controller.store[EStoreType.HAT].last];
    //     const accessory = Accessories[Controller.store[EStoreType.ACCESSORY].last];

    //     let speedMult = Controller.holdingItem ? 0.5 : 1;

    //     if (!Controller.holdingItem && "spdMult" in weapon) {
    //         speedMult *= weapon.spdMult;
    //     }

    //     if ("spdMult" in hat) {
    //         speedMult *= hat.spdMult;
    //     }
    //     if ("spdMult" in accessory) {
    //         speedMult *= accessory.spdMult;
    //     }

    //     if (this.position.current.y <= 2400 && hat.id !== EHat.WINTER_CAP) {
    //         speedMult *= Config.snowSpeed;
    //     }

    //     const angle = getAngleFromBitmask(Controller.move, false) || 0;
    //     const vec = Vector.fromAngle(angle, 1).normalize();
    //     vec.mult(Config.playerSpeed * speedMult * PlayerManager.step);

    //     const speed = vec.copy().mult(PlayerManager.step).length;
    //     const depth = Math.min(4, Math.max(1, Math.round(speed / 40)));
    //     const tMlt = 1 / depth;
    //     vec.mult(PlayerManager.step * tMlt);

    //     return vec;
    // }

    /**
     * Returns the best hat to be equipped at the tick
     */
    getBestCurrentHat(): THat {
        const { current, future } = this.position;

        if (settings.autoflipper) {
            const inRiver = pointInRiver(current) || pointInRiver(future);
            if (inRiver) {
                // myPlayer is right on the platform
                const platformActivated = this.checkCollision(ItemGroup.PLATFORM, 30);

                // myPlayer almost left the platform
                const stillStandingOnPlatform = this.checkCollision(ItemGroup.PLATFORM, -15);

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
        }

        if (settings.autoemp) {
            const turret = Items[EItem.TURRET];
            const objects = ObjectManager.retrieveObjects(future, turret.shootRange);
            for (const object of objects) {
                if (object instanceof PlayerObject && object.type === EItem.TURRET) {
                    if (ObjectManager.canTurretHitMyPlayer(object)) {
                        return EHat.EMP_HELMET;
                    }
                }
            }
        }

        if (settings.spikeprotection) {
            const collidingSpike = this.checkCollision(ItemGroup.SPIKE, -40, true);
            if (collidingSpike) {
                return EHat.SOLDIER_HELMET;
            }
        }

        const nearestInstakill = PlayerManager.getInstakillEnemies(this);
        if (nearestInstakill !== null) {
            const distance = nearestInstakill.position.future.distance(future);
            const range = nearestInstakill.getMaxWeaponRange() + this.hitScale;
            if (distance <= range) {
                Controller.needToHeal = true;
                return EHat.SOLDIER_HELMET;
            }
        }
        // if (settings.antienemy) {
        //     const nearestEntity = PlayerManager.getNearestEnemy(this);
        //     if (nearestEntity !== null) {
        //         // const distance = nearestEntity.position.future.distance(future);
        //         if (/* distance < 300 ||  */nearestEntity.canInstakill()) {
        //             return EHat.SOLDIER_HELMET;
        //         }
        //     }
        // }

        if (settings.antianimal) {
            for (const animal of PlayerManager.animals) {
                const currentDistance = animal.position.current.distance(current);
                const futureDistance = animal.position.future.distance(future);
                if (
                    animal.isHostile &&
                    (currentDistance <= animal.collisionRange || futureDistance <= animal.collisionRange) &&
                    !animal.isTrapped
                ) {
                    return EHat.SOLDIER_HELMET;
                }
            }
        }

        if (settings.autowinter) {
            const inWinter = current.y <= 2400 || future.y <= 2400;
            if (inWinter) return EHat.WINTER_CAP;
        }

        return Controller.store[EStoreType.HAT].actual;
    }

    getPlacePosition(
        start: Vector,
        itemID: TPlaceable,
        angle: number
    ): Vector {
        const item = Items[itemID];
        return start.direction(angle, this.scale + item.scale + item.placeOffset);
    }

    getProjectile(position: Vector, weapon: TWeapon): Projectile | null {
        if (!DataHandler.isShootable(weapon)) return null;

        const secondary = Weapons[weapon];
        const arrow = DataHandler.getProjectile(weapon);
        const angle = Controller.mouse.sentAngle;
        const start = position.direction(angle, 140 / 2);
        return new Projectile(
            start.x, start.y, angle,
            arrow.range,
            arrow.speed,
            secondary.projectile,
            myPlayer.checkCollision(ItemGroup.PLATFORM) ? 1 : 0,
            0
        )
    }

    /**
     * Called after all received packets. Player and animal positions have been updated
     */
    tickUpdate() {
        if (this.hatID === EHat.SHAME && this.shameTimer === 0) {
            this.shameTimer = 30000;
            this.shameCount = 8;
            this.shameActive = true;
        }

        this.shameTimer = Math.max(0, this.shameTimer - PlayerManager.step);
        if (this.shameTimer === 0 && this.shameActive) {
            this.shameActive = false;
            this.shameCount = 0;
        }

        Controller.postTick();
        // Instakill.postTick();
    }

    updateHealth(health: number) {
        this.previousHealth = this.currentHealth;
        this.currentHealth = health;

        if (this.shameActive) return;

        // Shame count should be changed only when healing
        if (this.currentHealth < this.previousHealth) {
            this.receivedDamage = Date.now();
        } else if (this.receivedDamage !== null) {
            const step = Date.now() - this.receivedDamage;
            this.receivedDamage = null;

            if (step <= 120) {
                this.shameCount = Math.min(this.shameCount + 1, 7);
            } else {
                this.shameCount = Math.max(this.shameCount - 2, 0);
            }
        }

        if (settings.autoheal && health < 100) {
            // const difference = Math.abs(health - this.previousHealth);
            // const delay = difference <= 10 ? 150 : 80;
            if (this.healDelay === -1) return;
            setTimeout(() => {
                Controller.heal(true);
            }, this.healDelay);
        }
    }

    playerSpawn(id: number) {
        this.id = id;
        this.inGame = true;
        this.shameTimer = 0;
        this.shameCount = 0;
        this.reload.primary.max = this.reload.primary.current = -1;
        this.reload.secondary.max = this.reload.secondary.current = -1;
        this.reload.turret.max = this.reload.turret.current = 2500;
        if (!PlayerManager.playerData.has(id)) {
            PlayerManager.playerData.set(id, myPlayer);
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
    reset(first = false) {
        this.resetResources();
        this.resetInventory();
        Controller.reset();
        this.inGame = false;

        const weapon = this.weapon;
        weapon.current = weapon.primary = weapon.secondary = 0;

        if (!first) {
            window.config.deathFadeout = settings.autospawn ? 0 : 3000;
            if (settings.autospawn) {
                setTimeout(() => GameUI.spawn(), 10);
            }
        }
    }
}

const myPlayer = new ClientPlayer();
export default myPlayer;