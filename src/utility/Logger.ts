class Logger {
    static readonly log = console.log;
    static readonly error = console.error;
    private static readonly timers: Map<string, number> = new Map;
    
    static start(label: string) {
        this.timers.set(label, performance.now());
    }

    static end(label: string, ...args: any[]) {
        if (this.timers.has(label)) {
            this.log(`${label}: ${performance.now() - this.timers.get(label)!}`, ...args);
        }
        this.timers.delete(label);
    }
}

export default Logger;