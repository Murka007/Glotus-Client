const Hooker = new class Hooker {
    createRecursiveHook(
        target: any,
        prop: string | number,
        condition: (that: any, value: any) => boolean,
        callback: (that: any, value: any) => boolean
    ) {
        (function recursiveHook() {
            Object.defineProperty(target, prop, {
                set(value) {
                    delete target[prop];
                    this[prop] = value;
                    if (
                        condition(this, value) &&
                        callback(this, value)
                    ) return;
                    recursiveHook();
                },
                configurable: true
            })
        })();
    }

    createHook(
        target: any,
        prop: string | number,
        callback: (that: any, value: any, symbol: any) => void
    ) {
        const symbol = Symbol(prop);
        Object.defineProperty(target, prop, {
            get() {
                return this[symbol];
            },
            set(value) {
                callback(this, value, symbol);
            },
            configurable: true
        })
    }
}

export default Hooker;