import Glotus from "..";
import Logger from "../utility/Logger";
import Regexer from "./Regexer";

class Injector {

    // Intercept creation of <script src="bundle.js"></script>
    static init() {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (
                        node instanceof HTMLScriptElement &&
                        /bundle/.test(node.src)
                    ) {
                        Logger.log("FOUND SCRIPT", node);
                        observer.disconnect();
                        this.loadScript(node.src);
                        
                        // Firefox support
                        node.addEventListener(
                            "beforescriptexecute",
                            event => event.preventDefault(),
                            { once: true }
                        );
        
                        node.remove();
                    }
                }
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }

    private static loadScript(src: string) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", src, false);
        xhr.send();
        
        const code = Injector.formatCode(xhr.responseText);
        const blob = new Blob([code], { type: "text/plain" });

        const element = document.createElement("script");
        element.src = URL.createObjectURL(blob);
        document.body.appendChild(element);
    }

    // Modify bundle using regular expressions
    private static formatCode(code: string) {
        const Hook = new Regexer(code);

        Hook.prepend(
            "LockRotationClient",
            /return \w+\?\(/,
            `return Glotus.Controller.mouse.angle;`
        );

        Hook.replace(
            "DisableResetMoveDir",
            /,\w+\.send\("rmd"\)/,
            ""
        );

        Hook.append(
            "offset",
            /(\w+)=\w+\-\w+\/2.+?(\w+)=\w+\-\w+\/2;/,
            `Glotus.myPlayer.offset.setXY($1,$2);`
        );

        Hook.append(
            "renderEntity",
            /=(\w+)==(\w+)\|\|.+?(\w+)\.fill\(\)\)/,
            `;Glotus.hooks.renderEntity($3,$1,$2);`
        );

        Hook.append(
            "renderItemPush",
            /\((\w+)\.dir\),\w+\.drawImage.+?2\)/,
            `,Glotus.Renderer.objects.push($1)`
        );

        // Hook.append(
        //     "renderItemPush",
        //     /(\w+)\.blocker,\w+.+?2\)\)/,
        //     `,Glotus.Renderer.objects.push($1)`
        // );

        Hook.append(
            "renderItem",
            /70, 0.35\)",(\w+).+?\w+\)/,
            `,Glotus.hooks.renderObject($1)`
        );

        Hook.append(
            "RemoveSendAngle",
            /clientSendRate\)/,
            `&&false`
        );

        Hook.replace(
            "handleEquip",
            /\w+\.send\("13c",0,(\w+),(\w+)\)/,
            `Glotus.Controller.equip($2,$1,"ACTUAL")`
        );

        Hook.replace(
            "handleBuy",
            /\w+\.send\("13c",1,(\w+),(\w+)\)/,
            `Glotus.Controller.buy($2,$1)`
        );

        Hook.replace(
            "pingCaller",
            /,\w+\.send\("pp"\)/,
            ``
        );

        Hook.replace(
            "pingElem",
            /,\w+\.innerText="Ping.+?ms"/,
            ``
        );

        Hook.replace(
            "RenderGrid",
            /("#91b2db".+?)(for.+?NUM{18}.+?NUM{18}.+?\)\);)/,
            `$1if(Glotus.settings.renderGrid){$2}`
        )
        
        return Hook.code;
    }
    
}

export default Injector;