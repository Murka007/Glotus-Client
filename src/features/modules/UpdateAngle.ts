import { ESentAngle } from "../../types/Enums";
import ModuleHandler from "../ModuleHandler";

class UpdateAngle {
    private tickCount = 0;

    postTick(): void {
        const { sentAngle, mouse } = ModuleHandler;
        if (sentAngle !== ESentAngle.NONE) return;
        
        if (this.tickCount === 0) {
            ModuleHandler.updateAngle(mouse.angle);
        }
        this.tickCount = (this.tickCount + 1) % 2;
    }
}

export default UpdateAngle;