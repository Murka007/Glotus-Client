import PlayerClient from "../../PlayerClient";
import { EAttack } from "../../types/Enums";
import { WeaponTypeString } from "../../types/Items";

class PreAttack {
    readonly name = "preAttack";
    private readonly client: PlayerClient;

    constructor(client: PlayerClient) {
        this.client = client;
    }

    postTick(): void {
        const { ModuleHandler } = this.client;
        const { moduleActive, useWeapon, weapon, previousWeapon, attackingState, staticModules } = ModuleHandler;
        const type = moduleActive ? useWeapon! : weapon;
        const stringType = WeaponTypeString[type];
        const shouldAttack = attackingState !== EAttack.DISABLED || moduleActive;
        const isReloaded = staticModules.reloading.isReloaded(stringType);
        ModuleHandler.canAttack = shouldAttack && isReloaded;

        if (useWeapon === null && previousWeapon !== null && staticModules.reloading.isReloaded(WeaponTypeString[weapon])) {
            ModuleHandler.whichWeapon(previousWeapon);
            ModuleHandler.previousWeapon = null;
        }
    }
}

export default PreAttack;