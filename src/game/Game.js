
import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { Track } from './entities/Track.js';
import { Car } from './entities/Car.js';
import { Bug } from './entities/Bug.js';
import { Powerup } from './entities/Powerup.js';
import { BallPlayer } from './entities/BallPlayer.js';
import { Dog } from './entities/Dog.js';
import { Cat } from './entities/Cat.js';
import { AudioController } from './Audio.js';

export class Game {
  constructor() {
    this.renderer = new Renderer('gameCanvas');
    this.input = new Input();
    this.track = new Track();
    this.audio = new AudioController();
    this.entities = [];
    this.score1 = 0;
    this.score2 = 0;

    // Cars
    // P1: Racecar
    this.player1 = new Car(this.track, 1, 'racecar');
    this.player1.speed = 100;
    this.player1.isPlayer = true;
    this.player1.playerId = 1;
    this.p1Controlled = false;

    // P2: Monster
    this.player2 = new Car(this.track, 2, 'monster'); // Use monster for P2
    this.player2.speed = 100;
    this.player2.isPlayer = true;
    this.player2.playerId = 2;
    this.p2Controlled = false;

    this.entities.push(this.player1);
    this.entities.push(this.player2);

    // AI Cars
    this.entities.push(new Car(this.track, 0, 'truck'));
    this.entities.push(new Car(this.track, 3, 'sedan'));

    // Distribute cars
    this.entities.forEach((car, i) => {
      car.distance = i * 150;
      if (!car.isPlayer) {
        car.speed = 100 + Math.random() * 50;
        car.targetSpeed = car.speed;
      }
    });

    // Spawns
    for (let i = 0; i < 8; i++) { // More spawns for 2 players
      this.entities.push(new Bug(this.track));
      this.entities.push(new Powerup(this.track));
    }

    // Pets
    this.entities.push(new Dog(this.track));
    this.entities.push(new Cat(this.track));

    this.state = 'RACE';
    this.lastTime = 0;

    this.ballPlayers = [];
    this.p1InCar = true;
    this.p2InCar = true;
  }

