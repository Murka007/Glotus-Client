import { PlayerObject, Resource } from "../data/ObjectItem";
import Player from "../data/Player";
import { EDanger } from "../types/Enums";
import { EItem, ItemGroup } from "../types/Items";
import SpatialHashGrid from "../modules/SpatialHashGrid";
import PlayerClient from "../PlayerClient";
import Animal from "../data/Animal";
import { EHat } from "../types/Store";
import Animals from "../constants/Animals";

const enum ENearest {
    PLAYER,
    ANIMAL
}

type TTarget = Player | Animal | PlayerObject;

class EnemyManager {
    private readonly client: PlayerClient;

    private readonly enemiesGrid = new SpatialHashGrid<Player>(100);
    readonly enemies: Player[] = [];
    readonly trappedEnemies = new Set<Player>();
    private readonly dangerousEnemies: Player[] = [];
    private readonly _nearestEnemy: [Player | null, Animal | null] = [null, null];

    /** The closest enemy that can attack myPlayer using melee weapons */
    nearestMeleeReloaded: Player | null = null;

    /** The closest animal that can cause damage to myPlayer */
    nearestDangerAnimal: Animal | null = null;
    nearestTrap: PlayerObject | null = null;

    nearestCollideSpike: Player | null = null;
    nearestTurretEntity: TTarget | null = null;
    detectedEnemy = false;

    constructor(client: PlayerClient) {
        this.client = client;
    }

    private reset() {
        this.enemiesGrid.clear();
        this.enemies.length = 0;
        this.trappedEnemies.clear();
        this.dangerousEnemies.length = 0;
        this._nearestEnemy[ENearest.PLAYER] = null;
        this._nearestEnemy[ENearest.ANIMAL] = null;
        this.nearestMeleeReloaded = null;
        this.nearestDangerAnimal = null;
        this.nearestTrap = null;
        this.nearestCollideSpike = null;
        this.nearestTurretEntity = null;
        this.detectedEnemy = false;
    }

    get nearestEnemy() {
        return this._nearestEnemy[ENearest.PLAYER];
    }

    get nearestAnimal() {
        return this._nearestEnemy[ENearest.ANIMAL];
    }

    /** Returns true if first entity is closer than the second */
    private isNear(enemy: TTarget, nearest: TTarget | null) {
        if (nearest === null) return true;

        const { myPlayer } = this.client;
        const a0 = myPlayer.position.current;
        const distance1 = a0.distance(enemy.position.current);
        const distance2 = a0.distance(nearest.position.current);
        return distance1 < distance2;
    }

    /** Returns the most nearest entity to myPlayer */
    get nearestEntity() {
        const target1 = this.nearestEnemy;
        const target2 = this.nearestAnimal;
        if (target1 === null) return target2;

        return this.isNear(target1, target2) ? target1 : target2;
    }

    // get nearestDangerEntity() {
    //     const target1 = this.nearestEnemy;
    //     const target2 = this.nearestDangerAnimal;
    //     if (target1 === null || target1.hatID === EHat.EMP_HELMET) return target2;

    //     return this.isNear(target1, target2) ? target1 : target2;
    // }

    // get nearestObject() {
    //     const target1 = this.nearestTrap;
    //     const target2 = this.nearestSpike;
    //     if (target1 === null) return target2;

    //     return this.isNear(target1, target2) ? target1 : target2;
    // }

    /** Returns true if nearestEnemy is within the specified range */
    nearestEnemyInRangeOf(range: number, target?: Player | Animal | null) {
        const enemy = target || this.nearestEnemy;
        return (
            enemy !== null &&
            this.client.myPlayer.collidingEntity(enemy, range)
        )
    }

    private handleNearestDanger(enemy: Player) {
        const { myPlayer, ModuleHandler } = this.client;
        // const extraRange = enemy.danger === EDanger.SUPER_HIGH ? 750 : (enemy.usingBoost ? 400 : 100);
        const extraRange = enemy.usingBoost && !enemy.isTrapped ? 400 : 100;
        const range = enemy.getMaxWeaponRange() + myPlayer.hitScale + extraRange;
        if (myPlayer.collidingEntity(enemy, range)) {
            if (enemy.danger >= EDanger.HIGH) {
                ModuleHandler.needToHeal = true;
            }
            this.detectedEnemy = true;
        }
    }

