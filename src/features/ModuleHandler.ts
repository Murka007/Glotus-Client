import GameUI from "../UI/GameUI";
import UI from "../UI/UI";
import ActionPlanner from "../modules/ActionPlanner";
import PlayerClient from "../PlayerClient";
import { IPlaceOptions } from "../types/Common";
import { EAttack, ESentAngle } from "../types/Enums";
import { ItemType, WeaponType} from "../types/Items";
import { EHat, EStoreType } from "../types/Store";
import { cursorPosition, formatButton, getAngle, getAngleFromBitmask, isActiveInput } from "../utility/Common";
import DataHandler from "../utility/DataHandler";
import settings from "../utility/Settings";
import AntiInsta from "./modules/AntiInsta";
import AutoPlacer from "./modules/AutoPlacer";
import Autohat from "./modules/Autohat";
import Automill from "./modules/Automill";
import PlacementExecutor from "./modules/PlacementExecutor";
import Placer from "./modules/Placer";
import ShameReset from "./modules/ShameReset";
import UpdateAngle from "./modules/UpdateAngle";
import UpdateAttack from "./modules/UpdateAttack";
import ClanJoiner from "./bot-modules/ClanJoiner";
import Movement from "./bot-modules/Movement";
import AutoAccept from "./modules/AutoAccept";
import Vector from "../modules/Vector";
import TempData from "./bot-modules/TempData";
import Reloading from "./modules/Reloading";
import Autobreak from "./modules/Autobreak";
import SpikeTick from "./modules/SpikeTick";
import PreAttack from "./modules/PreAttack";

interface IStore {
    readonly utility: Map<number, boolean>;
    lastUtility: number | null;
    current: number;
    best: number;
    actual: number;
    last: number;
}

type TStore = [IStore, IStore];

type TBotModuleList = [
    TempData,
    ClanJoiner,
    Movement,
]

type TModuleList = [
    AutoAccept,

    AntiInsta,
    ShameReset,
    
    AutoPlacer,
    Placer,
    Automill,
    PlacementExecutor,
    
    Reloading,
    SpikeTick,
    Autobreak,
    PreAttack,
    Autohat,

    UpdateAttack,
    UpdateAngle,
]

type TupleToObject<T extends { name: string }[]> = {
    readonly [K in T[number]["name"]]: Extract<T[number], { name: K }>;
};

type TModules = [...TBotModuleList, ...TModuleList];
type TStaticModules = TupleToObject<TModules>;

class ModuleHandler {

    private readonly client: PlayerClient;

    readonly staticModules = {} as TStaticModules;
    private readonly botModules: TBotModuleList;
    private readonly modules: TModuleList;

    /** A list of placement hotkeys that are currently pressed */
    private readonly hotkeys = new Map<string, ItemType>();

    readonly store: TStore = [
        { utility: new Map, lastUtility: null, current: 0, best: 0, actual: 0, last: 0 },
        { utility: new Map, lastUtility: null, current: 0, best: 0, actual: 0, last: 0 },
    ];

    readonly actionPlanner = new ActionPlanner;

    /** A ID list of bought hats and accessories */
    private readonly bought = [
        new Set<number>,
        new Set<number>
    ] as const;

    currentHolding: WeaponType | ItemType = WeaponType.PRIMARY;
    /** The type of weapon my player is holding */
    weapon!: WeaponType;

    /** Current type of item which is placing */
    currentType!: ItemType | null;

    /** true if autoattack is enabled */
    autoattack = false;

    /** true if rotation is enabled */
    private rotation = true;
    cursorAngle = 0;
    reverseCursorAngle = 0;
    lockPosition = false;
    lockedPosition = new Vector(0, 0);

    /** A bitmask which represents current movement direction */
    move!: number;

    /** true if myPlayer is attacking using left mouse button */
    attacking!: EAttack;
    attackingState!: EAttack;

    sentAngle!: ESentAngle;
    sentHatEquip!: boolean;
    sentAccEquip!: boolean;

    /** myPlayer is going to be instakilled, we need to heal */
    needToHeal!: boolean;

    /** true, if tried to outheal instakill */
    didAntiInsta!: boolean;

    /** true if used placement method at least once at current tick */
    placedOnce!: boolean;
    healedOnce!: boolean;
    totalPlaces!: number;
    attacked!: boolean;
    canAttack = false;
    canHitEntity = false;

