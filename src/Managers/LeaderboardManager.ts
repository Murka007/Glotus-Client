import Player from "../data/Player";
import PlayerClient from "../PlayerClient";

class LeaderboardManager {
    private readonly client: PlayerClient;
    private readonly list = new Set<Player>();

    constructor(client: PlayerClient) {
        this.client = client;
    }

    private updatePlayer(id: number, nickname: string, gold: number) {
        const owner = (
            this.client.PlayerManager.playerData.get(id) ||
            this.client.PlayerManager.createPlayer({ id, nickname })
        );

        this.list.add(owner);

        owner.totalGold = gold;
        owner.inLeaderboard = true;
    }

    update(data: any[]) {
        for (const player of this.list) {
            player.inLeaderboard = false;
        }
        this.list.clear();

        for (let i=0;i<data.length;i+=3) {
            const id = data[i + 0];
            const nickname = data[i + 1];
            const gold = data[i + 2];
            this.updatePlayer(id, nickname, gold);
        }
    }
}

export default LeaderboardManager;