    private handleDanger(enemy: Player) {
        if (enemy.dangerList.length >= 2) {
            enemy.dangerList.shift();
        }

        const danger = enemy.canPossiblyInstakill();
        enemy.dangerList.push(danger);
        enemy.danger = Math.max(...enemy.dangerList);

        if (enemy.danger !== EDanger.NONE) {
            this.dangerousEnemies.push(enemy);
            this.handleNearestDanger(enemy);
        }
    }

    /** Checks if the target is standing on a particular object */
    private checkCollision(target: Player, isOwner = false) {
        target.isTrapped = false;
        target.onPlatform = false;

        const { ObjectManager, PlayerManager } = this.client;
        const objects = ObjectManager.retrieveObjects(target.position.current, target.collisionScale);
        for (const object of objects) {
            if (object instanceof Resource) continue;
            if (!target.collidingObject(object, 5)) continue;

            const isEnemyObject = PlayerManager.isEnemyByID(object.ownerID, target);
            if (object.type === EItem.PIT_TRAP && isEnemyObject) {
                this.trappedEnemies.add(target);
                target.isTrapped = true;

                if (isOwner && this.isNear(target, this.nearestTrap)) {
                    this.nearestTrap = object;
                }
            } else if (object.type === EItem.PLATFORM) {
                target.onPlatform = true;
            } else if (object.itemGroup === ItemGroup.SPIKE && isEnemyObject) {
                if (!isOwner && this.isNear(target, this.nearestCollideSpike)) {
                    const pos1 = target.position.future; // current, future or both
                    const pos2 = object.position.current;
                    const distance = pos1.distance(pos2);
                    const range = object.collisionScale + target.collisionScale;
                    const willCollide = distance <= range;
                    if (willCollide) {
                        this.nearestCollideSpike = target;
                    }
                }
            }
        }
    }

    private handleNearest<T extends ENearest>(type: T, enemy: [Player, Animal][T]) {
        if (this.isNear(enemy, this._nearestEnemy[type])) {
            this._nearestEnemy[type] = enemy;

            if (enemy.canUseTurret && this.client.myPlayer.collidingEntity(enemy, 700)) {
                this.nearestTurretEntity = enemy;
            }
        }
    }

    private handleNearestMelee(enemy: Player) {
        const { myPlayer, ModuleHandler } = this.client;
        const range = enemy.getMaxWeaponRange() + myPlayer.hitScale + 60;
        const angle = ModuleHandler.getMoveAngle();

        if (!enemy.meleeReloaded()) return;
        if (!myPlayer.collidingEntity(enemy, range)) return;
        if (!myPlayer.runningAwayFrom(enemy, angle)) return;
        if (!this.isNear(enemy, this.nearestMeleeReloaded)) return;

        this.nearestMeleeReloaded = enemy;
    }

    private handleNearestDangerAnimal(animal: Animal) {
        const { myPlayer } = this.client;

        if (!animal.isDanger) return;
        if (!myPlayer.collidingEntity(animal, animal.collisionRange)) return;
        if (!this.isNear(animal, this.nearestDangerAnimal)) return;

        this.nearestDangerAnimal = animal;
    }

    handleEnemies(players: Player[], animals: Animal[]) {

        // It is important to reset data on each tick
        this.reset();

        const { myPlayer } = this.client;
        this.checkCollision(myPlayer, true);

        for (let i=0;i<players.length;i++) {
            const player = players[i];
            if (myPlayer.isEnemyByID(player.id)) {
                this.enemiesGrid.insert(player);
                this.enemies.push(player);

                this.checkCollision(player);
                this.handleDanger(player);
                this.handleNearest(ENearest.PLAYER, player);
                this.handleNearestMelee(player);
            }
        }

        for (let i=0;i<animals.length;i++) {
            const animal = animals[i];
            this.handleNearest(ENearest.ANIMAL, animal);
            this.handleNearestDangerAnimal(animal);
        }
    }
}

export default EnemyManager;