    /** true, if some of combat or defensive modules are active */
    moduleActive = false;
    useAngle = 0;
    useWeapon: WeaponType | null = null;
    previousWeapon: WeaponType | null = null;

    public readonly mouse = {
        x: 0,
        y: 0,
        lockX: 0,
        lockY: 0,

        /** Current mouse angle, regardless of conditions */
        _angle: 0,

        /** Current mouse angle, including lock rotation */
        angle: 0,

        /** An angle that was sent to the server */
        sentAngle: 0,
    }

    constructor(client: PlayerClient) {
        this.client = client;

        this.staticModules = {
            tempData: new TempData(client),
            movement: new Movement(client),
            clanJoiner: new ClanJoiner(client),

            autoAccept: new AutoAccept(client),

            antiInsta: new AntiInsta(client),
            shameReset: new ShameReset(client),
            
            autoPlacer: new AutoPlacer(client),
            placer: new Placer(client),
            autoMill: new Automill(client),
            placementExecutor: new PlacementExecutor(client),
            
            reloading: new Reloading(client),
            spikeTick: new SpikeTick(client),
            autoBreak: new Autobreak(client),
            preAttack: new PreAttack(client),
            autoHat: new Autohat(client),
        
            updateAttack: new UpdateAttack(client),
            updateAngle: new UpdateAngle(client),
        };

        this.botModules = [
            this.staticModules.tempData,
            this.staticModules.clanJoiner,
            this.staticModules.movement,
        ];

        this.modules = [
            this.staticModules.autoAccept,

            this.staticModules.antiInsta,
            this.staticModules.shameReset,
            
            this.staticModules.autoPlacer,
            this.staticModules.placer,
            this.staticModules.autoMill,
            this.staticModules.placementExecutor,
            
            this.staticModules.reloading,
            this.staticModules.spikeTick,
            this.staticModules.autoBreak,
            this.staticModules.preAttack,
            this.staticModules.autoHat,

            this.staticModules.updateAttack,
            this.staticModules.updateAngle,
        ];
        this.reset();
    }

    private movementReset() {
        this.hotkeys.clear();
        this.currentHolding = WeaponType.PRIMARY;
        this.weapon = WeaponType.PRIMARY;
        this.currentType = null;
        this.move = 0;
        this.attacking = EAttack.DISABLED;
        this.attackingState = EAttack.DISABLED;
    }

    reset(): void {
        this.movementReset();
        this.getHatStore().utility.clear();
        this.getAccStore().utility.clear();
        this.sentAngle = ESentAngle.NONE;
        this.sentHatEquip = false;
        this.sentAccEquip = false;
        this.needToHeal = false;
        this.didAntiInsta = false;
        this.placedOnce = false;
        this.healedOnce = false;
        this.totalPlaces = 0;
        this.attacked = false;
        this.canHitEntity = false;

        for (const module of this.modules) {
            if ("reset" in module) {
                module.reset();
            }
        }

        const { isOwner, clients } = this.client;
        if (isOwner) {
            for (const client of clients) {
                client.ModuleHandler.movementReset();
            }
        }
    }

    get isMoving(): boolean {
        const angle = getAngleFromBitmask(this.move, false);
        return angle !== null;
    }

    get holdingWeapon(): boolean {
        return this.currentHolding <= WeaponType.SECONDARY;
    }

    getHatStore() {
        return this.store[EStoreType.HAT];
    }

    getAccStore() {
        return this.store[EStoreType.ACCESSORY];
    }

    getMoveAngle(): number | null {
        if (this.client.isOwner) return getAngleFromBitmask(this.move, false);
        if (!this.staticModules.movement.stopped) return this.cursorAngle;
        return null;
    }

