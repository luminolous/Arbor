class Graph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(id, pos) {
    if (this.nodes.has(id)) return;
    this.nodes.set(id, { x: pos.x, y: pos.y });
    this.edges.set(id, []);
  }

  addEdge(idA, idB, weight, isSynapse = false) {
    const posA = this.nodes.get(idA);
    const posB = this.nodes.get(idB);
    this.edges.get(idA).push({ toId: idB, weight, fromPos: posA, toPos: posB, isSynapse });
    this.edges.get(idB).push({ toId: idA, weight, fromPos: posB, toPos: posA, isSynapse });
  }
}

function detectSynapses(neurons, cellSize, threshold, graph, onSynapse) {
  const grid = new SpatialGrid(cellSize);
  for (const neuron of neurons) {
    for (const tip of neuron.tips) {
      if (tip.alive) grid.insert({ neuron, tip }, tip.pos.x, tip.pos.y);
    }
  }

  const checked = new Set();
  for (const neuron of neurons) {
    for (const tip of neuron.tips) {
      if (!tip.alive) continue;
      for (const c of grid.queryNeighbors(tip.pos.x, tip.pos.y)) {
        if (c.item.neuron.id === neuron.id || !c.item.tip.alive) continue;
        const pairKey = tip.nodeId < c.item.tip.nodeId
          ? `${tip.nodeId}|${c.item.tip.nodeId}`
          : `${c.item.tip.nodeId}|${tip.nodeId}`;
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        if (dist(tip.pos.x, tip.pos.y, c.x, c.y) <= threshold) {
          tip.alive = false;
          c.item.tip.alive = false;
          graph.addEdge(tip.nodeId, c.item.tip.nodeId, threshold, true);
          onSynapse(tip, c.item.tip, neuron, c.item.neuron);
        }
      }
    }
  }
}

function propagate(graph, sourceId, speed) {
  const events = [];
  const arrival = new Map([[sourceId, 0]]);
  const visited = new Set();
  const frontier = [{ id: sourceId, time: 0 }];

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.time - b.time);
    const current = frontier.shift();
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    for (const edge of graph.edges.get(current.id) || []) {
      const arriveTime = current.time + edge.weight / speed;
      if (!arrival.has(edge.toId) || arriveTime < arrival.get(edge.toId)) {
        arrival.set(edge.toId, arriveTime);
        events.push({
          fromPos: edge.fromPos,
          toPos: edge.toPos,
          startTime: current.time,
          endTime: arriveTime,
          isSynapse: edge.isSynapse
        });
        frontier.push({ id: edge.toId, time: arriveTime });
      }
    }
  }
  return events;
}
