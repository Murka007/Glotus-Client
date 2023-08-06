import CSS from "../../public/styles/index.scss";
import GameCSS from "../../public/styles/Game.scss";
import Header from "../../public/Header.html";
import Navbar from "../../public/Navbar.html";
import Keybinds from "../../public/menu-pages/Keybinds.html";
import Combat from "../../public/menu-pages/Combat.html";
import Visuals from "../../public/menu-pages/Visuals.html";
import Misc from "../../public/menu-pages/Misc.html";
import Devtool from "../../public/menu-pages/Devtool.html";
import Credits from "../../public/menu-pages/Credits.html";
import { formatButton, formatCode, removeClass } from "../utility/Common";
import settings, { defaultSettings, ISettings, SaveSettings } from "../utility/Settings";
import { KeysOfType } from "../types/Common";
import GameUI from "./GameUI";
import Logger from "../utility/Logger";
import ModuleHandler from "../features/ModuleHandler";

interface IFrame {
    readonly target: HTMLIFrameElement;
    readonly window: Window & typeof globalThis;
    readonly document: Document;
}

const UI = new class UI {
    private frame!: IFrame;
    activeHotkeyInput: HTMLButtonElement | null = null;
    private toggleTimeout: ReturnType<typeof setTimeout> | undefined;
    private menuOpened = false;
    private menuLoaded = false;

    get isMenuOpened() {
        return this.menuOpened;
    }

    /**
     * Merges all html code together
     */
    private getFrameContent() {
        return `
            <style>${CSS}</style>
            <div id="menu-container">
                <div id="menu-wrapper">
                    ${Header}

                    <main>
                        ${Navbar}
                        
                        <div id="page-container">
                            ${Keybinds}
                            ${Combat}
                            ${Visuals}
                            ${Misc}
                            ${Devtool}
                            ${Credits}
                        </div>
                    </main>
                </div>
            </div>
        `
    }

    /**
     * Injects css
     */
    private createStyles() {
        const style = document.createElement("style");
        style.innerHTML = GameCSS;
        document.head.appendChild(style);
    }

    private createFrame() {
        this.createStyles();

        const iframe = document.createElement("iframe");
        const blob = new Blob([this.getFrameContent()], { type: "text/html; charset=utf-8" });
        iframe.src = URL.createObjectURL(blob);
        iframe.id = "iframe-page-container";
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        return new Promise<IFrame>(resolve => {
            iframe.onload = () => {
                const iframeWindow = iframe.contentWindow as Window & typeof globalThis;
                const iframeDocument = iframeWindow.document;
                URL.revokeObjectURL(iframe.src);

                resolve({
                    target: iframe,
                    window: iframeWindow,
                    document: iframeDocument
                })
            }
        })
    }

    private querySelector<T extends Element>(selector: string) {
        return this.frame.document.querySelector<T>(selector);
    }

    private querySelectorAll<T extends Element>(selector: string) {
        return this.frame.document.querySelectorAll<T>(selector);
    }

    private getElements() {
        return {
            menuContainer: this.querySelector<HTMLDivElement>("#menu-container")!,
            menuWrapper: this.querySelector<HTMLDivElement>("#menu-wrapper")!,
            hotkeyInputs: this.querySelectorAll<HTMLButtonElement>(".hotkeyInput[id]")!,
            checkboxes: this.querySelectorAll<HTMLInputElement>("input[type='checkbox'][id]")!,
            colorPickers: this.querySelectorAll<HTMLInputElement>("input[type='color'][id]")!,
            closeButton: this.querySelector<SVGSVGElement>("#close-button")!,
            openMenuButtons: this.querySelectorAll<HTMLButtonElement>(".open-menu[data-id]")!,
            menuPages: this.querySelectorAll<HTMLDivElement>(".menu-page[data-id]")!,
        } as const;
    }

    private handleResize() {
        const { menuContainer } = this.getElements();
        const scale = Math.min(0.9, Math.min(innerWidth / 1280, innerHeight / 720));
        menuContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

    private createRipple(selector: string) {
        const buttons = this.frame.document.querySelectorAll<HTMLButtonElement>(selector);
        for (const button of buttons) {
            button.addEventListener("click", event => {
                const { width, height } = button.getBoundingClientRect();
                const size = Math.max(width, height) * 2;

                const ripple = document.createElement("span");
                ripple.style.width = size + "px";
                ripple.style.height = size + "px";
                ripple.style.marginTop = -size / 2 + "px";
                ripple.style.marginLeft = -size / 2 + "px";
                ripple.style.left = event.offsetX + "px";
                ripple.style.top = event.offsetY + "px";
                ripple.classList.add("ripple");
                button.appendChild(ripple);

                setTimeout(() => ripple.remove(), 750);
            })
        }
    }

    private attachHotkeyInputs() {
        const { hotkeyInputs } = this.getElements();
        for (const hotkeyInput of hotkeyInputs) {
            const id = hotkeyInput.id as KeysOfType<ISettings, string>;
            const value = settings[id];
            if (id in settings && typeof value === "string") {
                hotkeyInput.textContent = formatCode(value);
            } else {
                Logger.error(`attachHotkeyInputs Error: Property "${id}" does not exist in settings`);
            }
        }
    }

    /**
     * Finds all repeating hotkeys and highlights them red
     */
    private checkForRepeats() {
        const { hotkeyInputs } = this.getElements();
        const list = new Map<string, [number, HTMLButtonElement[]]>();

        for (const hotkeyInput of hotkeyInputs) {
            const id = hotkeyInput.id as KeysOfType<ISettings, string>;
            if (id in settings) {
                const value = settings[id];
                const [count, inputs] = list.get(value) || [0, []];
                list.set(value, [(count || 0) + 1, [ ...inputs, hotkeyInput ]]);
                hotkeyInput.classList.remove("red");
            } else {
                Logger.error(`checkForRepeats Error: Property "${id}" does not exist in settings`);
            }
        }

        for (const data of list) {
            const [number, hotkeyInputs] = data[1];
            if (number === 1) continue;

            for (const hotkeyInput of hotkeyInputs) {
                hotkeyInput.classList.add("red");
            }
        }
    }

    /**
     * Changes value of hotkeyInput
     */
    private applyCode(code: string | number) {
        if (this.activeHotkeyInput === null) return;

        const deleting = code === "Backspace";
        const isCode = typeof code === "string";
        const keyText = isCode ? formatCode(code) : formatButton(code);
        const keySetting = isCode ? code : keyText;

        const id = this.activeHotkeyInput.id as KeysOfType<ISettings, string>;
        if (id in settings) {
            settings[id] = deleting ? "..." : keySetting;
            SaveSettings();
        } else {
            Logger.error(`applyCode Error: Property "${id}" does not exist in settings`);
        }

        this.activeHotkeyInput.textContent = deleting ? "..." : keyText;
        this.activeHotkeyInput.blur();
        this.activeHotkeyInput.classList.remove("active");
        this.activeHotkeyInput = null;
        this.checkForRepeats();
    }

    private isHotkeyInput(target: EventTarget | null): target is HTMLButtonElement {
        return (
            target instanceof this.frame.window.HTMLButtonElement &&
            target.classList.contains("hotkeyInput") &&
            target.hasAttribute("id")
        )
    }

    private handleCheckboxToggle(id: KeysOfType<ISettings, boolean>, checked: boolean) {
        switch (id) {
            case "itemCounter":
                GameUI.toggleItemCount();
                break;

            case "menuTransparency":
                const { menuContainer } = this.getElements();
                menuContainer.classList.toggle("transparent");
                break;
        }
    }

    private attachCheckboxes() {
        const { checkboxes } = this.getElements();
        for (const checkbox of checkboxes) {
            const id = checkbox.id as KeysOfType<ISettings, boolean>;
            
            if (!(id in settings)) {
                Logger.error(`attachCheckboxes Error: Property "${id}" does not exist in settings`);
                continue;
            }

            checkbox.checked = settings[id];
            checkbox.onchange = () => {
                if (id in settings) {
                    settings[id] = checkbox.checked;
                    SaveSettings();
                    this.handleCheckboxToggle(id, checkbox.checked);
                } else {
                    Logger.error(`attachCheckboxes Error: Property "${id}" was deleted from settings`);
                }
            }
        }
    }

    private attachColorPickers() {
        const { colorPickers } = this.getElements();
        for (const picker of colorPickers) {
            const id = picker.id as KeysOfType<ISettings, string>;

            if (!(id in settings)) {
                Logger.error(`attachColorPickers Error: Property "${id}" does not exist in settings`);
                continue;
            }

            picker.value = settings[id];
            picker.onchange = () => {
                if (id in settings) {
                    settings[id] = picker.value;
                    SaveSettings();
                    picker.blur();
                } else {
                    Logger.error(`attachColorPickers Error: Property "${id}" was deleted from settings`);
                }
            }

            const resetColor = picker.previousElementSibling;
            if (resetColor instanceof this.frame.window.HTMLButtonElement) {
                resetColor.style.setProperty("--data-color", defaultSettings[id]);
                resetColor.onclick = () => {
                    if (id in settings) {
                        picker.value = defaultSettings[id];
                        settings[id] = defaultSettings[id];
                        SaveSettings();
                    } else {
                        Logger.error(`resetColor Error: Property "${id}" was deleted from settings`);
                    }
                }
            }
        }
    }

    private closeMenu() {
        const { menuWrapper } = this.getElements();
        menuWrapper.classList.remove("toopen");
        menuWrapper.classList.add("toclose");
        this.menuOpened = false;
        
        clearTimeout(this.toggleTimeout);
        this.toggleTimeout = setTimeout(() => {
            menuWrapper.classList.remove("toclose");
            this.frame.target.style.display = "none";
        }, 150);
    }

    private openMenu() {
        const { menuWrapper } = this.getElements();
        this.frame.target.removeAttribute("style");
        menuWrapper.classList.remove("toclose");
        menuWrapper.classList.add("toopen");
        this.menuOpened = true;
        
        clearTimeout(this.toggleTimeout);
        this.toggleTimeout = setTimeout(() => {
            menuWrapper.classList.remove("toopen");
        }, 150);
    }

    toggleMenu() {
        if (!this.menuLoaded) return;
        if (this.menuOpened) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    private attachOpenMenu() {
        const { openMenuButtons, menuPages } = this.getElements();
        for (let i=0;i<openMenuButtons.length;i++) {
            const button = openMenuButtons[i];
            const id = button.getAttribute("data-id");
            const menuPage = this.querySelector<HTMLDivElement>(`.menu-page[data-id='${id}']`);
            button.onclick = () => {
                if (menuPage instanceof this.frame.window.HTMLDivElement) {
                    removeClass(openMenuButtons, "active");
                    button.classList.add("active");

                    removeClass(menuPages, "opened");
                    menuPage.classList.add("opened");
                } else {
                    Logger.error(`attachOpenMenu Error: Cannot find "${button.textContent}" menu`);
                }
            }
        }
    }

    private attachListeners() {

        const { closeButton } = this.getElements();

        closeButton.onclick = () => {
            this.closeMenu();
        }

        const preventDefaults = (target: Window) => {
            target.addEventListener("contextmenu", event => event.preventDefault());
            target.addEventListener("mousedown", event => {
                if (event.button === 1) event.preventDefault();
            });
            target.addEventListener("mouseup", event => {
                if (event.button === 3 || event.button === 4) event.preventDefault();
            });
        }
        preventDefaults(window);
        preventDefaults(this.frame.window);

        this.handleResize();
        window.addEventListener("resize", () => this.handleResize());

        this.frame.document.addEventListener("mouseup", event => {
            if (this.activeHotkeyInput) {
                this.applyCode(event.button);
            } else if (this.isHotkeyInput(event.target) && event.button === 0) {
                event.target.textContent = "Wait...";
                this.activeHotkeyInput = event.target;
                event.target.classList.add("active");
            }
        })

        this.frame.document.addEventListener("keyup", event => {
            if (this.activeHotkeyInput && this.isHotkeyInput(event.target)) {
                this.applyCode(event.code);
            }
        })

        this.frame.window.addEventListener("keydown", event => ModuleHandler.handleKeydown(event));
        this.frame.window.addEventListener("keyup", event => ModuleHandler.handleKeyup(event));

        this.openMenu();
    }

    async createMenu() {
        this.frame = await this.createFrame();

        this.attachListeners();
        this.attachHotkeyInputs();
        this.checkForRepeats();
        this.attachCheckboxes();
        this.attachColorPickers();
        this.attachOpenMenu();
        this.createRipple(".open-menu");

        const { menuContainer } = this.getElements();
        if (settings.menuTransparency) {
            menuContainer.classList.add("transparent");
        }
        this.menuLoaded = true;
    }
}

export default UI;