import { ESentAngle } from "../../types/Enums";
import ModuleHandler from "../ModuleHandler";

class UpdateAttack {
    postTick(): void {
        const { attacking, sentAngle, mouse } = ModuleHandler;
        if (attacking && sentAngle !== ESentAngle.NONE) {
            ModuleHandler.attack(mouse.angle);
        }
    }
}

export default UpdateAttack;