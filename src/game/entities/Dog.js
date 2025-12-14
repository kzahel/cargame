
export class Dog {
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

        this.state = 'WANDER'; // WANDER, CHASE, GRABBED, TIRED
        this.stateTimer = 0;
        this.targetX = this.x;
        this.targetY = this.y;

        this.baseSpeed = 100;
        this.chaseSpeed = 160;
    }

    update(dt, entities) {
        if (!this.active) return;

        // Find Cat
        const cat = entities.find(e => e.constructor.name === 'Cat' && e.active);

        // State Logic
        if (this.state === 'GRABBED') {
            this.speed = 0;
            this.stateTimer -= dt;

            if (this.stateTimer <= 0) {
                this.state = 'TIRED';
                this.stateTimer = 5; // Tired for longer
            }
            return; // Immoble
        }

        if (this.state === 'TIRED') {
            this.speed = 0; // Panting...
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                this.state = 'WANDER';
            }
            return;
        }

        let chasing = false;

        if (cat) {
            // Check if grabbed cat
            if (cat.state === 'GRABBED' || cat.state === 'CAUGHT') {
                // Cat is already caught.
                // Maybe I am the one who caught it?
                // If close, I am caught too.
                const dx = cat.x - this.x;
                const dy = cat.y - this.y;
                if (dx * dx + dy * dy < 40 * 40) {
                    // I caught it!
                    // But logic handled in contact? 
                    // Or just check here.
                    // If cat is caught and I am close, I enter GRABBED state.
                    if (this.state !== 'GRABBED') {
                        this.state = 'GRABBED';
                        this.stateTimer = 2; // Immobile for a bit with cat
                    }
                }
            } else {
                const dx = cat.x - this.x;
                const dy = cat.y - this.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < 300 * 300) {
                    // Chance to chase
                    if (this.state !== 'CHASE' && Math.random() < 0.005) {
                        chasing = true;
                        this.state = 'CHASE';
                        this.targetX = cat.x;
                        this.targetY = cat.y;
                        this.speed = this.chaseSpeed;
                    }

                    if (this.state === 'CHASE') {
                        chasing = true; // Continue chasing if already in state
                        this.targetX = cat.x;
                        this.targetY = cat.y;
                    }

                    if (distSq < 20 * 20) {
                        // CATCH!
                        cat.caught();
                        this.state = 'GRABBED';
                        this.stateTimer = 2;
                    }
                }
            }
        }

        if (!chasing && this.state !== 'GRABBED' && this.state !== 'TIRED') {
            this.state = 'WANDER';
            this.speed = this.baseSpeed;
            this.stateTimer -= dt;

            if (this.stateTimer <= 0) {
                this.targetX = this.minX + Math.random() * (this.maxX - this.minX);
                this.targetY = this.minY + Math.random() * (this.maxY - this.minY);
                this.stateTimer = 2 + Math.random() * 4;
            }
        }

        // Move towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;

            this.x += this.vx * dt;
            this.y += this.vy * dt;

            this.angle = Math.atan2(this.vy, this.vx);
        } else {
            this.vx = 0;
            this.vy = 0;
        }

        // Keep bounds (clamping)
        this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
        this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw Dog
        ctx.fillStyle = '#795548'; // Brown

        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(10, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.ellipse(6, -6, 4, 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, 6, 4, 2, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Legs (animation)
        let isMoving = (Math.abs(this.vx) > 1 || Math.abs(this.vy) > 1);

        if (this.state === 'TIRED') {
            // Panting animation?
            // Just static legs splayed
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-6, 3); ctx.lineTo(-10, 8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(6, 3); ctx.lineTo(10, 8); ctx.stroke();
            // Tongue
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath(); ctx.ellipse(14, 2, 3, 1.5, 0.2, 0, Math.PI * 2); ctx.fill();
        } else if (isMoving) {
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 2;
            const t = Date.now() / 150;

            for (let i = 0; i < 4; i++) {
                const legX = (i < 2 ? -6 : 6) + (i % 2 === 0 ? -2 : 2);
                const sway = Math.sin(t + i * Math.PI / 2) * 4;
                ctx.beginPath();
                ctx.moveTo(legX, 3);
                ctx.lineTo(legX + sway, 12);
                ctx.stroke();
            }

            // Tail
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(-18, Math.sin(t * 3) * 5);
            ctx.stroke();
        }

        ctx.restore();
    }
}
