
/**
 * Represents Player danger
 * 
 * `NONE` - peaceful to the player, cannot do any insant damage
 * 
 * `MEDIUM` - dangerous, but if you equip a soldier, you will be fine
 * 
 * `HIGH` - Extremely dangerous, the soldier is not enough to protect you. You must heal
 * 
 * `SUPER_HIGH` - Dramatically dangerous, healing must be consistent
 */
export const enum EDanger {
    NONE,
    LOW,
    MEDIUM,
    HIGH,
    SUPER_HIGH,
}

export const enum ESentAngle {
    NONE,
    LOW,
    MEDIUM,
    HIGH,
}

/** Represents types of resources: `BUSH` `CACTUS` `TREE` `STONE` `GOLD` */
export const enum EResourceType {
    WOOD,
    FOOD,
    STONE,
    GOLD,
}

/** Represents attacking state
 * 
 * `DISABLED` - attacking is currently off
 * 
 * `ATTACK` - attacking using LMB, bullspam
 * 
 * `DESTROY` - attacking using RMB, tankspam
 */
export const enum EAttack {
    DISABLED,
    ATTACK,
    DESTROY,
}