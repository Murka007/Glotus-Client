import PlayerClient from "../../PlayerClient";
import { ESentAngle } from "../../types/Enums";

class UpdateAttack {
    readonly name = "updateAttack";
    private readonly client: PlayerClient;
    constructor(client: PlayerClient) {
        this.client = client;
    }

    private getAttackAngle() {
        const { ModuleHandler, isOwner } = this.client;
        const { staticModules, useAngle, mouse, cursorAngle } = ModuleHandler;
        const { spikeTick, autoBreak } = staticModules;

        if (spikeTick.isActive) return useAngle;
        if (autoBreak.isActive && !ModuleHandler.canHitEntity) return useAngle;
        if (isOwner) return mouse.angle;
        return cursorAngle;
    }

    postTick(): void {
        const { ModuleHandler } = this.client;
        const { useWeapon, weapon, attacking, canAttack, sentAngle, staticModules } = ModuleHandler;
        const { reloading } = staticModules;

        if (useWeapon !== null && useWeapon !== weapon) {
            ModuleHandler.previousWeapon = weapon;
            ModuleHandler.whichWeapon(useWeapon);
        }

        if (canAttack) {
            const angle = this.getAttackAngle();
            ModuleHandler.attack(angle);
            ModuleHandler.stopAttack();
            
            const reload = reloading.currentReload;
            reloading.updateMaxReload(reload);
            reloading.resetReload(reload);
        } else if (!attacking && sentAngle !== ESentAngle.NONE) {
            ModuleHandler.stopAttack();
        }
    }
}

export default UpdateAttack;