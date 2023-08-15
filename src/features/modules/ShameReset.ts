import SocketManager from "../../Managers/SocketManager";
import myPlayer from "../../data/ClientPlayer";
import { EHat, EStoreType } from "../../types/Store";
import ModuleHandler from "../ModuleHandler";

const ShameReset = new class ShameReset {

    private get isEquipTime() {
        return myPlayer.timerCount > 1000 - SocketManager.TICK;
    }

    private get shouldReset() {
        return (
            myPlayer.shameCount > 0 &&
            !myPlayer.shameActive &&
            myPlayer.poisonCount === 0 &&
            this.isEquipTime
        )
    }

    postTick(): void {
        this.handleShameReset();
    }

    private handleShameReset(isDmgOverTime?: boolean) {
        if (ModuleHandler.sentHatEquip) return;
        if (ModuleHandler.didAntiInsta) return;

        const store = ModuleHandler.getHatStore();
        const bull = EHat.BULL_HELMET;
        const bullState = store.utility.get(bull);
        if (bullState === undefined && this.shouldReset) {
            const isEquipped = ModuleHandler.equip(EStoreType.HAT, bull);
            if (isEquipped) store.utility.set(bull, false);
        } else if (isDmgOverTime && bullState !== undefined) {
            store.utility.set(bull, true);
        } else if (bullState) {
            const isEquipped = ModuleHandler.equip(EStoreType.HAT, store.best);
            if (isEquipped) store.utility.delete(bull);
        }
    }

    healthUpdate(): boolean {
        const { currentHealth, previousHealth, shameCount } = myPlayer;
        const difference = Math.abs(currentHealth - previousHealth);
        const isDmgOverTime = difference <= 5 && currentHealth < previousHealth;
        const shouldRemoveBull = isDmgOverTime && shameCount > 0;

        if (isDmgOverTime) {
            myPlayer.timerCount = 0;
        }

        this.handleShameReset(isDmgOverTime);
        return shouldRemoveBull;
    }
}

export default ShameReset;