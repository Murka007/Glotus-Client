import { ItemType } from "../../types/Items";
import ModuleHandler from "../ModuleHandler";

class Placer {
    postTick() {
        if (
            ModuleHandler.currentType === null ||
            !ModuleHandler.canPlace(ModuleHandler.currentType)
        ) return;
        
        if (ModuleHandler.currentType !== ItemType.FOOD) {
            ModuleHandler.place(ModuleHandler.currentType);
            return;
        }

        if (ModuleHandler.didAntiInsta) return;
        ModuleHandler.heal(true);
    }
}

export default Placer;