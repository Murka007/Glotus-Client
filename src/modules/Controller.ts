import Glotus from "..";
import { Weapons } from "../constants/Items";
import myPlayer from "../data/ClientPlayer";
import SocketManager from "../Managers/SocketManager";
import { ItemType, TItemType, TWeapon, TWeaponType, WeaponType } from "../types/Items";
import { fixTo, formatButton, getAngle, getAngleFromBitmask, isActiveInput } from "../utility/Common";
import GameUI from "./GameUI";
import settings from "../utility/Settings";
import UI from "./UI";
import DataHandler from "../utility/DataHandler";

const Controller = new class Controller {
    private readonly hotkeys: Map<string, TItemType>;
    private readonly mouse: {
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
        this.autoattack = false;
        this.rotation = true;
        this.move = 0;
        this.attacking = false;
    }

    init() {
        this.attachMouse();

        setInterval(() => {
            const angle = this.mouse.angle;
            if (angle !== this.mouse.sentAngle) {
                this.mouse.sentAngle = angle;
                SocketManager.updateAngle(angle);
            }
        }, 200);
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
        if (this.attacking) {
            SocketManager.attack(angle);
        }
    }

    heal(lastHeal: boolean) {
        this.selectItemByType(ItemType.FOOD);
        SocketManager.attack(null);
        if (lastHeal) {
            SocketManager.stopAttack(null);
            this.whichWeapon();
            if (this.attacking) {
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
    }

    private handleMouseup(event: MouseEvent) {
        const button = formatButton(event.button);
        if (button === "LBTN" && this.attacking) {
            this.attacking = false;
            SocketManager.stopAttack(this.mouse.angle);
        }
    }
}

export default Controller;