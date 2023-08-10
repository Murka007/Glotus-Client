import Animal from "../data/Animal";
import { TObject } from "../data/ObjectItem";
import Player from "../data/Player";

export type ValueOf<T> = T[keyof T];
export type KeysOfType<T,V> = keyof { [ P in keyof T as T[P] extends V ? P : never ] : P };
export type TCTX = CanvasRenderingContext2D;
export type TTarget = Player | Animal | TObject;

export interface IReload {
    current: number;
    max: number;
}

export type TReload = "primary" | "secondary" | "turret";