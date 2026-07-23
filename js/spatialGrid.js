class SpatialGrid {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  _cellKey(x, y) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  insert(item, x, y) {
    const key = this._cellKey(x, y);
    if (!this.cells.has(key)) this.cells.set(key, []);
    this.cells.get(key).push({ item, x, y });
  }

  queryNeighbors(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const out = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = this.cells.get(`${cx + dx},${cy + dy}`);
        if (bucket) out.push(...bucket);
      }
    }
    return out;
  }
}
