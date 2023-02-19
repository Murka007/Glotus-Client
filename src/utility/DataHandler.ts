import { Items, Weapons } from "../constants/Items";
import myPlayer from "../data/ClientPlayer";
import { ItemType, TItemType, TShootable, TWeapon, TWeaponData, TWeapons, TWeaponType, WeaponType } from "../types/Items";

/**
 * Used in order to optimize management with constant data
 */
class DataHandler {
    static getWeaponByType<T extends TWeaponType>(type: T) {
        return Weapons[myPlayer.getItemByType(type)];
    }

    static getItemByType<T extends TItemType>(type: T) {
        return Items[myPlayer.getItemByType(type)];
    }

    static isPrimary(id: TWeapon): id is TWeaponData[0] {
        return Weapons[id].itemType === WeaponType.PRIMARY;
    }

    static isSecondary(id: TWeapon): id is NonNullable<TWeaponData[1]> {
        if (this.isShootable(id)) {
            const gg = Weapons[id];
        }
        return Weapons[id].itemType === WeaponType.SECONDARY;
    }

    static isShootable(id: TWeapon): id is TShootable {
        return "projectile" in Weapons[id];
    }
}

export default DataHandler;