import myPlayer from "../../data/ClientPlayer";
import { ItemType } from "../../types/Items";
import ModuleHandler from "../ModuleHandler";

class Placer {
    postTick(): void {
        const { currentType, placedOnce } = ModuleHandler;
        if (!myPlayer.canPlace(currentType)) return;

        if (currentType !== ItemType.FOOD) {
            if (placedOnce) return;
            ModuleHandler.placedOnce = true;

            ModuleHandler.actionPlanner.createAction(currentType, (last) => ModuleHandler.place(currentType, { last }));
        }

        // if (didAntiInsta) return;
        // ModuleHandler.heal();
    }
}

export default Placer;