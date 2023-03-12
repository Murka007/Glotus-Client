import myPlayer from "../data/ClientPlayer";
import PlayerManager from "../Managers/PlayerManager";
import { EWeapon, WeaponType } from "../types/Items";
import { EHat, EStoreType } from "../types/Store";
import Controller from "./Controller";

const Instakill = new class Instakill {
    private state: number = -1;

    /**
     * Returns true if instakill is still active
     */
    get isActive() {
        return this.state !== -1;
    }

    /**
     * Aims at nearest enemy if it exist
     */
    private aimAtEnemy() {
        const nearestEnemy = PlayerManager.getNearestEntity(myPlayer);
        if (nearestEnemy !== null) {
            const angle = myPlayer.position.future.angle(nearestEnemy.position.future);
            Controller.updateAngle(angle);
        }
    }

    private spearMusket() {
        if (this.state === 0 && myPlayer.isFullyReloaded()) {
            this.state++;
            this.aimAtEnemy();
            Controller.whichWeapon(WeaponType.PRIMARY);
            Controller.equip(EStoreType.HAT, EHat.BULL_HELMET, "UTILITY");
            Controller.toggleAutoattack();
        } else if (this.state === 1) {
            this.state++;
            this.aimAtEnemy();
            Controller.equip(EStoreType.HAT, EHat.TURRET_GEAR, "UTILITY");
            Controller.whichWeapon(WeaponType.SECONDARY);
        } else if (this.state === 2) {
            if (myPlayer.isReloaded("secondary")) {
                this.state++;
            }
            Controller.updateAngle(Controller.mouse.angle);
            Controller.toggleAutoattack();
            
            const store = Controller.store[EStoreType.HAT];
            Controller.equip(EStoreType.HAT, store.current, "CURRENT");
            store.utility = 0;
        } else if (this.state === 3) {
            this.state = -1;
            Controller.whichWeapon(WeaponType.PRIMARY);
        }
    }

    postTick() {
        if (this.state === -1) return;
        this.spearMusket();
        // const actions = this.spearMusket();
        // if (actions === null) return;

        // actions[this.state++]();
        // if (this.state === actions.length) {
        //     this.state = -1;
        // }
    }

    init() {
        if (this.state === -1) {
            this.state = 0;
        }
    }
}

export default Instakill;