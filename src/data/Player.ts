import { Items, Projectiles, Weapons, WeaponVariants } from "../constants/Items";
import { Accessories, Hats } from "../constants/Store";
import ObjectManager from "../Managers/ObjectManager";
import PlayerManager from "../Managers/PlayerManager";
import ProjectileManager from "../Managers/ProjectileManager";
import SocketManager from "../Managers/SocketManager";
import { IReload, TReload } from "../types/Common";
import { EDanger } from "../types/Enums";
import { EItem, EWeapon, ItemType, TMelee, TPrimary, TSecondary, TWeaponType, WeaponTypeString, WeaponVariant } from "../types/Items";
import { EHat, TAccessory, THat } from "../types/Store";
import { fixTo, removeFast } from "../utility/Common";
import DataHandler from "../utility/DataHandler";
import myPlayer, { ClientPlayer } from "./ClientPlayer";
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
    currentItem: EItem | -1 = -1;

    clanName: string | null = null;
    nickname = "unknown";
    skinID = 0;
    readonly scale = 35;

    hatID: THat = 0;
    accessoryID: TAccessory = 0;

    previousHealth = 100;
    currentHealth = 100;
    readonly maxHealth = 100;

    readonly weapon = {} as {
        /**
         * ID of weapon player is holding at the current tick
         */
        current: EWeapon;

        /**
         * ID of current primary weapon
         */
        primary: TPrimary;

        /**
         * ID of current secondary weapon
         */
        secondary: TSecondary | null;
    }

    private readonly variant = {} as {
        current: WeaponVariant;
        primary: WeaponVariant;
        secondary: WeaponVariant;
    }

    readonly reload = { primary: {}, secondary: {}, turret: {} } as {
        readonly primary: IReload;
        readonly secondary: IReload;
        readonly turret: IReload;
    }

    /**
     * Set of items placed by the player
     */
    readonly objects = new Set<PlayerObject>();
    newlyCreated = true;
    usingBoost = false;
    isFullyUpgraded = false;

    private readonly dangerList: EDanger[] = [];
    danger = EDanger.NONE;

    constructor() {
        super();

        this.init();
    }

    init() {
        this.weapon.current = 0;
        this.weapon.primary = 0;
        this.weapon.secondary = null;

        this.variant.current = 0;
        this.variant.primary = 0;
        this.variant.secondary = 0;

        const reload = this.reload;
        reload.primary.current = -1;
        reload.primary.max = -1;

        reload.secondary.current = -1;
        reload.secondary.max = -1;

        reload.turret.current = 2500;
        reload.turret.max = 2500;

        this.newlyCreated = true;
        this.usingBoost = false;
        this.isFullyUpgraded = false;
    }

    update(
        id: number,
        x: number,
        y: number,
        angle: number,
        currentItem: EItem | -1,
        currentWeapon: EWeapon,
        weaponVariant: WeaponVariant,
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
        this.variant.current = weaponVariant;
        this.clanName = clanName;
        this.hatID = hatID;
        this.accessoryID = accessoryID;
        this.newlyCreated = false;
        this.updateReloads();
    }

    private increaseReload(reload: IReload) {
        reload.current = Math.min(reload.current + PlayerManager.step, reload.max);
    }
    
    private updateTurretReload() {
        const reload = this.reload.turret;
        this.increaseReload(reload);
        if (this.hatID !== EHat.TURRET_GEAR) return;

        const speed = Projectiles[1].speed;
        const list = ProjectileManager.projectiles.get(speed);
        if (list === undefined) return;

        const current = this.position.current;
        for (let i=0;i<list.length;i++) {
            const projectile = list[i];
            const distance = current.distance(projectile.position.current);
            if (distance < 2) {
                reload.current = 0;
                removeFast(list, i);
                break;
            }
        }
    }

    private updateReloads() {
        this.updateTurretReload();

        // We should not reload if player is holding item
        if (this.currentItem !== -1) return;
        
        const weapon = Weapons[this.weapon.current];
        const type = WeaponTypeString[weapon.itemType];
        const reload = this.reload[type];

        const weaponSpeed = this.getWeaponSpeed(weapon.id, this.hatID);
        if (reload.max === -1) {
            reload.current = weaponSpeed;
        }
        reload.max = weaponSpeed;
        this.increaseReload(reload);

        this.weapon[type] = weapon.id as EWeapon & null;
        this.variant[type] = this.variant.current;

        if (this.weapon.secondary === null) {
            this.weapon.secondary = this.predictSecondary(this.weapon.primary);
        }

        // Handle reloading of shootable weapons
        if ("projectile" in weapon) {
            const speedMult = this.getWeaponSpeedMult();
            const type = weapon.projectile;
            const speed = Projectiles[type].speed * speedMult;
            const list = ProjectileManager.projectiles.get(speed);
            if (list === undefined) return;

            // It won't work if players have the same position, angle, hats and ranged weapons
            // I could potentially check for secondary weapon reloading
            const current = this.position.current;
            for (let i=0;i<list.length;i++) {
                const projectile = list[i];
                const distance = current.distance(projectile.position.current);
                if (distance < 2 && this.angle === projectile.angle) {
                    reload.current = 0;
                    removeFast(list, i);
                    break;
                }
            }
        }

        // this.dangerList.push(this.canInstakill());
        // if (this.dangerList.length >= 2) {
        //     this.dangerList.shift();
        // }
        // this.danger = Math.max(...this.dangerList);
        this.danger = this.canInstakill();
    }

    handleObjectPlacement(object: PlayerObject) {
        this.objects.add(object);

        const item = Items[object.type];
        if (object.seenPlacement) {
            if (object.type === EItem.TURRET) {
                ObjectManager.resetTurret(object.id);
            } else if (object.type === EItem.BOOST_PAD && !this.newlyCreated) {
                this.usingBoost = true;
            }
        }

        if (myPlayer.isMyPlayerByID(this.id) && item.itemType === ItemType.WINDMILL) {
            myPlayer.totalGoldAmount += item.pps;
        }
    }

    handleObjectDeletion(object: PlayerObject) {
        this.objects.delete(object);

        const item = Items[object.type];
        if (myPlayer.isMyPlayerByID(this.id) && item.itemType === ItemType.WINDMILL) {
            myPlayer.totalGoldAmount -= item.pps;
        }
    }

    predictSecondary(id: TPrimary): TSecondary | null {
        if (
            id === EWeapon.POLEARM ||
            id === EWeapon.SHORT_SWORD
        ) return EWeapon.MUSKET;
        if (id === EWeapon.KATANA) return EWeapon.GREAT_HAMMER;
        return null;
    }

    getWeaponVariant(id: EWeapon) {
        const type = Weapons[id].itemType;
        const variant = this.variant[WeaponTypeString[type]];
        return {
            current: variant,
            next: Math.min(variant + 1, WeaponVariant.RUBY) as WeaponVariant,
        } as const;
    }

    /**
     * Returns the number of damage, that can be dealt by the player weapon to buildings
     */
    getBuildingDamage(id: TMelee): number {
        const weapon = Weapons[id];
        const variant = WeaponVariants[this.getWeaponVariant(id).current];

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

    canDealPoison(weaponID: TMelee) {
        const variant = this.getWeaponVariant(weaponID).current;
        const isRuby = variant === WeaponVariant.RUBY;
        const hasPlague = this.hatID === EHat.PLAGUE_MASK;
        return {
            isAble: isRuby || hasPlague,
            count: isRuby ? 5 : hasPlague ? 6 : 0
        } as const;
    }

    getWeaponSpeed(id: EWeapon, hat: THat): number {
        const reloadSpeed = hat === EHat.SAMURAI_ARMOR ? Hats[hat].atkSpd : 1;
        return Weapons[id].speed * reloadSpeed;
    }

    getWeaponSpeedMult() {
        if (this.hatID === EHat.MARKSMAN_CAP) {
            return Hats[this.hatID].aMlt;
        }
        return 1;
    }

    getMaxWeaponRange() {
        const { primary, secondary } = this.weapon;
        const primaryRange = Weapons[primary].range;
        if (DataHandler.isMelee(secondary)) {
            const range = Weapons[secondary].range;
            if (range > primaryRange) {
                return range;
            }
        }
        return primaryRange;
    }

    /**
     * Returns the maximum possible damage of the specified weapon to entities, including bull and weapon level.
     */
    getMaxWeaponDamage(id: EWeapon | null, excludeVariant?: boolean): number {
        if (DataHandler.isMelee(id)) {
            const bull = Hats[EHat.BULL_HELMET];
            const damage = Weapons[id].damage * bull.dmgMultO;
            if (excludeVariant) return damage;

            const variant = this.getWeaponVariant(id).current;
            return damage * WeaponVariants[variant].val;
        } else if (DataHandler.isShootable(id)) {
            const projectile = DataHandler.getProjectile(id);
            return projectile.damage;
        }
        return 0;
    }

    private isReloaded(type: TReload) {
        const reload = this.reload[type].current;
        const min = SocketManager.TICK;
        const max = this.reload[type].max - SocketManager.TICK;
        return reload <= min || reload >= max;
        // return reload <= min || reload >= max;
    }

    private canInstakill(): EDanger {

        const primaryDamage = this.getMaxWeaponDamage(this.weapon.primary);
        const secondaryDamage = this.getMaxWeaponDamage(this.weapon.secondary);
        const soldier = Hats[EHat.SOLDIER_HELMET];

        let totalDamage = 0;
        if (this.isReloaded("primary")) totalDamage += primaryDamage;
        if (this.isReloaded("secondary")) totalDamage += secondaryDamage;
        if (this.isReloaded("turret")) totalDamage += 25;

        if (totalDamage * soldier.dmgMult >= 100) {
            return EDanger.HIGH;
        }

        if (totalDamage >= 100) {
            return EDanger.MEDIUM;
        }

        return EDanger.NONE;
    }
}

export default Player;