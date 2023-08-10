import myPlayer from "../../data/ClientPlayer";
import Logger from "../../utility/Logger";
import ModuleHandler from "../ModuleHandler";

class AntiInsta {
    postTick(): void {
        if (!ModuleHandler.needToHeal) return;
        ModuleHandler.needToHeal = false;
        if (myPlayer.shameActive) return;
        ModuleHandler.didAntiInsta = true;

        ModuleHandler.heal(true);
        ModuleHandler.heal(true);
        // ModuleHandler.heal(true);
    }
}

export default AntiInsta;