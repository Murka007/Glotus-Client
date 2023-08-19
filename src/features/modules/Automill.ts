import ObjectManager from "../../Managers/ObjectManager";
import { Items } from "../../constants/Items";
import myPlayer from "../../data/ClientPlayer";
import { ESentAngle } from "../../types/Enums";
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
        const { sentAngle, autoattack, attacking } = ModuleHandler;
        return (
            settings.automill &&
            myPlayer.isSandbox &&
            sentAngle === ESentAngle.NONE &&
            !autoattack &&
            !attacking &&
            this.toggle
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
        const angle1 = angle - toRadians(item.scale);
        const angle2 = angle + toRadians(item.scale);
        const mill1 = myPlayer.getPlacePosition(myPlayer.position.current, item.id, angle1);
        const mill2 = myPlayer.getPlacePosition(myPlayer.position.current, item.id, angle2);
        if (ObjectManager.canPlaceItem(item.id, mill1)) ModuleHandler.place(ItemType.WINDMILL, angle1);
        if (ObjectManager.canPlaceItem(item.id, mill2)) ModuleHandler.place(ItemType.WINDMILL, angle2);
    }
}

export default Automill;