import PlayerClient from "../../PlayerClient";
import { ItemType } from "../../types/Items";

class Placer {
    readonly name = "placer";
    private readonly client: PlayerClient;
    constructor(client: PlayerClient) {
        this.client = client;
    }

    postTick(): void {
        const { ModuleHandler, myPlayer, isOwner } = this.client;
        const { currentType, placedOnce, healedOnce, mouse } = ModuleHandler;
        if (!myPlayer.canPlace(currentType)) return;

        // const angle = isOwner ? mouse.angle : ModuleHandler.cursorAngle;
        // ModuleHandler.actionPlanner.createAction(ItemType.SPIKE, (last) => ModuleHandler.place(currentType, { angle, last }));
        // ModuleHandler.actionPlanner.createAction(ItemType.SPIKE, (last) => ModuleHandler.place(currentType, { angle, last }));
        // ModuleHandler.actionPlanner.createAction(ItemType.SPIKE, (last) => ModuleHandler.place(currentType, { angle, last }));
        // ModuleHandler.actionPlanner.createAction(ItemType.FOOD, (last) => ModuleHandler.heal(last));

        if (currentType === ItemType.FOOD) {
            if (healedOnce) return;
            ModuleHandler.healedOnce = true;
            ModuleHandler.actionPlanner.createAction(currentType, (last) => ModuleHandler.place(currentType, { last }));
            return;
        }
        
        if (placedOnce) return;
        ModuleHandler.placedOnce = true;

        const angle = isOwner ? mouse.angle : ModuleHandler.cursorAngle;
        ModuleHandler.actionPlanner.createAction(currentType, (last) => ModuleHandler.place(currentType, { angle, last }));
    }
}

export default Placer;