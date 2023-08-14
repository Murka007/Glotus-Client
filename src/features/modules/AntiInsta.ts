import myPlayer from "../../data/ClientPlayer";
import ModuleHandler from "../ModuleHandler";

class AntiInsta {
    postTick(): void {
        if (!ModuleHandler.needToHeal) return;
        ModuleHandler.needToHeal = false;

        if (myPlayer.shameActive) return;
        ModuleHandler.didAntiInsta = true;

        ModuleHandler.heal(false);
        ModuleHandler.heal(true);
    }
}

export default AntiInsta;