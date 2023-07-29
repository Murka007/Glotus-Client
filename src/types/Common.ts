import Animal from "../data/Animal";
import { TObject } from "../data/ObjectItem";
import Player from "../data/Player";

export type ValueOf<T> = T[keyof T];
export type GetValues<T, K extends keyof T> = T[K];
export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export type KeysOfType<T,V> = keyof { [ P in keyof T as T[P] extends V ? P : never ] : P };
export type ReplaceWithType<T,R> = { [K in keyof T]: R };
export type Required<T> = {
    [P in keyof T]-?: T[P]
}
export type ParentMethodParams<T> = T extends (...args: infer P) => any ? P : never;

export type TCTX = CanvasRenderingContext2D;
export type TTarget = Player | Animal | TObject;

export interface IReload {
    current: number;
    max: number;
}

export type TReload = "primary" | "secondary" | "turret";

export const enum ESentAngle {
    NONE,
    LOW,
    MEDIUM,
    HIGH,
}