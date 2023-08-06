import Logger from "../../utility/Logger";
import ModuleHandler from "../ModuleHandler";

class AntiInsta {
    postTick(): void {
        if (!ModuleHandler.needToHeal) return;
        ModuleHandler.needToHeal = false;

        ModuleHandler.heal();
        ModuleHandler.heal();
        ModuleHandler.heal();
        Logger.start("gg");
    }
}

export default AntiInsta;