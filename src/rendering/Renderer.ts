import Config from "../constants/Config";
import settings from "../utility/Settings";
import Vector from "../modules/Vector";
import { TCTX } from "../types/Common";
import { IRenderEntity, IRenderObject } from "../types/RenderTargets";
import { WeaponVariants, Weapons } from "../constants/Items";
import Player from "../data/Player";
import { clamp } from "../utility/Common";
import Animal from "../data/Animal";
import { myClient } from "..";
import { Notification } from "./NotificationRenderer";

class Renderer {
    static readonly objects: IRenderObject[] = [];

    static rect(ctx: TCTX, pos: Vector, scale: number, color: string, lineWidth = 4) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.translate(-myClient.myPlayer.offset.x, -myClient.myPlayer.offset.y);
        ctx.translate(pos.x, pos.y);
        ctx.rect(-scale, -scale, scale*2, scale*2);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

    static roundRect(ctx: TCTX, x: number, y: number, w: number, h: number, r: number) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        if (r < 0) r = 0;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    static circle(
        ctx: TCTX,
        x: number, y: number,
        radius: number,
        color: string,
        opacity = 1,
        lineWidth = 4
    ) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.translate(-myClient.myPlayer.offset.x, -myClient.myPlayer.offset.y);
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

    static fillCircle(
        ctx: TCTX,
        x: number, y: number,
        radius: number,
        color: string,
        opacity = 1,
    ) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.translate(-myClient.myPlayer.offset.x, -myClient.myPlayer.offset.y);
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    static line(ctx: TCTX, start: Vector, end: Vector, color: string, opacity = 1, lineWidth = 4) {
        ctx.save();
        ctx.translate(-myClient.myPlayer.offset.x, -myClient.myPlayer.offset.y);
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.restore();
    }

    static arrow(ctx: TCTX, length: number, x: number, y: number, angle: number, color: string) {
        ctx.save();
        ctx.translate(-myClient.myPlayer.offset.x, -myClient.myPlayer.offset.y);
        ctx.translate(x, y);
        ctx.rotate(Math.PI / 4);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(-length, -length);
        ctx.lineTo(length, -length);
        ctx.lineTo(length, length);
        ctx.stroke();
        ctx.restore();
    }

    static cross(ctx: TCTX, x: number, y: number, size: number, lineWidth: number, color: string) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.translate(x - myClient.myPlayer.offset.x, y - myClient.myPlayer.offset.y);
        const halfSize = size / 2;
        ctx.beginPath();
        ctx.moveTo(-halfSize, -halfSize);
        ctx.lineTo(halfSize, halfSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(halfSize, -halfSize);
        ctx.lineTo(-halfSize, halfSize);
        ctx.stroke();
        ctx.restore();
    }

    static getTracerColor(entity: IRenderEntity | Notification): string | null {
        if (entity instanceof Notification) return settings.notificationTracersColor;
        if (settings.animalTracers && entity.isAI) return settings.animalTracersColor;

        if (
            settings.teammateTracers &&
            entity.isPlayer &&
            myClient. myPlayer.isTeammateByID(entity.sid)
        ) return settings.teammateTracersColor;

        if (
            settings.enemyTracers &&
            entity.isPlayer &&
            myClient.myPlayer.isEnemyByID(entity.sid)
        ) return settings.enemyTracersColor;

        return null;
    }

    static renderTracer(ctx: TCTX, entity: IRenderEntity | Notification, player: IRenderEntity) {
        const color = this.getTracerColor(entity);
        if (color === null) return;

        const pos1 = new Vector(player.x, player.y);
        const pos2 = new Vector(entity.x, entity.y);

        if (settings.arrows) {
            const w = 8;
            const distance = Math.min(100 + w * 2, pos1.distance(pos2) - w * 2);
            const angle = pos1.angle(pos2);
            const pos = pos1.direction(angle, distance);
            this.arrow(ctx, w, pos.x, pos.y, angle, color);
        } else {
            this.line(ctx, pos1, pos2, color, 0.75);
        }
    }

    static getMarkerColor(object: IRenderObject): string | null {

        // ID of the owner
        // if ID is undefined, it means object is a resource
        const id = object.owner?.sid;
        if (id === undefined) return null;
        if (
            settings.itemMarkers &&
            myClient.myPlayer.isMyPlayerByID(id)
        ) return settings.itemMarkersColor;

        if (
            settings.teammateMarkers &&
            myClient.myPlayer.isTeammateByID(id)
        ) return settings.teammateMarkersColor;

        if (
            settings.enemyMarkers &&
            myClient.myPlayer.isEnemyByID(id)
        ) return settings.enemyMarkersColor;

        return null;
    }

