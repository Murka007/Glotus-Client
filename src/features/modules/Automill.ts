import { Items } from "../../constants/Items";
import myPlayer from "../../data/ClientPlayer";
import { ESentAngle } from "../../types/Common";
import { ItemType } from "../../types/Items";
import { getAngleFromBitmask, toRadians } from "../../utility/Common";
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
        return (
            settings.automill &&
            myPlayer.isSandbox &&
            ModuleHandler.sentAngle === ESentAngle.NONE &&
            !ModuleHandler.autoattack &&
            !ModuleHandler.attacking &&
            this.toggle
        )
    }

    postTick(): void {
        if (!this.canAutomill) return;
        if (!ModuleHandler.canPlace(ItemType.WINDMILL)) {
            this.toggle = false;
            return;
        }

        const angle = getAngleFromBitmask(ModuleHandler.move, true);
        if (angle === null) return;

        const item = Items[myPlayer.getItemByType(ItemType.WINDMILL)];
        ModuleHandler.place(ItemType.WINDMILL, angle - toRadians(item.scale));
        ModuleHandler.place(ItemType.WINDMILL, angle + toRadians(item.scale));
    }
}

export default Automill;