import PlayerClient from "../../PlayerClient";
import { Weapons } from "../../constants/Items";
import { EWeapon, WeaponType } from "../../types/Items";
import { EHat, EStoreType } from "../../types/Store";

class SpikeTick {
    readonly name = "spikeTick";
    private readonly client: PlayerClient;

    isActive = false;
    tickAction = 0;

    constructor(client: PlayerClient) {
        this.client = client;
    }

    postTick(): void {
        // this.isActive = false;
        // if (this.tickAction === 2) {
        //     this.tickAction = 0;
        //     console.log("ResetTick");
        // }

        // const { EnemyManager, myPlayer, ModuleHandler } = this.client;
        // const { reloading } = ModuleHandler.staticModules;
        // if (ModuleHandler.moduleActive) return;

        // const nearest = EnemyManager.nearestCollideSpike;
        // const primary = myPlayer.getItemByType(WeaponType.PRIMARY);

        // // if (
        // //     nearest === null ||
        // //     primary !== EWeapon.POLEARM ||
        // //     !reloading.isReloaded("primary")
        // // ) return;
        // if (
        //     nearest === null/*  ||
        //     primary !== EWeapon.POLEARM */
        // ) return;

        // if (this.tickAction === 0 && reloading.isReloaded("turret")) {
        //     console.log("SpikeTick");
        //     this.tickAction = 1;
        //     this.isActive = true;
        //     ModuleHandler.moduleActive = true;
        //     return;
        // }
        // this.tickAction = 2;
        // console.log("AttackTick");

        // Not going to try implement this anymore, tired
        // In theory these conditions should work perfectly, I will give a chance for you..
        // const spear = Weapons[primary];
        // const pos1 = myPlayer.position.future;
        // const pos2 = nearest.position.future;
        // // const distance = pos1.distance(pos2);
        // const angle = pos1.angle(pos2);
        // const range = spear.range + nearest.hitScale;
        
        // if (!myPlayer.collidingEntity(nearest, range, true, false)) return;
        // // if (distance > range) return;
        
        // if (!this.isActive) return;
        // this.tickAction = 2;
        // ModuleHandler.moduleActive = true;
        // ModuleHandler.useAngle = angle;
        // ModuleHandler.useWeapon = WeaponType.PRIMARY;
    }
}

export default SpikeTick;