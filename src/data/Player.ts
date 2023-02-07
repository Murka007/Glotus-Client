import Vector from "../modules/Vector";
import { TItem, TWeapon, TWeaponVariant } from "../types/Items";

interface IPosition {
    readonly previous: Vector;
    readonly current: Vector;
    readonly future: Vector;
}

class Player {
    id = -1;
    private readonly position: IPosition = {
        previous: new Vector,
        current: new Vector,
        future: new Vector
    }
    private angle = 0;
    private currentItem: TItem | -1 = -1;
    private currentWeapon: TWeapon | -1 = -1;
    private weaponVariant: TWeaponVariant = 0;
    private clanName: string | null = null;
    private isLeader = false;
    private hat = 0;
    private accessory = 0;
    private isSkull = false;
    private health = 100;
    nickname = "unknown";
    skinID = 0;

    private setFuturePosition() {
        const { previous, current, future } = this.position;
        const distance = previous.distance(current);
        const angle = previous.angle(current);
        future.setVec(current.direction(angle, distance));
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
        hat: number,
        accessory: number,
        isSkull: 1 | 0
    ) {
        this.id = id;
        this.position.previous.setVec(this.position.current);
        this.position.current.setXY(x, y);
        this.setFuturePosition();
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