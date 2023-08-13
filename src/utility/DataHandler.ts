import { Items, Projectiles, Weapons } from "../constants/Items";
import { store } from "../constants/Store";
import myPlayer from "../data/ClientPlayer";
import { EItem, EWeapon, ItemType, TAttackable, TDestroyable, THealable, TMelee, TPlaceable, TPrimary, TSecondary, TShootable, WeaponType } from "../types/Items";
import { EStoreType } from "../types/Store";

/**
 * Used in order to optimize management with constant data
 */
class DataHandler {

    static isWeaponType(type: WeaponType | ItemType): type is WeaponType {
        return type < 2;
    }

    static isItemType(type: WeaponType | ItemType): type is ItemType {
        return type > 1;
    }

    /**
     * Returns weapon data by type based on inventory
     */
    static getWeaponByType<T extends WeaponType>(type: T) {
        return Weapons[myPlayer.getItemByType(type)!];
    }

    /**
     * Returns item data by type based on inventory
     */
    static getItemByType<T extends ItemType>(type: T) {
        return Items[myPlayer.getItemByType(type)!];
    }

    static getStore<T extends EStoreType>(type: T) {
        return store[type];
    }

    /**
     * Returns a projectile data from shootable weapon ID
     */
    static getProjectile(id: TShootable) {
        return Projectiles[Weapons[id].projectile];
    }

    static isWeapon(id: number): id is EWeapon {
        return Weapons[id] !== undefined;
    }

    static isItem(id: number): id is EItem {
        return Items[id] !== undefined;
    }

    static isPrimary(id: EWeapon | null): id is TPrimary {
        return id !== null && Weapons[id].itemType === WeaponType.PRIMARY;
    }

    static isSecondary(id: EWeapon | null): id is TSecondary {
        return id !== null && Weapons[id].itemType === WeaponType.SECONDARY;
    }

    static isMelee(id: EWeapon | null): id is TMelee {
        return id !== null && "damage" in Weapons[id];
    }

    static isAttackable(id: EWeapon | null): id is TAttackable {
        return id !== null && "range" in Weapons[id];
    }

    /**
     * Checks if weapon can shoot
     */
    static isShootable(id: EWeapon | null): id is TShootable {
        return id !== null && "projectile" in Weapons[id];
    }

    static isPlaceable(id: EItem | -1): id is TPlaceable {
        return id !== -1 && "itemGroup" in Items[id];
    }

    static isHealable(id: EItem): id is THealable {
        return "restore" in Items[id];
    }

    /**
     * Checks if item has health by ID
     */
    static isDestroyable(id: TPlaceable): id is TDestroyable {
        return "health" in Items[id];
    }
}

export default DataHandler;