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

    postTick(): void {
        if (ModuleHandler.sentHatEquip) return;
        if (ModuleHandler.needToHealPrevious) return;
        if (!this.isEquipTime) return;

        const store = ModuleHandler.getHatStore();
        if (myPlayer.shameCount === 0) {
            store.utility.delete(EHat.BULL_HELMET);
        } else if (!store.utility.has(EHat.BULL_HELMET)) {
            ModuleHandler.equip(EStoreType.HAT, EHat.BULL_HELMET, "UTILITY");
            store.utility.set(EHat.BULL_HELMET, false);
            Logger.end("gg");
        }
    }

    healthUpdate() {
        const { currentHealth, previousHealth, shameCount } = myPlayer;
        const difference = Math.abs(currentHealth - previousHealth);
        const isDmgOverTime = difference <= 5 && currentHealth < previousHealth;
        const shouldReset = isDmgOverTime && shameCount > 0;

        if (isDmgOverTime) {
            myPlayer.timerCount = 0;
        }
        if (shouldReset) {
            const store = ModuleHandler.getHatStore();
            store.utility.set(EHat.BULL_HELMET, true);
        }
    }
}

export default ShameReset;