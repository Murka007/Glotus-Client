import myPlayer from "../../data/ClientPlayer";
import { EStoreType } from "../../types/Store";
import ModuleHandler from "../ModuleHandler";

class Autohat {
    postTick() {
        if (ModuleHandler.sentHatEquip) return;

        const store = ModuleHandler.getHatStore();
        if (store.utility.size === 0) {
            const hat = myPlayer.getBestCurrentHat();
            ModuleHandler.equip(EStoreType.HAT, hat, "CURRENT");
        }
    }
}

export default Autohat;