import Glotus from ".";
import { TAccessory, THat, TStoreType } from "./types/Store";

declare global {
    interface Window {
        Glotus: typeof Glotus;
        readonly vultr: {
            readonly scheme: "mm_prod" | "mm_exp" | "mm_beta";
        }

        readonly config: {
            nameY: number;
            storeEquip: (id: THat | TAccessory, index: TStoreType) => void;
        }
    }
}