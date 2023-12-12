import PlayerClient from "../../PlayerClient";
import { ESentAngle } from "../../types/Enums";

class UpdateAngle {
    readonly name = "updateAngle";
    private readonly client: PlayerClient;
    constructor(client: PlayerClient) {
        this.client = client;
    }

    postTick(): void {
        const { sentAngle, mouse, cursorAngle } = this.client.ModuleHandler;
        if (sentAngle > ESentAngle.LOW) return;

        const angle = this.client.isOwner ? mouse.angle : cursorAngle;
        this.client.ModuleHandler.updateAngle(angle);
    }
}

export default UpdateAngle;