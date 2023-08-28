import ObjectManager from "../../Managers/ObjectManager";
import { Items } from "../../constants/Items";
import myPlayer from "../../data/ClientPlayer";
import { ItemType } from "../../types/Items";
import { getAngleFromBitmask } from "../../utility/Common";
import settings from "../../utility/Settings";
import ModuleHandler from "../ModuleHandler";

class Automill {

    /**
     * true, if module is enabled
     */
    private toggle = true;

    reset() {
        this.toggle = true;
    }

    private get canAutomill() {
        const { autoattack, attacking, placedOnce } = ModuleHandler;
        return (
            settings.automill &&
            myPlayer.isSandbox &&
            !placedOnce &&
            !autoattack &&
            !attacking &&
            this.toggle
        )
    }

    private placeWindmill(angle: number) {
        const id = myPlayer.getItemByType(ItemType.WINDMILL)!;
        const position = myPlayer.getPlacePosition(myPlayer.position.future, id, angle);
        if (!ObjectManager.canPlaceItem(id, position)) return;
        if (ModuleHandler.totalPlaces >= 5) return;
        ModuleHandler.totalPlaces += 1;

        ModuleHandler.actionPlanner.createAction(
            ItemType.WINDMILL,
            (last) => ModuleHandler.place(ItemType.WINDMILL, { angle, last })
        )
    }

    postTick(): void {
        if (!this.canAutomill) return;
        if (!myPlayer.canPlace(ItemType.WINDMILL)) {
            this.toggle = false;
            return;
        }

        const angle = getAngleFromBitmask(ModuleHandler.move, true);
        if (angle === null) return;

        const item = Items[myPlayer.getItemByType(ItemType.WINDMILL)];
        const distance = myPlayer.getItemPlaceScale(item.id);
        const angleBetween = Math.asin((2 * item.scale) / (2 * distance));

        // Use 1x mill if 2x mill is too much
        if (ModuleHandler.totalPlaces <= 2) {
            this.placeWindmill(angle - angleBetween);
            this.placeWindmill(angle + angleBetween);
        } else {
            this.placeWindmill(angle);
        }
    }
}

export default Automill;