    static renderMarker(ctx: TCTX, object: IRenderObject) {
        const color = this.getMarkerColor(object);
        if (color === null) return;
        const x = object.x + object.xWiggle - myClient.myPlayer.offset.x;
        const y = object.y + object.yWiggle - myClient.myPlayer.offset.y;
        ctx.save();
        ctx.strokeStyle = "#3b3b3b";
        ctx.lineWidth = 4;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

    static barContainer(
        ctx: TCTX,
        x: number,
        y: number,
        w: number,
        h: number,
        r = 8
    ) {
        ctx.fillStyle = "#3d3f42";
        this.roundRect(ctx, x, y, w, h, r);
        ctx.fill();
    }

    static barContent(
        ctx: TCTX,
        x: number,
        y: number,
        w: number,
        h: number,
        fill: number,
        color: string,
    ) {
        const barPad = Config.barPad;
        ctx.fillStyle = color;
        this.roundRect(ctx, x + barPad, y + barPad, (w - barPad * 2) * fill, h - barPad * 2, 7);
        ctx.fill();
    }

    private static getNameY(target?: Animal | Player) {
        let nameY = 34;
        const height = 5;
        if (target === myClient.myPlayer && settings.weaponXPBar) nameY += height;
        if (settings.playerTurretReloadBar) nameY += height;
        if (settings.weaponReloadBar) nameY += height;
        return nameY;
    }

    static getContainerHeight(entity: IRenderEntity): number {
        const { barHeight, barPad } = Config;
        let height = barHeight;
        if (entity.isPlayer) {
            const smallBarHeight = barHeight - 4;
            const player = myClient.PlayerManager.playerData.get(entity.sid);
            if (player === undefined) return height;

            if (player === myClient.myPlayer && settings.weaponXPBar) height += smallBarHeight - barPad;
            if (settings.playerTurretReloadBar) height += smallBarHeight - barPad;
            if (settings.weaponReloadBar) height += barHeight - barPad;
        }
        return height;
    }

    static renderBar(ctx: TCTX, entity: IRenderEntity) {
        const { barWidth, barHeight, barPad } = Config;
        const smallBarHeight = barHeight - 4;
        const totalWidth = barWidth + barPad;
        const scale = entity.scale + 34;

        const { myPlayer, PlayerManager } = myClient;
        let x = entity.x - myPlayer.offset.x - totalWidth;
        let y = entity.y - myPlayer.offset.y + scale;
        ctx.save();

        const player = entity.isPlayer && PlayerManager.playerData.get(entity.sid);
        const animal = entity.isAI && PlayerManager.animalData.get(entity.sid);

        let height = 0;
        if (player instanceof Player) {
        
            const { primary, secondary, turret } = player.reload;

            // Weapon XP Bar
            if (player === myPlayer && settings.weaponXPBar) {
                const weapon = Weapons[myPlayer.weapon.current];
                const current = WeaponVariants[myPlayer.getWeaponVariant(weapon.id).current].color;
                const next = WeaponVariants[myPlayer.getWeaponVariant(weapon.id).next].color;
                const XP = myPlayer.weaponXP[weapon.itemType];

                this.barContainer(ctx, x, y, totalWidth * 2, smallBarHeight);
                this.barContent(ctx, x, y, totalWidth * 2, smallBarHeight, 1, current);
                this.barContent(ctx, x, y, totalWidth * 2, smallBarHeight, clamp(XP.current / XP.max, 0, 1), next);
                height += smallBarHeight - barPad;
            }

            // Turret Reload Bar
            if (settings.playerTurretReloadBar) {
                this.barContainer(ctx, x, y + height, totalWidth * 2, smallBarHeight);
                this.barContent(ctx, x, y + height, totalWidth * 2, smallBarHeight, turret.current / turret.max, settings.playerTurretReloadBarColor);
                height += smallBarHeight - barPad;
            }

            // Weapon Reload Bar
            if (settings.weaponReloadBar) {
                const extraPad = 2.25;
                this.barContainer(ctx, x, y + height, totalWidth * 2, barHeight);
                this.barContent(ctx, x, y + height, totalWidth + extraPad, barHeight, primary.current / primary.max, settings.weaponReloadBarColor);
                this.barContent(ctx, x + totalWidth - extraPad, y + height, totalWidth + extraPad, barHeight, secondary.current / secondary.max, settings.weaponReloadBarColor);
                height += barHeight - barPad;
            }
        }

        const target = player || animal;
        if (target) {
            window.config.nameY = this.getNameY(target);
            const { currentHealth, maxHealth } = target;
            const health = animal ? maxHealth : 100;
            const color = PlayerManager.isEnemyTarget(myPlayer, target) ? "#cc5151" : "#8ecc51";
            this.barContainer(ctx, x, y + height, totalWidth * 2, barHeight);
            this.barContent(ctx, x, y + height, totalWidth * 2, barHeight, currentHealth / health, color);
            height += barHeight;
        }

        ctx.restore();
    }

    static renderHP(ctx: TCTX, entity: IRenderEntity) {
        if (!settings.renderHP) return;

        const { barPad, nameY } = Config;
        const containerHeight = this.getContainerHeight(entity);
        let text = `HP ${Math.floor(entity.health)}/${entity.maxHealth}`;
        const offset = entity.scale + nameY + barPad + containerHeight;

        const { myPlayer } = myClient;
        const x = entity.x - myPlayer.offset.x;
        const y = entity.y - myPlayer.offset.y + offset;

        if (entity.isPlayer && myPlayer.isMyPlayerByID(entity.sid)) {
            text += ` ${myPlayer.shameCount}/8`;
        }

        ctx.save();
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#3d3f42";
        ctx.lineWidth = 8;
        ctx.lineJoin = "round";
        ctx.textBaseline = "top";
        ctx.font = `19px Hammersmith One`;
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    static circularBar(
        ctx: TCTX,
        object: IRenderObject,
        perc: number,
        angle: number,
        color: string,
        offset = 0
    ): number {
        const x = object.x + object.xWiggle - myClient.myPlayer.offset.x;
        const y = object.y + object.yWiggle - myClient.myPlayer.offset.y;
        const height = Config.barHeight * 0.7;
        const defaultScale = 10 + height / 2;
        const scale = defaultScale + 3 + offset;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.lineCap = "round";
        ctx.strokeStyle = "#3b3b3b";
        ctx.lineWidth = height;
        ctx.beginPath();
        ctx.arc(0, 0, scale, 0, perc * 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();

        ctx.strokeStyle = color;
        ctx.lineWidth = height / 3;
        ctx.beginPath();
        ctx.arc(0, 0, scale, 0, perc * 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
        return defaultScale - 3;
    }
}

export default Renderer;