import { ESentAngle } from "../../types/Enums";
import ModuleHandler from "../ModuleHandler";

class UpdateAngle {
    private tickCount = 0;

    postTick(): void {
        const { sentAngle, mouse } = ModuleHandler;
        if (sentAngle > ESentAngle.LOW) return;
        
        ModuleHandler.updateAngle(mouse.angle);
        // if (this.tickCount === 0) {
        // }
        // this.tickCount = (this.tickCount + 1) % 2;
    }
}

export default UpdateAngle;