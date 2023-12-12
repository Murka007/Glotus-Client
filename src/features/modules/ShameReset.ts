import PlayerClient from "../../PlayerClient";
import { EHat, EStoreType } from "../../types/Store";

class ShameReset {
    readonly name = "shameReset";
    private readonly client: PlayerClient;
    constructor(client: PlayerClient) {
        this.client = client;
    }

    private get isEquipTime() {
        const { myPlayer, SocketManager } = this.client;
        const max = 1000 - SocketManager.TICK;
        return myPlayer.timerCount >= max;
    }

    private get shouldReset() {
        const { myPlayer, ModuleHandler } = this.client;
        return (
            !myPlayer.shameActive &&
            myPlayer.shameCount > 0 &&
            myPlayer.poisonCount === 0 &&
            !ModuleHandler.didAntiInsta &&
            this.isEquipTime
        )
    }

    postTick(): void {
        this.handleShameReset();
    }

    private handleShameReset(isDmgOverTime?: boolean) {
        const { myPlayer, ModuleHandler } = this.client;
        if (ModuleHandler.sentHatEquip) return;

        const store = ModuleHandler.getHatStore();
        const bull = EHat.BULL_HELMET;
        const bullState = store.utility.get(bull);

        if (bullState === undefined && this.shouldReset) {
            const isEquipped = ModuleHandler.equip(EStoreType.HAT, bull);
            if (isEquipped) store.utility.set(bull, true);
        } else if (bullState && (myPlayer.shameCount === 0 || isDmgOverTime || myPlayer.poisonCount !== 0)) {
            store.utility.delete(bull);
        }
    }

    healthUpdate(): boolean {
        const { myPlayer } = this.client;
        const { currentHealth, previousHealth, shameCount } = myPlayer;
        const difference = Math.abs(currentHealth - previousHealth);
        const isDmgOverTime = difference === 5 && currentHealth < previousHealth;
        const shouldRemoveBull = isDmgOverTime && shameCount > 0;

        if (isDmgOverTime) {
            myPlayer.timerCount = 0;
        }

        this.handleShameReset(isDmgOverTime);
        return shouldRemoveBull;
    }
}

export default ShameReset;