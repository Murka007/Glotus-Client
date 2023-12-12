import PlayerClient from "../../PlayerClient";
import { Weapons } from "../../constants/Items";
import { EWeapon, WeaponType } from "../../types/Items";
import { EHat, EStoreType } from "../../types/Store";

class SpikeTick {
    readonly name = "spikeTick";
    private readonly client: PlayerClient;

    isActive = false;

    constructor(client: PlayerClient) {
        this.client = client;
    }

    postTick(): void {
        // this.isActive = false;

        // const { EnemyManager, myPlayer, ModuleHandler } = this.client;
        // const { reloading } = ModuleHandler.staticModules;
        // if (ModuleHandler.moduleActive) return;

        // const nearest = EnemyManager.nearestCollideSpike;
        // const primary = myPlayer.getItemByType(WeaponType.PRIMARY);

        // if (
        //     nearest === null ||
        //     primary !== EWeapon.POLEARM ||
        //     !reloading.isReloaded("primary")
        // ) return;

        // const spear = Weapons[primary];
        // const pos1 = myPlayer.position.current;
        // const pos2 = nearest.position.current;
        // const distance = pos1.distance(pos2);
        // const angle = pos1.angle(pos2);
        // const range = spear.range + nearest.hitScale;
        
        // if (distance > range) return;
        
        // this.isActive = true;
        // ModuleHandler.moduleActive = true;
        // ModuleHandler.useAngle = angle;
        // ModuleHandler.useWeapon = WeaponType.PRIMARY;
    }
}

export default SpikeTick;