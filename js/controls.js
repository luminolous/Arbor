const Controls = (() => {
  let onReset = () => {};
  let onSpeedChange = () => {};

  function init(params, callbacks) {
    onReset = callbacks.onReset;
    onSpeedChange = callbacks.onSpeedChange;

    const neuronSlider = document.getElementById('neuronCount');
    const neuronValue = document.getElementById('neuronCountValue');
    const speedSlider = document.getElementById('growthSpeed');
    const speedValue = document.getElementById('growthSpeedValue');
    const resetBtn = document.getElementById('resetBtn');
    const attractorsToggle = document.getElementById('showAttractors');

    neuronSlider.value = params.neuronCount;
    neuronValue.textContent = params.neuronCount;
    speedSlider.value = params.growthSpeed;
    speedValue.textContent = `${Number(params.growthSpeed).toFixed(2)}x`;

    neuronSlider.addEventListener('input', () => {
      params.neuronCount = Number(neuronSlider.value);
      neuronValue.textContent = params.neuronCount;
    });

    speedSlider.addEventListener('input', () => {
      params.growthSpeed = Number(speedSlider.value);
      speedValue.textContent = `${params.growthSpeed.toFixed(2)}x`;
      onSpeedChange(params.growthSpeed);
    });

    resetBtn.addEventListener('click', () => onReset());

    attractorsToggle.checked = params.showAttractors;
    attractorsToggle.addEventListener('change', () => {
      params.showAttractors = attractorsToggle.checked;
    });
  }

  function updateStats({ synapses, fps }) {
    document.getElementById('statSynapses').textContent = synapses;
    document.getElementById('statFps').textContent = fps;
  }

  function flashActivity() {
    const el = document.getElementById('activityIndicator');
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  return { init, updateStats, flashActivity };
})();
