import PlayerClient from "../../PlayerClient";
import { IReload, TReload } from "../../types/Common";
import { WeaponTypeString } from "../../types/Items";

class Reloading {
    readonly name = "reloading";
    private readonly client: PlayerClient;
    private readonly clientReload = { primary: {}, secondary: {}, turret: {} } as {
        readonly primary: IReload;
        readonly secondary: IReload;
        readonly turret: IReload;
    }

    constructor(client: PlayerClient) {
        this.client = client;

        const { primary, secondary, turret } = this.clientReload;
        primary.current = primary.max = 0;
        secondary.current = secondary.max = 0;
        turret.current = turret.max = 2500;
    }

    get currentReload() {
        const type = WeaponTypeString[this.client.ModuleHandler.weapon];
        return this.clientReload[type];
    }

    updateMaxReload(reload: IReload) {
        const { ModuleHandler, myPlayer } = this.client;
        if (ModuleHandler.attacked) {
            const id = myPlayer.getItemByType(ModuleHandler.weapon)!;
            const store = ModuleHandler.getHatStore();
            const speed = myPlayer.getWeaponSpeed(id, store.last);
            reload.max = speed;
        }
    }

    resetReload(reload: IReload) {
        const { PlayerManager } = this.client;
        reload.current = -PlayerManager.step;
    }

    resetByType(type: TReload) {
        const reload = this.clientReload[type];
        this.resetReload(reload);
    }

    isReloaded(type: TReload) {
        const reload = this.clientReload[type];
        return reload.current === reload.max;
    }

    private increaseReload(reload: IReload, step: number) {
        reload.current += step;
        if (reload.current > reload.max) {
            reload.current = reload.max;
        }
    }

    postTick(): void {
        const { ModuleHandler, PlayerManager } = this.client;

        this.increaseReload(this.clientReload.turret, PlayerManager.step);
        if (ModuleHandler.holdingWeapon) {
            this.increaseReload(this.currentReload, PlayerManager.step);
        }
    }
}

export default Reloading;