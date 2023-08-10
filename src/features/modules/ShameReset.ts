import SocketManager from "../../Managers/SocketManager";
import Config from "../../constants/Config";
import myPlayer from "../../data/ClientPlayer";
import { EHat, EStoreType } from "../../types/Store";
import Logger from "../../utility/Logger";
import ModuleHandler from "../ModuleHandler";

const ShameReset = new class ShameReset {

    private get isEquipTime() {
        return myPlayer.timerCount > 1000 - SocketManager.TICK;
    }

    private get shouldReset() {
        return myPlayer.shameCount > 0 && !myPlayer.shameActive && this.isEquipTime;
    }

    postTick(): void {
        if (ModuleHandler.sentHatEquip) return;
        if (ModuleHandler.didAntiInsta) return;

        const store = ModuleHandler.getHatStore();
        const bull = EHat.BULL_HELMET;
        const bullState = store.utility.get(bull);
        if (bullState === undefined && this.shouldReset) {
            store.utility.set(bull, false);
            ModuleHandler.equip(EStoreType.HAT, bull, "UTILITY");
        } else if (bullState) {
            store.utility.delete(bull);
            ModuleHandler.equip(EStoreType.HAT, store.current, "CURRENT");
        }
    }

    healthUpdate(): boolean {
        const { currentHealth, previousHealth, shameCount } = myPlayer;
        const difference = Math.abs(currentHealth - previousHealth);
        const isDmgOverTime = difference <= 5 && currentHealth < previousHealth;
        const shouldReset = isDmgOverTime && shameCount > 0;

        if (isDmgOverTime) {
            myPlayer.timerCount = 0;
        }
        const store = ModuleHandler.getHatStore();
        if (shouldReset) {
            store.utility.set(EHat.BULL_HELMET, true);
            return true;
        }
        return false;
    }
}

export default ShameReset;