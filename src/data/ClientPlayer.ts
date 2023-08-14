import { ItemGroups, Items, WeaponVariants, Weapons } from "../constants/Items";
import ObjectManager from "../Managers/ObjectManager";
import PlayerManager from "../Managers/PlayerManager";
import GameUI from "../UI/GameUI";
import Vector from "../modules/Vector";
import { EItem, EWeapon, ItemGroup, ItemType, TInventory, TPlaceable, WeaponType, WeaponVariant } from "../types/Items";
import { EHat, EStoreType } from "../types/Store";
import { pointInRiver } from "../utility/Common";
import DataHandler from "../utility/DataHandler";
import settings from "../utility/Settings";
import { PlayerObject } from "./ObjectItem";
import Player from "./Player";
import Projectile from "./Projectile";
import ModuleHandler from "../features/ModuleHandler";
import ShameReset from "../features/modules/ShameReset";
import { EDanger } from "../types/Enums";
import { TResource } from "../types/Common";
import SocketManager from "../Managers/SocketManager";

interface IWeaponXP {
    current: number;
    max: number;
}

/**
 * Represents my player. Contains all data that are related to the game bundle and websocket
 */
export class ClientPlayer extends Player {

    private readonly inventory = {} as TInventory;
    readonly weaponXP = [{}, {}] as [IWeaponXP, IWeaponXP];

    /**
     * Current count of placed items grouped by type
     */
    readonly itemCount = new Map<ItemGroup, number>;

    /**
     * My player's current resources
     */
    readonly resources = {} as { [key in TResource]: number };
    readonly offset = new Vector;

    /**
     * true if my player is in game
     */
    inGame = false;
    private platformActivated = false;

    private receivedDamage: number | null = null;
    timerCount = SocketManager.TICK;

    /**
     * true, if my player has clown
     */
    shameActive = false;
    private shameTimer = 0;
    shameCount = 0;

    /**
     * A Set of teammate IDs
     */
    readonly teammates = new Set<number>();

    /**
     * Shows how much gold the mills produce
     */
    totalGoldAmount = 0;

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
    get isSandbox() {
        return window.vultr.scheme === "mm_exp";
    }

    /**
     * Returns current inventory weapon or item by type
     */
    getItemByType<T extends WeaponType | ItemType>(type: T) {
        return this.inventory[type];
    }

    /**
     * Checks if item has enough resources to be used
     */
    hasResourcesForType(type: ItemType): boolean {
        if (this.isSandbox) return true;

        const res = this.resources;
        const { food, wood, stone, gold } = DataHandler.getItemByType(type).cost;
        return (
            res.food >= food &&
            res.wood >= wood &&
            res.stone >= stone &&
            res.gold >= gold
        )
    }

    /**
     * Returns current and max count of object
     */
    getItemCount(group: ItemGroup) {
        return {
            count: this.itemCount.get(group) || 0,
            limit: this.isSandbox ? 99 : ItemGroups[group].limit
        } as const;
    }

    /**
     * Checks if my player can place item by type
     * 
     * Automatically ignores food and returns true
     */
    hasItemCountForType(type: ItemType): boolean {
        if (type === ItemType.FOOD) return true;

        const item = DataHandler.getItemByType(type);
        const { count, limit } = this.getItemCount(item.itemGroup);
        return count < limit;
    }

    /**
     * Returns the best destroying weapon depending on the inventory
     * 
     * `null`, if player have stick and does not have a hammer
     */
    getBestDestroyingWeapon(): WeaponType | null {
        const secondaryID = myPlayer.getItemByType(WeaponType.SECONDARY);
        if (secondaryID === EWeapon.GREAT_HAMMER) return WeaponType.SECONDARY;

        const primary = DataHandler.getWeaponByType(WeaponType.PRIMARY);
        if (primary.damage !== 1) return WeaponType.PRIMARY;
        return null;
    }

    /**
     * Returns the best hat to be equipped at the tick
     */
    getBestCurrentHat(): number {
        const { previous, current, future } = this.position;

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

        if (settings.antienemy) {
            const enemies = PlayerManager.getDangerousEnemies(this);
            for (const enemy of enemies) {
                const danger = enemy.canInstakill();
                if (danger === EDanger.NONE) break;

                // It is important to check for all position variants cuz enemy can move in different directions
                const dist0 = enemy.position.previous.distance(previous);
                const dist1 = enemy.position.current.distance(current);
                const dist2 = enemy.position.future.distance(future);
                const extraRange = enemy.usingBoost ? 300 : 60;
                const range = enemy.getMaxWeaponRange() + this.hitScale + extraRange;
                if (dist0 <= range || dist1 <= range || dist2 <= range) {
                    if (danger === EDanger.HIGH) {
                        ModuleHandler.needToHeal = true;
                    }
                    return EHat.SOLDIER_HELMET;
                }
            }
        }

        if (settings.autoemp) {
            const turret = Items[EItem.TURRET];
            const objects = ObjectManager.retrieveObjects(future, turret.shootRange);
            let turretAttackCount = 0;
            for (const object of objects) {
                if (turretAttackCount > 4) {
                    break;
                }
                if (object instanceof PlayerObject && object.type === EItem.TURRET) {
                    if (ObjectManager.canTurretHitMyPlayer(object)) {
                        turretAttackCount += 1;
                    }
                }
            }

            if (turretAttackCount > 4 || turretAttackCount > 0 && !ModuleHandler.isMoving) {
                return EHat.EMP_HELMET;
            } else if (turretAttackCount > 2) {
                return EHat.SOLDIER_HELMET;
            }
        }

        if (settings.spikeprotection) {
            const collidingSpike = this.checkCollision(ItemGroup.SPIKE, -35, true);
            if (collidingSpike) {
                return EHat.SOLDIER_HELMET;
            }
        }

        if (settings.antianimal) {
            for (const animal of PlayerManager.animals) {
                if (!animal.isDanger) continue;

                const dist0 = animal.position.previous.distance(previous);
                const dist1 = animal.position.current.distance(current);
                const dist2 = animal.position.future.distance(future);
                const range = animal.collisionRange;
                if (dist0 <= range || dist1 <= range || dist2 <= range) {
                    return EHat.SOLDIER_HELMET;
                }
            }
        }

        if (settings.autowinter) {
            const inWinter = current.y <= 2400 || future.y <= 2400;
            if (inWinter) return EHat.WINTER_CAP;
        }

        return ModuleHandler.getHatStore().actual;
    }