    handleMouse(event: MouseEvent) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
        const angle = getAngle(innerWidth / 2, innerHeight / 2, this.mouse.x, this.mouse.y);
        this.mouse._angle = angle;
        if (this.rotation) {
            this.mouse.lockX = event.clientX;
            this.mouse.lockY = event.clientY;
            this.mouse.angle = angle;
        }
    }

    private updateSentAngle(priority: ESentAngle) {
        if (this.sentAngle >= priority) return;
        this.sentAngle = priority;
    }

    upgradeItem(id: number) {
        this.client.SocketManager.upgradeItem(id);
        this.client.myPlayer.upgradeItem(id);
    }

    canBuy(type: EStoreType, id: number): boolean {
        const store = DataHandler.getStore(type);
        // @ts-ignore
        const price = store[id].price;
        const bought = this.bought[type];
        return bought.has(id) || this.client.myPlayer.tempGold >= price;
    }

    /** Buys a hat or accessory and returns true if it was successful */
    buy(type: EStoreType, id: number, force = false): boolean {
        const store = DataHandler.getStore(type);
        const { isOwner, clients, myPlayer, SocketManager } = this.client;
        if (!myPlayer.inGame) return false;

        if (force) {
            if (isOwner) {
                for (const client of clients) {
                    client.ModuleHandler.buy(type, id, force);
                }
            }
        }

        // @ts-ignore
        const price = store[id].price;
        const bought = this.bought[type];

        if (price === 0) {
            bought.add(id);
            return true;
        }
        
        if (!bought.has(id) && myPlayer.tempGold >= price) {
            bought.add(id);
            SocketManager.buy(type, id);
            myPlayer.tempGold -= price;
            return false;
        }
        return bought.has(id);
    }

    /** Buys and equips a hat or accessory */
    equip(type: EStoreType, id: number, force = false): boolean {
        const { myPlayer, SocketManager, isOwner, clients, EnemyManager } = this.client;
        if (!myPlayer.inGame || !this.buy(type, id, force)) return false;

        const store = this.store[type];
        if (!force && store.last === id) return false;
        store.last = id;

        SocketManager.equip(type, id);
        if (type === EStoreType.HAT) {
            this.sentHatEquip = true;
        } else {
            this.sentAccEquip = true;
        }

        if (force) {
            store.actual = id;

            if (isOwner) {
                for (const client of clients) {
                    client.ModuleHandler.staticModules.tempData.setStore(type, id);
                }
            }
        }

        const nearest = EnemyManager.nearestTurretEntity;
        const reloading = this.staticModules.reloading;
        if (nearest !== null && reloading.isReloaded("turret")) {
            reloading.resetByType("turret");
        }
        return true;
    }

    updateAngle(angle: number, force = false) {
        if (!force && angle === this.mouse.sentAngle) return;
        this.mouse.sentAngle = angle;
        this.updateSentAngle(ESentAngle.HIGH);
        this.client.SocketManager.updateAngle(angle);
    }

    private selectItem(type: ItemType) {
        const item = this.client.myPlayer.getItemByType(type)!;
        this.client.SocketManager.selectItemByID(item, false);
        this.currentHolding = type;
    }

    attack(angle: number | null, priority = ESentAngle.MEDIUM) {
        if (angle !== null) {
            this.mouse.sentAngle = angle;
        }
        this.updateSentAngle(priority);
        this.client.SocketManager.attack(angle);

        if (this.holdingWeapon) {
            this.attacked = true;
        }
    }

    stopAttack() {
        this.client.SocketManager.stopAttack();
    }

    whichWeapon(type: WeaponType = this.weapon) {
        const weapon = this.client.myPlayer.getItemByType(type);
        if (weapon === null) return;

        this.currentHolding = type;
        this.weapon = type;
        this.client.SocketManager.selectItemByID(weapon, true);
    }

    place(type: ItemType, { angle = this.mouse.angle, priority, last }: IPlaceOptions) {
        this.selectItem(type);
        this.attack(angle, priority);
        if (last) this.whichWeapon();
    }

    heal(last: boolean) {
        this.selectItem(ItemType.FOOD);
        this.attack(null, ESentAngle.LOW);
        if (last) this.whichWeapon();
    }

    private placementHandler(type: ItemType, code: string) {
        const item = this.client.myPlayer.getItemByType(type);
        if (item === null) return;
        this.hotkeys.set(code, type);
        this.currentType = type;

        const { isOwner, clients } = this.client;
        if (isOwner) {
            for (const client of clients) {
                client.ModuleHandler.placementHandler(type, code);
            } 
        }
    }

    private handleMovement() {
        const angle = getAngleFromBitmask(this.move, false);
        this.client.SocketManager.move(angle);
    }

    private toggleAutoattack(value?: boolean) {
        if (this.attackingState !== EAttack.DISABLED) return;

        const { SocketManager, isOwner, clients } = this.client;
        if (isOwner) {
            this.autoattack = !this.autoattack;
            SocketManager.autoAttack();

            for (const client of clients) {
                client.ModuleHandler.toggleAutoattack(this.autoattack);
            }
        } else if (typeof value === "boolean" && this.autoattack !== value) {
            this.autoattack = value;
            SocketManager.autoAttack();
        }
    }

    private toggleRotation() {
        this.rotation = !this.rotation;
        if (this.rotation) {
            const { x, y, _angle } = this.mouse;
            this.mouse.lockX = x;
            this.mouse.lockY = y;
            this.mouse.angle = _angle;
        }
    }

    private toggleBotPosition() {
        this.lockPosition = !this.lockPosition;
        if (this.lockPosition) {
            const pos = cursorPosition();
            this.lockedPosition.setVec(pos);
        }
    }

    private updateStoreState(type: EStoreType) {
        const { myPlayer } = this.client;
        const id = myPlayer.getBestCurrentID(type);
        this.store[type].current = id;
    }

    postTick() {
        this.sentAngle = ESentAngle.NONE;
        this.sentHatEquip = false;
        this.sentAccEquip = false;
        this.didAntiInsta = false;
        this.placedOnce = false;
        this.healedOnce = false;
        this.totalPlaces = 0;
        this.attacked = false;
        this.canHitEntity = false;
        this.moduleActive = false;
        this.useWeapon = null;

        const { isOwner } = this.client;
        this.updateStoreState(EStoreType.HAT);
        this.updateStoreState(EStoreType.ACCESSORY);

        if (!isOwner) {
            for (const botModule of this.botModules) {
                botModule.postTick();
            }
        }

        for (const module of this.modules) {
            module.postTick();
        }
        this.attackingState = this.attacking;
    }

    handleKeydown(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        if (event.code === "Space" && target.tagName === "BODY") {
            event.preventDefault();
        }
        if (event.repeat) return;
        if (UI.activeHotkeyInput !== null) return;
        
        const isInput = isActiveInput();
        if (event.code === settings.toggleMenu && !isInput) {
            UI.toggleMenu();
        }

        if (event.code === settings.toggleChat) {
            GameUI.handleEnter(event);
        }
        if (!this.client.myPlayer.inGame) return;
        if (isInput) return;

        const { isOwner, clients } = this.client;
        const type = event.code === settings.primary ? WeaponType.PRIMARY : event.code === settings.secondary ? WeaponType.SECONDARY : null;
        if (type !== null) {
            this.whichWeapon(type);

            if (isOwner) {
                for (const client of clients) {
                    const { tempData } = client.ModuleHandler.staticModules; 
                    tempData.setWeapon(type);
                }
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

        if (event.code === settings.autoattack) this.toggleAutoattack();
        if (event.code === settings.lockrotation) this.toggleRotation();
        if (event.code === settings.lockBotPosition) this.toggleBotPosition();

        const { storeButton, clanButton } = GameUI.getElements();
        if (event.code === settings.toggleShop) storeButton.click();
        if (event.code === settings.toggleClan) clanButton.click();
    }

    handleKeyup(event: KeyboardEvent) {
        if (!this.client.myPlayer.inGame) return;

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

            const { isOwner, clients } = this.client;
            if (isOwner) {
                for (const client of clients) {
                    const { ModuleHandler } = client;
                    if (ModuleHandler.currentType !== null && ModuleHandler.hotkeys.delete(event.code)) {
                        const entry = [...ModuleHandler.hotkeys].pop();
                        ModuleHandler.currentType = entry !== undefined ? entry[1] : null;
                        if (ModuleHandler.currentType === null) {
                            ModuleHandler.whichWeapon();
                        }
                    }
                }
            }
        }
    }

    handleMousedown(event: MouseEvent) {
        const button = formatButton(event.button);

        // if (button === "MBTN") {
        //     this.instakill.start();
        //     return;
        // }

        const state = button === "LBTN" ? EAttack.ATTACK : button === "RBTN" ? EAttack.DESTROY : null;
        if (state !== null && this.attacking === EAttack.DISABLED) {
            this.attacking = state;
            this.attackingState = state;

            const { isOwner, clients } = this.client;
            if (isOwner) {
                for (const client of clients) {
                    client.ModuleHandler.staticModules.tempData.setAttacking(state);
                }
            }
        }
    }

    handleMouseup(event: MouseEvent) {
        const button = formatButton(event.button);

        if ((button === "LBTN" || button === "RBTN") && this.attacking !== EAttack.DISABLED) {
            this.attacking = EAttack.DISABLED;

            const { isOwner, clients } = this.client;
            if (isOwner) {
                for (const client of clients) {
                    client.ModuleHandler.staticModules.tempData.setAttacking(EAttack.DISABLED);
                }
            }
        }
    }
}

export default ModuleHandler;