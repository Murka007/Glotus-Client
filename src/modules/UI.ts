import CSS from "../../public/styles/index.scss";
import Header from "../../public/Header.html";
import Navbar from "../../public/Navbar.html";
import Keybinds from "../../public/menu-pages/Keybinds.html";
import Glotus from "..";
import { formatButton, formatCode } from "../utility/Common";
import settings, { ISettings } from "./Settings";
import Storage from "./Storage";

interface IFrame {
    readonly window: Window & typeof globalThis;
    readonly document: Document;
}

const UI = new class UI {
    private frame!: IFrame;
    private activeHotkeyInput: HTMLButtonElement | null = null;

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
                        </div>
                    </main>
                </div>
            </div>
        `
    }

    private getFrameStyles() {
        return `
            #iframe-page-container {
                position: absolute;
                z-index: 10;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                width: 100%;
                height: 100%;
                border: none;
            }
        `
    }

    private createStyles() {
        const style = document.createElement("style");
        style.innerHTML = this.getFrameStyles();
        document.head.appendChild(style);
    }

    private createFrame() {
        this.createStyles();

        const iframe = document.createElement("iframe");
        const blob = new Blob([this.getFrameContent()], { type: "text/html; charset=utf-8" });
        iframe.src = URL.createObjectURL(blob);
        iframe.id = "iframe-page-container";
        document.body.appendChild(iframe);

        return new Promise<IFrame>(resolve => {
            iframe.onload = () => {
                const iframeWindow = iframe.contentWindow as Window & typeof globalThis;
                const iframeDocument = iframeWindow.document;
                URL.revokeObjectURL(iframe.src);

                resolve({
                    window: iframeWindow,
                    document: iframeDocument
                })
            }
        })
    }

    private getElements() {
        const querySelector = this.frame.document.querySelector.bind(this.frame.document);
        const querySelectorAll = this.frame.document.querySelectorAll.bind(this.frame.document);

        return {
            menuContainer: querySelector<HTMLDivElement>("#menu-container")!,
            hotkeyInputs: querySelectorAll<HTMLButtonElement>(".hotkeyInput[id]")!,
        } as const;
    }

    private handleResize() {
        const { menuContainer } = this.getElements();
        const scale = Math.min(1, Math.min(innerWidth / 1280, innerHeight / 720));
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

    private applyCode(code: string | number) {
        if (this.activeHotkeyInput === null) return;

        const deleting = code === "Backspace";
        const isCode = typeof code === "string";
        const keyText = isCode ? formatCode(code) : formatButton(code);
        const keySetting = isCode ? code : keyText;

        const id = this.activeHotkeyInput.id;
        if (id in settings) {
            settings[id as keyof ISettings] = deleting ? "..." : keySetting;
            Storage.set("Glotus", settings);
        } else {
            Glotus.error(`applyCode Error: Property ${id} does not exist in settings`);
        }

        this.activeHotkeyInput.textContent = deleting ? "..." : keyText;
        this.activeHotkeyInput.blur();
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

    private attachListeners() {

        const preventDefaults = (target: Window) => {
            target.addEventListener("contextmenu", event => event.preventDefault());
            target.addEventListener("mousedown", event => {
                if (event.button === 1) event.preventDefault();
            });
            target.addEventListener("mouseup", event => {
                if (event.button === 3 || event.button === 4) event.preventDefault();
            });
            // target.addEventListener("keydown", event => event.preventDefault());
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
            }
        })

        this.frame.document.addEventListener("keyup", event => {
            if (this.activeHotkeyInput && this.isHotkeyInput(event.target)) {
                this.applyCode(event.code);
            }
        })
    }

    private checkForRepeats() {
        const { hotkeyInputs } = this.getElements();
        const list = new Map<string, [number, HTMLButtonElement[]]>();

        for (const hotkeyInput of hotkeyInputs) {
            const id = hotkeyInput.id;
            if (id in settings) {
                const value = settings[id as keyof ISettings];
                const [count, inputs] = list.get(value) || [0, []];
                list.set(value, [(count || 0) + 1, [ ...inputs, hotkeyInput ]]);
                hotkeyInput.classList.remove("red");
            } else {
                Glotus.error(`checkForRepeats Error: Property ${id} does not exist in settings`);
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

    private attachHotkeyInputs() {
        const { hotkeyInputs } = this.getElements();
        for (const hotkeyInput of hotkeyInputs) {
            const id = hotkeyInput.id;
            const value = settings[id as keyof ISettings];
            if (id in settings && typeof value === "string") {
                hotkeyInput.textContent = formatCode(value);
            } else {
                Glotus.error(`attachHotkeyInputs Error: Property "${id}" does not exist in settings`);
            }
        }
    }

    async createMenu() {
        this.frame = await this.createFrame();

        this.attachListeners();
        this.attachHotkeyInputs();
        this.checkForRepeats();
        this.createRipple(".open-menu");
    }
}

export default UI;