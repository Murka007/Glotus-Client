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

        // Too much issues going on with this method
        // It selects a weapon perfectly, but the whole logic when it should break an object or attack enemy is completely broken.
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