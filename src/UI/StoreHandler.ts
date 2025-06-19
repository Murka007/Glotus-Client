import { myClient } from "..";
import { EStoreAction, EStoreType } from "../types/Store";
import DataHandler from "../utility/DataHandler";
import settings from "../utility/Settings";
import GameUI from "./GameUI";

const enum StoreState {
    UNEQUIPPED,
    EQUIPPED,
}

interface ITempStore {
    previous: number;
    current: number;
    readonly list: Map<number, StoreState>;
}

type TStore = [ITempStore, ITempStore];

const StoreHandler = new class StoreHandler {
    private isOpened = false;

    private readonly store: TStore = [
        { previous: -1, current: -1, list: new Map },
        { previous: -1, current: -1, list: new Map }
    ];
    private currentType = EStoreType.HAT;

    private isRightStore(type: EStoreType) {
        return this.isOpened && this.currentType === type;
    }

    private createStore(type: EStoreType) {
        const storeContainer = document.createElement("div");
        storeContainer.id = "storeContainer";
        storeContainer.style.display = "none";

        const button = document.createElement("div");
        button.id = "toggleStoreType";
        button.textContent = type === EStoreType.HAT ? "Hats" : "Accessories";
        button.onmousedown = () => {
            this.currentType = (this.currentType === EStoreType.HAT ? EStoreType.ACCESSORY : EStoreType.HAT);
            button.textContent = this.currentType === EStoreType.HAT ? "Hats" : "Accessories";
            if (this.isOpened) {
                this.fillStore(this.currentType);
            }
        }
        storeContainer.appendChild(button);

        const itemHolder = document.createElement("div");
        itemHolder.id = "itemHolder";
        storeContainer.appendChild(itemHolder);

        itemHolder.addEventListener("wheel", event => {
            event.preventDefault();
            const scale = Math.sign(event.deltaY) * 50;
            itemHolder.scroll(0, itemHolder.scrollTop + scale);
        })

        const { gameUI } = GameUI.getElements();
        gameUI.appendChild(storeContainer);
    }

    private getTextEquip(type: EStoreType, id: number, price: number) {
        const { list, current } = this.store[type];
        if (current === id) return "Unequip";
        if (list.has(id) || price === 0) return "Equip";
        return "Buy";
    }

    private generateStoreElement(type: EStoreType, id: number, name: string, price: number, isTop: boolean) {
        const srcType = ["hats/hat", "accessories/access"];
        const src = [srcType[type], id];

        if (isTop) {
            src.push("p");
        }

        const html = `
            <div class="storeItemContainer">
                <img class="storeHat" src="./img/${src.join("_")}.png">
                <span class="storeItemName">${name}</span>
                <div class="equipButton" data-id="${id}">${this.getTextEquip(type, id, price)}</div>
            </div>
        `;

        const div = document.createElement("div");
        div.innerHTML = html;

        const equipButton = div.querySelector<HTMLDivElement>(".equipButton")!;
        equipButton.onmousedown = () => {
            myClient.ModuleHandler.equip(type, id, true, true);
        }
        
        return div.firstElementChild!;
    }

    private fillStore(type: EStoreType) {
        const { itemHolder } = GameUI.getElements();
        itemHolder.innerHTML = "";
        const items = settings.storeItems[type];

        for (const id of items) {
            const item = DataHandler.getStoreItem(type, id);
            const element = this.generateStoreElement(type, id, item.name, item.price, "topSprite" in item);
            itemHolder.appendChild(element);
        }
    }

    private handleEquipUpdate(type: EStoreType, prev: number, curr: number, isBuy: boolean) {
        if (!this.isRightStore(type)) return;
        
        const current = document.querySelector<HTMLDivElement>(`.equipButton[data-id="${curr}"]`)!;
        if (current !== null) current.textContent = isBuy ? "Equip" : "Unequip";

        if (!isBuy && prev !== -1) {
            const previous = document.querySelector<HTMLDivElement>(`.equipButton[data-id="${prev}"]`)!;
            if (previous !== null) previous.textContent = "Equip";
        }
    }

    updateStoreState(type: EStoreType, action: EStoreAction, id: number) {
        const store = this.store[type];
        if (action === EStoreAction.EQUIP) {
            store.previous = store.current;
            store.current = id;

            const { previous, current, list } = store;
            list.set(previous, StoreState.UNEQUIPPED);
            list.set(current, StoreState.EQUIPPED);
            this.handleEquipUpdate(type, store.previous, id, false);
        } else {
            store.list.set(id, StoreState.UNEQUIPPED);
            this.handleEquipUpdate(type, store.previous, id, true);
        }
    }

    closeStore() {
        const { storeContainer, itemHolder } = GameUI.getElements();
        itemHolder.innerHTML = "";
        storeContainer.style.display = "none";
        this.isOpened = false;
    }

    openStore() {
        GameUI.closePopups();
        const { storeContainer } = GameUI.getElements();
        this.fillStore(this.currentType);
        storeContainer.style.display = "";
        storeContainer.classList.remove("closedItem");
        this.isOpened = true;
    }

    toggleStore() {
        const { storeContainer, itemHolder } = GameUI.getElements();
        if (this.isOpened) {
            itemHolder.innerHTML = "";
        } else {
            GameUI.closePopups();
            this.fillStore(this.currentType);
        }
        storeContainer.style.display = storeContainer.style.display === "none" ? "" : "none";
        this.isOpened = !this.isOpened;
    }

    init() {
        this.createStore(EStoreType.HAT);
    }
}

export default StoreHandler;