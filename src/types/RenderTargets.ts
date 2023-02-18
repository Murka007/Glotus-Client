export interface IRenderEntity {
    sid: number;
    x: number;
    y: number;
    scale: number;
    health: number;
    maxHealth: number;
    isPlayer?: boolean;
    isAI?: boolean;
}

export interface IRenderObject {
    sid: number;
    x: number;
    y: number;
    xWiggle: number;
    yWiggle: number;
    owner?: {
        sid: number;
    }
}