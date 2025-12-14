
export class Car {
    constructor(track, lane, style = 'sedan') {
        this.track = track;
        this.lane = lane;
        this.targetLane = lane;
        this.laneChangeProgress = 0;

        this.distance = 0;
        this.speed = 0;
        this.targetSpeed = 0;
        this.maxSpeed = 200;
        this.isPlayer = false;

        this.style = style; // 'sedan', 'racecar', 'truck', 'monster'
        this.color = this.getColor(style);

        this.x = 0;
        this.y = 0;
        this.angle = 0;
        this.z = 0;
        this.score = 0;
        this.isAccelerating = false;
    }

    getColor(style) {
        switch (style) {
            case 'racecar': return '#e74c3c'; // Red
            case 'truck': return '#3498db'; // Blue
            case 'monster': return '#9b59b6'; // Purple
            default: return '#f1c40f'; // Yellow sedan
        }
    }

    update(dt) {
        // AI Acceleration
        if (!this.isPlayer) {
            if (this.speed < this.targetSpeed) {
                this.speed += 50 * dt; // Acceleration
            } else if (this.speed > this.targetSpeed) {
                this.speed -= 100 * dt; // Deceleration
            }
        }

        // Movement
        this.distance += this.speed * dt;

        // Lane changing logic
        if (this.lane !== this.targetLane) {
            const dir = Math.sign(this.targetLane - this.lane);
            const speed = 2.0; // lane change speed
            this.laneChangeProgress += speed * dt;
            if (this.laneChangeProgress >= 1) {
                this.lane = this.targetLane;
                this.laneChangeProgress = 0;
            }
        }

        // Calculate effective lane for position
        let drawLane = this.lane;
        if (this.lane !== this.targetLane) {
            drawLane = this.lane + (this.targetLane - this.lane) * this.laneChangeProgress;
        }

        // Get position from track
        const pos = this.track.getLanePosition(this.distance, drawLane);
        this.x = pos.x;
        this.y = pos.y;
        this.angle = pos.angle;
        this.z = pos.z;
    }

    changeLane(dir) {
        if (this.laneChangeProgress > 0) return; // Busy changing
        const next = this.targetLane + dir;
        if (next >= 0 && next < this.track.laneCount) {
            this.targetLane = next;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // ctx.rotate(this.angle); // If 0 is Right. 
        // Track angle is atan2(dy, dx). aligned with X axis.
        ctx.rotate(this.angle);

        // Rocket Fire
        if (this.isAccelerating) {
            ctx.save();
            ctx.translate(-15, 0); // Back of car

            // Core
            ctx.fillStyle = '#f1c40f'; // Yellow
            ctx.beginPath();
            ctx.moveTo(0, -5);
            ctx.lineTo(-20 - Math.random() * 10, 0);
            ctx.lineTo(0, 5);
            ctx.fill();

            // Outer
            ctx.fillStyle = '#e74c3c'; // Red
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(-15 - Math.random() * 10, 0);
            ctx.lineTo(0, 8);
            ctx.fill();

            ctx.restore();
        }

        // Draw based on style
        ctx.fillStyle = this.color;

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 5;

        switch (this.style) {
            case 'racecar':
                // Pointy
                ctx.beginPath();
                ctx.moveTo(15, 0);
                ctx.lineTo(-15, -10);
                ctx.lineTo(-15, 10);
                ctx.fill();
                break;
            case 'truck':
                // Big Box
                ctx.fillRect(-15, -12, 30, 24);
                ctx.fillStyle = '#bdc3c7'; // Cab
                ctx.fillRect(5, -10, 10, 20);
                break;
            case 'monster':
                // Big wheels
                ctx.fillStyle = '#333';
                ctx.fillRect(-12, -18, 10, 8); // FL
                ctx.fillRect(-12, 10, 10, 8);  // FR
                ctx.fillRect(2, -18, 10, 8);   // RL
                ctx.fillRect(2, 10, 10, 8);    // RR
                ctx.fillStyle = this.color;
                ctx.fillRect(-15, -10, 30, 20);
                break;
            default: // sedan
                ctx.fillRect(-15, -10, 30, 20);
                // Windshield
                ctx.fillStyle = '#add8e6';
                ctx.fillRect(0, -8, 5, 16);
                break;
        }

        ctx.restore();
    }
}
