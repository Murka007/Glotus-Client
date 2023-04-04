import { Items, Projectiles, Weapons } from "../constants/Items";
import myPlayer from "../data/ClientPlayer";
import { ItemType, TDestroyable, THealable, TItem, TItemType, TMelee, TPlaceable, TShootable, TWeapon, TWeaponData, TWeapons, TWeaponType, WeaponType } from "../types/Items";

/**
 * Used in order to optimize management with constant data
 */
class DataHandler {

    /**
     * Returns weapon data by type based on inventory
     */
    static getWeaponByType<T extends TWeaponType>(type: T) {
        return Weapons[myPlayer.getItemByType(type)];
    }

    /**
     * Returns item data by type based on inventory
     */
    static getItemByType<T extends TItemType>(type: T) {
        return Items[myPlayer.getItemByType(type)];
    }

    static isPrimary(id: TWeapon): id is TWeaponData[0] {
        return Weapons[id].itemType === WeaponType.PRIMARY;
    }

    static isSecondary(id: TWeapon): id is NonNullable<TWeaponData[1]> {
        return Weapons[id].itemType === WeaponType.SECONDARY;
    }

    /**
     * Checks if weapon can shoot
     */
    static isShootable(id: TWeapon): id is TShootable {
        return id !== null && "projectile" in Weapons[id];
    }

    static isMelee(id: TWeapon): id is TMelee {
        return id !== null && "range" in Weapons[id];
    }

    static isWeapon(id: number): id is TWeapon {
        return Weapons[id] !== undefined;
    }

    /**
     * Checks if item has health by ID
     */
    static isDestroyable(id: TPlaceable | null): id is TDestroyable {
        return id !== null && "health" in Items[id];
    }

    static isPlaceable(id: TItem | -1): id is TPlaceable {
        return id !== -1 && "itemGroup" in Items[id];
    }

    static isHealable(id: TItem): id is THealable {
        return "restore" in Items[id];
    }

    /**
     * Returns a projectile data from shootable weapon ID
     */
    static getProjectile(id: TShootable) {
        return Projectiles[Weapons[id].projectile];
    }
}

export default DataHandler;