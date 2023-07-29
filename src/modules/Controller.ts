import myPlayer from "../data/ClientPlayer";
import SocketManager from "../Managers/SocketManager";
import { EWeapon, ItemType, TItemType, TWeapon, TWeaponData, TWeaponType, WeaponType, WeaponTypeString } from "../types/Items";
import { fixTo, formatButton, getAngle, getAngleFromBitmask, isActiveInput } from "../utility/Common";
import GameUI from "./GameUI";
import settings from "../utility/Settings";
import UI from "./UI";
import { EHat, EStoreType, TAccessory, TEquipType, THat, TStoreType } from "../types/Store";
import { Accessories, Hats } from "../constants/Store";
import Logger from "../utility/Logger";
import ZoomHandler from "./ZoomHandler";
import { ESentAngle, IReload } from "../types/Common";
import { Weapons } from "../constants/Items";
import PlayerManager from "../Managers/PlayerManager";
import ObjectManager from "../Managers/ObjectManager";
import DataHandler from "../utility/DataHandler";
import Animal from "../data/Animal";
import Player from "../data/Player";
import Animals from "../constants/Animals";

type IStore = [
    {
        utility: THat;
        current: THat;
        actual: THat;
        last: THat;
    },
    {
        utility: TAccessory;
        current: TAccessory;
        actual: TAccessory;
        last: TAccessory;
    }
]

/**
 * Controller class. Responsible for everything related to the basic controls of the game.
 * 
 * Movement, placement, open/close shop etc.
 */
