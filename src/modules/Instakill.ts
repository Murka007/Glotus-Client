// import { Weapons } from "../constants/Items";
// import Animal from "../data/Animal";
// import myPlayer from "../data/ClientPlayer";
// import Player from "../data/Player";
// import PlayerManager from "../Managers/PlayerManager";
// import { EWeapon, WeaponType } from "../types/Items";
// import { EHat, EStoreType } from "../types/Store";
// import DataHandler from "../utility/DataHandler";
// import settings from "../utility/Settings";
// import Controller from "./Controller";

// const Instakill = new class Instakill {
//     private state: number = -1;

//     /**
//      * true if instakill is still active
//      */
//     isActive = false;

//     /**
//      * true if myPlayer pressed instakill button and on next tick it will execute
//      */
//     get willExecute() {
//         return this.state !== -1;
//     }

//     reset() {
//         this.state = -1;
//         this.isActive = false;
//     }

//     /**
//      * Aims at nearest enemy if it exist
//      */
//     private aimAtEnemy() {
//         const nearestEnemy = PlayerManager.getNearestEntity(myPlayer);
//         if (nearestEnemy !== null) {
//             const angle = myPlayer.position.future.angle(nearestEnemy.position.future);
//             Controller.updateAngle(angle);
//         }
//     }

//     private spearMusketPrimary() {
//         const isShootable = DataHandler.isSecondary(myPlayer.getItemByType(WeaponType.SECONDARY));
//         if (this.state === 0 && Controller.isFullyReloaded()) {
//             this.isActive = true;
//             this.state++;
//             this.aimAtEnemy();
//             Controller.whichWeapon(WeaponType.PRIMARY);
//             Controller.equip(EStoreType.ACCESSORY, EHat.UNEQUIP, "UTILITY");
//             Controller.equip(EStoreType.HAT, EHat.BULL_HELMET, "UTILITY");
//             Controller.toggleAutoattack();
//         } else if (this.state === 1) {
//             this.state++;
//             this.aimAtEnemy();
//             if (isShootable) {
//                 Controller.equip(EStoreType.HAT, EHat.TURRET_GEAR, "UTILITY");
//             }
//             Controller.whichWeapon(WeaponType.SECONDARY);
//         } else if (this.state === 2) {
//             this.state++;
//             Controller.updateAngle(Controller.mouse.angle);
//             Controller.toggleAutoattack();
            
//             const hatStore = Controller.store[EStoreType.HAT];
//             const accessoryStore = Controller.store[EStoreType.ACCESSORY];
//             Controller.equip(EStoreType.HAT, hatStore.current, "CURRENT");
//             Controller.equip(EStoreType.ACCESSORY, accessoryStore.actual, "ACTUAL");
//             hatStore.utility = 0;
//             this.isActive = false;
//         }

//         if (this.state === 3 && (Controller.isReloaded("secondary") || !settings.autoreload)) {
//             this.state = -1;
//             Controller.whichWeapon(WeaponType.PRIMARY);
//         }
//     }

//     postTick() {
//         if (this.state === -1) return;
//         this.spearMusketPrimary();
//     }

//     init() {
//         if (this.state === -1) {
//             this.state = 0;
//         }
//     }
// }

// export default Instakill;