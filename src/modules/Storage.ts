/**
 * Used to get, set and delete values from localStorage
 */
class Storage {
    static get<T>(key: string): T | null {
        const value = localStorage.getItem(key);
        return value === null ? null : JSON.parse(value);
    }

    static set(key: string, value: unknown) {
        const data = JSON.stringify(value);
        localStorage.setItem(key, data);
    }

    static delete(key: string) {
        const has = localStorage.hasOwnProperty(key) && key in localStorage;
        localStorage.removeItem(key);
        return has;
    }
}

export default Storage;