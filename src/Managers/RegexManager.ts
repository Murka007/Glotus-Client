import Glotus from "..";

const ANY_LETTER = "(?:[^\\x00-\\x7F-]|\\$|\\w)";

interface ISystem {
    readonly radix: number;
    readonly prefix: string;
}

const NumberSystem: ReadonlyArray<ISystem> = [
    { radix: 2, prefix: "0b0*" },
    { radix: 8, prefix: "0+" },
    { radix: 10, prefix: "" },
    { radix: 16, prefix: "0x0*" },
]

type TRegex = RegExp | RegExp[] | string | string[];
class RegexManager {
    code: string;
    readonly COPY_CODE: string;
    hookCount: number

    constructor(code: string) {
        this.code = code;
        this.COPY_CODE = code;
        this.hookCount = 0;
    }

    private isRegExp(regex: RegExp | string): regex is RegExp {
        return regex instanceof RegExp;
    }

    private generateNumberSystem(int: number) {
        const template = NumberSystem.map(({ radix, prefix }) => prefix + int.toString(radix));
        return `(?:${ template.join("|") })`;
    }

    private parseVariables(regex: string) {
        regex = regex.replace(/\{VAR\}/g, "(?:let|var|const)");
        regex = regex.replace(/\{QUOTE\}/g, "[\'\"\`]");
        regex = regex.replace(/NUM\{(\d+)\}/g, (...args) => {
            return this.generateNumberSystem(Number(args[1]));
        });
        regex = regex.replace(/\\w/g, ANY_LETTER);
        return regex;
    }

    private format(name: string, inputRegex: TRegex, flags?: string): RegExp {

        let regex: string = "";
        if (Array.isArray(inputRegex)) {
            regex = inputRegex.map(exp => this.isRegExp(exp) ? exp.source : exp).join("\\s*");
        } else if (this.isRegExp(inputRegex)) {
            regex = inputRegex.source;
        }

        regex = this.parseVariables(regex);
        const expression = new RegExp(regex, flags);
        const match = this.code.match(expression);
        if (match === null) Glotus.error("Failed to find: " + name);
        this.hookCount++;
        return expression;
    }

    match(name: string, regex: TRegex, flags?: string) {
        const expression = this.format(name, regex, flags);
        return this.code.match(expression) || [];
    }

    replace(name: string, regex: TRegex, substr: string, flags?: string) {
        const expression = this.format(name, regex, flags);
        this.code = this.code.replace(expression, substr);
    }

    private insert(index: number, str: string) {
        return this.code.slice(0, index) + str + this.code.slice(index, this.code.length);
    }

    append(name: string, regex: TRegex, substr: string) {
        const expression = this.format(name, regex);
        const match = this.code.match(expression);
        if (match === null) return;

        const appendIndex = (match.index || 0) + match[0].length;
        this.code = this.insert(appendIndex, substr.replace(/\$(\d+)/g, (...args) => {
            return match[args[1]];
        }));
    }

    prepend(name: string, regex: TRegex, substr: string) {
        const expression = this.format(name, regex);
        const match = this.code.match(expression);
        if (match === null) return;

        const appendIndex = match.index || 0;
        this.code = this.insert(appendIndex, substr.replace(/\$(\d+)/g, (...args) => {
            return match[args[1]];
        }));
    }
}

export default RegexManager;