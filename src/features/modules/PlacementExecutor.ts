import PlayerClient from "../../PlayerClient";

/**
 * Used to execute all planned placement and healing actions
 */
class PlacementExecutor {
    readonly name = "placementExecutor";
    private readonly client: PlayerClient;
    constructor(client: PlayerClient) {
        this.client = client;
    }

    postTick(): void {
        const actions = this.client.ModuleHandler.actionPlanner.getActions();
        const lastIndex = actions.length - 1;
        for (let i=0;i<actions.length;i++) {
            const current = actions[i];
            const last = actions[i + 1];
            const isLast = i === lastIndex || last !== undefined && last[0] === current[0];
            current[1](isLast);
        }
    }
}

export default PlacementExecutor;