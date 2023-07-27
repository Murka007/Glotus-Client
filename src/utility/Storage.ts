import settings from "./Settings";

/**
 * Used to get, set and delete values from localStorage
 */
class Storage {
    static get<T>(key: string): T | null {
        const value = localStorage.getItem(key);
        return value === null ? null : JSON.parse(value);
    }

    static set(key: string, value: unknown, stringify = true) {
        const data = stringify ? JSON.stringify(value) : value;
        localStorage.setItem(key, data as string);
    }

    static delete(key: string) {
        const has = localStorage.hasOwnProperty(key) && key in localStorage;
        localStorage.removeItem(key);
        return has;
    }
}

export default Storage;

// document.cookie = "myCookieName=myCookieValue;domain=.moomoo.io;path=/";
interface IOptions {
    readonly path?: string;
    expires?: Date | string;
    readonly domain?: string;
}

export class Cookie {
    static get<T>(key: string): T | null {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
            const match = cookie.trim().match(/^(.+?)=(.+?)$/);
            if (match !== null && match[1] === key) {
                try {
                    return JSON.parse(decodeURIComponent(match[2]));
                } catch(err){}
            }
        }
        return null;
    }

    static set(key: string, value: string, options: IOptions = {}) {
        options = {
            path: "/",
            ...options
        }

        if (options.expires instanceof Date) {
            options.expires = options.expires.toUTCString();
        }
        
        let cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        for (const [key, value] of Object.entries(options)) {
            cookie += `; ${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
        
        document.cookie = cookie;
    }
}