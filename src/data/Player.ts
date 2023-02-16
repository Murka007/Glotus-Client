import Glotus from "..";
import { Items, Projectiles, Weapons } from "../constants/Items";
import { EHat, Hats, TAccessory, THat } from "../constants/Store";
import ObjectManager from "../Managers/ObjectManager";
import PlayerManager from "../Managers/PlayerManager";
import ProjectileManager from "../Managers/ProjectileManager";
import Controller from "../modules/Controller";
import Vector from "../modules/Vector";
import { EItem, TItem, TWeapon, TWeaponVariant } from "../types/Items";
import { fixTo, getAngleDist } from "../utility/Common";
import myPlayer from "./ClientPlayer";
import Entity from "./Entity";
import ObjectItem from "./ObjectItem";

interface IReload {
    current: number;
    max: number;
}

class Player extends Entity {
    
    // private weaponVariant: TWeaponVariant = 0;
    clanName: string | null = null;
    // private isLeader = false;
    hatID: THat | 0 = 0;
    private accessoryID: TAccessory | 0 = 0;
    // private isSkull = false;
    private health = 100;
    nickname = "unknown";
    skinID = 0;
    scale = 35;

    readonly weapon: {
        current: TWeapon | -1;
        primary: TWeapon | -1;
        secondary: TWeapon | -1;
    }

    readonly reload: {
        readonly primary: IReload;
        readonly secondary: IReload;
        readonly turret: IReload;
    }

    readonly objects: ObjectItem[] = [];

    constructor() {
        super();

        this.weapon = {
            current: -1,
            primary: -1,
            secondary: -1
        }

        this.reload = {
            primary: {
                current: -1,
                max: -1,
            },
            secondary: {
                current: -1,
                max: -1,
            },
            turret: {
                current: 2500,
                max: 2500,
            }
        }
    }

    update(
        id: number,
        x: number,
        y: number,
        angle: number,
        currentItem: TItem | -1,
        currentWeapon: TWeapon | -1,
        weaponVariant: TWeaponVariant,
        clanName: string | null,
        isLeader: 1 | 0,
        hatID: THat | 0,
        accessoryID: TAccessory | 0,
        isSkull: 1 | 0
    ) {
        this.id = id;

        this.position.previous.setVec(this.position.current);
        this.position.current.setXY(x, y);
        this.setFuturePosition();

        this.angle = angle;
        this.weapon.current = currentWeapon;
        // this.weaponVariant = weaponVariant;
        this.clanName = clanName;
        // this.isLeader = Boolean(isLeader);
        this.hatID = hatID;
        this.accessoryID = accessoryID;
        // this.isSkull = Boolean(isSkull);

        if (currentWeapon !== -1) {
            const type = Controller.isPrimary(currentWeapon) ? "primary" : "secondary";
            const target = this.reload[type];
            const weapon = Weapons[currentWeapon];
            if (target.max === -1) {
                target.current = weapon.speed;
                target.max = weapon.speed;
            }

            if ("projectile" in weapon) {
                const speedMult = hatID === 1 ? Hats[hatID].aMlt : 1;
                const type = weapon.projectile;
                const range = Projectiles[type].range * speedMult;
                const speed = Projectiles[type].speed * speedMult;

                for (const [id, projectile] of ProjectileManager.projectiles) {
                    if (
                        type === projectile.type &&
                        range === projectile.range &&
                        speed === projectile.speed &&
                        angle === projectile.angle &&
                        this.position.future.distance(projectile.position) < 65 &&
                        this.checkCollision(EItem.PLATFORM) === projectile.onPlatform
                    ) {
                        ProjectileManager.projectiles.delete(id);
                        target.current = -PlayerManager.step;
                        target.max = weapon.speed;
                        break;
                    }
                }
            }

            target.current = Math.min(target.current + PlayerManager.step, target.max);
            this.weapon[type] = currentWeapon;
        }

        const target = this.reload.turret;
        if (hatID === EHat.TURRET_GEAR) {
            const future = this.position.future;
            const nearest = PlayerManager.getNearestEntity(this);
            if (nearest !== null && future.distance(nearest.position.future) < 800) {
                for (const [id, turret] of ProjectileManager.turrets) {
                    const angle = fixTo(future.angle(nearest.position.future), 2);
                    if (
                        future.distance(turret.position) < 70 &&
                        getAngleDist(angle, turret.angle) < 0.5
                    ) {
                        ProjectileManager.turrets.delete(id);
                        target.current = -PlayerManager.step;
                        break;
                    }
                }
            }
        }
        target.current = Math.min(target.current + PlayerManager.step, target.max);
    }

    checkCollision(type: TItem): boolean {
        const objects = ObjectManager.getObjects(this.position.future, this.scale);
        for (const object of objects) {
            const distance = this.position.future.distance(object.position);
            const radius = this.scale + object.formatScale();
            if (object.objectItemType === type && distance <= radius) return true;
        }
        return false;
    }
}

export default Player;