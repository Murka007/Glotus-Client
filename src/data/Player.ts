import Glotus from "..";
import { Items, Projectiles, Weapons, weaponVariants } from "../constants/Items";
import { Hats } from "../constants/Store";
import ObjectManager from "../Managers/ObjectManager";
import PlayerManager from "../Managers/PlayerManager";
import ProjectileManager from "../Managers/ProjectileManager";
import SocketManager from "../Managers/SocketManager";
import Controller from "../modules/Controller";
import Vector from "../modules/Vector";
import { ReplaceWithType } from "../types/Common";
import { EItem, EWeapon, TItem, TMelee, TPlaceable, TWeapon, TWeaponVariant } from "../types/Items";
import { EHat, EStoreType, TAccessory, THat } from "../types/Store";
import { fixTo, getAngleDist } from "../utility/Common";
import DataHandler from "../utility/DataHandler";
import myPlayer from "./ClientPlayer";
import Entity from "./Entity";
import { PlayerObject } from "./ObjectItem";

interface IReload {
    current: number;
    max: number;
}

class Player extends Entity {
    
    currentItem: TItem | -1 = -1;
    private weaponVariant: TWeaponVariant = 0;
    clanName: string | null = null;
    // private isLeader = false;
    hatID: THat = 0;
    accessoryID: TAccessory = 0;
    // private isSkull = false;
    previousHealth = 100;
    currentHealth = 100;
    maxHealth = 100;
    nickname = "unknown";
    skinID = 0;
    scale = 35;

    readonly weapon: {
        current: TWeapon;
        primary: TWeapon;
        secondary: TWeapon;
    }

    readonly reload: {
        readonly primary: IReload;
        readonly secondary: IReload;
        readonly turret: IReload;
    }

    readonly objects: PlayerObject[] = [];

    constructor() {
        super();

        this.weapon = {
            current: 0,
            primary: 0,
            secondary: 0,
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
        currentWeapon: TWeapon,
        weaponVariant: TWeaponVariant,
        clanName: string | null,
        isLeader: 1 | 0,
        hatID: THat,
        accessoryID: TAccessory,
        isSkull: 1 | 0
    ) {
        this.id = id;

        this.position.previous.setVec(this.position.current);
        this.position.current.setXY(x, y);
        this.setFuturePosition();

        this.angle = angle;
        this.currentItem = currentItem;
        this.weapon.current = currentWeapon;
        this.weaponVariant = weaponVariant;
        this.clanName = clanName;
        // this.isLeader = Boolean(isLeader);
        this.hatID = hatID;
        this.accessoryID = accessoryID;
        // this.isSkull = Boolean(isSkull);
        this.updateReloads();
    }

    private updateReloads() {
        const current = this.position.current;

        const turretReload = this.reload.turret;
        turretReload.current = Math.min(turretReload.current + PlayerManager.step, turretReload.max);
        if (this.hatID === EHat.TURRET_GEAR) {
            for (const [id, turret] of ProjectileManager.turrets) {
                if (current.distance(turret.position.current) < 2) {
                    ProjectileManager.turrets.delete(id);
                    turretReload.current = 0;
                    break;
                }
            }
        }

        // We should not reload if player is holding item
        if (this.currentItem !== -1) return;

        const type = DataHandler.isPrimary(this.weapon.current) ? "primary" : "secondary";
        const targetReload = this.reload[type];
        const weapon = Weapons[this.weapon.current];
        const reloadSpeed = this.hatID === EHat.SAMURAI_ARMOR ? Hats[this.hatID].atkSpd : 1;
        const weaponSpeed = weapon.speed * reloadSpeed;

        // Set default reload based on current weapon
        if (targetReload.max === -1) {
            targetReload.current = weaponSpeed;
            targetReload.max = weaponSpeed;
        }
        
        targetReload.current = Math.min(targetReload.current + PlayerManager.step, targetReload.max);
        this.weapon[type] = this.weapon.current;

        // Handle reloading of shootable weapons
        if ("projectile" in weapon) {
            const speedMult = this.hatID === EHat.MARKSMAN_CAP ? Hats[this.hatID].aMlt : 1;
            const type = weapon.projectile;
            const range = Projectiles[type].range * speedMult;
            const speed = Projectiles[type].speed * speedMult;

            for (const [id, projectile] of ProjectileManager.projectiles) {
                if (
                    type === projectile.type &&
                    range === projectile.range &&
                    speed === projectile.speed &&
                    this.angle === projectile.angle &&
                    current.distance(projectile.position.current) < 2
                ) {
                    ProjectileManager.projectiles.delete(id);
                    targetReload.current = 0;
                    targetReload.max = weaponSpeed;
                    break;
                }
            }
        }
    }

    getWeaponDamage(id: TMelee): number {
        const weapon = Weapons[id];
        const variant = weaponVariants[this.weaponVariant];

        let damage = weapon.damage * variant.val;
        if ("sDmg" in weapon) {
            damage *= weapon.sDmg;
        }

        const hat = Hats[this.hatID];
        if ("bDmg" in hat) {
            damage *= hat.bDmg;
        }
        return damage;
    }

    checkCollision(type: TPlaceable, subRadius = 0): boolean {
        const objects = ObjectManager.getObjects(this.position.future, this.scale);
        for (const object of objects) {
            if (object.type !== type) continue;
            const distance = this.position.future.distance(object.position.current);
            const radius = this.scale + object.formatScale() - subRadius;
            if (distance <= radius) return true;
        }
        return false;
    }
}

export default Player;