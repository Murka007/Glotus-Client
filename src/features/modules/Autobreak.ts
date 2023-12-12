import PlayerClient from "../../PlayerClient";
import settings from "../../utility/Settings";

class Autobreak {
    readonly name = "autoBreak";
    private readonly client: PlayerClient;
    
    isActive = false;

    constructor(client: PlayerClient) {
        this.client = client;
    }

    postTick(): void {
        this.isActive = false;
        const { EnemyManager, myPlayer, ModuleHandler } = this.client;
        if (!settings.autobreak || ModuleHandler.moduleActive) return;

        const nearestTrap = EnemyManager.nearestTrap;
        const type = ModuleHandler.weapon;
        // const type = myPlayer.getBestDestroyingWeapon();

        if (nearestTrap !== null && type !== null) {
            this.isActive = true;

            const pos1 = myPlayer.position.current;
            const pos2 = nearestTrap.position.current;
            ModuleHandler.moduleActive = true;
            ModuleHandler.useAngle = pos1.angle(pos2);
            ModuleHandler.useWeapon = type;
        }
    }
}

export default Autobreak;