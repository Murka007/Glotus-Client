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
import ObjectManager from "./ObjectManager";
import ProjectileManager from "./ProjectileManager";
import SocketManager from "./SocketManager";

interface IPlayerData {
    readonly id: number;
    readonly nickname: string;
    readonly skinID: number;
}

const PlayerManager = new class PlayerManager {

    /**
     * A Map of all known players in the game
     */
    readonly players: Map<number, Player> = new Map;

    /**
     * An array of current players, that are visible to my player
     */
    readonly visiblePlayers: Player[] = [];

    /**
     * A Map of all known animals in the game
     */
    readonly animals: Map<number, Animal> = new Map;

    /**
     * An array of current animals, that are visible to my player
     */
    readonly visibleAnimals: Animal[] = [];

    start = Date.now();

    /**
     * A time between current and previous `MOVE_UPDATE` packet
     */
    step = 0;

    createPlayer({ id, nickname, skinID }: IPlayerData) {
        const player = this.players.get(id) || new Player;
        if (!this.players.has(id)) {
            this.players.set(id, player);
        }
        player.id = id;
        player.nickname = nickname;
        player.skinID = skinID;
        return player;
    }

    attackPlayer(id: number, gathering: 0 | 1, weaponID: TMelee) {
        const player = this.players.get(id);
        if (player === undefined) return;
        const { position, hatID, reload } = player;

        const reloadSpeed = hatID === EHat.SAMURAI_ARMOR ? Hats[hatID].atkSpd : 1;
        const type = DataHandler.isPrimary(weaponID) ? "primary" : "secondary";
        
        reload[type].current = 0;
        reload[type].max = Weapons[weaponID].speed * reloadSpeed;

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
                    const damage = player.getWeaponDamage(weaponID);
                    object.health -= damage;
                }
            }
        }
    }

    updatePlayer(buffer: any[]) {
        this.visiblePlayers.length = 0;

        const now = Date.now();
        this.step = now - this.start;
        this.start = now;

        let myPlayerCopy: ClientPlayer | null = null;

        for (let i=0;i<buffer.length;i+=13) {
            const player = this.players.get(buffer[i]);
            if (!player) continue;

            const id = buffer[i];
            if (myPlayerCopy === null && myPlayer.isMyPlayerByID(id)) {
                myPlayerCopy = player as ClientPlayer;
            }

            this.visiblePlayers.push(player);
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
        this.visibleAnimals.length = 0;

        for (let i=0;i<buffer.length;i+=7) {
            const id = buffer[i];
            if (!this.animals.has(id)) {
                this.animals.set(id, new Animal);
            }
            const animal = this.animals.get(id)!;
            this.visibleAnimals.push(animal);
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
        const player = this.players.get(ownerID)!;

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
        return target instanceof Animal || target instanceof Player && this.isEnemyByID(ownerID, target);
    }

    /**
     * Returns current players and animals visible to my player
     */
    getEntities(): (Player | Animal)[] {
        return [...this.visiblePlayers, ...this.visibleAnimals];
    }

    /**
     * Returns nearest hostile entity to a specified player
     */
    getNearestEntity(target: Player): Player | Animal | null {
        const entities = this.getEntities();
        return entities.filter(a => {
            const notTarget = a !== target;
            const isEnemy = a instanceof Player && this.isEnemy(target, a);
            const isHostile = a instanceof Animal && Animals[a.type].hostile;
            return notTarget && (isEnemy || isHostile);
        }).sort((a, b) => {
            const dist1 = target.position.future.distance(a.position.future);
            const dist2 = target.position.future.distance(b.position.future);
            return dist1 - dist2;
        })[0] || null;
    }

    /**
     * Returns a target that can be shot at the current tick
     */
    getCurrentShootTarget(
        owner: TTarget,
        ownerID: number,
        projectile: Projectile
    ): TTarget | null {
        const start = projectile.position.current;
        const end = projectile.position.end;
        const length = projectile.length;
        const layer = projectile.onPlatform;

        const targets: TTarget[] = [];

        const entities = this.getEntities();
        for (const entity of entities) {
            if (entity === owner) continue;

            const s = entity.collisionScale;
            const { x, y } = entity.position.current;
            if (
                this.canShoot(ownerID, entity) &&
                lineIntersectsRect(
                    start, end,
                    new Vector(x - s, y - s),
                    new Vector(x + s, y + s)
                )
            ) {
                targets.push(entity);
            }
        }

        const objects = ObjectManager.getObjects(start, length);
        for (const object of objects) {
            if (object === owner) continue;

            const s = object.collisionScale;
            const { x, y } = object.position.current;
            if (
                layer <= object.layer &&
                lineIntersectsRect(
                    start, end,
                    new Vector(x - s, y - s),
                    new Vector(x + s, y + s)
                )
            ) {
                targets.push(object);
            }
        }

        // The closest target to my player is the only one that can be hit
        return targets.sort((a, b) => {
            const dist1 = owner.position.current.distance(a.position.current);
            const dist2 = owner.position.current.distance(b.position.current);
            return dist1 - dist2;
        })[0] || null;
    }

    private projectileCanHitEntity(projectile: Projectile, target: Player | Animal): TTarget | null {
        const pos1 = projectile.position.current.copy();
        const pos2 = target.position.future.copy();

        const objects = ObjectManager.getObjects(pos1, projectile.length);
        for (const object of objects) {
            const pos3 = object.position.current.copy();

            // Skip objects that are further away than the target
            if (pos1.distance(pos3) > pos1.distance(pos2)) continue;
            if (projectile.onPlatform > object.layer) continue;

            const s = object.collisionScale;
            const { x, y } = pos3;
            if (
                lineIntersectsRect(
                    pos1, pos2,
                    new Vector(x - s, y - s),
                    new Vector(x + s, y + s)
                )
            ) {
                return null;
            }
        }

        return target;
    }

    getPossibleShootEntity(): Player | Animal | null {
        const projectile = myPlayer.getProjectile(myPlayer.position.future, myPlayer.weapon.secondary);
        if (projectile === null) return null;

        return this.getEntities().filter(entity => {
            const notTarget = entity !== myPlayer;
            const canHit = this.projectileCanHitEntity(projectile, entity);
            const canShoot = this.canShoot(myPlayer.id, entity);
            return notTarget && canHit && canShoot;
        }).sort((a, b) => {
            const dist1 = myPlayer.position.current.distance(a.position.current);
            const dist2 = myPlayer.position.current.distance(b.position.current);
            return dist1 - dist2;
        })[0] || null;
    }
}

export default PlayerManager;