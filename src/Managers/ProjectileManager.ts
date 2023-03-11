import Projectile from "../data/Projectile";

const ProjectileManager = new class ProjectileManager {
    readonly projectiles = new Map<number, Projectile>();
    readonly turrets = new Map<number, Projectile>();

    createProjectile(projectile: Projectile) {
        const { id, isTurret } = projectile;
        const key = isTurret ? "turrets" : "projectiles";
        this[key].set(id, projectile);
    }

    postTick() {
        this.projectiles.clear();
        this.turrets.clear();
    }
}

export default ProjectileManager;