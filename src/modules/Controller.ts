import myPlayer from "../data/ClientPlayer";
import SocketManager from "../Managers/SocketManager";
import { EWeapon, ItemType, TItemType, TWeapon, TWeaponData, TWeaponType, WeaponType } from "../types/Items";
import { fixTo, formatButton, getAngle, getAngleFromBitmask, isActiveInput } from "../utility/Common";
import GameUI from "./GameUI";
import settings from "../utility/Settings";
import UI from "./UI";
import { EHat, EStoreType, TAccessory, TEquipType, THat, TStoreType } from "../types/Store";
import { Accessories, Hats } from "../constants/Store";
import Logger from "../utility/Logger";
import ZoomHandler from "./ZoomHandler";
import Instakill from "./Instakill";

interface IStore {
    readonly [EStoreType.HAT]: {
        utility: THat;
        current: THat;
        actual: THat;
    }

    readonly [EStoreType.ACCESSORY]: {
        utility: TAccessory;
        current: TAccessory;
        actual: TAccessory;
    }
}

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
    private readonly bought = {
        [EStoreType.HAT]: new Set<THat>,
        [EStoreType.ACCESSORY]: new Set<TAccessory>
    } as const;

    readonly store: IStore = {
        [EStoreType.HAT]: {
            utility: 0,
            current: 0,
            actual: 0,
        },
    
        [EStoreType.ACCESSORY]: {
            utility: 0,
            current: 0,
            actual: 0,
        }
    }

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
    private weapon!: TWeaponType;

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

    breaking!: boolean;
    breakingState!: boolean;
    wasBreaking!: boolean;

    /**
     * A bitmask which represents current movement direction
     */
    private move!: number;
    private placementTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

    constructor() {
        this.mouse = {
            x: 0,
            y: 0,
            _angle: 0,
            angle: 0,
            sentAngle: 0
        }
        
        this.reset();
        this.placement = this.placement.bind(this);
    }

    /**
     * Called on the first time and also when my player died
     */
    reset() {
        this.weapon = WeaponType.PRIMARY;
        this.currentType = null;
        this.hotkeys.clear();
        this.autoattack = false;
        this.rotation = true;
        this.attacking = false;
        this.breaking = false;
        this.breakingState = false;
        this.wasBreaking = false;
        this.move = 0;
    }

    /**
     * Called when game completely loaded
     */
    init() {
        this.attachMouse();

        setInterval(() => {
            if (this.canSendAimPacket()) {
                this.updateAngle(this.mouse.angle);
            }
        }, 200);
    }

    updateAngle(angle: number) {
        if (angle !== this.mouse.sentAngle) {
            this.mouse.sentAngle = angle;
            SocketManager.updateAngle(angle);
        }
    }

    private attachMouse() {
        const { gameCanvas } = GameUI.getElements();
        window.addEventListener("mousemove", event => {
            if (myPlayer.inGame && event.target !== gameCanvas) return;
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
            const angle = getAngle(innerWidth / 2, innerHeight / 2, this.mouse.x, this.mouse.y);
            this.mouse._angle = angle;
            if (this.rotation) {
                this.mouse.angle = angle;
            }
        })

        gameCanvas.addEventListener("mousedown", event => this.handleMousedown(event));
        window.addEventListener("mouseup", event => this.handleMouseup(event));
        window.addEventListener("wheel", event => ZoomHandler.handler(event));
    }

    /**
     * We should not send update angle packet, because we are already placing items or instakilling.
     */
    private canSendAimPacket() {
        return (
            myPlayer.inGame &&
            Instakill.isActive === false &&
            this.currentType === null
        )
    }

    get placing(): boolean {
        return this.currentType !== null;
    }

    private canInstakill() {
        return !(
            this.attacking ||
            this.breaking ||
            this.breakingState ||
            this.autoattack
        )
    }

    /**
     * Buys a hat or accessory and returns true if it was successful
     * @param type Buy 0 - hat, 1 - accessory
     * @param id ID of the hat or accessory
     */
    buy(type: TStoreType, id: THat | TAccessory): boolean {
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
    equip(type: TStoreType, id: THat | TAccessory, equipType: TEquipType) {
        if (!this.buy(type, id) || !myPlayer.inGame) return;

        SocketManager.equip(type, id);

        const store = this.store[type];
        if (equipType === "CURRENT") {
            store.current = id;
        } else if (equipType === "ACTUAL") {
            store.actual = id;
        } else if (equipType === "UTILITY") {
            store.utility = id;
        }
    }

    attack(angle: number) {
        this.mouse.sentAngle = angle;
        SocketManager.attack(angle);
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
    }

    private selectItemByType(type: TItemType) {
        const item = myPlayer.getItemByType(type);
        SocketManager.selectItemByID(item, false);
    }

    /**
     * Tries to place an item once
     */
    private place(type: TItemType, angle = this.mouse.angle) {
        this.selectItemByType(type);
        this.attack(angle);
        SocketManager.stopAttack(angle);
        this.whichWeapon();
        if (this.attacking || this.breaking) {
            this.attack(angle);
        }
    }

    heal(lastHeal: boolean) {
        this.selectItemByType(ItemType.FOOD);
        SocketManager.attack(null);
        if (lastHeal) {
            SocketManager.stopAttack(null);
            this.whichWeapon();
            if (this.attacking || this.breaking) {
                this.attack(this.mouse.angle);
            }
        }
    }

    /**
     * A constant loop that runs as long as player is trying to place an item
     */
    private placement() {
        if (this.currentType === null) return;
        if (
            myPlayer.hasResourcesForType(this.currentType) &&
            myPlayer.hasItemCountForType(this.currentType)
        ) {
            this.place(this.currentType);
        }
        this.placementTimeout = setTimeout(this.placement, 200);
    }

    /**
     * Called when player pressed a placement key. Checks for placement availability.
     */
    private placementHandler(type: TItemType, code: string) {
        if (!myPlayer.hasItemType(type)) return;
        if (!myPlayer.hasResourcesForType(type)) return;

        // this.selectItemByType(type);
        // return;
        this.hotkeys.set(code, type);
        this.currentType = type;

        if (this.hotkeys.size === 1) {
            this.placement();
        }
    }

    private handleMovement() {
        const angle = getAngleFromBitmask(this.move, false);
        SocketManager.move(angle);
    }

    toggleAutoattack() {
        this.autoattack = !this.autoattack;
        SocketManager.autoAttack();
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

        if (!myPlayer.inGame) return;
        if (event.code === settings.toggleChat) {
            GameUI.toggleChat(event);
        }

        if (isInput) return;

        if (!Instakill.isActive) {
            if (event.code === settings.primary) this.whichWeapon(WeaponType.PRIMARY);
            if (event.code === settings.secondary) this.whichWeapon(WeaponType.SECONDARY);
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

        if (event.code === settings.autoattack) this.toggleAutoattack();
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
                clearTimeout(this.placementTimeout);
                this.whichWeapon();
            }
        }
    }

    private handleMousedown(event: MouseEvent) {
        const button = formatButton(event.button);
        if (button === "LBTN" && !this.attacking) {
            this.attacking = true;
            this.attack(this.mouse.angle);
        }

        if (button === "MBTN" && this.canInstakill()) {
            Instakill.init();
        }

        if (button === "RBTN") {
            this.breaking = true;
            this.breakingState = true;
        }
    }

    private handleMouseup(event: MouseEvent) {
        const button = formatButton(event.button);
        if (button === "LBTN" && this.attacking) {
            this.attacking = false;
            SocketManager.stopAttack(this.mouse.angle);
        }

        if (button === "RBTN") {
            this.breakingState = false;
        }
    }
}

export default Controller;