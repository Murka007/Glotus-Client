import { ESentAngle } from "../../types/Enums";
import ModuleHandler from "../ModuleHandler";

class UpdateAttack {
    postTick(): void {
        const { attacking, sentAngle, mouse } = ModuleHandler;
        if (sentAngle !== ESentAngle.NONE) {
            if (attacking) {
                ModuleHandler.attack(mouse.angle);
            } else {
                ModuleHandler.stopAttack();
            }
        }
    }
}

export default UpdateAttack;