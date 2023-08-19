
/**
 * Used to get, set and delete values from localStorage
 */
export default class Storage {
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

    static set(name: string, value: string, days: number) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "; expires=" + date.toUTCString();
        const domain = "; domain=.moomoo.io";
        const path = "; path=/";
      
        const cookieString = `${name}=${encodeURIComponent(value)}${expires}${domain}${path}`;
        document.cookie = cookieString;
    }
}