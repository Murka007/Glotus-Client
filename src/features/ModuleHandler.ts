import SocketManager from "../Managers/SocketManager";
import GameUI from "../UI/GameUI";
import UI from "../UI/UI";
import { Accessories, Hats } from "../constants/Store";
import myPlayer from "../data/ClientPlayer";
import { ESentAngle } from "../types/Common";
import { ItemType, TItemType, TWeaponType, WeaponType } from "../types/Items";
import { EStoreType, TAccessory, TEquipType, THat, TStoreType } from "../types/Store";
import { formatButton, getAngle, getAngleFromBitmask, getUniqueID, isActiveInput } from "../utility/Common";
import Logger from "../utility/Logger";
import settings from "../utility/Settings";
import AntiInsta from "./modules/Antiinsta";
import Autohat from "./modules/Autohat";
import Automill from "./modules/Automill";
import Placer from "./modules/Placer";
import ShameReset from "./modules/ShameReset";

interface IStore {
    readonly utility: Map<number, boolean>;
    current: number;
    actual: number;
    last: number;
}

type TStore = [IStore, IStore];

const ModuleHandler = new class ModuleHandler {

    private readonly modules = [
        new AntiInsta,
        ShameReset,
        new Placer,
        new Automill,
        new Autohat,
    ] as const;

    /**
     * A list of placement hotkeys that are currently pressed
     */
    private readonly hotkeys = new Map<string, TItemType>();

    private readonly store: TStore = [
        { utility: new Map, current: 0, actual: 0, last: 0 },
        { utility: new Map, current: 0, actual: 0, last: 0 },
    ];

    /**
     * A list of IDs of bought hats and accessories
     */
    private readonly bought = [
        new Set<number>,
        new Set<number>
    ] as const;

    /**
     * The type of weapon my player is holding
     */
    weapon!: TWeaponType;

    /**
     * Current type of item which is placing
     */
    currentType!: TItemType | null;

    /**
     * true if autoattack is enabled
     */
    autoattack!: boolean;

    /**
     * true if rotation is enabled
     */
    private rotation!: boolean;

    /**
     * A bitmask which represents current movement direction
     */
    move!: number;

    /**
     * true if myPlayer is attacking using left mouse button
     */
    attacking!: boolean;

    sentAngle!: ESentAngle;
    sentHatEquip!: boolean;
    sentAccEquip!: boolean;

    needToHeal!: boolean;
    needToHealPrevious!: boolean;

    public readonly mouse = {
        x: 0,
        y: 0,

        /**
         * Current mouse angle, regardless of conditions
         */
        _angle: 0,

        /**
         * Current mouse angle, including lock rotation
         */
        angle: 0,

        /**
         * An angle that was sent to the server
         */
        sentAngle: 0,
    }

    constructor() {
        this.reset();
    }

    reset(): void {
        this.hotkeys.clear();
        this.weapon = WeaponType.PRIMARY;
        this.currentType = null;
        this.autoattack = false;
        this.rotation = true;
        this.move = 0;
        this.attacking = false;
        this.sentAngle = ESentAngle.NONE;
        this.sentHatEquip = false;
        this.sentAccEquip = false;
        this.needToHeal = false;
        this.needToHealPrevious = false;

        for (const module of this.modules) {
            if ("reset" in module) {
                module.reset();
            }
        }
    }

    getHatStore() {
        return this.store[EStoreType.HAT];
    }

    getAccStore() {
        return this.store[EStoreType.ACCESSORY];
    }

    /**
     * Returns true if myPlayer can place item
     */
    canPlace(type: TItemType) {
        return (
            myPlayer.hasResourcesForType(type) &&
            myPlayer.hasItemCountForType(type)
        )
    }

    handleMouse(event: MouseEvent) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
        const angle = getAngle(innerWidth / 2, innerHeight / 2, this.mouse.x, this.mouse.y);
        this.mouse._angle = angle;
        if (this.rotation) {
            this.mouse.angle = angle;
        }
    }

    private updateSentAngle(priority: ESentAngle) {
        if (this.sentAngle >= priority) return;
        this.sentAngle = priority;
    }

    private upgradeItem(id: number) {
        SocketManager.upgradeItem(id);

        // if (DataHandler.isWeapon(id)) {
        //     const type = WeaponTypeString[Weapons[id].itemType];
        //     const reload = this.reload[type];
        //     const store = this.store[EStoreType.HAT];
        //     const speed = myPlayer.getWeaponSpeed(id, store.actual);
        //     reload.current = this.attacked ? -this.timeToNextTick : speed;
        //     reload.max = speed;
        // }
    }

    /**
     * Buys a hat or accessory and returns true if it was successful
     * @param type Buy 0 - hat, 1 - accessory
     * @param id ID of the hat or accessory
     */
    private buy(type: TStoreType, id: number): boolean {
        const store = type === EStoreType.HAT ? Hats : Accessories;
        const price = store[id as keyof typeof store].price;
        const bought = this.bought[type];

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
    equip(type: TStoreType, id: number, equipType: TEquipType, force = false) {
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
            // store.utility.set(id, false);
        }

        // if (type === EStoreType.HAT && id === EHat.TURRET_GEAR) {
        //     this.reload.turret.current = -this.timeToNextTick;
        // }
    }


    private updateAngle(angle: number) {
        if (angle === this.mouse.sentAngle) return;
        this.mouse.sentAngle = angle;
        this.updateSentAngle(ESentAngle.HIGH);
        SocketManager.updateAngle(angle);
    }

    private selectItem(type: TItemType) {
        const item = myPlayer.getItemByType(type);
        SocketManager.selectItemByID(item, false);
    }

    private attack(angle: number | null, priority = ESentAngle.LOW) {
        if (angle !== null) {
            this.mouse.sentAngle = angle;
        }
        this.updateSentAngle(priority);
        SocketManager.attack(angle);
    }

    private stopAttack() {
        SocketManager.stopAttack();
    }

    private whichWeapon(type: TWeaponType = this.weapon) {
        if (!myPlayer.hasItemType(type)) return;
        this.weapon = type;

        const weapon = myPlayer.getItemByType(this.weapon);
        SocketManager.selectItemByID(weapon, true);
    }

    place(type: TItemType, angle = this.mouse.angle) {
        this.selectItem(type);
        this.attack(angle);
        this.stopAttack();
        this.whichWeapon();
        if (this.attacking) {
            this.attack(angle);
        }
    }

    heal() {
        this.selectItem(ItemType.FOOD);
        this.attack(null, ESentAngle.NONE);
        this.stopAttack();
        this.whichWeapon();
        if (this.attacking) {
            this.attack(this.mouse.angle);
        }
    }

    private placementHandler(type: TItemType, code: string) {
        if (!myPlayer.hasItemType(type)) return;
        this.hotkeys.set(code, type);
        this.currentType = type;

        if (this.sentAngle === ESentAngle.NONE) {
            if (type === ItemType.FOOD) {
                this.heal();
            } else {
                this.place(type);
            }
        }
    }

    private handleMovement() {
        const angle = getAngleFromBitmask(this.move, false);
        SocketManager.move(angle);
    }

    private toggleAutoattack() {
        this.autoattack = !this.autoattack;
        SocketManager.autoAttack();
    }

    private toggleRotation() {
        this.rotation = !this.rotation;
        if (this.rotation) {
            this.mouse.angle = this.mouse._angle;
        }
    }

    postTick() {
        this.sentAngle = ESentAngle.NONE;
        this.sentHatEquip = false;
        this.sentAccEquip = false;
        this.needToHealPrevious = this.needToHeal;

        const store = this.getHatStore();
        for (const [hat, toRemove] of store.utility) {
            if (toRemove) {
                store.utility.delete(hat);
            }
        }

        if (store.utility.size > 0) {
            const last = [...store.utility].pop()!;
            this.equip(EStoreType.HAT, last[0], "UTILITY");
        }

        for (const module of this.modules) {
            module.postTick();
        }

        if (this.sentAngle === ESentAngle.NONE) {
            this.updateAngle(this.mouse.angle);
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

        if (event.code === settings.primary) {
            this.whichWeapon(WeaponType.PRIMARY);
        }
        if (event.code === settings.secondary) {
            this.whichWeapon(WeaponType.SECONDARY);
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
        if (!myPlayer.inGame) return;

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

    handleMousedown(event: MouseEvent) {
        const button = formatButton(event.button);

        if (button === "LBTN") {
            this.attacking = true;
            this.attack(this.mouse.angle);
        }
    }

    handleMouseup(event: MouseEvent) {
        const button = formatButton(event.button);

        if (button === "LBTN" && this.attacking) {
            this.attacking = false;
            this.stopAttack();
        }
    }
}

export default ModuleHandler;