  start() {
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // P1 Enter/Exit (Space)
    if (this.input.isPressed(' ')) {
      if (this.p1InCar) {
        if (this.player1.speed < 50) {
          this.p1InCar = false;
          this.ballPlayers.push(new BallPlayer(this.player1.x + 30, this.player1.y, 1));
          this.audio.playTone(300, 'sine', 0.2);
        }
      } else {
        const idx = this.ballPlayers.findIndex(b => b.playerId === 1);
        if (idx !== -1) {
          const bp = this.ballPlayers[idx];
          const distSq = (bp.x - this.player1.x) ** 2 + (bp.y - this.player1.y) ** 2;
          if (distSq < 40 * 40) {
            this.p1InCar = true;
            this.ballPlayers.splice(idx, 1);
            this.audio.playTone(400, 'square', 0.1);
          }
        }
      }
    }

    // P2 Enter/Exit (Q)
    if (this.input.isPressed('q')) {
      if (this.p2InCar) {
        if (this.player2.speed < 50) {
          this.p2InCar = false;
          this.ballPlayers.push(new BallPlayer(this.player2.x - 30, this.player2.y, 2));
          this.audio.playTone(300, 'sine', 0.2);
        }
      } else {
        const idx = this.ballPlayers.findIndex(b => b.playerId === 2);
        if (idx !== -1) {
          const bp = this.ballPlayers[idx];
          const distSq = (bp.x - this.player2.x) ** 2 + (bp.y - this.player2.y) ** 2;
          if (distSq < 40 * 40) {
            this.p2InCar = true;
            this.ballPlayers.splice(idx, 1);
            this.audio.playTone(400, 'square', 0.1);
          }
        }
      }
    }

    // P1 Control
    if (this.input.isDown('ArrowUp') || this.input.isDown('ArrowDown') ||
      this.input.isDown('ArrowLeft') || this.input.isDown('ArrowRight')) {
      this.p1Controlled = true;
    }

    if (this.p1InCar) {
      if (this.p1Controlled) {
        if (this.player1.laneChangeProgress === 0) {
          if (this.input.isDown('ArrowLeft')) this.player1.changeLane(-1);
          if (this.input.isDown('ArrowRight')) this.player1.changeLane(1);
        }
        if (this.input.isDown('ArrowUp')) {
          this.player1.speed += 300 * dt;
          this.player1.isAccelerating = true;
        } else {
          if (this.input.isDown('ArrowDown')) this.player1.speed -= 300 * dt;
          this.player1.isAccelerating = false;
        }
      } else {
        // Initial Auto-drive before control
        this.player1.speed = 120;
        this.player1.isAccelerating = false;
      }
    } else {
      // Friction when empty
      this.player1.speed *= 0.95;
      this.player1.isAccelerating = false;
    }
    this.player1.speed = Math.max(0, Math.min(this.player1.speed, 600));

    // P2 Control
    if (this.input.isDown('w') || this.input.isDown('s') ||
      this.input.isDown('a') || this.input.isDown('d')) {
      this.p2Controlled = true;
    }

    if (this.p2InCar) {
      if (this.p2Controlled) {
        if (this.player2.laneChangeProgress === 0) {
          if (this.input.isDown('a')) this.player2.changeLane(-1);
          if (this.input.isDown('d')) this.player2.changeLane(1);
        }
        if (this.input.isDown('w')) {
          this.player2.speed += 300 * dt;
          this.player2.isAccelerating = true;
        } else {
          if (this.input.isDown('s')) this.player2.speed -= 300 * dt;
          this.player2.isAccelerating = false;
        }
      } else {
        this.player2.speed = 120;
        this.player2.isAccelerating = false;
      }
    } else {
      this.player2.speed *= 0.95;
      this.player2.isAccelerating = false;
    }
    this.player2.speed = Math.max(0, Math.min(this.player2.speed, 600));

    // Audio
    this.audio.setEngineThrust(this.player1.isAccelerating || this.player2.isAccelerating);


    // Update all entities
    this.entities.forEach(e => {
      if (e.update) e.update(dt, this.entities);
    });

    // Car vs Car Collision (Blocking)
    const cars = this.entities.filter(e => e instanceof Car);
    cars.forEach(car => {
      let minDist = Infinity;
      let blockingCar = null;

      cars.forEach(other => {
        if (car === other) return;
        if (car.lane !== other.lane) return; // Only check same lane

        // Calculate distance ahead
        // Taking track loop into account
        let d = other.distance - car.distance;
        const len = this.track.totalLength;

        // Normalize d to be within [-len/2, len/2] or [0, len]
        // We want d > 0 and small.
        // If d is negative, it might be wrapped.
        // wrapped d: d + len

        // Logic: find positive distance ahead, handling wrap
        // dist modulo length
        let myPos = car.distance % len;
        if (myPos < 0) myPos += len;
        let otherPos = other.distance % len;
        if (otherPos < 0) otherPos += len;

        let diff = otherPos - myPos;
        if (diff < 0) diff += len; // Wrap around

        if (diff < minDist) {
          minDist = diff;
          blockingCar = other;
        }
      });

      // If blocked
      const SAFE_DIST = 60; // Car length + gap
      if (blockingCar && minDist < SAFE_DIST) {
        // Speed match or stop
        car.speed = Math.min(car.speed, blockingCar.speed);
        // Also hard position correction to prevent overlap if speed was too high
        // But smoothing speed is better.
        // If we really hit, we stop or match.
        if (minDist < 40) {
          car.speed = 0; // Crash stop? Or just hard limit?
          // User said "shall not pass", so matching relative 0 is good.
          // Actually, match speed is better feel.
          car.speed = blockingCar.speed;
        }
      }
    });

    // Update BallPlayers
    this.ballPlayers.forEach(bp => bp.update(dt, this.input));

    // Collision Detection
    // Collision Detection
    // Check Cars vs Items
    this.entities.forEach(e => {
      if (e instanceof Car) {
        const p = e;
        this.entities.forEach(item => {
          if (item === p) return;
          if (!item.active) return;
          if (!(item instanceof Bug || item instanceof Powerup || item instanceof Dog || item instanceof Cat)) return;

          if (item.distance !== undefined && p.distance !== undefined) {
            let distDiff = Math.abs(p.distance - item.distance);
            const totalLen = this.track.totalLength;
            if (distDiff > totalLen / 2) distDiff = totalLen - distDiff;
            // Optimization: skip if far on track loop
            if (distDiff > 200) return;
          }

          const dx = p.x - item.x;
          const dy = p.y - item.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 30 * 30 && Math.abs(p.z - (item.z || 0)) < 0.5) {
            this.handleCollision(p, item);
          }
        });
      }
    });

