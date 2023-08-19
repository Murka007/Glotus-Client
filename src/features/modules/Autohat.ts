import myPlayer from "../../data/ClientPlayer";
import { EStoreType } from "../../types/Store";
import ModuleHandler from "../ModuleHandler";

class Autohat {
    postTick() {
        if (ModuleHandler.sentHatEquip) return;

        const store = ModuleHandler.getHatStore();
        if (store.utility.size === 0) {
            const hat = myPlayer.getBestCurrentHat();
            if (store.best !== hat && ModuleHandler.buy(EStoreType.HAT, hat)) {
                store.best = hat;
                ModuleHandler.equip(EStoreType.HAT, hat);
            }
        }
    }
}

export default Autohat;