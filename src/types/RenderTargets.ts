export interface IRenderEntity {
    sid: number;
    x: number;
    y: number;
    scale: number;
    health: number;
    maxHealth: number;
    isPlayer?: boolean;
    isAI?: boolean;
    index?: number;
    team?: number;
}

export interface IRenderObject {
    id: number;
    sid: number;
    x: number;
    y: number;
    dir: number;
    xWiggle: number;
    yWiggle: number;
    turnSpeed: number | undefined;
    owner?: {
        sid: number;
    }
}