    // Check BallPlayers vs Items
    this.ballPlayers.forEach(p => {
      this.entities.forEach(item => {
        if (!item.active) return;
        if (!(item instanceof Bug || item instanceof Powerup || item instanceof Dog || item instanceof Cat)) return;

        const dx = p.x - item.x;
        const dy = p.y - item.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 30 * 30) {
          this.handleCollision(p, item);
        }
      });
    });

    // Check Cars vs BallPlayers
    cars.forEach(car => {
      this.ballPlayers.forEach(bp => {
        const dx = car.x - bp.x;
        const dy = car.y - bp.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 40 * 40 && Math.abs(car.z - (bp.z || 0)) < 20) {
          this.handleCollision(car, bp);
        }
      });
    });

    this.entities = this.entities.filter(e => e.active !== false);

    // Respawn
    if (Math.random() < 0.02) {
      if (Math.random() > 0.5) this.entities.push(new Bug(this.track));
      else this.entities.push(new Powerup(this.track));
    }

    this.input.update();
  }

  handleCollision(actor, item) {
    const isPlayer = actor.isPlayer || (actor instanceof BallPlayer);
    const playerId = actor.playerId;

    if (item instanceof Bug) {
      const points = -5;
      if (playerId === 1) this.score1 = Math.max(0, this.score1 + points);
      if (playerId === 2) this.score2 = Math.max(0, this.score2 + points);

      if (actor.score !== undefined) actor.score = Math.max(0, actor.score + points);

      if (actor instanceof Car) actor.speed *= 0.5;
      if (actor instanceof BallPlayer) {
        actor.vx *= 0.5;
        actor.vy *= 0.5;
      }

      item.active = false;
      this.audio.playSplat();
    } else if (item instanceof Powerup) {
      const points = 10;
      if (playerId === 1) this.score1 += points;
      if (playerId === 2) this.score2 += points;

      if (actor.score !== undefined) actor.score += points;

      item.active = false;
      this.audio.playCoin();
    } else if (item instanceof Dog || item instanceof Cat || item instanceof BallPlayer) {
      // Stop the actor
      if (actor instanceof Car) {
        actor.speed = 0;
      }
      if (actor instanceof BallPlayer) {
        actor.vx = 0;
        actor.vy = 0;
      }

      const now = Date.now();
      if (!item.lastSoundTime || now - item.lastSoundTime > 1000) {
        this.audio.playTone(150, 'sawtooth', 0.5); // Bark/Meow sound placeholder
        item.lastSoundTime = now;
      }
    }
  }

  draw() {
    this.renderer.clear();

    // Fit track logic...
    const minX = -150, maxX = 1100;
    const minY = 50, maxY = 650;
    const trackW = maxX - minX;
    const trackH = maxY - minY;
    const canvasW = this.renderer.canvas.width;
    const canvasH = this.renderer.canvas.height;
    const padding = 50;
    const scaleX = (canvasW - padding * 2) / trackW;
    const scaleY = (canvasH - padding * 2) / trackH;
    const scale = Math.min(scaleX, scaleY);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const camX = canvasW / 2;
    const camY = canvasH / 2;

    this.renderer.ctx.save();
    this.renderer.ctx.translate(camX, camY);
    this.renderer.ctx.scale(scale, scale);
    this.renderer.ctx.translate(-midX, -midY);

    this.renderer.drawLayer(this.track, this.entities, 0);
    this.renderer.drawLayer(this.track, this.entities, 1);

    this.ballPlayers.forEach(bp => {
      bp.draw(this.renderer.ctx);
    });

    this.renderer.ctx.restore();

    // HUD
    this.renderer.drawText(`FPS: ${Math.round(1000 / (this.lastTime - (performance.now() - 16)))}`, 10, 30);

    // P1 Stats (Left)
    this.renderer.drawText(`P1 (Arrows)`, 10, 60, 20, '#e74c3c');
    this.renderer.drawText(`Score: ${this.score1}`, 10, 85, 25, '#f1c40f');
    this.renderer.drawText(`Speed: ${Math.round(this.player1.speed)}`, 10, 110, 20, '#fff');

    // P2 Stats (Right)
    const rightX = canvasW - 200;
    this.renderer.drawText(`P2 (WASD)`, rightX, 60, 20, '#9b59b6');
    this.renderer.drawText(`Score: ${this.score2}`, rightX, 85, 25, '#f1c40f');
    this.renderer.drawText(`Speed: ${Math.round(this.player2.speed)}`, rightX, 110, 20, '#fff');

    if (!this.p1InCar) {
      this.renderer.drawText(`P1 OUT!`, canvasW / 2 - 100, canvasH - 80, 20, '#e74c3c');
    }
    if (!this.p2InCar) {
      this.renderer.drawText(`P2 OUT!`, canvasW / 2 - 100, canvasH - 50, 20, '#9b59b6');
    }
  }
}
