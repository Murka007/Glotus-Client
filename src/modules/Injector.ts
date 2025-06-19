import Regexer from "./Regexer";

const Injector = new class Injector {

    private foundScript(script: HTMLScriptElement) {
        console.log("FOUND NODE", script);
        this.loadScript(script.src);
        script.remove();
    }
    /**
     * Intercepts creation of <script src="bundle.js"></script>
     */
    init() {
        const script = document.querySelector<HTMLScriptElement>("script[type='module'][src]");
        if (script !== null) {
            this.foundScript(script);
        }
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof HTMLScriptElement)) continue;
                    if (/recaptcha/.test(node.src)) continue;

                    // Firefox support
                    function scriptExecuteHandler(event: Event) {
                        event.preventDefault();
                        node.removeEventListener("beforescriptexecute", scriptExecuteHandler);
                    }
                    node.addEventListener("beforescriptexecute", scriptExecuteHandler);

                    const regex = /cookie|cloudflare|ads|jquery|howler|frvr-channel-web/;
                    if (regex.test(node.src)) {
                        node.remove();
                    }
                    
                    if (/assets.+\.js$/.test(node.src) && script === null) {
                        observer.disconnect();
                        this.foundScript(node);
                    }
                }
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }

    /**
     * Fetches game bundle by src, modifies it and injects back to the DOM
     */
    private loadScript(src: string) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", src, false);
        xhr.send();
        
        const code = this.formatCode(xhr.responseText);
        const blob = new Blob([code], { type: "text/plain" });

        const element = document.createElement("script");
        element.src = URL.createObjectURL(blob);
        this.waitForBody(() => {
            document.head.appendChild(element);
        });
    }

    private waitForBody(callback: () => void) {
        if (document.readyState !== "loading") {
            callback();
            return;
        }
        document.addEventListener("readystatechange", () => {
            if (document.readyState !== "loading") {
                callback();
            }
        }, { once: true });
    }

    /**
     * Modifies bundle using regular expressions
     */
    private formatCode(code: string) {
        const Hook = new Regexer(code);

        Hook.prepend(
            "LockRotationClient",
            /return \w+\?\(\!/,
            `return Glotus.myClient.ModuleHandler.mouse.angle;`
        );

        Hook.replace(
            "DisableResetMoveDir",
            /\w+=\{\},\w+\.send\("\w+"\)/,
            ""
        );

        Hook.append(
            "offset",
            /\W170\W.+?(\w+)=\w+\-\w+\/2.+?(\w+)=\w+\-\w+\/2;/,
            `Glotus.myClient.myPlayer.offset.setXY($1,$2);`
        );

        Hook.prepend(
            "renderEntity",
            /\w+\.health>NUM{0}.+?(\w+)\.fillStyle=(\w+)==(\w+)/,
            `;Glotus.hooks.EntityRenderer.render($1,$2,$3);false&&`
        );

        Hook.append(
            "renderItemPush",
            /,(\w+)\.blocker,\w+.+?2\)\)/,
            `,Glotus.Renderer.objects.push($1)`
        );

        Hook.append(
            "renderItem",
            /70, 0.35\)",(\w+).+?\w+\)/,
            `,Glotus.hooks.ObjectRenderer.render($1)`
        );

        Hook.append(
            "RemoveSendAngle",
            /clientSendRate\)/,
            `&&false`
        );

        Hook.replace(
            "handleEquip",
            /\w+\.send\("\w+",0,(\w+),(\w+)\)/,
            `Glotus.myClient.ModuleHandler.equip($2,$1,true)`
        );

        Hook.replace(
            "handleBuy",
            /\w+\.send\("\w+",1,(\w+),(\w+)\)/,
            `Glotus.myClient.ModuleHandler.buy($2,$1,true)`
        );

        Hook.prepend(
            "RemovePingCall",
            /\w+&&clearTimeout/,
            "return;"
        );

        Hook.append(
            "RemovePingState",
            /let \w+=-1;function \w+\(\)\{/,
            "return;"
        )

        Hook.prepend(
            "preRender",
            /(\w+)\.lineWidth=NUM{4},/,
            `Glotus.hooks.ObjectRenderer.preRender($1);`
        );
        
        Hook.replace(
            "RenderGrid",
            /("#91b2db".+?)(for.+?)(\w+\.stroke)/,
            "$1if(Glotus.settings.renderGrid){$2}$3"
        )

        Hook.replace(
            "upgradeItem",
            /(upgradeItem.+?onclick.+?)\w+\.send\("\w+",(\w+)\)\}/,
            "$1Glotus.myClient.ModuleHandler.upgradeItem($2)}"
        );

        const data = Hook.match("DeathMarker", /99999.+?(\w+)=\{x:(\w+)/);
        Hook.append(
            "playerDied",
            /NUM{99999};function \w+\(\)\{/,
            `if(Glotus.myClient.myPlayer.handleDeath()){${data[1]}={x:${data[2]}.x,y:${data[2]}.y};return};`
        );

        Hook.append(
            "updateNotificationRemove",
            /\w+=\[\],\w+=\[\];function \w+\(\w+,\w+\)\{/,
            `return;`
        );

        Hook.replace(
            "retrieveConfig",
            /((\w+)=\{maxScreenWidth.+?\}),/,
            "$1;window.config=$2;"
        );

        Hook.replace(
            "retrieveUtility",
            /((\w+)=\{randInt.+?\}),/,
            "$1;window.bundleUtility=$2;"
        );

        Hook.replace(
            "removeSkins",
            /(\(\)\{)(let \w+="";for\(let)/,
            "$1return;$2"
        );

        Hook.prepend(
            "unlockedItems",
            /\w+\.list\[\w+\]\.pre==/,
            "true||"
        );

        return Hook.code;
    }
    
}

export default Injector;