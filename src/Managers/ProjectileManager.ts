import Projectile from "../data/Projectile";

const ProjectileManager = new class ProjectileManager {
    readonly projectiles: Map<number, Projectile> = new Map;
    readonly turrets: Map<number, Projectile> = new Map;
    // readonly removedProjectiles: Map<number, Projectile> = new Map;

    createProjectile(projectile: Projectile) {
        const { id, isTurret } = projectile;
        const key = isTurret ? "turrets" : "projectiles";
        this[key].set(id, projectile);
    }

    // removeProjectile(id: number, length: number) {
    //     const projectile = this.projectiles.get(id);
    //     if (projectile !== undefined) {
    //         this.projectiles.delete(id);
    //         this.removedProjectiles.set(id, projectile);
    //     }
    // }

    postTick() {
        this.projectiles.clear();
        this.turrets.clear();
    }
}

export default ProjectileManager;