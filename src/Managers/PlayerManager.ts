import Glotus from "..";
import Animals from "../constants/Animals";
import Config from "../constants/Config";
import { Weapons } from "../constants/Items";
import { Hats } from "../constants/Store";
import Animal from "../data/Animal";
import myPlayer, { ClientPlayer } from "../data/ClientPlayer";
import { PlayerObject, TObject } from "../data/ObjectItem";
import Player from "../data/Player";
import Projectile from "../data/Projectile";
import Controller from "../modules/Controller";
import Vector from "../modules/Vector";
import { TTarget } from "../types/Common";
import { TMelee, TWeapon } from "../types/Items";
import { EHat, EStoreType } from "../types/Store";
import { getAngleDist, lineIntersectsRect } from "../utility/Common";
import DataHandler from "../utility/DataHandler";
import Logger from "../utility/Logger";
import Sorting from "../utility/Sorting";
import ObjectManager from "./ObjectManager";
import ProjectileManager from "./ProjectileManager";
import SocketManager from "./SocketManager";

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
        return player;
    }

    attackPlayer(id: number, gathering: 0 | 1, weaponID: TMelee) {
        const player = this.playerData.get(id);
        if (player === undefined) return;
        const { position, hatID, reload } = player;

        // When player hits, we must reset his reload
        const type = DataHandler.isPrimary(weaponID) ? "primary" : "secondary";
        reload[type].current = 0;
        reload[type].max = player.getWeaponSpeed(weaponID, hatID);

        if (gathering === 1) {
            const weapon = Weapons[weaponID];
            for (const [id, object] of ObjectManager.attackedObjects) {
                if (!(object instanceof PlayerObject && object.isDestroyable())) continue;

                const pos = object.position.current;
                const distance = position.current.distance(pos) - object.scale;
                const angle = position.current.angle(pos);
                if (
                    distance <= weapon.range &&
                    getAngleDist(angle, player.angle) <= Config.gatherAngle
                ) {
                    ObjectManager.attackedObjects.delete(id);
                    const damage = player.getBuildingDamage(weaponID);
                    object.health -= damage;
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
            );
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

    /**
     * Returns nearest hostile entity to a specified player
     */
    // getNearestEntity(target: Player): Player | Animal | null {
    //     const entities = this.getEntities();
    //     return entities.filter(a => {
    //         const notTarget = a !== target;
    //         const isEnemy = a instanceof Player && this.isEnemy(target, a);
    //         const isHostile = a instanceof Animal && Animals[a.type].hostile;
    //         return notTarget && (isEnemy || isHostile);
    //     }).sort((a, b) => {
    //         const dist1 = target.position.future.distance(a.position.future);
    //         const dist2 = target.position.future.distance(b.position.future);
    //         return dist1 - dist2;
    //     })[0] || null;
    // }

    getEnemies(owner: Player): Player[] {
        return this.players.filter(player => this.isEnemy(owner, player));
    }

    getNearestEnemy(owner: Player): Player | null {
        const enemies = this.getEnemies(owner);
        return enemies.sort(Sorting.byDistance(owner, "future", "future"))[0] || null;
    }

    getInstakillEnemies(owner: Player): Player | null {
        const enemies = this.getEnemies(owner);
        return enemies.filter(enemy => enemy.canInstakill())
            .sort(Sorting.byDistance(owner, "future", "future"))[0] || null;
    }

    getPossibleShootEntity(): Player | Animal | null {
        const projectile = myPlayer.getProjectile(myPlayer.position.future, myPlayer.weapon.secondary);
        if (projectile === null) return null;

        return this.getEntities().filter(entity => {
            const { initial, current } = projectile.position;
            current.setVec(initial);

            const angleTowardsEntity = myPlayer.position.future.angle(entity.position.future);
            const vec = current.direction(angleTowardsEntity, 70);
            current.setVec(vec);

            const notTarget = entity !== myPlayer;
            const canShoot = this.canShoot(myPlayer.id, entity);
            const canHit = ProjectileManager.projectileCanHitEntity(projectile, entity);
            return notTarget && canShoot && canHit;
        }).sort(Sorting.byDistance(myPlayer, "current", "current"))[0] || null;
    }
}

export default PlayerManager;