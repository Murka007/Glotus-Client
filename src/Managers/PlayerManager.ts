import Config from "../constants/Config";
import { Weapons } from "../constants/Items";
import Animal from "../data/Animal";
import ClientPlayer from "../data/ClientPlayer";
import { PlayerObject } from "../data/ObjectItem";
import Player from "../data/Player";
import PlayerClient from "../PlayerClient";
import { TTarget } from "../types/Common";
import { EResourceType } from "../types/Enums";
import { EWeapon, TMelee, WeaponTypeString} from "../types/Items";
import { EHat } from "../types/Store";
import { getAngleDist } from "../utility/Common";
import Logger from "../utility/Logger";

interface IPlayerData {
    readonly socketID?: string;
    readonly id: number;
    readonly nickname?: string;
    readonly health?: number;
    readonly skinID?: number;
}

class PlayerManager {

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

    private readonly client: PlayerClient;
    constructor(client: PlayerClient) {
        this.client = client;
    }

    get timeSinceTick() {
        return Date.now() - this.start;
    }

    createPlayer({ socketID, id, nickname, health, skinID }: IPlayerData) {
        const player = this.playerData.get(id) || new Player(this.client);
        if (!this.playerData.has(id)) {
            this.playerData.set(id, player);
        }

        player.socketID = socketID || "";
        player.id = id;
        player.nickname = nickname || "";
        player.currentHealth = health || 100;
        player.skinID = typeof skinID === "undefined" ? -1 : skinID;
        player.init();

        const { myPlayer } = this.client;
        if (myPlayer.isMyPlayerByID(id)) {
            myPlayer.playerSpawn();
        }
        
        return player;
    }

    canHitTarget(player: Player, weaponID: TMelee, target: TTarget) {
        const pos = target.position.current;
        const distance = player.position.current.distance(pos);
        const angle = player.position.current.angle(pos);
        const range = Weapons[weaponID].range + target.hitScale;
        return distance <= range && getAngleDist(angle, player.angle) <= Config.gatherAngle;
    }

    attackPlayer(id: number, gathering: 0 | 1, weaponID: TMelee) {
        const player = this.playerData.get(id);
        if (player === undefined) return;
        const { hatID, reload } = player;

        const { myPlayer, ObjectManager } = this.client;
        if (myPlayer.isMyPlayerByID(id) && !myPlayer.inGame) {
            return;
        }
        
        // When player hits, we must reset his reload
        const weapon = Weapons[weaponID];
        const type = WeaponTypeString[weapon.itemType];
        reload[type].current = 0;
        reload[type].max = player.getWeaponSpeed(weaponID);

        if (
            myPlayer.isEnemyByID(id) &&
            this.canHitTarget(player, weaponID, myPlayer)
        ) {
            const { isAble, count } = player.canDealPoison(weaponID);
            if (isAble) {
                myPlayer.poisonCount = count;
            }
        }

        // Handle building HP and weaponXP
        if (gathering === 1) {
            const objects = ObjectManager.attackedObjects;
            for (const [id, data] of objects) {
                const [hitAngle, object] = data;
                if (this.canHitTarget(player, weaponID, object) && getAngleDist(hitAngle, player.angle) <= 1.25) {
                    objects.delete(id);

                    if (object instanceof PlayerObject) {
                        const damage = player.getBuildingDamage(weaponID);
                        object.health = Math.max(0, object.health - damage);
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

        for (let i=0;i<buffer.length;i+=13) {
            const id = buffer[i];
            const player = this.playerData.get(id);
            if (!player) continue;

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
    }

    updateAnimal(buffer: any[]) {
        this.animals.length = 0;

        for (let i=0;i<buffer.length;i+=7) {
            const id = buffer[i];
            if (!this.animalData.has(id)) {
                this.animalData.set(id, new Animal(this.client));
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

    postTick() {
        const { EnemyManager, ProjectileManager, ObjectManager, myPlayer } = this.client;
        EnemyManager.handleEnemies(this.players, this.animals);

        // Call all other classes after updating player and animal positions
        ProjectileManager.postTick();
        ObjectManager.postTick();

        // Once we updated every player, animal, turret reloadings we proceed to the combat logic
        if (myPlayer.inGame) {
            myPlayer.tickUpdate();
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
            return player.isEnemyByID(target.id);
        }

        if (target instanceof ClientPlayer) {
            return target.isEnemyByID(player.id);
        }
        
        return this.isEnemy(player, target);
    }

    isEnemyTarget(owner: Player, target: Player | Animal): boolean {
        if (target instanceof Animal) return true;
        return this.isEnemyByID(owner.id, target);
    }

    /** Returns true if the projectile won't pass through entity */
    canShoot(ownerID: number, target: Player | Animal) {
        return target instanceof Animal || this.isEnemyByID(ownerID, target);
    }

    /** Returns true if player is looking at target using shield */
    lookingShield(owner: Player, target: Player): boolean {
        const weapon = owner.weapon.current;
        if (weapon !== EWeapon.WOODEN_SHIELD) return false;
        
        const { myPlayer, ModuleHandler } = this.client;
        const pos1 = owner.position.current;
        const pos2 = target.position.current;
        const angle = pos1.angle(pos2);
        const ownerAngle = myPlayer.isMyPlayerByID(owner.id) ? ModuleHandler.mouse.sentAngle : owner.angle; 
        return getAngleDist(angle, ownerAngle) <= Config.shieldAngle;
    }

    /**
     * Returns current players and animals visible to my player
     */
    getEntities(): (Player | Animal)[] {
        return [...this.players, ...this.animals];
    }
}

export default PlayerManager;