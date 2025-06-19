import { myClient } from "..";
import Config from "../constants/Config";
import Vector from "../modules/Vector";
import ZoomHandler from "../modules/ZoomHandler";
import { IAngle } from "../types/Common";

export const getAngle = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.atan2(y2 - y1, x2 - x1);
}

export const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.hypot(x1 - x2, y1 - y2);
}

export const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
}

export const fixTo = (value: number, fraction: number) => {
    return parseFloat(value.toFixed(fraction))
}

export const getAngleDist = (a: number, b: number) => {
    const p = Math.abs(b - a) % (Math.PI * 2);
    return (p > Math.PI ? (Math.PI * 2) - p : p);
}

export const toRadians = (degrees: number) => {
    return degrees * (Math.PI / 180);
}

export const removeFast = (array: unknown[], index: number) => {
    if (index < 0 || index >= array.length) throw new RangeError("removeFast: Index out of range");
    
    if (index === array.length - 1) {
        array.pop();
    } else {
        array[index] = array.pop();
    }
}

export const map = (value: number, start1: number, stop1: number, start2: number, stop2: number) => {
    return (value - start1) / (stop1 - start1) * (stop2 - start2) + start2;
}

export const lerp = (start: number, end: number, factor: number) => {
    return (1 - factor) * start + factor * end;
}

let uniqueID = 0;
export const getUniqueID = () => {
    return uniqueID++;
}

export const pointInsideRect = (
    point: Vector,
    rectStart: Vector,
    rectEnd: Vector
): boolean => {
    return (
        point.x >= rectStart.x &&
        point.x <= rectEnd.x &&
        point.y >= rectStart.y &&
        point.y <= rectEnd.y
    )
}

export const circleInsideSquare = (
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number
) => {
    return (
        x1 + r1 >= x2 &&
        x1 - r1 <= x2 + r2 &&
        y1 + r1 >= y2 &&
        y1 - r1 <= y2 + r2
    )
}

