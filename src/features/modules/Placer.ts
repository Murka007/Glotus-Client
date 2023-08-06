import { ItemType } from "../../types/Items";
import ModuleHandler from "../ModuleHandler";

class Placer {
    postTick() {
        if (
            ModuleHandler.currentType === null ||
            !ModuleHandler.canPlace(ModuleHandler.currentType)
        ) return;
        
        if (ModuleHandler.currentType === ItemType.FOOD) {
            ModuleHandler.heal();
        } else {
            ModuleHandler.place(ModuleHandler.currentType);
        }
    }
}

export default Placer;