import Glotus from ".";

declare global {
    interface Window {
        Glotus: typeof Glotus;
        readonly vultr: {
            readonly scheme: "mm_prod" | "mm_exp" | "mm_beta";
        }

        readonly config: {
            nameY: number;
        }
    }
}