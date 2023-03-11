import Glotus from "..";
import Animals from "../constants/Animals";
import Config from "../constants/Config";
import { Weapons } from "../constants/Items";
import { Hats } from "../constants/Store";
import Animal from "../data/Animal";
import myPlayer, { ClientPlayer } from "../data/ClientPlayer";
import { PlayerObject, TObject } from "../data/ObjectItem";
import Player from "../data/Player";
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
    tickStep = 0;

    createPlayer({ id, nickname, skinID }: IPlayerData) {
        const player = this.players.get(id) || new Player;
        if (!this.players.has(id)) {
            this.players.set(id, player);
        }
        player.nickname = nickname;
        player.skinID = skinID;
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
        this.tickStep += this.step;

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
        if (myPlayerCopy !== null) myPlayerCopy.tickUpdate();
        ProjectileManager.postTick();
        ObjectManager.postTick();
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

    /**
     * true, if the projectile won't pass through entity
     */
    canShoot(target: Player | Animal) {
        return target instanceof Player && this.isEnemy(myPlayer, target) || target instanceof Animal;
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

    getCurrentShootTarget(
        start: Vector,
        end: Vector,
        range: number,
        layer: 1 | 0,
    ): TTarget | null {

        const targets: TTarget[] = [];
        const entities = this.getEntities();
        for (const entity of entities) {
            const s = entity.arrowScale;
            const { x, y } = entity.position.current;
            if (
                this.canShoot(entity) &&
                lineIntersectsRect(
                    start, end,
                    new Vector(x - s, y - s),
                    new Vector(x + s, y + s)
                )
            ) {
                targets.push(entity);
            }
        }

        const objects = ObjectManager.getObjects(start, range);
        for (const object of objects) {
            const s = object.arrowScale;
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

        return targets.sort((a, b) => {
            const dist1 = myPlayer.position.current.distance(a.position.current);
            const dist2 = myPlayer.position.current.distance(b.position.current);
            return dist1 - dist2;
        })[0] || null;
    }

    getPossibleShootTarget(): TTarget | null {
        return null;
    }
}

export default PlayerManager;