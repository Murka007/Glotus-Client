import Player from "../data/Player";
import Vector from "../modules/Vector";

type TPosType = "previous" | "current" | "future";
interface TEntityLike {
    position: {
        [key: string]: Vector;
    }
}

type ExtractKeys<T extends TEntityLike, C = keyof T["position"]> = C extends TPosType ? C : never;

class Sorting {

    /**
     * Sorts entities in comparison to the target, from the nearest to the farthest
     */
    static byDistance<T extends TEntityLike, A extends TEntityLike>(
        target: T,
        typeA: ExtractKeys<T>,
        typeB: ExtractKeys<A>
    ) {
        return (a: A, b: A) => {
            const dist1 = target.position[typeA].distance(a.position[typeB]);
            const dist2 = target.position[typeA].distance(b.position[typeB]);
            return dist1 - dist2;
        }
    }

    static byDanger(a: Player, b: Player) {
        return b.danger - a.danger;
    }
}

export default Sorting;