import Animal from "../data/Animal";
import { TObject } from "../data/ObjectItem";
import Player from "../data/Player";
import { ESentAngle } from "./Enums";

export type ValueOf<T> = T[keyof T];
export type KeysOfType<T,V> = keyof { [ P in keyof T as T[P] extends V ? P : never ] : P };
export type TCTX = CanvasRenderingContext2D;
export type TTarget = Player | Animal | TObject;

export interface IReload {
    current: number;
    max: number;
}

export type TReload = "primary" | "secondary" | "turret";
export type TResource = "food" | "wood" | "stone" | "gold" | "kills";

export interface IAngle {

    /** Current target angle */
    readonly angle: number;

    /** The angle offset that leads to creation of angleStart and angleEnd */
    readonly offset: number;
}

export interface IPlaceOptions {
    readonly angle?: number;
    readonly priority?: ESentAngle;
    readonly last: boolean;
}