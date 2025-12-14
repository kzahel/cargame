
export class Powerup {
    constructor(track) {
        this.track = track;
        this.distance = Math.random() * track.totalLength;
        // Center of a random lane
        const lane = Math.floor(Math.random() * track.laneCount);
        this.lane = lane;
        this.offset = (lane - (track.laneCount - 1) / 2) * track.laneWidth;

        this.active = true;
        this.updatePosition();
    }

    update(dt) {
        // Static usually
        // Maybe animate float
        this.updatePosition();
    }

    updatePosition() {
        const centerLaneIndex = (this.track.laneCount - 1) / 2;
        const lanePos = centerLaneIndex + (this.offset / this.track.laneWidth);

        const pos = this.track.getLanePosition(this.distance, lanePos);
        this.x = pos.x;
        this.y = pos.y;
        this.z = pos.z;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Star shape
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        const r = 8;
        for (let i = 0; i < 5; i++) {
            const th = (i * 4 * Math.PI) / 5;
            const x = Math.cos(th) * r;
            const y = Math.sin(th) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