export const lineIntersectsLine = (
    start1: Vector,
    end1: Vector,
    start2: Vector,
    end2: Vector
): boolean => {
    const line1 = end1.copy().sub(start1);
    const line2 = end2.copy().sub(start2);
  
    const diff = start1.copy().sub(start2);
    const a = (-line2.x * line1.y + line1.x * line2.y);
    const s = (-line1.y * diff.x + line1.x * diff.y) / a;
    const t = ( line2.x * diff.y - line2.y * diff.x) / a;
    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

export const lineIntersectsRect = (
    lineStart: Vector,
    lineEnd: Vector,
    rectStart: Vector,
    rectEnd: Vector
): boolean => {
    return (
        pointInsideRect(lineStart, rectStart, rectEnd) ||
        pointInsideRect(lineEnd, rectStart, rectEnd) ||
        lineIntersectsLine(lineStart, lineEnd, rectStart, new Vector(rectEnd.x, rectStart.y)) ||
        lineIntersectsLine(lineStart, lineEnd, new Vector(rectEnd.x, rectStart.y), rectEnd) ||
        lineIntersectsLine(lineStart, lineEnd, rectEnd, new Vector(rectStart.x, rectEnd.y)) ||
        lineIntersectsLine(lineStart, lineEnd, new Vector(rectStart.x, rectEnd.y), rectStart)
    )
}

export const sleep = (ms: number): Promise<void> => {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if active DOM element is an input
 */
export const isActiveInput = () => {
    const active = document.activeElement || document.body;
    return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
}

export const getAngleFromBitmask = (bitmask: number, rotate: boolean): number | null => {
    const vec = { x: 0, y: 0 };
    if (bitmask & 0b0001) vec.y--;
    if (bitmask & 0b0010) vec.y++;
    if (bitmask & 0b0100) vec.x--;
    if (bitmask & 0b1000) vec.x++;
    if (rotate) {
        vec.x *= -1;
        vec.y *= -1;
    }
    return vec.x === 0 && vec.y === 0 ? null : Math.atan2(vec.y, vec.x);
}

export const formatCode = (code: string): string => {
    code = code + "";
    if (code === "Backspace") return code;
    if (code === "Escape") return "ESC";
    if (code === "Delete") return "DEL";
    if (code === "Minus") return "-";
    if (code === "Equal") return "=";
    if (code === "BracketLeft") return "[";
    if (code === "BracketRight") return "]";
    if (code === "Slash") return "/";
    if (code === "Backslash") return "\\";
    if (code === "Quote") return "'";
    if (code === "Backquote") return "`";
    if (code === "Semicolon") return ";";
    if (code === "Comma") return ",";
    if (code === "Period") return ".";
    if (code === "CapsLock") return "CAPS";
    if (code === "ContextMenu") return "CTXMENU";
    if (code === "NumLock") return "LOCK";
    return code.replace(/^Page/, "PG")
               .replace(/^Digit/, "")
               .replace(/^Key/, "")
               .replace(/^(Shift|Control|Alt)(L|R).*$/, "$2$1")
               .replace(/Control/, "CTRL")
               .replace(/^Arrow/, "")
               .replace(/^Numpad/, "NUM")
               .replace(/Decimal/, "DEC")
               .replace(/Subtract/, "SUB")
               .replace(/Divide/, "DIV")
               .replace(/Multiply/, "MULT").toUpperCase();
}

export const formatButton = (button: number) => {
    if (button === 0) return "LBTN"; // Left Button
    if (button === 1) return "MBTN"; // Middle Button
    if (button === 2) return "RBTN"; // Right Button
    if (button === 3) return "BBTN"; // Back Button
    if (button === 4) return "FBTN"; // Forward Button
    throw new Error(`formatButton Error: "${button}" is not valid button`);
}

export const removeClass = (target: HTMLElement | NodeListOf<HTMLElement>, name: string) => {
    if (target instanceof HTMLElement) {
        target.classList.remove(name);
        return;
    }

    for (const element of target) {
        element.classList.remove(name);
    }
}

export const pointInWinter = (position: Vector) => {
    const y = position.y;
    return y <= Config.snowBiomeTop;
}

export const pointInRiver = (position: Vector) => {
    const y = position.y;
    const below = y >= (Config.mapScale / 2 - Config.riverWidth / 2);
    const above = y <= (Config.mapScale / 2 + Config.riverWidth / 2);
    return below && above;
}

export const pointInDesert = (position: Vector) => {
    return position.y >= (Config.mapScale - Config.snowBiomeTop);
}

export const inView = (x: number, y: number, radius: number) => {
    const maxScreenWidth = Math.min(1920, ZoomHandler.scale.current.w);
    const maxScreenHeight = Math.min(1080, ZoomHandler.scale.current.h);
    const visibleHorizontally = x + radius > 0 && x - radius < maxScreenWidth;
    const visibleVertically = y + radius > 0 && y - radius < maxScreenHeight;
    // return true;
    return visibleHorizontally && visibleVertically;
}

export const inRange = (value: number, min: number, max: number) => {
    return value >= min && value <= max;
}

export const findPlacementAngles = (angles: IAngle[]) => {
    // const output: number[] = [];
    const output = new Set<number>();

    for (let i = 0; i < angles.length; i++) {
        const { angle, offset } = angles[i];
        const start = angle - offset;
        const end = angle + offset;

        let startIntersects = false;
        let endIntersects = false;

        for (let j = 0; j < angles.length; j++) {
            if (startIntersects && endIntersects) break;

            if (i !== j) {
                const { angle, offset } = angles[j];
                if (getAngleDist(start, angle) <= offset) startIntersects = true;
                if (getAngleDist(end, angle) <= offset) endIntersects = true;
            }
        }
  
        if (!startIntersects) output.add(start);
        if (!endIntersects) output.add(end);
    }
  
    return output;
}

export const getAngleOffset = (a: Vector, b: Vector, scale: number): IAngle => {
    const distance = a.distance(b);
    const angle = a.angle(b);
    const offset = Math.asin((2 * scale) / (2 * distance));
    return { angle, offset };
}

export const cursorPosition = () => {
    const { ModuleHandler, myPlayer } = myClient;
    const { w, h } = ZoomHandler.scale.current;
    const scale = Math.max(innerWidth / w, innerHeight / h);
    const cursorX = (ModuleHandler.mouse.lockX - innerWidth / 2) / scale;
    const cursorY = (ModuleHandler.mouse.lockY - innerHeight / 2) / scale;
    const pos = myPlayer.position.current;
    return new Vector(pos.x + cursorX, pos.y + cursorY);
}