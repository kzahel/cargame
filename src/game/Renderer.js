
export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    clear() {
        this.ctx.fillStyle = '#8bc34a'; // Grass color background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawText(text, x, y, size = 20, color = 'white') {
        this.ctx.fillStyle = color;
        this.ctx.font = `${size}px "Outfit", sans-serif`;
        this.ctx.fillText(text, x, y);
    }

    // Placeholder for later
    drawLayer(track, entities, layer) {
        track.drawLayer(this.ctx, layer);
        entities.forEach(entity => {
            if (Math.round(entity.z) === layer) {
                entity.draw(this.ctx);
            }
        });
    }
}
