import Glotus from "./src";

declare module "*.html" {
    const content: string;
    export default content;
}

declare module "*.scss" {
    const content: string;
    export default content;
}

declare global {
    interface Window {
        Glotus: typeof Glotus;
    }
}