import Glotus from "..";
import SocketManager from "../Managers/SocketManager";


const GameUI = new class GameUI {

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

    init() {
        this.formatMainMenu();

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

    private isOpened(element: HTMLElement) {
        return element.style.display === "block";
    }

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

    toggleChat() {
        const { chatHolder, chatBox } = this.getElements();
        this.closePopups(chatHolder);
        if (this.isOpened(chatHolder)) {
            chatBox.focus();
        } else {
            chatBox.blur();
        }
    }
}

export default GameUI;