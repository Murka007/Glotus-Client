import { ItemType } from "../types/Items";
import { removeFast } from "../utility/Common";

type TAction = (isLast: boolean) => void;

/** Used to optimize placement and healing packets */
class ActionPlanner {
    private readonly actionKeys: ItemType[] = [];
    private readonly actionValues: TAction[] = [];

    createAction(key: ItemType, value: TAction) {
        this.actionKeys.push(key);
        this.actionValues.push(value);
    }

    createActions(key: ItemType, value: TAction, amount: number) {
        if (amount === 1) {
            return this.createAction(key, value);
        }

        for (let i=0;i<amount;i++) {
            this.createAction(key, value);
        }
    }

    /** Returns all planned actions in such order, so it will take less packets to send */
    getActions() {
        const keys = [...this.actionKeys];
        const values = [...this.actionValues];
        const uniqueItems = [...new Set(keys)];
        const output: [ItemType, TAction][] = [];

        while (keys.length > 0) {
            for (const item of uniqueItems) {
                const index = keys.indexOf(item);
                if (index >= 0) {
                    output.push([item, values[index]]);
                    removeFast(keys, index);
                    removeFast(values, index);
                }
            }
        }

        this.actionKeys.length = 0;
        this.actionValues.length = 0;

        return output;
    }
}

export default ActionPlanner;