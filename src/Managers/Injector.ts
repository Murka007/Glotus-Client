import RegexManager from "./RegexManager";

class Injector {

    // Intercept creation of <script src="bundle.js"></script>
    static init() {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (
                        node instanceof HTMLScriptElement &&
                        node.parentElement instanceof HTMLBodyElement &&
                        /bundle/.test(node.src)
                    ) {
                        observer.disconnect();
                        Injector.loadScript(node);
                        
                        // Firefox support
                        const scriptExecuteHandler = (event: Event) => {
                            event.preventDefault();
                            node.removeEventListener("beforescriptexecute", scriptExecuteHandler);
                        }
                        node.addEventListener("beforescriptexecute", scriptExecuteHandler);
        
                        node.parentElement.removeChild(node);
                    }
                }
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }

    private static loadScript(script: HTMLScriptElement) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", script.src, false);
        xhr.send();
        
        const code = Injector.formatCode(xhr.responseText);
        Function(code)();
    }

    // Modify bundle using regular expressions
    private static formatCode(code: string) {
        const Hook = new RegexManager(code);

        Hook.append(
            "Packer",
            /(\w+)=new \w+,(\w+)=new \w+;/,
            // "Glotus.WebSocketManager.encode=$2.encode.bind(o);Glotus.WebSocketManager.decode=$3.decode.bind(a);console.log(Glotus);"
            `console.log("encoder", $1);`
        );

        Hook.prepend(
            "storeBuy",
            /\w+\.storeBuy=(\w+)/,
            `console.log("storeBuy", $1),`
        )
        return Hook.code;
    }
    
}

export default Injector;