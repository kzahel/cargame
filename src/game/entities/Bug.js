
export class Bug {
    constructor(track) {
        this.track = track;
        this.distance = Math.random() * track.totalLength;
        this.offset = (Math.random() - 0.5) * track.roadWidth;
        this.walkSpeed = 10 + Math.random() * 20;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.z = 0; // Bugs stay on ground? or match segment z.

        // Determine Z based on spawn
        // This is expensive to check every frame if we don't know segment
        // But we can just use track.getLanePosition(dist, 0).z 
        // We need a helper in track to get Z at distance?
        // or just track.getLanePosition handles it.

        this.active = true;
        this.updatePosition();
    }

    update(dt) {
        if (!this.active) return;

        // Walk accross
        this.offset += this.walkSpeed * this.direction * dt;
        if (this.offset > this.track.roadWidth / 2 || this.offset < -this.track.roadWidth / 2) {
            this.direction *= -1;
        }

        this.updatePosition();
    }

    updatePosition() {
        // Hack: use lane 1.5 (center) and add offset manually? 
        // getLanePosition adds offset to center of specific lane.
        // track center is between lane 1 and 2 (if 4 lanes).
        // offset 0 = center of road.
        // My getLanePosition takes "laneIndex". 0..3.
        // Center is index 1.5.

        // We can use a custom method or just pass fractional lane to getLanePosition?
        // laneIndex 1.5 is center.
        const centerLaneIndex = (this.track.laneCount - 1) / 2;
        const lanePos = centerLaneIndex + (this.offset / this.track.laneWidth);

        const pos = this.track.getLanePosition(this.distance, lanePos);
        this.x = pos.x;
        this.y = pos.y;
        this.z = pos.z;
        this.angle = pos.angle;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw Bug
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        const legTime = Date.now() / 100;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 3) * Math.PI;
            const len = 8 + Math.sin(legTime + i) * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(-angle) * len, Math.sin(-angle) * len);
            ctx.stroke();
        }

        ctx.restore();
    }
}
