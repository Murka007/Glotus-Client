import { Items } from "../constants/Items";
import myPlayer from "../data/ClientPlayer";
import ModuleHandler from "../features/ModuleHandler";
import SocketManager from "../Managers/SocketManager";
import ZoomHandler from "../modules/ZoomHandler";
import { ItemGroup } from "../types/Items";
import settings from "../utility/Settings";
import Storage from "../utility/Storage";
import UI from "./UI";


const GameUI = new class GameUI {

    /**
     * Returns game html elements
     */
    getElements() {
        const querySelector = document.querySelector.bind(document);
        const querySelectorAll = document.querySelectorAll.bind(document);
        return {
            gameCanvas: querySelector<HTMLCanvasElement>("#gameCanvas")!,
            chatHolder: querySelector<HTMLInputElement>("#chatHolder")!,
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
        } as const;
    }

    private formatMainMenu() {
        const { setupCard, serverBrowser, skinColorHolder, settingRadio } = this.getElements();
        setupCard.appendChild(serverBrowser);
        setupCard.appendChild(skinColorHolder);

        for (const radio of settingRadio) {
            setupCard.appendChild(radio);
        }

        const index = Storage.get<number>("skin_color") || 0;
        const colorButton = skinColorHolder.childNodes[index];
        if (colorButton instanceof HTMLDivElement) {
            colorButton.click();
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

                const { count, limit } = myPlayer.getItemCount(group);
                span.textContent = `${count}/${limit}`;
                actionBar[i].appendChild(span);
            }
        }
    }

    private attachMouse() {
        const { gameCanvas } = this.getElements();

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
                SocketManager.chat(value);
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
        const { count, limit } = myPlayer.getItemCount(group);
        for (const item of items) {
            item.textContent = `${count}/${limit}`;
        }
    }

    init() {
        this.formatMainMenu();
        this.attachItemCount();
        this.attachMouse();
        this.modifyInputs();
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

    spawn() {
        const { enterGame } = this.getElements();
        enterGame.click();
    }
    
    handleEnter(event: KeyboardEvent) {
        if (UI.isMenuOpened) return;
        const { allianceInput, allianceButton } = this.getElements();
        const active = document.activeElement;

        if (myPlayer.inGame) {
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
}

export default GameUI;