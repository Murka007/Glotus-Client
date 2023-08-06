import Glotus from "..";
import Config from "../constants/Config";
import { Projectiles, Weapons, weaponVariants } from "../constants/Items";
import { Hats } from "../constants/Store";
import ObjectManager from "../Managers/ObjectManager";
import PlayerManager from "../Managers/PlayerManager";
import ProjectileManager from "../Managers/ProjectileManager";
import { IReload, TReload } from "../types/Common";
import { EWeapon, EWeaponVariant, TItem, TMelee, TPlaceable, TWeapon, TWeaponData, TWeaponVariant, WeaponTypeString } from "../types/Items";
import { EHat, EStoreType, TAccessory, THat } from "../types/Store";
import DataHandler from "../utility/DataHandler";
import Entity from "./Entity";
import { PlayerObject } from "./ObjectItem";

/**
 * Represents all players.
 */
class Player extends Entity {
    
    socketID = "";
    /**
     * ID of item player is holding at the current tick
     * 
     * `-1` means player is holding a weapon
     */
    currentItem: TItem | -1 = -1;
    private weaponVariant: TWeaponVariant = 0;

    clanName: string | null = null;
    nickname = "unknown";
    skinID = 0;
    readonly scale = 35;

    hatID: THat = 0;
    accessoryID: TAccessory = 0;

    previousHealth = 100;
    currentHealth = 100;
    readonly maxHealth = 100;

    readonly weapon: {
        /**
         * ID of weapon player is holding at the current tick
         */
        current: TWeapon;

        /**
         * ID of current primary weapon
         */
        primary: TWeapon;

        /**
         * ID of current secondary weapon
         */
        secondary: TWeapon;
    }

    readonly reload: {
        readonly primary: IReload;
        readonly secondary: IReload;
        readonly turret: IReload;
    }

    /**
     * Set of items placed by the player
     */
    readonly objects = new Set<PlayerObject>();

    constructor() {
        super();

        this.weapon = {
            current: 0,
            primary: 0,
            secondary: 0,
        }

        this.reload = {
            primary: {
                current: -1,
                max: -1,
            },
            secondary: {
                current: -1,
                max: -1,
            },
            turret: {
                current: 2500,
                max: 2500,
            }
        }
    }

    update(
        id: number,
        x: number,
        y: number,
        angle: number,
        currentItem: TItem | -1,
        currentWeapon: TWeapon,
        weaponVariant: TWeaponVariant,
        clanName: string | null,
        isLeader: 1 | 0,
        hatID: THat,
        accessoryID: TAccessory,
        isSkull: 1 | 0
    ) {
        this.id = id;

        this.position.previous.setVec(this.position.current);
        this.position.current.setXY(x, y);
        this.setFuturePosition();

        this.angle = angle;
        this.currentItem = currentItem;
        this.weapon.current = currentWeapon;
        this.weaponVariant = weaponVariant;
        this.clanName = clanName;
        this.hatID = hatID;
        this.accessoryID = accessoryID;
        this.updateReloads();
    }

    increaseReload(reload: IReload) {
        reload.current = Math.min(reload.current + PlayerManager.step, reload.max);
    }

    isReloaded(type: TReload) {
        return this.reload[type].current === this.reload[type].max;
    }

    private updateReloads() {
        const current = this.position.current;

        const turretReload = this.reload.turret;
        this.increaseReload(turretReload);
        if (this.hatID === EHat.TURRET_GEAR) {
            for (const [id, turret] of ProjectileManager.turrets) {
                if (current.distance(turret.position.current) < 2) {
                    ProjectileManager.turrets.delete(id);
                    turretReload.current = 0;
                    break;
                }
            }
        }

        // We should not reload if player is holding item
        if (this.currentItem !== -1) return;

        const type = WeaponTypeString[Weapons[this.weapon.current].itemType];
        const targetReload = this.reload[type];
        const weapon = Weapons[this.weapon.current];
        const weaponSpeed = this.getWeaponSpeed(this.weapon.current, this.hatID);

        // Set default reload based on current weapon
        if (targetReload.max === -1) {
            targetReload.current = weaponSpeed;
            targetReload.max = weaponSpeed;
        }
        
        this.increaseReload(targetReload);
        this.weapon[type] = this.weapon.current;

        // Handle reloading of shootable weapons
        if ("projectile" in weapon) {
            const speedMult = this.hatID === EHat.MARKSMAN_CAP ? Hats[this.hatID].aMlt : 1;
            const type = weapon.projectile;
            const range = Projectiles[type].range * speedMult;
            const speed = Projectiles[type].speed * speedMult;

            // It won't work if players have the same position, angle, hats and ranged weapons
            // I could potentially check for secondary weapon reloading
            for (const [id, projectile] of ProjectileManager.projectiles) {
                if (
                    type === projectile.type &&
                    range === projectile.range &&
                    speed === projectile.speed &&
                    this.angle === projectile.angle &&
                    current.distance(projectile.position.current) < 2
                ) {
                    ProjectileManager.projectiles.delete(id);
                    targetReload.current = 0;
                    targetReload.max = weaponSpeed;
                    break;
                }
            }
        }
    }

    /**
     * Returns the number of damage, that can be dealt by the player weapon
     */
    getBuildingDamage(id: TMelee): number {
        const weapon = Weapons[id];
        const variant = weaponVariants[this.weaponVariant];

        let damage = weapon.damage * variant.val;
        if ("sDmg" in weapon) {
            damage *= weapon.sDmg;
        }

        const hat = Hats[this.hatID];
        if ("bDmg" in hat) {
            damage *= hat.bDmg;
        }
        return damage;
    }

    getWeaponSpeed(id: TWeapon, hat: THat): number {
        const reloadSpeed = hat === EHat.SAMURAI_ARMOR ? Hats[hat].atkSpd : 1;
        return Weapons[id].speed * reloadSpeed;
    }

    getMaxWeaponRange() {
        const { primary, secondary } = this.weapon;
        const primaryRange = Weapons[primary as TWeaponData[0]].range;
        if (DataHandler.isMelee(secondary)) {
            const range = Weapons[secondary].range;
            if (range > primaryRange) {
                return range;
            }
        }
        return primaryRange;
    }

    canInstakill() {

        // Only players who have all their weapons reloaded can instakill
        const isReloaded = (
            this.isReloaded("primary") &&
            this.isReloaded("secondary") &&
            this.isReloaded("turret")
        );

        if (!isReloaded) return false;

        const { primary, secondary } = this.weapon;
        const variant = this.weaponVariant;

        // At the moment, I consider only basic instakill variants
        const hasMusket = secondary === EWeapon.MUSKET;
        if (primary === EWeapon.POLEARM) {
            if (hasMusket) return true;
            return variant >= EWeaponVariant.GOLD && secondary === EWeapon.CROSSBOW;
        }

        return primary === EWeapon.SHORT_SWORD && variant >= EWeaponVariant.DIAMOND && hasMusket;
    }
}

export default Player;