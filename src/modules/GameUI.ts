import { Items } from "../constants/Items";
import myPlayer from "../data/ClientPlayer";
import SocketManager from "../Managers/SocketManager";
import { TItemGroup } from "../types/Items";
import settings from "../utility/Settings";


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
            pingDisplay: querySelector<HTMLDivElement>("#pingDisplay")!
        } as const;
    }

    private formatMainMenu() {
        const { setupCard, serverBrowser, skinColorHolder, settingRadio } = this.getElements();
        setupCard.appendChild(serverBrowser);
        setupCard.appendChild(skinColorHolder);

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

                const { count, limit } = myPlayer.getItemCount(group);
                span.textContent = `${count}/${limit}`;
                actionBar[i].appendChild(span);
            }
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
    updateItemCount(group: TItemGroup) {
        const items = document.querySelectorAll<HTMLSpanElement>(`span.itemCounter[data-id='${group}']`);
        const { count, limit } = myPlayer.getItemCount(group);
        for (const item of items) {
            item.textContent = `${count}/${limit}`;
        }
    }

    init() {
        this.formatMainMenu();
        this.attachItemCount();

        const { chatHolder, chatBox } = this.getElements();
        chatBox.onblur = () => {
            chatHolder.style.display = "none";
            const value = chatBox.value;
            if (value.length > 0) {
                SocketManager.chat(value);
            }
            chatBox.value = "";
        }
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