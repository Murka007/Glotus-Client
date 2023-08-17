import Config from "../constants/Config";
import Vector from "../modules/Vector";

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

// export const lineInRect = (lineStart: Vector, lineEnd: Vector, rectStart: Vector, rectEnd: Vector) => {
//     const { x: x1, y: y1 } = lineStart;
//     const { x: x2, y: y2 } = lineEnd;
//     const { x: recX, y: recY } = rectStart;
//     const { x: recX2, y: recY2 } = rectEnd;

//     let minX = x1;
//     let maxX = x2;
//     if (x1 > x2) {
//         minX = x2;
//         maxX = x1;
//     }
//     if (maxX > recX2) maxX = recX2;
//     if (minX < recX) minX = recX;
//     if (minX > maxX) return false;

//     let minY = y1;
//     let maxY = y2;
//     const dx = x2 - x1;
//     if (Math.abs(dx) > 0.0000001) {
//         const a = (y2 - y1) / dx;
//         const b = y1 - a * x1;
//         minY = a * minX + b;
//         maxY = a * maxX + b;
//     }
//     if (minY > maxY) {
//         const tmp = maxY;
//         maxY = minY;
//         minY = tmp;
//     }
//     if (maxY > recY2) maxY = recY2;
//     if (minY < recY) minY = recY;
//     if (minY > maxY) return false;
//     return true;
// }

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

export const pointInRiver = (position: Vector) => {
    const y = position.y;
    const below = y >= (Config.mapScale / 2 - Config.riverWidth / 2);
    const above = y <= (Config.mapScale / 2 + Config.riverWidth / 2);
    return below && above;
}

export const pointInDesert = (position: Vector) => {
    return position.y >= (Config.mapScale - Config.snowBiomeTop);
}

export const inRange = (value: number, min: number, max: number) => {
    return value >= min && value <= max;
}