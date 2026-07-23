class AttractorField {
  constructor(points, cellSize) {
    this.points = points;
    this.grid = new SpatialGrid(cellSize);
    for (const p of points) this.grid.insert(p, p.x, p.y);
  }

  static generate(width, height, somas, params) {
    const area = width * height;
    const count = Math.max(400, Math.min(4000, Math.round(area / 3000)));
    const biasedCount = Math.round(count * 0.3);
    const points = [];

    for (let i = 0; i < biasedCount && somas.length > 0; i++) {
      const soma = somas[Math.floor(Math.random() * somas.length)];
      const r = Math.random() * 150;
      const a = Math.random() * Math.PI * 2;
      points.push({ x: soma.x + Math.cos(a) * r, y: soma.y + Math.sin(a) * r, alive: true });
    }
    for (let i = biasedCount; i < count; i++) {
      points.push({ x: Math.random() * width, y: Math.random() * height, alive: true });
    }
    return new AttractorField(points, params.influenceRadius);
  }

  queryInfluence(x, y, radius) {
    const out = [];
    for (const e of this.grid.queryNeighbors(x, y)) {
      if (e.item.alive && dist(e.x, e.y, x, y) <= radius) out.push(e.item);
    }
    return out;
  }

  killWithin(x, y, radius) {
    for (const e of this.grid.queryNeighbors(x, y)) {
      if (e.item.alive && dist(e.x, e.y, x, y) <= radius) e.item.alive = false;
    }
  }
}

function computeGrowthStep(tip, attractorField, params) {
  const influencers = attractorField.queryInfluence(tip.pos.x, tip.pos.y, params.influenceRadius);
  if (influencers.length === 0) return { type: 'stall' };

  let ax = 0, ay = 0;
  for (const a of influencers) {
    const dx = a.x - tip.pos.x, dy = a.y - tip.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    ax += dx / d;
    ay += dy / d;
  }
  const alen = Math.sqrt(ax * ax + ay * ay) || 1;
  ax /= alen;
  ay /= alen;

  let dx = tip.dir.x * 0.4 + ax * 0.6;
  let dy = tip.dir.y * 0.4 + ay * 0.6;
  const dlen = Math.sqrt(dx * dx + dy * dy) || 1;
  dx /= dlen;
  dy /= dlen;

  const newPos = { x: tip.pos.x + dx * params.stepLength, y: tip.pos.y + dy * params.stepLength };
  attractorField.killWithin(newPos.x, newPos.y, params.killDistance);
  return { type: 'advance', dir: { x: dx, y: dy }, newPos };
}