const Controller = new class Controller {

    /**
     * A list of placement hotkeys that are currently pressed
     */
    private readonly hotkeys = new Map<string, TItemType>();

    /**
     * A list of IDs of bought hats and accessories
     */
    private readonly bought = [
        new Set<THat>,
        new Set<TAccessory>
    ] as const;

    readonly store: Readonly<IStore> = [
        { utility: 0, current: 0, actual: 0, last: 0 },
        { utility: 0, current: 0, actual: 0, last: 0 }
    ]

    readonly mouse: {
        x: number;
        y: number;

        /**
         * Current mouse angle, regardless of conditions
         */
        _angle: number;

        /**
         * Current mouse angle, including lock rotation
         */
        angle: number;

        /**
         * An angle that was sent to the server
         */
        sentAngle: number;
    }

    /**
     * The type of weapon my player is holding
     */
    weapon!: TWeaponType;
    previousWeapon!: TWeaponType;

    /**
     * Current type of item which is placing
     */
    private currentType!: TItemType | null;

    /**
     * true if autoattack is enabled
     */
    private autoattack!: boolean;

    /**
     * true if rotation is enabled
     */
    private rotation!: boolean;

    /**
     * true if myPlayer is attacking using left mouse button
     */
    private attacking!: boolean;

    /**
     * true if myPlayer is breaking using right mouse button
     */
    private breaking!: boolean;

    /**
     * true, if myPlayer tried to use autobreak
     */
    private breakingState!: boolean;

    /**
     * true, if autobreak was activated and currently in process
     */
    private wasBreaking!: boolean;
    private holdingInsta!: boolean;

    private shooting!: boolean;
    private shootingState!: boolean;
    private wasShooting!: boolean;

    /**
     * A bitmask which represents current movement direction
     */
    private move!: number;

    private readonly reload: {
        readonly primary: IReload;
        readonly secondary: IReload;
        readonly turret: IReload;
    }

    /**
     * type of item my player is holding at the moment. null if holding a weapon
     */
    private lastHoldingItemType!: TItemType | null;

    /**
     * true if myPlayer attacked and weapon is still reloading
     */
    private attacked!: boolean;
    private sentAngle!: ESentAngle;
    private sentHatEquip!: boolean;
    private sentAccEquip!: boolean;
    private tickIndex = 0;

    constructor() {
        this.mouse = {
            x: 0,
            y: 0,
            _angle: 0,
            angle: 0,
            sentAngle: 0
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
        
        this.reset();
    }

    /**
     * Called on the first time and also when my player died
     */
    reset() {
        this.weapon = WeaponType.PRIMARY;
        this.previousWeapon = this.weapon;
        this.currentType = null;
        this.hotkeys.clear();
        this.autoattack = false;
        this.rotation = true;
        this.attacking = false;
        this.breaking = false;
        this.breakingState = false;
        this.wasBreaking = false;
        this.holdingInsta = false;
        this.shooting = false;
        this.shootingState = false;
        this.wasShooting = false;
        this.move = 0;
        this.lastHoldingItemType = null;
        this.attacked = false;
        this.sentAngle = ESentAngle.NONE;
        this.sentHatEquip = false;
        this.sentAccEquip = false;
        // Instakill.reset();

        const { primary, secondary, turret } = this.reload;
        primary.current = primary.max = 300;
        secondary.current = secondary.max = -1;
        turret.current = turret.max = 2500;
    }

    /**
     * Called when game completely loaded
     */
    init() {
        this.attachMouse();
    }

    updateAngle(angle: number) {
        if (angle === this.mouse.sentAngle) return;
        SocketManager.updateAngle(angle);
        this.mouse.sentAngle = angle;
        this.sentAngle = ESentAngle.HIGH;
    }

    private attachMouse() {
        const { gameCanvas } = GameUI.getElements();

        const handleMouse = (event: MouseEvent) => {
            if (myPlayer.inGame && event.target !== gameCanvas) return;
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
            const angle = getAngle(innerWidth / 2, innerHeight / 2, this.mouse.x, this.mouse.y);
            this.mouse._angle = angle;
            if (this.rotation) {
                this.mouse.angle = angle;
            }
        }

        window.addEventListener("mousemove", handleMouse);
        window.addEventListener("mouseover", handleMouse);

        gameCanvas.addEventListener("mousedown", event => this.handleMousedown(event));
        window.addEventListener("mouseup", event => this.handleMouseup(event));
        window.addEventListener("wheel", event => ZoomHandler.handler(event));
    }

    /**
     * true, if myPlayer is holding item
     */
    get holdingItem(): boolean {
        return this.currentType !== null;
    }
    
    /**
     * We should not send update angle packet, because we are already placing items or instakilling.
     */
    // private canSendAimPacket() {
    //     return (
    //         myPlayer.inGame &&
    //         !Instakill.isActive &&
    //         !this.placing &&
    //         !this.shootingActive
    //     )
    // }

    /**
     * true, if autobreak is active in any way
     */
    private get breakingActive() {
        return (
            this.breaking ||
            this.breakingState ||
            this.wasBreaking
        )
    }

    /**
     * true, if myPlayer shooting using RButton in any way
     */
    private get shootingActive() {
        return (
            this.shooting ||
            this.shootingState ||
            this.wasShooting
        )
    }

    /**
     * Checks for properties that can break instakill operation
     */
    private canInstakill() {
        return !(
            this.attacking ||
            this.autoattack ||
            this.breakingActive ||
            this.shootingActive
        )
    }

    private upgradeItem(id: number) {
        SocketManager.upgradeItem(id);

        if (DataHandler.isWeapon(id)) {
            const type = WeaponTypeString[Weapons[id].itemType];
            const reload = this.reload[type];
            const store = this.store[EStoreType.HAT];
            const speed = myPlayer.getWeaponSpeed(id, store.actual);
            reload.current = this.attacked ? -this.timeToNextTick : speed;
            reload.max = speed;
        }
    }

    /**
     * Buys a hat or accessory and returns true if it was successful
     * @param type Buy 0 - hat, 1 - accessory
     * @param id ID of the hat or accessory
     */
    private buy(type: TStoreType, id: THat | TAccessory): boolean {
        const store = type === EStoreType.HAT ? Hats : Accessories;
        const price = store[id as keyof typeof store].price;
        const bought = this.bought[type] as Set<THat | TAccessory>;

        if (!bought.has(id) && myPlayer.resources.gold >= price) {
            bought.add(id);
            SocketManager.buy(type, id);
        }
        return bought.has(id);
    }

    /**
     * Buys and equips a hat or accessory
     * @param type Equip 0 - hat, 1 - accessory
     * @param id ID of the hat or accessory
     * @param equipType Indicates the type of hat you want to equip.
     */
    equip(type: TStoreType, id: THat | TAccessory, equipType: TEquipType, force = false) {
        if (!this.buy(type, id) || !myPlayer.inGame) return;

        const store = this.store[type];
        if (!force && store.last === id) return;
        store.last = id;

        SocketManager.equip(type, id);
        if (type === EStoreType.HAT) {
            this.sentHatEquip = true;
        } else {
            this.sentAccEquip = true;
        }

        if (equipType === "CURRENT") {
            store.current = id;
        } else if (equipType === "ACTUAL") {
            store.actual = id;
            store.current = id;
        } else if (equipType === "UTILITY") {
            store.utility = id;
        }

        if (type === EStoreType.HAT && id === EHat.TURRET_GEAR) {
            this.reload.turret.current = -this.timeToNextTick;
        }
    }

    private get timeToNextTick() {
        return (
            // SocketManager.ping +
            PlayerManager.step/*  +
            (SocketManager.nextTick - Date.now()) */
        )
    }

    isReloaded(type: "primary" | "secondary" | "turret") {
        const reload = this.reload[type];
        return reload.current === reload.max;
    }

    isFullyReloaded() {
        return (
            this.isReloaded("primary") &&
            this.isReloaded("secondary") &&
            this.isReloaded("turret")
        )
    }

    private resetReload() {
        const type = WeaponTypeString[this.weapon];
        if (this.isReloaded(type)) {
            this.reload[type].current = -this.timeToNextTick;
            this.attacked = true;
        }
    }

    private changeMaxReload(type: "primary" | "secondary", id: TWeapon) {
        const store = this.store[EStoreType.HAT];
        this.reload[type].max = myPlayer.getWeaponSpeed(id, store.current);
    }

    private increaseReload(reload: IReload) {
        reload.current = Math.min(reload.current + PlayerManager.step, reload.max);
    }

    postTick() {
        this.tickIndex += 1;
        this.sentAngle = ESentAngle.NONE;
        this.sentHatEquip = false;
        this.sentAccEquip = false;

        const holdingWeapon = myPlayer.currentItem === -1;

        // Increase reload every tick
        const type = WeaponTypeString[this.weapon];
        this.changeMaxReload(type, myPlayer.getItemByType(this.weapon));
        if (holdingWeapon) {
            this.increaseReload(this.reload[type]);
        }
        this.increaseReload(this.reload.turret);

        const isReloaded = this.isReloaded(type);
        if (isReloaded && this.attacked) {
            this.attacked = false;
        }

        // Check if need to place, then place
        if (
            this.currentType !== null &&
            this.canPlace(this.currentType)
        ) {
            this.place(this.currentType);
        }

        const canStartAutobreak = (
            this.breakingState &&
            holdingWeapon &&
            !this.attacked &&
            !this.wasBreaking
        );

        const store = this.store[EStoreType.HAT];

        // Reset turret in order to unequip it
        if (this.wasShooting) {
            this.wasShooting = false;
            this.equip(EStoreType.HAT, store.current, "CURRENT");
            store.utility = 0;
        }

        if (canStartAutobreak) {
            this.wasBreaking = true;
            this.equip(EStoreType.HAT, EHat.TANK_GEAR, "UTILITY");
            this.attack(this.mouse.angle, ESentAngle.LOW);
            this.stopAttack();
        } else if (this.wasBreaking) {
            this.wasBreaking = false;
            this.equip(EStoreType.HAT, store.current, "CURRENT");
            store.utility = 0;
        } else if (this.shootingState) {
            const entity = PlayerManager.getPossibleShootEntity();
            const { secondary } = myPlayer.weapon;
            if (entity !== null && DataHandler.isShootable(secondary)) {
                const speed = DataHandler.getProjectile(secondary).speed;
                const pos1 = myPlayer.position.future;

                const { previous, current, future } = entity.position;
                const distance = previous.distance(current) * speed;
                const pos2 = current.direction(previous.angle(current), distance);

                const angle = pos1.angle(pos2);
                this.attack(angle, ESentAngle.LOW);
                this.stopAttack();

                const isHostile = entity instanceof Player || Animals[entity.type].hostile;
                const canReach = future.distance(myPlayer.position.future) < 700;

                // Additional turret damage when shooting
                if (!this.wasShooting && this.isReloaded("turret") && isHostile && canReach) {
                    this.wasShooting = true;
                    this.equip(EStoreType.HAT, EHat.TURRET_GEAR, "UTILITY");
                }
            }
        }

        if (!this.breaking) this.breakingState = false;
        if (!this.shooting) this.shootingState = false;

        // Instakill.postTick();

        // Autohat
        if (store.utility === 0 && !this.sentHatEquip) {
            const hat = myPlayer.getBestCurrentHat();
            if (store.current !== hat) {
                this.equip(EStoreType.HAT, hat, "CURRENT");
            }
        }

        // Update angle every tick
        if (this.sentAngle === ESentAngle.NONE) {
            this.updateAngle(this.mouse.angle);
        }
    }

    attack(angle: number | null, priority: ESentAngle) {
        if (angle !== null) {
            this.mouse.sentAngle = angle;
        }
        SocketManager.attack(angle);
        this.sentAngle = priority;

        // If holding weapon and attacked then reset reload
        if (this.lastHoldingItemType === null) {
            this.resetReload();
            return;
        }

        const id = myPlayer.getItemByType(this.lastHoldingItemType);
        let willReturnToWeapon = DataHandler.isHealable(id);
        if (DataHandler.isPlaceable(id)) {
            const dir = this.mouse.sentAngle;
            const position = myPlayer.getPlacePosition(myPlayer.position.future, id, dir);
            if (ObjectManager.canPlaceItem(id, position)) {
                willReturnToWeapon = true;
            }
        }

        if (willReturnToWeapon) {
            this.lastHoldingItemType = null;
        }
    }

    stopAttack() {
        SocketManager.stopAttack();
    }

    /**
     * Selects the specified or current weapon
     * @param type 0 - primary, 1 - secondary
     */
    whichWeapon(type: TWeaponType = this.weapon) {
        if (!myPlayer.hasItemType(type)) return;
        this.weapon = type;

        const weapon = myPlayer.getItemByType(this.weapon);
        SocketManager.selectItemByID(weapon, true);

        this.changeMaxReload(WeaponTypeString[this.weapon], weapon);
        if (this.attacked) {
            this.resetReload();
        }
        this.lastHoldingItemType = null;
    }

    private selectItemByType(type: TItemType) {
        const item = myPlayer.getItemByType(type);
        SocketManager.selectItemByID(item, false);

        if (this.lastHoldingItemType !== type) {
            this.lastHoldingItemType = type;
            return;
        }

        // If I will select the same item twice, on the second time it will return back to weapon
        this.lastHoldingItemType = null;
        if (this.attacked) {
            this.resetReload();
        }
    }

    /**
     * Returns true if myPlayer can place item
     */
    private canPlace(type: TItemType) {
        return (
            myPlayer.hasResourcesForType(type) &&
            myPlayer.hasItemCountForType(type)
        )
    }

    /**
     * Tries to place an item once
     */
    private place(type: TItemType, angle = this.mouse.angle) {
        this.selectItemByType(type);
        this.attack(angle, ESentAngle.LOW);
        this.stopAttack();
        this.whichWeapon();
        if (this.attacking) {
            this.attack(angle, ESentAngle.LOW);
        }
    }

    heal(lastHeal: boolean) {
        this.selectItemByType(ItemType.FOOD);
        this.attack(null, ESentAngle.LOW);
        if (lastHeal) {
            this.stopAttack();
            this.whichWeapon();
            if (this.attacking) {
                this.attack(this.mouse.angle, ESentAngle.LOW);
            }
        }
    }

    /**
     * Called when player pressed a placement key. Checks for placement availability.
     */
    private placementHandler(type: TItemType, code: string) {
        if (!myPlayer.hasItemType(type)) return;
        this.hotkeys.set(code, type);
        this.currentType = type;
    }

    private handleMovement() {
        const angle = getAngleFromBitmask(this.move, false);
        SocketManager.move(angle);
    }

    toggleAutoattack() {
        this.autoattack = !this.autoattack;
        SocketManager.autoAttack();
        if (this.autoattack && this.lastHoldingItemType === null) {
            this.resetReload();
        }
    }

    private toggleRotation() {
        this.rotation = !this.rotation;
        if (this.rotation) {
            this.mouse.angle = this.mouse._angle;
        }
    }

    handleKeydown(event: KeyboardEvent) {
        if (event.repeat) return;
        if (UI.activeHotkeyInput !== null) return;

        const isInput = isActiveInput();
        if (event.code === settings.toggleMenu && !isInput) {
            UI.toggleMenu();
        }

        if (event.code === settings.toggleChat) {
            GameUI.handleEnter(event);
        }
        if (!myPlayer.inGame) return;
        if (isInput) return;

        if (!this.shootingActive) {
            if (event.code === settings.primary) {
                this.whichWeapon(WeaponType.PRIMARY);
            }
            if (event.code === settings.secondary) {
                this.whichWeapon(WeaponType.SECONDARY);
            }
        }

        if (event.code === settings.food) this.placementHandler(ItemType.FOOD, event.code);
        if (event.code === settings.wall) this.placementHandler(ItemType.WALL, event.code);
        if (event.code === settings.spike) this.placementHandler(ItemType.SPIKE, event.code);
        if (event.code === settings.windmill) this.placementHandler(ItemType.WINDMILL, event.code);
        if (event.code === settings.farm) this.placementHandler(ItemType.FARM, event.code);
        if (event.code === settings.trap) this.placementHandler(ItemType.TRAP, event.code);
        if (event.code === settings.turret) this.placementHandler(ItemType.TURRET, event.code);
        if (event.code === settings.spawn) this.placementHandler(ItemType.SPAWN, event.code);

        const copyMove = this.move;
        if (event.code === settings.up) this.move |= 1;
        if (event.code === settings.left) this.move |= 4;
        if (event.code === settings.down) this.move |= 2;
        if (event.code === settings.right) this.move |= 8;
        if (copyMove !== this.move) this.handleMovement();

        if (
            event.code === settings.autoattack &&
            !this.breakingActive
        ) {
            this.toggleAutoattack();
        }
        if (event.code === settings.lockrotation) this.toggleRotation();

        const { storeButton, clanButton } = GameUI.getElements();
        if (event.code === settings.toggleShop) storeButton.click();
        if (event.code === settings.toggleClan) clanButton.click();
    }

    handleKeyup(event: KeyboardEvent) {
        const copyMove = this.move;
        if (event.code === settings.up) this.move &= -2;
        if (event.code === settings.left) this.move &= -5;
        if (event.code === settings.down) this.move &= -3;
        if (event.code === settings.right) this.move &= -9;
        if (copyMove !== this.move) this.handleMovement();

        if (this.currentType !== null && this.hotkeys.delete(event.code)) {
            const entry = [...this.hotkeys].pop();
            this.currentType = entry !== undefined ? entry[1] : null;
            if (this.currentType === null) {
                this.whichWeapon();
            }
        }
    }

    private handleMousedown(event: MouseEvent) {
        const button = formatButton(event.button);

        if (
            button === "LBTN" &&
            !this.breakingActive
        ) {
            this.attacking = true;
            this.attack(this.mouse.angle, ESentAngle.LOW);
        }

        if (button === "MBTN" && this.canInstakill()) {
            this.holdingInsta = true;
        }

        if (
            button === "RBTN" &&
            !this.attacking &&
            !this.autoattack
        ) {
            const isShoot = (
                this.weapon === WeaponType.SECONDARY &&
                DataHandler.isShootable(myPlayer.weapon.secondary)
            );
            if (isShoot) {
                this.shooting = true;
                this.shootingState = true;
            } else {
                this.breaking = true;
                this.breakingState = true;
            }
        }
    }

    private handleMouseup(event: MouseEvent) {
        const button = formatButton(event.button);

        if (button === "LBTN" && this.attacking) {
            this.attacking = false;
            this.stopAttack();
        }

        if (button === "MBTN") {
            this.holdingInsta = false;
        }

        if (button === "RBTN") {
            this.breaking = false;
            this.shooting = false;
        }
    }
}

export default Controller;