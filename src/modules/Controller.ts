import Glotus from "..";
import { Weapons } from "../constants/Items";
import myPlayer from "../data/ClientPlayer";
import SocketManager from "../Managers/SocketManager";
import { EWeapon, ItemType, TItemType, TWeapon, TWeaponData, TWeaponType, WeaponType } from "../types/Items";
import { fixTo, formatButton, getAngle, getAngleFromBitmask, isActiveInput } from "../utility/Common";
import GameUI from "./GameUI";
import settings from "../utility/Settings";
import UI from "./UI";
import DataHandler from "../utility/DataHandler";
import { EHat, EStoreType, TAccessory, TEquipType, THat, TStoreType } from "../types/Store";
import { Accessories, Hats } from "../constants/Store";
import Logger from "../utility/Logger";
import ZoomHandler from "./ZoomHandler";


interface IStore {
    readonly [EStoreType.HAT]: {
        utility: THat;
        biome: THat;
        current: THat;
        actual: THat;
    }

    readonly [EStoreType.ACCESSORY]: {
        utility: TAccessory;
        current: TAccessory;
        actual: TAccessory;
    }
}

const Controller = new class Controller {
    private readonly hotkeys: Map<string, TItemType>;
    private readonly bought = {
        [EStoreType.HAT]: new Set<THat>,
        [EStoreType.ACCESSORY]: new Set<TAccessory>
    } as const;

    readonly store: IStore = {
        [EStoreType.HAT]: {
            utility: 0,
            biome: 0,
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
        _angle: number;
        angle: number;
        sentAngle: number;
    }

    readonly teammates: number[] = [];
    private weapon!: TWeaponType;
    private currentType!: TItemType | null;
    private autoattack!: boolean;
    private rotation!: boolean;
    private attacking!: boolean;
    breaking!: boolean;
    breakingState!: boolean;
    wasBreaking!: boolean;
    private move!: number;

    constructor() {
        this.hotkeys = new Map;
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

    init() {
        this.attachMouse();

        setInterval(() => {
            const angle = this.mouse.angle;
            if (angle !== this.mouse.sentAngle) {
                this.mouse.sentAngle = angle;
                SocketManager.updateAngle(angle);
            }
        }, 150);
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

    isMyPlayer(id: number) {
        return id === myPlayer.id;
    }

    isTeammate(id: number) {
        return this.teammates.includes(id);
    }

    isEnemy(id: number) {
        return !this.isMyPlayer(id) && !this.isTeammate(id);
    }

    getBestDestroyingWeapon(): TWeaponType | null {
        const secondaryID = myPlayer.getItemByType(WeaponType.SECONDARY);
        if (secondaryID === EWeapon.GREAT_HAMMER) return WeaponType.SECONDARY;

        const primary = DataHandler.getWeaponByType(WeaponType.PRIMARY);
        if (primary.damage !== 1) return WeaponType.PRIMARY;
        return null;
    }

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

    private whichWeapon(type: TWeaponType = this.weapon) {
        if (!myPlayer.hasItemType(type)) return;
        this.weapon = type;

        const weapon = myPlayer.getItemByType(this.weapon);
        SocketManager.selectItemByID(weapon, true);
    }

    private selectItemByType(type: TItemType) {
        const item = myPlayer.getItemByType(type);
        SocketManager.selectItemByID(item, false);
    }

    private place(type: TItemType, angle = this.mouse.angle) {
        this.selectItemByType(type);
        SocketManager.attack(angle);
        SocketManager.stopAttack(angle);
        this.whichWeapon();
        if (this.attacking || this.breaking) {
            SocketManager.attack(angle);
        }
    }

    heal(lastHeal: boolean) {
        this.selectItemByType(ItemType.FOOD);
        SocketManager.attack(null);
        if (lastHeal) {
            SocketManager.stopAttack(null);
            this.whichWeapon();
            if (this.attacking || this.breaking) {
                SocketManager.attack(this.mouse.angle);
            }
        }
    }

    private placement() {
        if (this.currentType === null) return;
        if (
            myPlayer.hasResourcesForType(this.currentType) &&
            myPlayer.hasItemCountForType(this.currentType)
        ) {
            this.place(this.currentType);
        }
        setTimeout(this.placement, 150);
    }

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

    handleKeydown(event: KeyboardEvent) {
        if (event.repeat) return;
        if (UI.activeHotkeyInput !== null) return;

        const isInput = isActiveInput();
        if (event.code === settings.toggleMenu && !isInput) {
            UI.toggleMenu();
        }

        if (!myPlayer.inGame) return;
        if (event.code === settings.toggleChat) {
            GameUI.toggleChat();
        }

        if (isInput) return;

        if (event.code === settings.primary) this.whichWeapon(WeaponType.PRIMARY);
        if (event.code === settings.secondary) this.whichWeapon(WeaponType.SECONDARY);

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

        if (event.code === settings.autoattack) {
            this.autoattack = !this.autoattack;
            SocketManager.autoAttack();
        }

        if (event.code === settings.lockrotation) {
            this.rotation = !this.rotation;
            if (this.rotation) {
                this.mouse.angle = this.mouse._angle;
            }
        }

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
        if (button === "LBTN" && !this.attacking) {
            this.attacking = true;
            SocketManager.attack(this.mouse.angle);
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