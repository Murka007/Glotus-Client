import Glotus from "..";
import Projectile from "../data/Projectile";

const ProjectileManager = new class ProjectileManager {
    readonly projectiles: Map<number, Projectile> = new Map;
    readonly turrets: Map<number, Projectile> = new Map;

    createProjectile(projectile: Projectile) {
        const { id, isTurret } = projectile;
        const key = isTurret ? "turrets" : "projectiles";
        this[key].set(id, projectile);
    }
}

export default ProjectileManager;