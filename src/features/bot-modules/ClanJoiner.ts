import { myClient } from "../..";
import PlayerClient from "../../PlayerClient";

class ClanJoiner {
    readonly name = "clanJoiner";
    private readonly client: PlayerClient;
    private joinCount = 0;
    constructor(client: PlayerClient) {
        this.client = client;
    }

    postTick(): void {
        const { myPlayer, SocketManager } = this.client;
        const ownerClan = myClient.myPlayer.clanName;
        const myClan = myPlayer.clanName;
        if (ownerClan === null || myClan === ownerClan) return;

        if (this.joinCount === 0) {
            if (myClan !== null) {
                SocketManager.leaveClan();
            } else {
                myClient.pendingJoins.add(myPlayer.id);
                SocketManager.joinClan(ownerClan);
            }
        }
        this.joinCount = (this.joinCount + 1) % 7;
    }
}

export default ClanJoiner;