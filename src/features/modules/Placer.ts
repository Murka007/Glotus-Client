import { ItemType } from "../../types/Items";
import ModuleHandler from "../ModuleHandler";

class Placer {
    private placeCount = 0;
    
    postTick() {
        const { currentType, didAntiInsta } = ModuleHandler;
        if (currentType === null || !ModuleHandler.canPlace(currentType)) return;
        

        if (currentType !== ItemType.FOOD) {
            // If it won't work, check if myPlayer can actually place item
            if (this.placeCount === 0) {
                ModuleHandler.place(currentType);
            }
            this.placeCount = (didAntiInsta ? ((this.placeCount + 1) % 2) : 0);
            return;
        }

        if (didAntiInsta) return;
        ModuleHandler.heal(true);
    }
}

export default Placer;