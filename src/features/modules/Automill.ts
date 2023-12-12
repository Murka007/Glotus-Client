import { Items } from "../../constants/Items";
import PlayerClient from "../../PlayerClient";
import { ItemType } from "../../types/Items";
import { getAngleFromBitmask } from "../../utility/Common";
import settings from "../../utility/Settings";

class Automill {
    readonly name = "autoMill";
    /**
     * true, if module is enabled
     */
    private toggle = true;

    private readonly client: PlayerClient;
    private placeCount = 0;

    constructor(client: PlayerClient) {
        this.client = client;
    }

    reset() {
        this.toggle = true;
    }

    private get canAutomill() {
        const isOwner = this.client.isOwner;
        const { autoattack, attacking, placedOnce } = this.client.ModuleHandler;
        return (
            settings.automill &&
            this.client.myPlayer.isSandbox &&
            !placedOnce &&
            !autoattack &&
            (!isOwner || !attacking) &&
            this.toggle
        )
    }

    private placeWindmill(angle: number) {
        const { myPlayer, ObjectManager, ModuleHandler, isOwner } = this.client;
        const id = myPlayer.getItemByType(ItemType.WINDMILL)!;
        const position = myPlayer.getPlacePosition(myPlayer.position.future, id, angle);
        const radius = isOwner ? 0 : Items[id].scale;
        if (!ObjectManager.canPlaceItem(id, position, radius)) return;
        // if (ModuleHandler.totalPlaces >= 5) return;
        // ModuleHandler.totalPlaces += 1;

        ModuleHandler.actionPlanner.createAction(
            ItemType.WINDMILL,
            (last) => ModuleHandler.place(ItemType.WINDMILL, { angle, last })
        )
    }

    postTick(): void {
        const { myPlayer, ModuleHandler, isOwner } = this.client;

        if (!this.canAutomill) return;
        if (!myPlayer.canPlace(ItemType.WINDMILL)) {
            this.toggle = false;
            return;
        }

        const angle = isOwner ? getAngleFromBitmask(ModuleHandler.move, true) : ModuleHandler.reverseCursorAngle;
        if (angle === null) return;

        const item = Items[myPlayer.getItemByType(ItemType.WINDMILL)];
        const distance = myPlayer.getItemPlaceScale(item.id);
        const angleBetween = Math.asin((2 * item.scale) / (2 * distance));
        this.placeWindmill(angle - angleBetween);
        this.placeWindmill(angle + angleBetween);
        // Use 1x mill if 2x mill is too much
        // if (isOwner && ModuleHandler.totalPlaces <= 2) {
        //     this.placeWindmill(angle - angleBetween);
        //     this.placeWindmill(angle + angleBetween);
        // } else {
        //     this.placeWindmill(angle);
        // }
    }
}

export default Automill;