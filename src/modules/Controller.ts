import Glotus from "..";
import myPlayer from "../data/ClientPlayer";
import SocketManager from "../Managers/SocketManager";
import { ItemType, TItemType, TWeaponType, WeaponType } from "../types/Items";
import { getAngle, getAngleFromBitmask, isActiveInput } from "../utility/Common";
import GameUI from "./GameUI";
import settings from "./Settings";

const Controller = new class Controller {
    private readonly hotkeys: Map<string, TItemType>;
    private readonly mouse: {
        x: number;
        y: number;
        _angle: number;
        angle: number;
    }

    private weapon!: TWeaponType;
    private currentType!: TItemType | null;
    private autoattack!: boolean;
    private rotation!: boolean;
    private move!: number;

    constructor() {
        this.hotkeys = new Map;
        this.mouse = {
            x: 0,
            y: 0,
            _angle: 0,
            angle: 0
        }

        
        this.reset();
        this.placement = this.placement.bind(this);
    }

    reset() {
        this.weapon = WeaponType.PRIMARY;
        this.currentType = null;
        this.autoattack = false;
        this.rotation = true;
        this.move = 0;
    }

    init() {
        this.attachMouse();
    }

    private attachMouse() {
        const { gameCanvas } = GameUI.getElements();
        gameCanvas.addEventListener("mousemove", event => {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
            const angle = getAngle(innerWidth / 2, innerHeight / 2, this.mouse.x, this.mouse.y);
            this.mouse._angle = angle;
            if (this.rotation) {
                this.mouse.angle = angle;
            }
        })
    }

    private whichWeapon(type: TWeaponType = this.weapon) {
        if (!myPlayer.hasItem(type)) return;
        this.weapon = type;

        const weapon = myPlayer.getItem(this.weapon);
        SocketManager.selectItemByID(weapon, true);
    }

    private selectItemByType(type: TItemType) {
        const item = myPlayer.getItem(type);
        SocketManager.selectItemByID(item, false);
    }

    private place(type: TItemType, angle = this.mouse.angle) {
        this.selectItemByType(type);
        SocketManager.attack(angle);
        SocketManager.stopAttack(angle);
        this.whichWeapon();
    }

    private placement() {
        if (this.currentType === null) return;
        if (myPlayer.hasResourcesForType(this.currentType)) {
            this.place(this.currentType);
        }
        setTimeout(this.placement, 75);
    }

    private placementHandler(type: TItemType, code: string) {
        if (!myPlayer.hasItem(type)) return;
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
        if (!myPlayer.inGame) return;

        if (event.code === settings.toggleChat) {
            GameUI.toggleChat();
        }

        if (isActiveInput()) return;

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
}

export default Controller;