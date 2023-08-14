import Config from "../constants/Config";
import { Weapons } from "../constants/Items";
import Animal from "../data/Animal";
import myPlayer, { ClientPlayer } from "../data/ClientPlayer";
import { PlayerObject, TObject } from "../data/ObjectItem";
import Player from "../data/Player";
import { EResourceType } from "../types/Enums";
import { TMelee, WeaponTypeString} from "../types/Items";
import { EHat } from "../types/Store";
import { getAngleDist } from "../utility/Common";
import DataHandler from "../utility/DataHandler";
import Sorting from "../utility/Sorting";
import ObjectManager from "./ObjectManager";
import ProjectileManager from "./ProjectileManager";

interface IPlayerData {
    readonly socketID?: string;
    readonly id: number;
    readonly nickname?: string;
    readonly skinID?: number;
}

const PlayerManager = new class PlayerManager {

    /**
     * A Map of all known players in the game
     */
    readonly playerData: Map<number, Player> = new Map;

    /**
     * An array of players, that are visible to my player
     */
    readonly players: Player[] = [];

    /**
     * A Map of all known animals in the game
     */
    readonly animalData: Map<number, Animal> = new Map;

    /**
     * An array of current animals, that are visible to my player
     */
    readonly animals: Animal[] = [];

    start = Date.now();

    /**
     * A time between current and previous `MOVE_UPDATE` packet
     */
    step = 0;

    createPlayer({ socketID, id, nickname, skinID }: IPlayerData) {
        const player = this.playerData.get(id) || new Player;
        if (!this.playerData.has(id)) {
            this.playerData.set(id, player);
        }

        player.socketID = socketID || "";
        player.id = id;
        player.nickname = nickname || "";
        player.skinID = skinID || -1;
        player.newlyCreated = true;
        player.usingBoost = false;
        return player;
    }

    attackPlayer(id: number, gathering: 0 | 1, weaponID: TMelee) {
        const player = this.playerData.get(id);
        if (player === undefined) return;
        const { position, hatID, reload } = player;

        // When player hits, we must reset his reload
        const weapon = Weapons[weaponID];
        const type = WeaponTypeString[weapon.itemType];
        reload[type].current = 0;
        reload[type].max = player.getWeaponSpeed(weaponID, hatID);

        if (gathering === 1) {
            const objects = ObjectManager.attackedObjects;
            for (const [id, object] of objects) {
                const pos = object.position.current;
                const distance = position.current.distance(pos) - object.scale;
                const angle = position.current.angle(pos);
                if (
                    distance <= weapon.range &&
                    getAngleDist(angle, player.angle) <= Config.gatherAngle
                ) {
                    objects.delete(id);
                    if (object instanceof PlayerObject) {
                        const damage = player.getBuildingDamage(weaponID);
                        object.health -= damage;
                    } else if (player === myPlayer) {
                        let amount = (hatID === EHat.MINERS_HELMET ? 1 : 0);
                        if (object.type === EResourceType.GOLD) {
                            amount += weapon.gather + 4;
                        }
                        myPlayer.updateWeaponXP(amount);
                    }
                }
            }
        }
    }

    updatePlayer(buffer: any[]) {
        this.players.length = 0;

        const now = Date.now();
        this.step = now - this.start;
        this.start = now;

        let myPlayerCopy: ClientPlayer | null = null;

        for (let i=0;i<buffer.length;i+=13) {
            const id = buffer[i];
            const player = this.playerData.get(id);
            if (!player) continue;

            if (myPlayerCopy === null && myPlayer.isMyPlayerByID(id)) {
                myPlayerCopy = player as ClientPlayer;
            }

            this.players.push(player);
            player.update(
                id,
                buffer[i + 1],
                buffer[i + 2],
                buffer[i + 3],
                buffer[i + 4],
                buffer[i + 5],
                buffer[i + 6],
                buffer[i + 7],
                buffer[i + 8],
                buffer[i + 9],
                buffer[i + 10],
                buffer[i + 11]
            )
        }

        // Call all other classes after updating player and animal positions
        ObjectManager.postTick();
        if (myPlayerCopy !== null) myPlayerCopy.tickUpdate();
        ProjectileManager.postTick();
    }

    updateAnimal(buffer: any[]) {
        this.animals.length = 0;

        for (let i=0;i<buffer.length;i+=7) {
            const id = buffer[i];
            if (!this.animalData.has(id)) {
                this.animalData.set(id, new Animal);
            }
            const animal = this.animalData.get(id)!;
            this.animals.push(animal);
            animal.update(
                id,
                buffer[i + 1],
                buffer[i + 2],
                buffer[i + 3],
                buffer[i + 4],
                buffer[i + 5],
                buffer[i + 6],
            )
        }
    }

    /**
     * Checks if players are enemies by their clan names.
     */
    isEnemy(target1: Player, target2: Player) {
        return (
            target1 !== target2 && (
            target1.clanName === null ||
            target2.clanName === null ||
            target1.clanName !== target2.clanName)
        )
    }

    isEnemyByID(ownerID: number, target: Player) {
        const player = this.playerData.get(ownerID)!;

        if (player instanceof ClientPlayer) {
            return !player.teammates.has(target.id);
        }

        if (target instanceof ClientPlayer) {
            return !target.teammates.has(player.id);
        }
        
        return this.isEnemy(player, target);
    }

    /**
     * true, if the projectile won't pass through entity
     */
    canShoot(ownerID: number, target: Player | Animal) {
        return target instanceof Animal || this.isEnemyByID(ownerID, target);
    }

    /**
     * Returns current players and animals visible to my player
     */
    getEntities(): (Player | Animal)[] {
        return [...this.players, ...this.animals];
    }

    getEnemies(owner: Player): Player[] {
        return this.players.filter(player => this.isEnemy(owner, player));
    }

    getNearestEnemy(owner: Player): Player | null {
        const enemies = this.getEnemies(owner);
        return enemies.sort(Sorting.byDistance(owner, "future", "future"))[0] || null;
    }

    getDangerousEnemies(owner: Player): Player[] {
        const enemies = this.getEnemies(owner);
        return enemies.sort(Sorting.byDanger);
    }

    // getPossibleShootEntity(): Player | Animal | null {
    //     const projectile = myPlayer.getProjectile(myPlayer.position.future, myPlayer.weapon.secondary!);
    //     if (projectile === null) return null;

    //     return this.getEntities().filter(entity => {
    //         const { initial, current } = projectile.position;
    //         current.setVec(initial);

    //         const angleTowardsEntity = myPlayer.position.future.angle(entity.position.future);
    //         const vec = current.direction(angleTowardsEntity, 70);
    //         current.setVec(vec);

    //         const notTarget = entity !== myPlayer;
    //         const canShoot = this.canShoot(myPlayer.id, entity);
    //         const canHit = ProjectileManager.projectileCanHitEntity(projectile, entity);
    //         return notTarget && canShoot && canHit;
    //     }).sort(Sorting.byDistance(myPlayer, "current", "current"))[0] || null;
    // }
}

export default PlayerManager;