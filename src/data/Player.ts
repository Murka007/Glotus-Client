import { EItems, EWeapons, EWeaponVariant } from "../constants/Items";
import Vector from "../Managers/Vector";

interface IPosition {
    readonly previous: Vector;
    readonly server: Vector;
}

class Player {
    id = -1;
    private readonly position: IPosition = {
        previous: new Vector,
        server: new Vector
    }
    private angle = 0;
    private currentItem: EItems = -1;
    private currentWeapon: EWeapons = -1;
    private weaponVariant: EWeaponVariant = 0;
    private clanName: string | null = null;
    private isLeader = false;
    private hat = 0;
    private accessory = 0;
    private isSkull = false;
    private health = 100;
    nickname = "unknown";
    skinID = 0;

    update(
        id: number,
        x: number,
        y: number,
        angle: number,
        currentItem: number,
        currentWeapon: number,
        weaponVariant: EWeaponVariant,
        clanName: string | null,
        isLeader: 1 | 0,
        hat: number,
        accessory: number,
        isSkull: 1 | 0
    ) {
        this.id = id;
        this.position.previous.setVec(this.position.server);
        this.position.server.setXY(x, y);
        this.angle = angle;
        this.currentItem = currentItem;
        this.currentWeapon = currentWeapon;
        this.weaponVariant = weaponVariant;
        this.clanName = clanName;
        this.isLeader = Boolean(isLeader);
        this.hat = hat;
        this.accessory = accessory;
        this.isSkull = Boolean(isSkull);
    }
}

export default Player;