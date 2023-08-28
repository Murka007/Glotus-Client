import { ESentAngle } from "../../types/Enums";
import ModuleHandler from "../ModuleHandler";

class UpdateAngle {
    postTick(): void {
        const { sentAngle, mouse } = ModuleHandler;
        if (sentAngle > ESentAngle.LOW) return;

        ModuleHandler.updateAngle(mouse.angle);
    }
}

export default UpdateAngle;