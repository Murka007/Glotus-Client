import PlayerClient from "../../PlayerClient";
import Animal from "../../data/Animal";
import { EWeapon, WeaponType } from "../../types/Items";
import { EHat, EStoreType } from "../../types/Store";

class Instakill {
    readonly name = "instakill";
    private readonly client: PlayerClient;
    private state = -1;

    constructor(client: PlayerClient) {
        this.client = client;
    }

    start() {
        setTimeout(() => {
            if (this.state === -1) {
                this.state = 0;
            }
        }, 3000);
    }

    postTick(): void {
        const { ModuleHandler, EnemyManager, myPlayer } = this.client;
        if (this.state === -1) return;

        // I realized that instakill is a complete nonsense, should focus on spiketick, autosync, tanksense implementations..
        // Reset when finished instakilling
        if (this.state === 3) {
            this.state = -1;
            ModuleHandler.stopAttack();
            return;
        }

        const target = EnemyManager.nearestEnemy;
        if (target === null) {
            if (this.state === 0) {
                this.state = -1;
            } else {
                this.state = 3;
            }
            return;
        }

        const pos1 = myPlayer.position.future;
        const pos2 = target.position.future;
        const angle = pos1.angle(pos2);

        const shouldEquip = myPlayer.collidingEntity(target, 700) && target.hatID !== EHat.EMP_HELMET;
        const store = ModuleHandler.getHatStore();
        switch (this.state) {
            case 0: {
                if (shouldEquip) {
                    ModuleHandler.equip(EStoreType.HAT, EHat.TURRET_GEAR);
                    store.utility.set(EHat.TURRET_GEAR, true);
                }

                if (ModuleHandler.weapon !== WeaponType.SECONDARY) {
                    ModuleHandler.whichWeapon(WeaponType.SECONDARY);
                }

                ModuleHandler.attack(angle);
                this.state++;
                break;
            }

            case 1: {
                store.utility.delete(EHat.TURRET_GEAR);
                ModuleHandler.upgradeItem(EWeapon.CROSSBOW);
                ModuleHandler.attack(angle);
                this.state++;
                break;
            }

            case 2: {
                ModuleHandler.upgradeItem(EWeapon.MUSKET);
                ModuleHandler.attack(angle);
                this.state++;
                break;
            }
        }
    }
}

export default Instakill;