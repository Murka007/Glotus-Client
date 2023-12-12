import PlayerClient from "../../PlayerClient";
import { EStoreType } from "../../types/Store";

class Autohat {
    readonly name = "autoHat";
    private readonly client: PlayerClient;
    private utilitySize: [number, number] = [0, 0];

    constructor(client: PlayerClient) {
        this.client = client;
    }

    private handleUtility(type: EStoreType) {
        const { ModuleHandler, myPlayer } = this.client;

        const store = ModuleHandler.store[type];
        if (store.lastUtility !== null) {
            store.utility.delete(store.lastUtility);
            store.lastUtility = null;
        }

        if (ModuleHandler.canAttack && store.utility.size === 0) {
            const id = myPlayer.getBestUtilityID(type);
            if (id === null) return;

            if (ModuleHandler.equip(type, id)) {
                store.lastUtility = id;
                store.utility.set(id, true);
            }
        }
    }

    private handleEquip(type: EStoreType) {
        const { ModuleHandler } = this.client;
        const store = ModuleHandler.store[type];
        const size = store.utility.size;
        const oldSize = this.utilitySize[type];
        if (size === 0 && (size !== oldSize || store.best !== store.current)) {
            if (ModuleHandler.equip(type, store.current)) {
                store.best = store.current;
            }
        }
        this.utilitySize[type] = size;
    }

    postTick() {
        const { ModuleHandler } = this.client;
        if (!ModuleHandler.sentHatEquip) {
            this.handleUtility(EStoreType.HAT);
            this.handleEquip(EStoreType.HAT);
        }
        
        if (!ModuleHandler.sentAccEquip && !ModuleHandler.sentHatEquip) {
            // this.handleUtility(EStoreType.ACCESSORY);
            this.handleEquip(EStoreType.ACCESSORY);
        }
    }
}

export default Autohat;