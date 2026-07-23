class Tip {
  constructor(pos, dir, nodeId, parentSegment = null) {
    this.pos = { x: pos.x, y: pos.y };
    this.dir = { x: dir.x, y: dir.y };
    this.alive = true;
    this.parentSegment = parentSegment;
    this.nodeId = nodeId;
  }
}

class Segment {
  constructor(from, to, neuronId) {
    this.from = { x: from.x, y: from.y };
    this.to = { x: to.x, y: to.y };
    this.neuronId = neuronId;
  }
}

class Neuron {
  constructor(id, soma) {
    this.id = id;
    this.soma = { x: soma.x, y: soma.y };
    this.tips = [];
    this.segments = [];
  }

  spawnInitialTips(count, graph) {
    const nodeId = `soma-${this.id}`;
    graph.addNode(nodeId, this.soma);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const dir = { x: Math.cos(angle), y: Math.sin(angle) };
      this.tips.push(new Tip(this.soma, dir, nodeId));
    }
  }
}
