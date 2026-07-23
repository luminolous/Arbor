let buffer;
let nodeCounter = 0;

const state = {
  neurons: [],
  graph: null,
  attractorField: null,
  growthAccumulator: 0,
  activePulses: [],
  synapseFlashes: [],
  nextFireTime: 0,
  params: {
    influenceRadius: 60,
    killDistance: 12,
    stepLength: 6,
    branchProbability: 0.12,
    synapseThreshold: 8,
    gridCellSize: 20,
    neuronCount: 120,
    growthSpeed: 1,
    pulseSpeed: 0.28,
    showAttractors: false
  }
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  buffer = createGraphics(windowWidth, windowHeight);

  Controls.init(state.params, {
    onReset: resetSimulation,
    onSpeedChange: (v) => { state.params.growthSpeed = v; }
  });

  resetSimulation();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  buffer = createGraphics(windowWidth, windowHeight);
  resetSimulation();
}

function resetSimulation() {
  state.graph = new Graph();
  state.neurons = [];
  state.activePulses = [];
  state.synapseFlashes = [];
  state.growthAccumulator = 0;
  nodeCounter = 0;
  buffer.background('#0A0E13');

  const count = Math.round(state.params.neuronCount);
  const margin = 60;
  const somas = [];
  for (let i = 0; i < count; i++) {
    somas.push({
      x: random(margin, max(margin + 1, width - margin)),
      y: random(margin, max(margin + 1, height - margin))
    });
  }
  for (let i = 0; i < count; i++) {
    const neuron = new Neuron(i, somas[i]);
    neuron.spawnInitialTips(4, state.graph);
    state.neurons.push(neuron);
  }

  state.attractorField = AttractorField.generate(width, height, somas, state.params);
  state.nextFireTime = millis() + 1500;
}

function draw() {
  image(buffer, 0, 0);

  state.growthAccumulator += state.params.growthSpeed;
  while (state.growthAccumulator >= 1) {
    growthTick();
    state.growthAccumulator -= 1;
  }

  detectSynapses(
    state.neurons,
    state.params.gridCellSize,
    state.params.synapseThreshold,
    state.graph,
    onSynapseFormed
  );

  let synapseCount = 0;
  for (const edges of state.graph.edges.values()) {
    for (const e of edges) if (e.isSynapse) synapseCount++;
  }
  synapseCount = synapseCount / 2;

  if (state.params.showAttractors) renderAttractors();
  renderTips();
  renderSynapseFlashes();
  renderPulses();
  maybeFirePulse();

  Controls.updateStats({ synapses: synapseCount, fps: Math.round(frameRate()) });
}

function growthTick() {
  for (const neuron of state.neurons) {
    const newTips = [];
    for (const tip of neuron.tips) {
      if (!tip.alive) continue;
      const result = computeGrowthStep(tip, state.attractorField, state.params);

      if (result.type === 'advance') {
        const segment = new Segment(tip.pos, result.newPos, neuron.id);
        neuron.segments.push(segment);
        drawSegmentToBuffer(segment);

        const newNodeId = `n${nodeCounter++}`;
        state.graph.addNode(newNodeId, result.newPos);
        state.graph.addEdge(
          tip.nodeId,
          newNodeId,
          dist(tip.pos.x, tip.pos.y, result.newPos.x, result.newPos.y)
        );

        tip.parentSegment = segment;
        tip.pos = result.newPos;
        tip.dir = result.dir;
        tip.nodeId = newNodeId;
      } else {
        if (random() < state.params.branchProbability) {
          const angle = atan2(tip.dir.y, tip.dir.x);
          const spread = 0.5;
          newTips.push(new Tip(tip.pos, { x: cos(angle - spread), y: sin(angle - spread) }, tip.nodeId));
          newTips.push(new Tip(tip.pos, { x: cos(angle + spread), y: sin(angle + spread) }, tip.nodeId));
        }
        tip.alive = false;
      }
    }
    if (newTips.length) neuron.tips.push(...newTips);
  }
}

function drawSegmentToBuffer(segment) {
  buffer.stroke('#3A4550');
  buffer.strokeWeight(1.2);
  buffer.line(segment.from.x, segment.from.y, segment.to.x, segment.to.y);
}

function onSynapseFormed(tipA, tipB) {
  const mx = (tipA.pos.x + tipB.pos.x) / 2;
  const my = (tipA.pos.y + tipB.pos.y) / 2;
  buffer.noStroke();
  buffer.fill('#D9A566');
  buffer.circle(mx, my, 4);
  state.synapseFlashes.push({ x: mx, y: my, start: millis() });
}

function renderAttractors() {
  noStroke();
  fill('#4A5560');
  for (const p of state.attractorField.points) {
    if (p.alive) circle(p.x, p.y, 3);
  }
}

function renderTips() {
  noStroke();
  fill('#6B7785');
  for (const neuron of state.neurons) {
    for (const tip of neuron.tips) {
      if (tip.alive) circle(tip.pos.x, tip.pos.y, 3);
    }
  }
}

function renderSynapseFlashes() {
  const now = millis();
  state.synapseFlashes = state.synapseFlashes.filter(f => now - f.start < 500);
  for (const f of state.synapseFlashes) {
    const t = (now - f.start) / 500;
    noFill();
    stroke(217, 165, 102, lerp(180, 0, t));
    strokeWeight(1.5);
    circle(f.x, f.y, lerp(4, 18, t));
  }
}

function renderPulses() {
  const now = millis();
  noStroke();
  const remaining = [];

  for (const p of state.activePulses) {
    if (now >= p.absEnd) {
      if (p.isSynapse) {
        state.synapseFlashes.push({ x: p.toPos.x, y: p.toPos.y, start: now });
        Controls.flashActivity();
      }
      continue;
    }
    if (now < p.absStart) {
      remaining.push(p);
      continue;
    }

    const t = constrain((now - p.absStart) / (p.absEnd - p.absStart), 0, 1);
    const x = lerp(p.fromPos.x, p.toPos.x, t);
    const y = lerp(p.fromPos.y, p.toPos.y, t);

    drawingContext.shadowBlur = 12;
    drawingContext.shadowColor = '#FFB86B';
    fill('#FFDD9C');
    circle(x, y, 5);
    fill('#FFB86B');
    circle(x, y, 3);
    drawingContext.shadowBlur = 0;

    remaining.push(p);
  }
  state.activePulses = remaining;
}

function maybeFirePulse() {
  if (millis() < state.nextFireTime) return;

  const sourceIds = [...state.graph.nodes.keys()].filter(
    id => id.startsWith('soma-') && state.graph.edges.get(id).length > 0
  );

  if (sourceIds.length > 0) {
    const sourceId = random(sourceIds);
    const events = propagate(state.graph, sourceId, state.params.pulseSpeed);
    const now = millis();
    for (const e of events) {
      state.activePulses.push({
        fromPos: e.fromPos,
        toPos: e.toPos,
        absStart: now + e.startTime,
        absEnd: now + e.endTime,
        isSynapse: e.isSynapse
      });
    }
  }
  state.nextFireTime = millis() + random(1500, 4000);
}
