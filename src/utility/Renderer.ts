import Glotus from "..";
import Config from "../constants/Config";
import myPlayer from "../data/ClientPlayer";
import PlayerManager from "../Managers/PlayerManager";
import Controller from "../modules/Controller";
import settings from "../modules/Settings";
import Vector from "../modules/Vector";
import { TCTX } from "../types/Common";
import { IRenderEntity, IRenderObject } from "../types/RenderTargets";
import { clamp } from "./Common";

class Renderer {
    static HSL = 0;
    static readonly objects: IRenderObject[] = [];

    static updateHSL() {
        this.HSL = (this.HSL + 0.5) % 360;
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

    static line(ctx: TCTX, x1: number, y1: number, x2: number, y2: number, color: string) {
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    static arrow(ctx: TCTX, length: number, x: number, y: number, angle: number, color: string) {
        ctx.save();
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

    static marker(ctx: TCTX, color: string) {
        ctx.strokeStyle = "#3b3b3b";
        ctx.lineWidth = 3;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }

    static getTracerColor(entity: IRenderEntity): string | null {
        if (settings.animalTracers && entity.isAI) return settings.animalTracersColor;

        if (
            settings.teammateTracers &&
            entity.isPlayer &&
            Controller.isTeammate(entity.sid)
        ) return settings.teammateTracersColor;

        if (
            settings.enemyTracers &&
            entity.isPlayer &&
            Controller.isEnemy(entity.sid)
        ) return settings.enemyTracersColor;

        return null;
    }

    static renderTracer(ctx: TCTX, entity: IRenderEntity, player: IRenderEntity) {
        const colorValue = this.getTracerColor(entity);
        if (colorValue === null) return;
        const color = settings.rainbow ? `hsl(${this.HSL}, 100%, 50%)` : colorValue;

        const pos1 = new Vector(player.x, player.y).sub(myPlayer.offset);
        const pos2 = new Vector(entity.x, entity.y).sub(myPlayer.offset);

        if (settings.arrows) {
            const w = 8;
            const distance = Math.min(100 + w * 2, pos1.distance(pos2) - w * 2);
            const angle = pos1.angle(pos2);
            const pos = pos1.direction(angle, distance);
            this.arrow(ctx, w, pos.x, pos.y, angle, color);
        } else {
            this.line(ctx, pos1.x, pos1.y, pos2.x, pos2.y, color);
        }
    }

    static getMarkerColor(object: IRenderObject): string | null {
        const id = object.owner?.sid;
        if (id === undefined) return null;
        if (settings.itemMarkers && Controller.isMyPlayer(id)) return settings.itemMarkersColor;
        if (settings.teammateMarkers && Controller.isTeammate(id)) return settings.teammateMarkersColor;
        if (settings.enemyMarkers && Controller.isEnemy(id)) return settings.enemyMarkersColor;
        return null;
    }

    static renderMarker(ctx: TCTX, object: IRenderObject) {
        const color = this.getMarkerColor(object);
        if (color === null) return;
        ctx.save();
        const x = object.x + object.xWiggle - myPlayer.offset.x;
        const y = object.y + object.yWiggle - myPlayer.offset.y;
        ctx.translate(x, y);
        this.marker(ctx, color);
        ctx.restore();
    }

    static bar(
        ctx: TCTX,
        x: number,
        y: number,
        w: number,
        h: number,
        scale: number,
        fill: number,
        color: string,
    ) {
        const { barWidth, barPad, nameY } = Config;

        x -= barWidth + barPad;
        y += scale + nameY;

        ctx.save();
        ctx.fillStyle = "#3d3f42";
        this.roundRect(ctx, x, y, w, h, 8);
        ctx.fill();

        ctx.fillStyle = color;
        this.roundRect(ctx, x + barPad, y + barPad, (w - barPad * 2) * fill, h - barPad * 2, 7);
        ctx.fill();
        ctx.restore();
    }

    static renderBar(ctx: TCTX, entity: IRenderEntity) {
        const player = PlayerManager.players.get(entity.sid);
        if (player === undefined) return;

        const { barWidth, barHeight, barPad } = Config;
        const x = entity.x - myPlayer.offset.x;
        const y = entity.y - myPlayer.offset.y;
        const scale = entity.scale;
        let height = barHeight;

        const { primary, secondary, turret } = player.reload;
        if (settings.weaponReloadBar) {
            this.bar(
                ctx,
                x, y - height,
                barWidth + barPad, barHeight,
                scale,
                clamp(primary.current / primary.max, 0, 1),
                settings.weaponReloadBarColor
            );

            this.bar(
                ctx,
                x + barWidth + barPad, y - height,
                barWidth + barPad, barHeight,
                scale,
                clamp(secondary.current / secondary.max, 0, 1),
                settings.weaponReloadBarColor
            );

            height += barHeight;
        }

        if (settings.turretReloadBar) {
            this.bar(
                ctx,
                x, y - height + 3,
                barWidth * 2 + barPad * 2, barHeight - 3,
                scale,
                clamp(turret.current / turret.max, 0, 1),
                settings.turretReloadBarColor
            );
        }
    }
}

export default Renderer;