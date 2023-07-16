import Glotus from "..";
import Logger from "../utility/Logger";

type TRegex = RegExp | RegExp[] | string | string[];

/**
 * Regexer class, significantly simplifies the work with regular expressions
 */
class Regexer {

    /**
     * the code to which changes are applied
     */
    code: string;

    /**
     * The original code
     */
    private readonly COPY_CODE: string;

    /**
     * Total amount of hooks applied
     */
    hookCount = 0;
    private readonly ANY_LETTER = "(?:[^\\x00-\\x7F-]|\\$|\\w)";
    private readonly NumberSystem = [
        { radix: 2, prefix: "0b0*" },
        { radix: 8, prefix: "0+" },
        { radix: 10, prefix: "" },
        { radix: 16, prefix: "0x0*" },
    ] as const satisfies ReadonlyArray<{radix: number, prefix: string}>;

    constructor(code: string) {
        this.code = code;
        this.COPY_CODE = code;
    }

    private isRegExp(regex: RegExp | string): regex is RegExp {
        return regex instanceof RegExp;
    }

    /**
     * Converts a number to regular expression which represents this number in different number systems
     * 
     * @example
     * ```
     * 25 -> "(?:0b0*11001|0+31|25|0x0*19)"
     * ```
     */
    private generateNumberSystem(int: number) {
        const template = this.NumberSystem.map(({ radix, prefix }) => prefix + int.toString(radix));
        return `(?:${ template.join("|") })`;
    }

    /**
     * Replaces variables with regular expressions
     */
    private parseVariables(regex: string) {
        regex = regex.replace(/{VAR}/g, "(?:let|var|const)");
        regex = regex.replace(/{QUOTE}/g, "[\'\"\`]");
        regex = regex.replace(/NUM{(\d+)}/g, (...args) => {
            return this.generateNumberSystem(Number(args[1]));
        });
        regex = regex.replace(/\\w/g, this.ANY_LETTER);
        return regex;
    }

    /**
     * Formats regular expression
     */
    private format(name: string, inputRegex: TRegex, flags?: string): RegExp {

        let regex = "";
        if (Array.isArray(inputRegex)) {
            regex = inputRegex.map(exp => this.isRegExp(exp) ? exp.source : exp).join("\\s*");
        } else if (this.isRegExp(inputRegex)) {
            regex = inputRegex.source;
        }

        regex = this.parseVariables(regex);
        const expression = new RegExp(regex, flags);
        const match = this.code.match(expression);
        if (match === null) Logger.error("Failed to find: " + name);
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

    private insertAtIndex(index: number, str: string) {
        return this.code.slice(0, index) + str + this.code.slice(index, this.code.length);
    }

    private template(
        name: string,
        regex: TRegex,
        substr: string,
        getIndex: (match: RegExpMatchArray) => number
    ) {
        const expression = this.format(name, regex);
        const match = this.code.match(expression);
        if (match === null) return;

        const index = getIndex(match);
        this.code = this.insertAtIndex(index, substr.replace(/\$(\d+)/g, (...args) => {
            return match[args[1]];
        }));
    }

    append(name: string, regex: TRegex, substr: string) {
        this.template(name, regex, substr, (match) => (match.index || 0) + match[0].length);
    }

    prepend(name: string, regex: TRegex, substr: string) {
        this.template(name, regex, substr, (match) => match.index || 0);
    }

    insert(name: string, regex: TRegex, substr: string) {
        const expression = this.format(name, regex);
        if (!/{INSERT}/.test(expression.source)) {
            throw new Error("insert Error: Your regexp must contain {INSERT} keyword");
        }

        let source = expression.source;
        while (/\(.+?\)/.test(source)) {
            source = source.replace(/\((?!\?)(.+?)\)/g, "$1");
        }
        const formatted = new RegExp(source.replace(/{INSERT}/g, ""));
        const match = this.code.match(formatted)!;
        console.log(expression, match);
    }
}

export default Regexer;