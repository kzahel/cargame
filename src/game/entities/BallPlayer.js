
export class BallPlayer {
    constructor(x, y, playerId) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 10;
        this.playerId = playerId;
        this.color = playerId === 1 ? '#e74c3c' : '#9b59b6';
    }

    update(dt, input) {
        let ax = 0;
        let ay = 0;
        const accel = 500;

        if (this.playerId === 1) {
            if (input.isDown('ArrowRight')) ax += 1;
            if (input.isDown('ArrowLeft')) ax -= 1;
            if (input.isDown('ArrowDown')) ay += 1;
            if (input.isDown('ArrowUp')) ay -= 1;
        } else {
            if (input.isDown('d')) ax += 1;
            if (input.isDown('a')) ax -= 1;
            if (input.isDown('s')) ay += 1;
            if (input.isDown('w')) ay -= 1;
        }

        this.vx += ax * accel * dt;
        this.vy += ay * accel * dt;

        // Friction
        this.vx *= 0.95;
        this.vy *= 0.95;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Face
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-3, -2, 3, 0, Math.PI * 2);
        ctx.arc(3, -2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3, -2, 1, 0, Math.PI * 2);
        ctx.arc(3, -2, 1, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0, Math.PI);
        ctx.stroke();

        ctx.restore();
    }
}
