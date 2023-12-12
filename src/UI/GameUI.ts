import { myClient } from "..";
import Config from "../constants/Config";
import { Items } from "../constants/Items";
import ZoomHandler from "../modules/ZoomHandler";
import { ItemGroup } from "../types/Items";
import { EStoreAction, EStoreType } from "../types/Store";
import settings from "../utility/Settings";
import Storage from "../utility/Storage";
import UI from "./UI";

// const enum StoreState {
//     UNEQUIPPED,
//     EQUIPPED,
// }

// interface ITempStore {
//     previous: number;
//     current: number;
//     readonly list: Map<number, StoreState>;
// }

// type TStore = [ITempStore, ITempStore];

const GameUI = new class GameUI {
    // private readonly store: TStore = [
    //     { previous: 0, current: 0, list: new Map },
    //     { previous: 0, current: 0, list: new Map }
    // ];

    // private generateStoreElement(type: EStoreType, id: number) {
    //     // const html = `
    //     //     <div className="storeItem">
    //     //     </div>
    //     // `;
    //     const div = document.createElement("div");
    //     div.className = "storeItem";

    //     const img = document.createElement("img");
    //     img.src = `../img/`;
    // }

    // updateStore(type: EStoreType, action: EStoreAction, id: number) {
    //     const store = this.store[type];
    //     if (action === EStoreAction.EQUIP) {
    //         store.previous = store.current;
    //         store.current = id;

    //         const { previous, current, list } = store;
    //         list.set(previous, StoreState.UNEQUIPPED);
    //         list.set(current, StoreState.EQUIPPED);
    //     } else {
    //         store.list.set(id, StoreState.UNEQUIPPED);
    //     }
    // }

    /**
     * Returns game html elements
     */
    getElements() {
        const querySelector = document.querySelector.bind(document);
        const querySelectorAll = document.querySelectorAll.bind(document);
        return {
            gameCanvas: querySelector<HTMLCanvasElement>("#gameCanvas")!,
            chatHolder: querySelector<HTMLInputElement>("#chatHolder")!,
            storeHolder: querySelector<HTMLInputElement>("#storeHolder")!,
            chatBox: querySelector<HTMLInputElement>("#chatBox")!,
            storeMenu: querySelector<HTMLInputElement>("#storeMenu")!,
            clanMenu: querySelector<HTMLInputElement>("#allianceMenu")!,
            storeButton: querySelector<HTMLInputElement>("#storeButton")!,
            clanButton: querySelector<HTMLInputElement>("#allianceButton")!,
            setupCard: querySelector<HTMLDivElement>("#setupCard")!,
            serverBrowser: querySelector<HTMLSelectElement>("#serverBrowser")!,
            skinColorHolder: querySelector<HTMLDivElement>("#skinColorHolder")!,
            settingRadio: querySelectorAll<HTMLDivElement>(".settingRadio")!,
            pingDisplay: querySelector<HTMLDivElement>("#pingDisplay")!,
            enterGame: querySelector<HTMLDivElement>("#enterGame")!,
            nameInput: querySelector<HTMLInputElement>("#nameInput")!,
            allianceInput: querySelector<HTMLInputElement>("#allianceInput")!,
            allianceButton: querySelector<HTMLDivElement>(".allianceButtonM")!,
            noticationDisplay: querySelector<HTMLDivElement>("#noticationDisplay")!,
        } as const;
    }

    private createSkinColors() {
        const index = Storage.get<number>("skin_color") || 0;
        const { skinColorHolder } = this.getElements();

        let prevIndex = index;
        for (let i=0;i<Config.skinColors.length;i++) {
            const color = Config.skinColors[i];
            const div = document.createElement("div");
            div.classList.add("skinColorItem");
            if (i === index) {
                div.classList.add("activeSkin");
            }
            div.style.backgroundColor = color;
            div.onclick = () => {
                const colorButton = skinColorHolder.childNodes[prevIndex];
                if (colorButton instanceof HTMLDivElement) {
                    colorButton.classList.remove("activeSkin");
                }
                div.classList.add("activeSkin");
                prevIndex = i;
                (window as any).selectSkinColor(i);
            }
            skinColorHolder.appendChild(div);
        }
    }

    private formatMainMenu() {
        const { setupCard, serverBrowser, skinColorHolder, settingRadio } = this.getElements();
        setupCard.appendChild(serverBrowser);
        setupCard.appendChild(skinColorHolder);
        this.createSkinColors();

        for (const radio of settingRadio) {
            setupCard.appendChild(radio);
        }
    }

    /**
     * Adds item counts to the inventory. So you can see amount of placed items
     */
    private attachItemCount() {
        const actionBar = document.querySelectorAll<HTMLDivElement>("div[id*='actionBarItem'");
        for (let i=19;i<39;i++) {
            const item = Items[i - 16];
            if (
                actionBar[i] instanceof HTMLDivElement &&
                item !== undefined &&
                "itemGroup" in item
            ) {
                const group = item.itemGroup;
                const span = document.createElement("span");
                span.classList.add("itemCounter");
                if (!settings.itemCounter) {
                    span.classList.add("hidden");
                }
                span.setAttribute("data-id", group + "");

                const { count, limit } = myClient.myPlayer.getItemCount(group);
                span.textContent = `${count}/${limit}`;
                actionBar[i].appendChild(span);
            }
        }
    }

    private attachMouse() {
        const { gameCanvas } = this.getElements();

        const { myPlayer, ModuleHandler } = myClient;
        const handleMouse = (event: MouseEvent) => {
            if (myPlayer.inGame && event.target !== gameCanvas) return;
            ModuleHandler.handleMouse(event);
        }
        window.addEventListener("mousemove", handleMouse);
        window.addEventListener("mouseover", handleMouse);

        gameCanvas.addEventListener("mousedown", event => ModuleHandler.handleMousedown(event));
        window.addEventListener("mouseup", event => ModuleHandler.handleMouseup(event));
        window.addEventListener("wheel", event => ZoomHandler.handler(event));
    }

    private modifyInputs() {
        const { chatHolder, chatBox, nameInput } = this.getElements();
        chatBox.onblur = () => {
            chatHolder.style.display = "none";
            const value = chatBox.value;
            if (value.length > 0) {
                myClient.SocketManager.chat(value);
            }
            chatBox.value = "";
        }

        nameInput.onchange = () => {
            Storage.set("moo_name", nameInput.value, false);
        }
    }

    /**
     * When user switches option in the menu. It toggles item count
     */
    toggleItemCount() {
        const items = document.querySelectorAll<HTMLSpanElement>(`span.itemCounter[data-id]`);
        for (const item of items) {
            item.classList.toggle("hidden");
        }
    }

    /**
     * Updates item count of items in inventory
     */
    updateItemCount(group: ItemGroup) {
        const items = document.querySelectorAll<HTMLSpanElement>(`span.itemCounter[data-id='${group}']`);
        const { count, limit } = myClient.myPlayer.getItemCount(group);
        for (const item of items) {
            item.textContent = `${count}/${limit}`;
        }
    }

    init() {
        this.formatMainMenu();
        this.attachMouse();
        this.modifyInputs();
        this.createTotalKill();
    }

    load() {
        const index = Storage.get<number>("skin_color") || 0;
        (window as any).selectSkinColor(index);
    }

    loadGame() {
        this.attachItemCount();
    }

    /**
     * Checks if element is opened. Used for store, clan and chat
     */
    private isOpened(element: HTMLElement) {
        return element.style.display === "block";
    }

    /**
     * Closes all popups except..
     */
    private closePopups(element?: HTMLElement) {
        const popups = document.querySelectorAll<HTMLDivElement>("#chatHolder, #storeMenu, #allianceMenu");
        for (const popup of popups) {
            if (popup === element) continue;
            popup.style.display = "none";
        }

        if (element instanceof HTMLElement) {
            element.style.display = this.isOpened(element) ? "none" : "block";
        }
    }

    private createAcceptButton(type: 0 | 1) {
        const data = [["#cc5151", "&#xE14C;"], ["#8ecc51", "&#xE876;"]] as const;
        const [color, code] = data[type];
        const button = document.createElement("div");
        button.classList.add("notifButton");
        button.innerHTML = `<i class="material-icons" style="font-size:28px; color:${color};">${code}</i>`;
        return button;
    }

    private resetNotication(noticationDisplay: HTMLDivElement) {
        noticationDisplay.innerHTML = "";
        noticationDisplay.style.display = "none";
    }

    clearNotication() {
        const { noticationDisplay } = this.getElements();
        this.resetNotication(noticationDisplay);
    }

    createRequest(user: [number, string]) {
        const [id, name] = user;
        const { noticationDisplay } = this.getElements();
        if (noticationDisplay.style.display !== "none") return;

        noticationDisplay.innerHTML = "";
        noticationDisplay.style.display = "block";

        const text = document.createElement("div");
        text.classList.add("notificationText");
        text.textContent = name;
        noticationDisplay.appendChild(text);

        const handleClick = (type: 0 | 1) => {
            const button = this.createAcceptButton(type);
            button.onclick = () => {
                myClient.SocketManager.clanRequest(id, !!type);
                myClient.myPlayer.joinRequests.shift();
                myClient.pendingJoins.delete(id);
                this.resetNotication(noticationDisplay);
            }
            noticationDisplay.appendChild(button);
        }
        handleClick(0);
        handleClick(1);
    }

    spawn() {
        const { enterGame } = this.getElements();
        enterGame.click();
    }
    
    handleEnter(event: KeyboardEvent) {
        if (UI.isMenuOpened) return;
        const { allianceInput, allianceButton } = this.getElements();
        const active = document.activeElement;

        if (myClient.myPlayer.inGame) {
            if (active === allianceInput) {
                allianceButton.click();
            } else {
                this.toggleChat(event);
            }
            return;
        }

        this.spawn();
    }

    toggleChat(event: KeyboardEvent) {
        const { chatHolder, chatBox } = this.getElements();
        this.closePopups(chatHolder);
        if (this.isOpened(chatHolder)) {
            event.preventDefault();
            chatBox.focus();
        } else {
            chatBox.blur();
        }
    }

    updatePing(ping: number) {
        const { pingDisplay } = this.getElements();
        pingDisplay.textContent = `Ping: ${ping}ms`;
    }

    private createTotalKill() {
        const topInfoHolder = document.querySelector<HTMLDivElement>("#topInfoHolder");
        if (topInfoHolder === null) return;

        const div = document.createElement("div");
        div.id = "totalKillCounter";
        div.classList.add("resourceDisplay");
        div.textContent = "0";
        topInfoHolder.appendChild(div);
    }

    updateTotalKill() {
        const counter = document.querySelector<HTMLDivElement>("#totalKillCounter");
        if (counter === null) return;
        counter.textContent = myClient.totalKills.toString();
    }
}

export default GameUI;