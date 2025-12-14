
export class Cat {
    constructor(track) {
        // Bounds
        this.minX = -150; this.maxX = 1100;
        this.minY = 50; this.maxY = 650;

        // Start random position
        this.x = this.minX + Math.random() * (this.maxX - this.minX);
        this.y = this.minY + Math.random() * (this.maxY - this.minY);
        this.z = 0;

        this.active = true;

        this.speed = 0;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;

        this.baseSpeed = 120;
        this.runSpeed = 220;
        this.boostSpeed = 300; // Super fast after caught

        this.stamina = 100;
        this.maxStamina = 100;
        this.isResting = false;

        this.state = 'WANDER'; // WANDER, FLEE, CAUGHT, ESCAPING
        this.stateTimer = 0;
        this.targetX = this.x;
        this.targetY = this.y;

        this.color = '#e67e22';
    }

    caught() {
        if (this.state !== 'CAUGHT') {
            this.state = 'CAUGHT';
            this.stateTimer = 2; // Stuck for a bit
            this.speed = 0;
        }
    }

    update(dt, entities) {
        if (!this.active) return;

        // Find Dog
        const dog = entities.find(e => e.constructor.name === 'Dog' && e.active);

        if (this.state === 'CAUGHT') {
            this.speed = 0;
            this.stateTimer -= dt;

            if (this.stateTimer <= 0) {
                // Escape!
                this.state = 'ESCAPING';
                this.stamina = this.maxStamina * 2; // Super Stamina Boost
                this.stateTimer = 3; // Boost duration

                // Pick far away target
                if (dog) {
                    const dx = this.x - dog.x;
                    const dy = this.y - dog.y;
                    // Away from dog
                    const dist = Math.hypot(dx, dy) || 1;
                    this.targetX = this.x + (dx / dist) * 400;
                    this.targetY = this.y + (dy / dist) * 400;
                } else {
                    this.targetX = this.minX + Math.random() * (this.maxX - this.minX);
                    this.targetY = this.minY + Math.random() * (this.maxY - this.minY);
                }
            }
            return;
        }

        if (this.state === 'ESCAPING') {
            this.speed = this.boostSpeed;
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                this.state = 'WANDER';
            }
            // Beeline to target
        } // Fall through to move logic

        if (this.state !== 'ESCAPING') {
            let fleeing = false;

            if (this.isResting) {
                this.stamina += dt * 30;
                if (this.stamina >= this.maxStamina) {
                    this.isResting = false;
                }
                this.speed = 0;
            } else {
                if (dog && dog.state !== 'TIRED') { // Don't flee from tired dog? Or maybe yes.
                    const dx = this.x - dog.x;
                    const dy = this.y - dog.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < 250 * 250) {
                        fleeing = true;
                        if (this.stamina > 0) {
                            this.speed = this.runSpeed;
                            this.stamina -= dt * 40;

                            // Run away from dog
                            const dist = Math.sqrt(distSq) || 1;
                            const nx = dx / dist;
                            const ny = dy / dist;

                            this.targetX = this.x + nx * 200;
                            this.targetY = this.y + ny * 200;
                        } else {
                            this.speed = this.baseSpeed * 0.5;
                            this.isResting = true;
                        }
                    }
                }

                if (!fleeing) {
                    this.speed = this.baseSpeed;
                    this.stamina = Math.min(this.stamina + dt * 10, this.maxStamina);

                    this.stateTimer -= dt;
                    if (this.stateTimer <= 0) {
                        this.targetX = this.minX + Math.random() * (this.maxX - this.minX);
                        this.targetY = this.minY + Math.random() * (this.maxY - this.minY);
                        this.stateTimer = 2 + Math.random() * 4;
                    }
                }
            }
        }

        // Move towards target
        const tdx = this.targetX - this.x;
        const tdy = this.targetY - this.y;
        const tDist = Math.hypot(tdx, tdy);

        if (tDist > 5) {
            this.vx = (tdx / tDist) * this.speed;
            this.vy = (tdy / tDist) * this.speed;

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            this.angle = Math.atan2(this.vy, this.vx);
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // Bounds clamping
        this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
        this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw Cat
        ctx.fillStyle = this.color;

        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(6, -2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.moveTo(4, -5);
        ctx.lineTo(8, -8);
        ctx.lineTo(8, -4);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8, -5);
        ctx.lineTo(12, -8);
        ctx.lineTo(10, -4);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.moveTo(-8, 0);
        const t = Date.now() / 200;

        let tailWag = Math.sin(t) * 5;
        if (this.state === 'CAUGHT') tailWag = 0; // Frozen
        if (this.state === 'ESCAPING') tailWag = Math.sin(t * 5) * 2; // Rigid fast wag?

        ctx.quadraticCurveTo(-12, tailWag, -14, -4);
        ctx.stroke();

        ctx.restore();
    }
}
