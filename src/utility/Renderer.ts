import Config from "../constants/Config";
import myPlayer from "../data/ClientPlayer";
import PlayerManager from "../Managers/PlayerManager";
import settings from "./Settings";
import Vector from "../modules/Vector";
import { TCTX } from "../types/Common";
import { IRenderEntity, IRenderObject } from "../types/RenderTargets";
import { WeaponVariants, Weapons } from "../constants/Items";
import { WeaponVariant } from "../types/Items";
import Player from "../data/Player";
import { clamp } from "./Common";

class Renderer {
    static HSL = 0;
    static readonly objects: IRenderObject[] = [];

    static updateHSL() {
        this.HSL = (this.HSL + 0.5) % 360;
    }

    static rect(ctx: TCTX, pos: Vector, scale: number, color: string, lineWidth = 4) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.translate(-myPlayer.offset.x, -myPlayer.offset.y);
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
        ctx.translate(-myPlayer.offset.x, -myPlayer.offset.y);
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
        ctx.translate(-myPlayer.offset.x, -myPlayer.offset.y);
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }

    static line(ctx: TCTX, start: Vector, end: Vector, color: string, opacity = 1) {
        ctx.save();
        ctx.translate(-myPlayer.offset.x, -myPlayer.offset.y);
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.restore();
    }

    static arrow(ctx: TCTX, length: number, x: number, y: number, angle: number, color: string) {
        ctx.save();
        ctx.translate(-myPlayer.offset.x, -myPlayer.offset.y);
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
        ctx.closePath();
        ctx.restore();
    }

    static getTracerColor(entity: IRenderEntity): string | null {
        if (settings.animalTracers && entity.isAI) return settings.animalTracersColor;

        if (
            settings.teammateTracers &&
            entity.isPlayer &&
            myPlayer.isTeammateByID(entity.sid)
        ) return settings.teammateTracersColor;

        if (
            settings.enemyTracers &&
            entity.isPlayer &&
            myPlayer.isEnemyByID(entity.sid)
        ) return settings.enemyTracersColor;

        return null;
    }

    static renderTracer(ctx: TCTX, entity: IRenderEntity, player: IRenderEntity) {
        const colorValue = this.getTracerColor(entity);
        if (colorValue === null) return;
        const color = settings.rainbow ? `hsl(${this.HSL}, 100%, 50%)` : colorValue;

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
            myPlayer.isMyPlayerByID(id)
        ) return settings.itemMarkersColor;

        if (
            settings.teammateMarkers &&
            myPlayer.isTeammateByID(id)
        ) return settings.teammateMarkersColor;

        if (
            settings.enemyMarkers &&
            myPlayer.isEnemyByID(id)
        ) return settings.enemyMarkersColor;

        return null;
    }

    static renderMarker(ctx: TCTX, object: IRenderObject) {
        const color = this.getMarkerColor(object);
        if (color === null) return;
        const x = object.x + object.xWiggle - myPlayer.offset.x;
        const y = object.y + object.yWiggle - myPlayer.offset.y;
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
    ) {
        ctx.fillStyle = "#3d3f42";
        this.roundRect(ctx, x, y, w, h, 8);
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

    private static getNameY(isBar: boolean, player?: Player) {
        let nameY = 34;
        const height = isBar ? 11 : 7;
        if (settings.weaponReloadBar) nameY += height;
        if (settings.playerTurretReloadBar) nameY += height;
        if (player === myPlayer && settings.weaponXPBar) nameY += height;
        return nameY;
    }

    static renderBar(ctx: TCTX, entity: IRenderEntity) {
        const player = PlayerManager.playerData.get(entity.sid);
        if (player === undefined) return;

        ctx.save();

        const { primary, secondary, turret } = player.reload;
        const { barWidth, barHeight, barPad } = Config;

        const nameY = this.getNameY(true, player);
        window.config.nameY = nameY;

        const totalWidth = barWidth + barPad;
        const scale = entity.scale + nameY;
        let x = entity.x - myPlayer.offset.x;
        let y = entity.y - myPlayer.offset.y + scale;

        // Secondary Reload bar
        if (settings.weaponReloadBar) {
            y -= barHeight;
            this.barContainer(ctx, x, y, totalWidth, barHeight);
            this.barContent(ctx, x, y, totalWidth, barHeight, secondary.current / secondary.max, settings.weaponReloadBarColor);
        }
        
        x -= totalWidth;

        // Primary Reload bar
        if (settings.weaponReloadBar) {
            this.barContainer(ctx, x, y, totalWidth, barHeight);
            this.barContent(ctx, x, y, totalWidth, barHeight, primary.current / primary.max, settings.weaponReloadBarColor);
        }

        const smallBarHeight = barHeight - 4;

        // Turret Reload Bar
        if (settings.playerTurretReloadBar) {
            y -= smallBarHeight;
            this.barContainer(ctx, x, y, totalWidth * 2, smallBarHeight);
            this.barContent(ctx, x, y, totalWidth * 2, smallBarHeight, turret.current / turret.max, settings.playerTurretReloadBarColor);
        }

        // Weapon XP Bar
        if (player === myPlayer && settings.weaponXPBar) {
            const weapon = Weapons[myPlayer.weapon.current];
            const current = WeaponVariants[myPlayer.getWeaponVariant(weapon.id).current].color;
            const next = WeaponVariants[myPlayer.getWeaponVariant(weapon.id).next].color;
            const XP = myPlayer.weaponXP[weapon.itemType];

            y -= smallBarHeight;
            this.barContainer(ctx, x, y, totalWidth * 2, smallBarHeight);
            this.barContent(ctx, x, y, totalWidth * 2, smallBarHeight, 1, current);
            this.barContent(ctx, x, y, totalWidth * 2, smallBarHeight, clamp(XP.current / XP.max, 0, 1), next);
        }
        ctx.restore();
    }

    static renderHP(ctx: TCTX, entity: IRenderEntity) {
        if (!settings.renderHP) return;

        const nameY = window.config.nameY;
        const { barHeight, barPad } = Config;
        let text = `HP ${Math.floor(entity.health)}/${entity.maxHealth}`;
        const offset = entity.scale + barHeight + barPad;
        const x = entity.x - myPlayer.offset.x;
        const y = entity.y - myPlayer.offset.y + nameY + offset;

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
        const x = object.x + object.xWiggle - myPlayer.offset.x;
        const y = object.y + object.yWiggle - myPlayer.offset.y;
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