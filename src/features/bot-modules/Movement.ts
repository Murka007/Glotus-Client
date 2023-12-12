import { myClient } from "../..";
import PlayerClient from "../../PlayerClient";
import { cursorPosition } from "../../utility/Common";

class Movement {
    readonly name = "movement";
    private readonly client: PlayerClient;
    stopped = true;
    constructor(client: PlayerClient) {
        this.client = client;
    }

    private getPosition() {
        const { ModuleHandler } = myClient;
        if (ModuleHandler.lockPosition) return ModuleHandler.lockedPosition;
        return cursorPosition();
    }

    postTick(): void {
        const { myPlayer, ModuleHandler, SocketManager } = this.client;
        const pos1 = myPlayer.position.current;
        const pos2 = this.getPosition();
        const distance = pos1.distance(pos2);
        ModuleHandler.cursorAngle = pos1.angle(pos2);
        ModuleHandler.reverseCursorAngle = pos2.angle(pos1);

        if (distance > 175) {
            this.stopped = false;
            SocketManager.move(ModuleHandler.cursorAngle);
        } else if (!this.stopped) {
            this.stopped = true;
            SocketManager.move(null);
        }
    }
}

export default Movement;