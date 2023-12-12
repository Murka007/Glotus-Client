import PlayerClient from "../../PlayerClient";
import { EAttack } from "../../types/Enums";
import { WeaponType } from "../../types/Items";
import { EStoreType } from "../../types/Store";

class TempData {
    readonly name = "tempData";
    private readonly client: PlayerClient;
    private weapon = WeaponType.PRIMARY;
    private readonly store: [number, number] = [0, 0];

    constructor(client: PlayerClient) {
        this.client = client;
    }

    setWeapon(weapon: WeaponType) {
        this.weapon = weapon;
        this.updateWeapon();
    }

    setAttacking(attacking: EAttack) {
        const { ModuleHandler } = this.client;
        if (ModuleHandler.attacking === attacking) return;
        ModuleHandler.attacking = attacking;
        
        if (attacking !== EAttack.DISABLED) {
            ModuleHandler.attackingState = attacking;
        }
    }

    setStore(type: EStoreType, id: number) {
        this.store[type] = id;
        this.handleBuy(type);
    }

    private updateWeapon() {
        const { ModuleHandler } = this.client;
        if (ModuleHandler.weapon !== this.weapon) {
            ModuleHandler.whichWeapon(this.weapon);
        }
    }

    private handleBuy(type: EStoreType) {
        const { ModuleHandler } = this.client;
        const id = this.store[type];
        const store = ModuleHandler.store[type];
        if (store.actual === id) return;
        if (ModuleHandler.sentHatEquip) return;
        
        const temp = ModuleHandler.canBuy(type, id) ? id : 0;
        ModuleHandler.equip(type, temp, true);
    }

    postTick(): void {
        this.updateWeapon();
        this.handleBuy(EStoreType.HAT);
        this.handleBuy(EStoreType.ACCESSORY);
    }

}

export default TempData;