    getPlacePosition(start: Vector, itemID: TPlaceable, angle: number): Vector {
        const item = Items[itemID];
        return start.direction(angle, this.scale + item.scale + item.placeOffset);
    }

    // getProjectile(position: Vector, weapon: EWeapon): Projectile | null {
    //     if (!DataHandler.isShootable(weapon)) return null;

    //     const secondary = Weapons[weapon];
    //     const arrow = DataHandler.getProjectile(weapon);
    //     const angle = ModuleHandler.mouse.sentAngle;
    //     const start = position.direction(angle, 140 / 2);
    //     return new Projectile(
    //         start.x, start.y, angle,
    //         arrow.range,
    //         arrow.speed,
    //         secondary.projectile,
    //         myPlayer.checkCollision(ItemGroup.PLATFORM) ? 1 : 0,
    //         0
    //     )
    // }

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
            if (settings.autoheal && this.currentHealth < 100) {
                ModuleHandler.heal(true);
            }
        }

        this.timerCount = Math.min(this.timerCount + PlayerManager.step, 1000);
        if (this.timerCount === 1000) {
            this.timerCount = 0;
        }

        ModuleHandler.postTick();
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

        if (health < 100) {
            const healDelay = Math.max(0, 120 - SocketManager.pong + 10);
            const needReset = ShameReset.healthUpdate();
            if (settings.autoheal || needReset) {
                setTimeout(() => {
                    ModuleHandler.heal(true);
                }, healDelay);
            }
        }
    }

    playerSpawn(id: number) {
        this.id = id;
        this.inGame = true;
        if (!PlayerManager.playerData.has(id)) {
            PlayerManager.playerData.set(id, myPlayer);
        }

        const store = ModuleHandler.getHatStore();
        ModuleHandler.equip(EStoreType.HAT, store.current, "CURRENT");
    }

    upgradeItem(id: number) {
        if (id < 16) {
            const weapon = Weapons[id];
            this.inventory[weapon.itemType] = id as EWeapon & null;
            const XP = this.weaponXP[weapon.itemType];
            XP.current = 0;
            XP.max = -1;
        } else {
            id -= 16;
            const item = Items[id];
            this.inventory[item.itemType] = id as EItem & null;
        }
    }

    updateClanMembers(teammates: (string | number)[]) {
        this.teammates.clear();
        for (let i=0;i<teammates.length;i+=2) {
            const id = teammates[i + 0] as number;
            // const nickname = teammates[i + 1] as string;
            if (!this.isMyPlayerByID(id)) {
                this.teammates.add(id);
            }
        }
    }

    updateItemCount(group: ItemGroup, count: number) {
        this.itemCount.set(group, count);
        GameUI.updateItemCount(group);
    }

    updateResources(type: TResource, amount: number) {
        const previousAmount = this.resources[type];
        this.resources[type] = amount;

        if (type === "gold" || type === "kills") return;
        if (amount < previousAmount) return;
        
        const difference = amount - previousAmount;
        this.updateWeaponXP(difference);
    }

    updateWeaponXP(amount: number) {
        const { next } = this.getWeaponVariant(this.weapon.current);
        const XP = this.weaponXP[Weapons[this.weapon.current].itemType];
        const maxXP = WeaponVariants[next].needXP;

        XP.current += amount;

        if (XP.max !== -1 && XP.current >= XP.max) {
            XP.current -= XP.max;
            XP.max = maxXP;
            return;
        }

        if (XP.max === -1) {
            XP.max = maxXP;
        }

        if (XP.current >= XP.max) {
            XP.current -= XP.max;
            XP.max = -1;
        }
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

    private resetWeapon() {
        this.weapon.current = 0;
        this.weapon.primary = 0;
        this.weapon.secondary = null;
    }

    private resetReload() {
        this.reload.primary.max = this.reload.primary.current = -1;
        this.reload.secondary.max = this.reload.secondary.current = -1;
        this.reload.turret.max = this.reload.turret.current = 2500;

        for (const XP of this.weaponXP) {
            XP.current = 0;
            XP.max = -1;
        }
    }

    /**
     * Resets player data. Called when myPlayer died
     */
    reset(first = false) {
        this.resetResources();
        this.resetInventory();
        this.resetWeapon();
        this.resetReload();
        ModuleHandler.reset();

        this.inGame = false;
        this.shameTimer = 0;
        this.shameCount = 0;

        if (first) return;

        window.config.deathFadeout = settings.autospawn ? 0 : 3000;
        if (settings.autospawn) {
            setTimeout(() => GameUI.spawn(), 10);
        }
    }
}

const myPlayer = new ClientPlayer();
export default myPlayer;