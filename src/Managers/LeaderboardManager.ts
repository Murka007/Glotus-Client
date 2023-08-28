import Player from "../data/Player";
import PlayerManager from "./PlayerManager";

const LeaderboardManager = new class LeaderboardManager {
    private readonly list = new Set<Player>();

    private updatePlayer(id: number, nickname: string, gold: number) {
        const owner = (
            PlayerManager.playerData.get(id) ||
            PlayerManager.createPlayer({ id, nickname })
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