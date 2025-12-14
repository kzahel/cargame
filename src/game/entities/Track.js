
export class Track {
    constructor() {
        this.laneWidth = 40;
        this.laneCount = 4;
        this.roadWidth = this.laneWidth * this.laneCount;
        this.color = '#555';
        this.lineColor = '#fff';
        this.borderColor = '#c0392b';

        // Simple Loop Track
        // Center is approx 400, 300
        this.waypoints = [
            { x: 100, y: 500, z: 0 }, // Bottom Left
            { x: 400, y: 600, z: 0 }, // Bottom Middle
            { x: 700, y: 500, z: 0 }, // Bottom Right
            { x: 900, y: 300, z: 0 }, // Right Curve
            { x: 700, y: 100, z: 0 }, // Top Right
            { x: 400, y: 200, z: 0 }, // Top Middle
            { x: 100, y: 100, z: 0 }, // Top Left
            { x: -100, y: 300, z: 0 }, // Left Curve
        ];

        this.segments = [];
        this.totalLength = 0;
        this.buildSplineTrack();
    }

    buildSplineTrack() {
        // Catmull-Rom Spline
        const points = this.waypoints;
        const resolution = 40; // segments per point
        this.segments = [];
        this.totalLength = 0;

        // We need to pad points for loop: add last to start, and first to end
        // P-1, P0, P1, P2...
        const paddedPoints = [
            points[points.length - 1],
            ...points,
            points[0],
            points[1]
        ];

        for (let i = 1; i < paddedPoints.length - 2; i++) {
            const p0 = paddedPoints[i - 1];
            const p1 = paddedPoints[i];
            const p2 = paddedPoints[i + 1];
            const p3 = paddedPoints[i + 2];

            for (let t = 0; t < 1; t += 1 / resolution) {
                const p = this.catmullRom(p0, p1, p2, p3, t);
                const nextT = t + 1 / resolution;
                const nextP = this.catmullRom(p0, p1, p2, p3, nextT);

                const dx = nextP.x - p.x;
                const dy = nextP.y - p.y;
                const len = Math.sqrt(dx * dx + dy * dy);

                // Simple linear Z interpolation + discrete layering
                const z = p1.z + (p2.z - p1.z) * t;
                const drawZ = Math.round(z);

                this.segments.push({
                    p1: p,
                    p2: nextP,
                    length: len,
                    startDist: this.totalLength,
                    z: drawZ,
                    normal: { x: -dy / len, y: dx / len }
                });
                this.totalLength += len;
            }
        }

        // Post-process for smooth normals
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            const prev = this.segments[(i - 1 + this.segments.length) % this.segments.length];
            const next = this.segments[(i + 1) % this.segments.length];

            // proper average of adjacent face normals
            let nx1 = prev.normal.x + seg.normal.x;
            let ny1 = prev.normal.y + seg.normal.y;
            const l1 = Math.hypot(nx1, ny1);
            seg.n1 = { x: nx1 / l1, y: ny1 / l1 };

            let nx2 = seg.normal.x + next.normal.x;
            let ny2 = seg.normal.y + next.normal.y;
            const l2 = Math.hypot(nx2, ny2);
            seg.n2 = { x: nx2 / l2, y: ny2 / l2 };
        }
    }

    catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;

        const x = 0.5 * (
            (2 * p1.x) +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );

        const y = 0.5 * (
            (2 * p1.y) +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );

        return { x, y };
    }

    getLanePosition(dist, laneIndex) {
        dist = dist % this.totalLength;
        if (dist < 0) dist += this.totalLength;

        const segment = this.segments.find(s => dist >= s.startDist && dist < s.startDist + s.length) || this.segments[this.segments.length - 1];

        const localDist = dist - segment.startDist;
        const t = localDist / segment.length;

        // Lerp position
        const x = segment.p1.x + (segment.p2.x - segment.p1.x) * t;
        const y = segment.p1.y + (segment.p2.y - segment.p1.y) * t;

        // Lerp Normal (Smooth curves)
        const nx = segment.n1.x + (segment.n2.x - segment.n1.x) * t;
        const ny = segment.n1.y + (segment.n2.y - segment.n1.y) * t;
        const nLen = Math.hypot(nx, ny);
        const normalX = nx / nLen;
        const normalY = ny / nLen;

        const offset = (laneIndex - (this.laneCount - 1) / 2) * this.laneWidth;

        // Tangent is perpendicular to normal: {-ny, nx} check?
        // Normal was {-dy, dx}. So tangent is {dx, dy}.
        // If Normal is {0, 1} (Down), Tangent is {1, 0} (Right).
        // Tangent from Normal(x,y): {y, -x}.
        // Check: Normal(0,1) -> Tangent(1, 0). Correct.

        return {
            x: x + normalX * offset,
            y: y + normalY * offset,
            z: segment.z,
            angle: Math.atan2(-normalX, normalY)
            // Tangent = {normalY, -normalX}
            // angle = atan2(-normalX, normalY)
        };
    }

    draw(ctx) {
        // unused directly if valid renderer
    }

    drawLayer(ctx, layer) {
        // Optimization: Draw as single path?
        // Segments are contiguous.
        // If consecutive segments share Z, we can lineTo.
        // If Z changes, stroke and start new.

        // Draw Border first (so it's behind the road surface)
        ctx.lineWidth = this.roadWidth + 4;
        ctx.strokeStyle = this.borderColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        let isDrawing = false;
        ctx.beginPath();
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            if (seg.z === layer) {
                if (!isDrawing) {
                    ctx.moveTo(seg.p1.x, seg.p1.y);
                    isDrawing = true;
                }
                ctx.lineTo(seg.p2.x, seg.p2.y);
            } else {
                if (isDrawing) {
                    ctx.stroke();
                    ctx.beginPath();
                    isDrawing = false;
                }
            }
        }
        if (isDrawing) ctx.stroke();

        // Draw Road surface
        ctx.lineWidth = this.roadWidth;
        ctx.strokeStyle = this.color;
        isDrawing = false;
        ctx.beginPath();

        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            if (seg.z === layer) {
                if (!isDrawing) {
                    ctx.moveTo(seg.p1.x, seg.p1.y);
                    isDrawing = true;
                }
                ctx.lineTo(seg.p2.x, seg.p2.y);
            } else {
                if (isDrawing) {
                    ctx.stroke();
                    ctx.beginPath();
                    isDrawing = false;
                }
            }
        }
        if (isDrawing) ctx.stroke();


        // Dashes
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.lineColor;
        ctx.setLineDash([20, 20]);
        for (let l = 1; l < this.laneCount; l++) {
            const offset = (l - (this.laneCount - 1) / 2) * this.laneWidth;
            isDrawing = false;
            ctx.beginPath();

            for (let i = 0; i < this.segments.length; i++) {
                const seg = this.segments[i];
                if (seg.z === layer) {
                    const ox1 = seg.n1.x * offset;
                    const oy1 = seg.n1.y * offset;
                    const ox2 = seg.n2.x * offset;
                    const oy2 = seg.n2.y * offset;

                    if (!isDrawing) {
                        ctx.moveTo(seg.p1.x + ox1, seg.p1.y + oy1);
                        isDrawing = true;
                    }
                    ctx.lineTo(seg.p2.x + ox2, seg.p2.y + oy2);
                } else {
                    if (isDrawing) {
                        ctx.stroke();
                        ctx.beginPath();
                        isDrawing = false;
                    }
                }
            }
            if (isDrawing) ctx.stroke();
        }
        ctx.setLineDash([]);
    }
}
