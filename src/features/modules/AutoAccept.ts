import { myClient } from "../..";
import PlayerClient from "../../PlayerClient";
import GameUI from "../../UI/GameUI";
import settings from "../../utility/Settings";

class AutoAccept {
    readonly name = "autoAccept";
    private readonly client: PlayerClient;
    private acceptCount = 0;

    constructor(client: PlayerClient) {
        this.client = client;
    }

    postTick(): void {
        const { myPlayer, clientIDList, SocketManager, isOwner } = this.client;
        if (!myPlayer.isLeader || myPlayer.joinRequests.length === 0) return;
        
        const id = myPlayer.joinRequests[0][0];
        if (this.acceptCount === 0) {
            if (settings.autoaccept || myClient.pendingJoins.size !== 0) {
                SocketManager.clanRequest(id, settings.autoaccept || clientIDList.has(id));
                myPlayer.joinRequests.shift();
                myClient.pendingJoins.delete(id);
                if (isOwner) GameUI.clearNotication();
            }

            const nextID = myPlayer.joinRequests[0];
            if (isOwner && nextID !== undefined) {
                GameUI.createRequest(nextID);
            }
        }

        this.acceptCount = (this.acceptCount + 1) % 7;
    }
}

export default AutoAccept;