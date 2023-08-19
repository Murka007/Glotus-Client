import ObjectManager from "../Managers/ObjectManager";
import PlayerManager from "../Managers/PlayerManager";
import ProjectileManager from "../Managers/ProjectileManager";
import SocketManager from "../Managers/SocketManager";
import { Items, Projectiles, WeaponVariants, Weapons } from "../constants/Items";
import { Hats } from "../constants/Store";
import { IReload, TReload } from "../types/Common";
import { EDanger } from "../types/Enums";
import { EItem, EWeapon, ItemGroup, ItemType, TGlobalInventory, TMelee, TPlaceable, TPrimary, TSecondary, WeaponType, WeaponTypeString, WeaponVariant } from "../types/Items";
import { EAccessory, EHat } from "../types/Store";
import { removeFast } from "../utility/Common";
import DataHandler from "../utility/DataHandler";
import myPlayer from "./ClientPlayer";
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

    hatID: EHat = 0;
    accessoryID: EAccessory = 0;

    previousHealth = 100;
    currentHealth = 100;
    readonly maxHealth = 100;

    readonly globalInventory = {} as TGlobalInventory;
    readonly weapon = {} as {
        /**
         * ID of weapon player is holding at the current tick
         */
        current: EWeapon;
        oldCurrent: EWeapon;

        /**
         * ID of current primary weapon
         */
        primary: TPrimary | null;

        /**
         * ID of current secondary weapon
         */
        secondary: TSecondary | null;
    }

    protected readonly variant = {} as {
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
    onPlatform = false;
    isFullyUpgraded = false;

    readonly dangerList: EDanger[] = [];
    danger = EDanger.NONE;

    constructor() {
        super();

        this.init();
    }

    resetReload() {
        const reload = this.reload;
        reload.primary.current = -1;
        reload.primary.max = -1;

        reload.secondary.current = -1;
        reload.secondary.max = -1;

        reload.turret.current = 2500;
        reload.turret.max = 2500;
    }

    private resetGlobalInventory() {
        this.globalInventory[WeaponType.PRIMARY] = EWeapon.TOOL_HAMMER;
        this.globalInventory[WeaponType.SECONDARY] = null;
        this.globalInventory[ItemType.FOOD] = EItem.APPLE;
        this.globalInventory[ItemType.WALL] = EItem.WOOD_WALL;
        this.globalInventory[ItemType.SPIKE] = EItem.SPIKES;
        this.globalInventory[ItemType.WINDMILL] = EItem.WINDMILL;
        this.globalInventory[ItemType.FARM] = null;
        this.globalInventory[ItemType.TRAP] = null;
        this.globalInventory[ItemType.TURRET] = null;
        this.globalInventory[ItemType.SPAWN] = null;
    }

    init() {
        this.weapon.current = 0;
        this.weapon.oldCurrent = 0;
        this.weapon.primary = null;
        this.weapon.secondary = null;

        this.variant.current = 0;
        this.variant.primary = 0;
        this.variant.secondary = 0;

        this.resetReload();
        this.resetGlobalInventory();

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
        hatID: EHat,
        accessoryID: EAccessory,
        isSkull: 1 | 0
    ) {
        this.id = id;

        this.position.previous.setVec(this.position.current);
        this.position.current.setXY(x, y);
        this.setFuturePosition();

        this.angle = angle;
        this.currentItem = currentItem;
        this.weapon.oldCurrent = this.weapon.current;
        this.weapon.current = currentWeapon;
        this.variant.current = weaponVariant;
        this.clanName = clanName;
        this.hatID = hatID;
        this.accessoryID = accessoryID;
        this.newlyCreated = false;
        this.onPlatform = this.checkCollision(ItemGroup.PLATFORM);
        this.predictItems();
        this.predictWeapons();
        this.updateReloads();
    }

    private predictItems() {
        if (this.currentItem === -1) return;

        const item = Items[this.currentItem];
        this.globalInventory[item.itemType] = this.currentItem as EItem & null;
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

        this.increaseReload(reload);

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

            this.updateInventory(object.type);
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

    /**
     * Updates the player's inventory based on the placed item
     */
    private updateInventory(type: TPlaceable) {
        const item = Items[type];
        const inventoryID = this.globalInventory[item.itemType];
        const shouldUpdate = inventoryID === null || item.age > Items[inventoryID].age;
        if (shouldUpdate) {
            this.globalInventory[item.itemType] = item.id as ItemType & null;
        }
    }

    /**
     * Based on the player's already known weapons and items, calculates whether the player is fully upgraded
     */
    private detectFullUpgrade() {
        const inventory = this.globalInventory;
        const primary = inventory[WeaponType.PRIMARY];
        const secondary = inventory[WeaponType.SECONDARY];
        const spike = inventory[ItemType.SPIKE];

        if (primary && secondary) {
            if (
                "isUpgrade" in Weapons[primary] &&
                "isUpgrade" in Weapons[secondary]
            ) return true;
        }

        return (
            primary && Weapons[primary].age === 8 ||
            secondary && Weapons[secondary].age === 9 ||
            spike && Items[spike].age === 9 ||
            inventory[ItemType.WINDMILL] === EItem.POWER_MILL ||
            inventory[ItemType.SPAWN] === EItem.SPAWN_PAD
        )
    }

    private predictPrimary(id: TSecondary): TPrimary | null {
        if (id === EWeapon.GREAT_HAMMER || DataHandler.isShootable(id)) return EWeapon.POLEARM;
        if (id === EWeapon.WOODEN_SHIELD) return EWeapon.KATANA;
        return null;
    }

    private predictSecondary(id: TPrimary): TSecondary | null {
        if (
            id === EWeapon.POLEARM ||
            id === EWeapon.SHORT_SWORD
        ) return EWeapon.MUSKET;

        if (id === EWeapon.KATANA) return EWeapon.GREAT_HAMMER;
        return null;
    }

    private predictWeapons() {
        const { current, oldCurrent } = this.weapon;
        const weapon = Weapons[current];
        const type = WeaponTypeString[weapon.itemType];
        const reload = this.reload[type];

        // May not work if attacked, switched to other type and upgraded previous type
        const weaponSpeed = this.getWeaponSpeed(weapon.id, this.hatID);
        const upgradedWeapon = current !== oldCurrent && weapon.itemType === Weapons[oldCurrent].itemType;
        if (reload.max === -1 || upgradedWeapon) {
            reload.current = weaponSpeed;
        }
        reload.max = weaponSpeed;
        
        this.globalInventory[weapon.itemType] = current as EWeapon & null;
        this.variant[type] = this.variant.current;

        const currentType = this.weapon[type];
        if (currentType === null || weapon.age > Weapons[currentType].age) {
            this.weapon[type] = current as EWeapon & null;
        }

        // Player can hold only one type of item, primary or secondary. Based on current weapon id, we predict other weapon type
        // Doesn't work correctly if player has already shown both types of weapons and at the same time hasn't fully upgraded
        if (this.weapon.primary === null && DataHandler.isSecondary(current)) {
            this.weapon.primary = this.predictPrimary(current);
        } else if (this.weapon.secondary === null && DataHandler.isPrimary(current)) {
            this.weapon.secondary = this.predictSecondary(current);
        }
        
        // Update weapons if it is already known that the player is fully upgraded
        this.isFullyUpgraded = this.detectFullUpgrade();
        if (this.isFullyUpgraded) {
            const primary = this.globalInventory[WeaponType.PRIMARY];
            const secondary = this.globalInventory[WeaponType.SECONDARY];

            // If some weapon is not yet known, leave the predicted
            if (primary !== null) this.weapon.primary = primary;
            if (secondary !== null) this.weapon.secondary = secondary;
        }
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

    getWeaponSpeed(id: EWeapon, hat: EHat): number {
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
        const primaryRange = Weapons[primary!].range;
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
        // const min = SocketManager.TICK;
        const max = this.reload[type].max - SocketManager.TICK;// * 2;
        return reload >= max;
        // return reload <= min || reload >= max;
    }

    canPossiblyInstakill(): EDanger {
        const { primary, secondary } = this.weapon;
        const primaryDamage = this.getMaxWeaponDamage(primary);
        const secondaryDamage = this.getMaxWeaponDamage(secondary);
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