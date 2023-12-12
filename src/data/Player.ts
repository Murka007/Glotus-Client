import { myClient } from "..";
import PlayerClient from "../PlayerClient";
import { Items, Projectiles, WeaponVariants, Weapons } from "../constants/Items";
import { Accessories, Hats } from "../constants/Store";
import { IReload, TReload } from "../types/Common";
import { EDanger } from "../types/Enums";
import { EItem, EProjectile, EWeapon, ItemType, TGlobalInventory, TMelee, TPlaceable, TPrimary, TSecondary, TWeaponType, WeaponType, WeaponTypeString, WeaponVariant } from "../types/Items";
import { EAccessory, EHat, EStoreType } from "../types/Store";
import { removeFast } from "../utility/Common";
import DataHandler from "../utility/DataHandler";
import Entity from "./Entity";
import { PlayerObject } from "./ObjectItem";
import Projectile from "./Projectile";

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
    isLeader = false;
    nickname = "unknown";
    skinID = 0;
    readonly scale = 35;

    hatID: EHat = 0;
    accessoryID: EAccessory = 0;

    private totalStorePrice = 0;
    readonly storeList = [
        new Set<number>(),
        new Set<number>(),
    ] as const;

    previousHealth = 100;
    currentHealth = 100;
    tempHealth = 100;
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

    /** Last or current amount of gold player had in leaderboard */
    totalGold = 0;

    /** true, if player is currently in leaderboard */
    inLeaderboard = false;
    newlyCreated = true;

    /** true, if player is using boost pads, potentially 1 tick user */
    usingBoost = false;

    isTrapped = false;

    /** true, if player is currently standing on platform */
    onPlatform = false;
    isFullyUpgraded = false;

    private potentialDamage = 0;
    readonly foundProjectiles = new Map<number, Projectile[]>();
    readonly dangerList: EDanger[] = [];
    danger = EDanger.NONE;

    constructor(client: PlayerClient) {
        super(client);
        this.init();
    }

    private hasFound(projectile: Projectile) {
        const key = projectile.type;
        return this.foundProjectiles.has(key);
    }

    addFound(projectile: Projectile) {
        const key = projectile.type;
        if (!this.foundProjectiles.has(key)) {
            this.foundProjectiles.set(key, []);
        }

        const list = this.foundProjectiles.get(key)!;
        list.push(projectile);
    }

    resetReload() {
        const { primary, secondary } = this.weapon;
        const primarySpeed = primary !== null ? this.getWeaponSpeed(primary) : -1;
        const secondarySpeed = secondary !== null ? this.getWeaponSpeed(secondary) : -1;
        
        const reload = this.reload;
        reload.primary.current = primarySpeed;
        reload.primary.max = primarySpeed;

        reload.secondary.current = secondarySpeed;
        reload.secondary.max = secondarySpeed;

        reload.turret.current = 2500;
        reload.turret.max = 2500;
    }

    private resetGlobalInventory() {
        this.globalInventory[WeaponType.PRIMARY] = null;
        this.globalInventory[WeaponType.SECONDARY] = null;
        this.globalInventory[ItemType.FOOD] = null;
        this.globalInventory[ItemType.WALL] = null;
        this.globalInventory[ItemType.SPIKE] = null;
        this.globalInventory[ItemType.WINDMILL] = null;
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
        this.foundProjectiles.clear();
    }

    get canUseTurret() {
        return this.hatID !== EHat.EMP_HELMET;
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
        this.isLeader = Boolean(isLeader);
        this.hatID = hatID;
        this.accessoryID = accessoryID;
        if (!this.storeList[EStoreType.HAT].has(hatID)) {
            this.storeList[EStoreType.HAT].add(hatID);
            this.totalStorePrice += Hats[hatID].price;
        }
        if (!this.storeList[EStoreType.ACCESSORY].has(accessoryID)) {
            this.storeList[EStoreType.ACCESSORY].add(accessoryID);
            this.totalStorePrice += Accessories[accessoryID].price;
        }
        this.newlyCreated = false;
        this.potentialDamage = 0;
        this.predictItems();
        this.predictWeapons();
        this.updateReloads();
    }

    updateHealth(health: number) {
        this.previousHealth = this.currentHealth;
        this.currentHealth = health;
        this.tempHealth = health;
    }

    private predictItems() {
        if (this.currentItem === -1) return;

        const item = Items[this.currentItem];
        this.globalInventory[item.itemType] = this.currentItem as EItem & null;
    }

    private increaseReload(reload: IReload) {
        reload.current = Math.min(reload.current + this.client.PlayerManager.step, reload.max);
    }
    
    private updateTurretReload() {
        const reload = this.reload.turret;
        this.increaseReload(reload);
        if (this.hatID !== EHat.TURRET_GEAR) return;

        const { ProjectileManager } = this.client;
        const speed = Projectiles[1].speed;
        const list = ProjectileManager.projectiles.get(speed);
        if (list === undefined) return;

        const current = this.position.current;
        for (let i=0;i<list.length;i++) {
            const projectile = list[i];
            const distance = current.distance(projectile.position.current);
            if (distance < 2) {
                if (this.hasFound(projectile)) {
                    this.foundProjectiles.clear();
                }
                this.addFound(projectile);
                projectile.owner = this;

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
            const { ProjectileManager } = this.client;
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
                    if (this.hasFound(projectile)) {
                        this.foundProjectiles.clear();
                    }
                    this.addFound(projectile);
                    projectile.owner = this;

                    reload.current = 0;
                    reload.max = this.getWeaponSpeed(weapon.id);
                    removeFast(list, i);
                    break;
                }
            }
        }

    }

    handleObjectPlacement(object: PlayerObject) {
        this.objects.add(object);

        const { myPlayer, ObjectManager } = this.client;
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

        const { myPlayer } = this.client;
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

    private predictPrimary(id: TSecondary) {
        if (id === EWeapon.WOODEN_SHIELD) return EWeapon.KATANA;
        return EWeapon.POLEARM;
    }

    private predictSecondary(id: TPrimary) {
        if (id === EWeapon.TOOL_HAMMER) return null;
        if (id === EWeapon.GREAT_AXE || id === EWeapon.KATANA) return EWeapon.GREAT_HAMMER;
        return EWeapon.MUSKET;
    }

    private predictWeapons() {
        const { current, oldCurrent } = this.weapon;
        const weapon = Weapons[current];
        const type = WeaponTypeString[weapon.itemType];
        const reload = this.reload[type];

        // May not work if attacked, switched to other type and upgraded previous type
        const upgradedWeapon = current !== oldCurrent && weapon.itemType === Weapons[oldCurrent].itemType;
        if (reload.max === -1 || upgradedWeapon) {
            reload.current = weapon.speed;
            reload.max = weapon.speed;
        }
        
        this.globalInventory[weapon.itemType] = current as EWeapon & null;
        this.variant[type] = this.variant.current;

        const currentType = this.weapon[type];
        if (currentType === null || weapon.age > Weapons[currentType].age) {
            this.weapon[type] = current as EWeapon & null;
        }

        const primary = this.globalInventory[WeaponType.PRIMARY];
        const secondary = this.globalInventory[WeaponType.SECONDARY];
        const notPrimaryUpgrade = primary === null || !("isUpgrade" in Weapons[primary]);
        const notSecondaryUpgrade = secondary === null || !("isUpgrade" in Weapons[secondary]);

        // Player can hold only one type of item, primary or secondary. Based on current weapon id, we predict other weapon type
        // Doesn't work correctly if player has already shown both types of weapons and at the same time hasn't fully upgraded
        if (DataHandler.isSecondary(current) && notPrimaryUpgrade) {
            const predicted = this.predictPrimary(current);
            if (primary === null || Weapons[predicted].upgradeType === Weapons[primary].upgradeType) {
                this.weapon.primary = predicted;
            }
        } else if (DataHandler.isPrimary(current) && notSecondaryUpgrade) {
            const predicted = this.predictSecondary(current);
            if (predicted === null || secondary === null || Weapons[predicted].upgradeType === Weapons[secondary].upgradeType) {
                this.weapon.secondary = predicted;
            }
        }
        
        // Update weapons if it is already known that the player is fully upgraded
        this.isFullyUpgraded = this.detectFullUpgrade();
        if (this.isFullyUpgraded) {
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

    getWeaponSpeed(id: EWeapon, hat = this.hatID): number {
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
    getMaxWeaponDamage(id: EWeapon | null, lookingShield: boolean): number {
        if (DataHandler.isMelee(id)) {
            const bull = Hats[EHat.BULL_HELMET];
            const variant = this.getWeaponVariant(id).current;
            let damage = Weapons[id].damage;
            damage *= bull.dmgMultO;
            damage *= WeaponVariants[variant].val;
            if (lookingShield) {
                damage *= Weapons[EWeapon.WOODEN_SHIELD].shield;
            }
            return damage;
        } else if (DataHandler.isShootable(id) && !lookingShield) {
            const projectile = DataHandler.getProjectile(id);
            return projectile.damage;
        }
        return 0;
    }

    getItemPlaceScale(itemID: TPlaceable) {
        const item = Items[itemID];
        return this.scale + item.scale + item.placeOffset;
    }

    private isReloaded(type: TReload, tick = this.client.SocketManager.TICK * 2) {
        const reload = this.reload[type].current;
        const max = this.reload[type].max - tick;
        return reload >= max;
    }

    meleeReloaded() {
        const { TICK } = this.client.SocketManager;
        return (
            this.isReloaded("primary", TICK) ||
            DataHandler.isMelee(this.weapon.secondary) && this.isReloaded("secondary", TICK)
        )
    }

    private detectSpikeInsta() {
        const { myPlayer, ObjectManager } = this.client;
        const spikeID = this.globalInventory[ItemType.SPIKE] || EItem.SPINNING_SPIKES;
        const placeLength = this.getItemPlaceScale(spikeID);

        const pos1 = this.position.current;
        const pos2 = myPlayer.position.current;
        const angleTo = pos1.angle(pos2);

        const angles = ObjectManager.getBestPlacementAngles(pos1, spikeID, angleTo);
        const spike = Items[spikeID];
        for (const angle of angles) {
            const spikePos = pos1.direction(angle, placeLength);
            const distance = pos2.distance(spikePos);
            const range = this.collisionScale + spike.scale;
            if (distance <= range) {
                this.potentialDamage += spike.damage;
                break;
            }
        }
    }

    canPossiblyInstakill(): EDanger {
        const { PlayerManager, myPlayer } = myClient;
        const lookingShield = PlayerManager.lookingShield(myPlayer, this);

        const { primary, secondary } = this.weapon;
        const primaryDamage = this.getMaxWeaponDamage(primary, lookingShield);
        const secondaryDamage = this.getMaxWeaponDamage(secondary, lookingShield);

        if (this.isReloaded("primary")) {
            this.potentialDamage += primaryDamage;
        }
        if (this.isReloaded("secondary")) {
            const turrets = this.foundProjectiles.get(EProjectile.TURRET);
            this.foundProjectiles.clear();
            if (turrets !== undefined) {
                this.foundProjectiles.set(EProjectile.TURRET, turrets);
            }
            this.potentialDamage += secondaryDamage;
        }
        if (this.isReloaded("turret") && !lookingShield) this.potentialDamage += 25;
        this.detectSpikeInsta();

        // if (!lookingShield) {
        //     const hasTurret = this.foundProjectiles.has(EProjectile.TURRET);
        //     const hasBow = this.foundProjectiles.has(EProjectile.BOW);
        //     if (hasTurret && hasBow) {
        //         return EDanger.SUPER_HIGH;
        //     }
        // }

        if (this.potentialDamage * Hats[EHat.SOLDIER_HELMET].dmgMult >= 100) {
            return EDanger.HIGH;
        }

        if (this.potentialDamage >= 100) {
            return EDanger.MEDIUM;
        }

        return EDanger.NONE;
    }
}

export default Player;