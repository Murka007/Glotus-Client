import SocketManager from "../../Managers/SocketManager";
import { Items } from "../../constants/Items";
import myPlayer from "../../data/ClientPlayer";
import { ItemType } from "../../types/Items";
import settings from "../../utility/Settings";
import ModuleHandler from "../ModuleHandler";

class AntiInsta {
    private get isSaveHeal(): boolean {
        const startHit = myPlayer.receivedDamage || 0;
        const timeSinceHit = Date.now() - startHit + SocketManager.ping;
        const maxTime = myPlayer.shameCount > 0 ? 120 : 60;
        return timeSinceHit >= maxTime;
    }

    private get canHeal() {
        return (
            settings.autoheal &&
            myPlayer.currentHealth < 100 &&
            !myPlayer.shameActive &&
            this.isSaveHeal
        )
    }

    postTick(): void {

        let healingTimes: number | null = null;

        // AntiInsta implementation
        if (ModuleHandler.needToHeal) {
            ModuleHandler.needToHeal = false;

            if (myPlayer.shameActive) return;
            ModuleHandler.didAntiInsta = true;
            healingTimes = 2;
        } else if (this.canHeal) {
            const foodID = myPlayer.getItemByType(ItemType.FOOD);
            const restore = Items[foodID].restore;
            const maxTimes = Math.ceil((myPlayer.maxHealth - myPlayer.currentHealth) / restore);
            healingTimes = Math.min(3, maxTimes);
        }

        if (healingTimes !== null) {
            ModuleHandler.totalPlaces += healingTimes;
            ModuleHandler.actionPlanner.createActions(
                ItemType.FOOD,
                (last) => ModuleHandler.heal(last),
                healingTimes
            )
        }
    }
}

export default AntiInsta;