import Glotus from "..";
import Animals from "../constants/Animals";
import { Weapons } from "../constants/Items";
import Animal from "../data/Animal";
import myPlayer from "../data/ClientPlayer";
import Player from "../data/Player";
import Controller from "../modules/Controller";
import { TWeapon } from "../types/Items";
import ProjectileManager from "./ProjectileManager";

interface IPlayerData {
    readonly id: number;
    readonly nickname: string;
    readonly skinID: number;
}

const PlayerManager = new class PlayerManager {
    readonly players: Map<number, Player> = new Map;
    readonly visiblePlayers: Player[] = [];

    readonly animals: Map<number, Animal> = new Map;
    readonly visibleAnimals: Animal[] = [];

    start = Date.now();
    step = 0;

    createPlayer({ id, nickname, skinID }: IPlayerData) {
        const player = this.players.get(id) || new Player;
        if (!this.players.has(id)) {
            this.players.set(id, player);
        }
        player.nickname = nickname;
        player.skinID = skinID;
    }

    attackPlayer(id: number, weaponID: TWeapon) {
        const player = this.players.get(id);
        if (!player) return;

        const weapon = Weapons[weaponID];
        const type = Controller.isPrimary(weaponID) ? "primary" : "secondary";
        const target = player.reload[type];
        target.current = 0;
        target.max = weapon.speed;
    }

    updatePosition(buffer: any[]) {
        this.visiblePlayers.length = 0;

        const now = Date.now();
        this.step = now - this.start;
        this.start = now;

        for (let i=0;i<buffer.length;i+=13) {
            const player = this.players.get(buffer[i]);
            if (!player) continue;
            this.visiblePlayers.push(player);
            player.update(
                buffer[i],
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

        ProjectileManager.projectiles.clear();
        ProjectileManager.turrets.clear();
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

    isEnemy(target1: Player, target2: Player) {
        return target1.clanName === null || target1.clanName !== target2.clanName;
    }

    getNearestEntity(target: Player): Player | Animal | null {
        const entities = [...this.visiblePlayers, ...this.visibleAnimals];
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
}

export default PlayerManager;