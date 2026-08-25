// State management variables
let isPlaying = true;
let currentDb = 36;
let smoothedDbVal = 36;
let currentLevel = 'quiet';
let wavePhase = 0; // Waveform phase for high performance rendering
let stats = {
  current: 36,
  max: 58,
  min: 32,
  average: 42
};

// Interaction configuration
let isRealMic = false;
let calibrationOffset = 0;
let history = [35, 36, 34, 38, 36, 35, 37, 39, 36, 38, 37, 35];
let simulationScenario = 'classroom'; // Alternative scenarios: 'classroom', 'cafe', 'subway'

// Average stats trackers
let historySum = 42 * 12;
let historyCount = 12;

// Web Audio API refs
let audioContext = null;
let analyser = null;
let stream = null;
let animationFrameId = null;
let simulationIntervalId = null;

// Initialize the application and load UI events
window.addEventListener('DOMContentLoaded', () => {
  setupUIEvents();
  startSimulation();
  updateUI();
  
  // Try to set up microphone automatically if possible, or gracefully fallback
  setupMicrophone();
  
  // Start high performance 60 FPS real-time wave drawing loop
  startWavechartRenderLoop();
});

// Configure Scenario Selector and Button Clicks
function setupUIEvents() {
  const toggleBtn = document.getElementById('toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) {
        // ALWAYS try starting the real mic on click! It handles falling back to simulation if blocked.
        startRealMicrophoneAnalysis();
      } else {
        stopAudioAnalysis();
      }
      updateUI();
    });
  }

  const resetStatsBtn = document.getElementById('reset-stats-btn');
  if (resetStatsBtn) {
    resetStatsBtn.addEventListener('click', () => {
      resetStatistics();
    });
  }

  // Intercept and bind decibel sensitivity slider inputs
  const sensitivitySlider = document.getElementById('sensitivity-slider');
  const sensitivityVal = document.getElementById('sensitivity-val');
  if (sensitivitySlider) {
    // Initialize offset based on default slider value (5 maps to 0 offset)
    const initVal = parseInt(sensitivitySlider.value);
    calibrationOffset = (initVal - 5) * 3;
    if (sensitivityVal) {
      sensitivityVal.textContent = initVal;
    }

    sensitivitySlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      calibrationOffset = (val - 5) * 3;
      if (sensitivityVal) {
        sensitivityVal.textContent = val;
      }
      // Re-trigger an instant state render update so any user changes are shown instantly
      updateUI();
    });
  }
}

// Register noise values, accumulate stats
function registerNewDbValue(newDb) {
  const finalDb = Math.max(20, Math.min(120, Math.round(newDb + calibrationOffset)));
  
  // Apply exponential smoothing (low-pass filter) to eliminate rapid flickering
  const smoothingFactor = 0.08; // smooth but responsive coefficient
  smoothedDbVal = (smoothedDbVal * (1 - smoothingFactor)) + (finalDb * smoothingFactor);
  
  const displayedDb = Math.round(smoothedDbVal);
  currentDb = displayedDb;
  
  // Update history buffer
  history.push(displayedDb);
  if (history.length > 50) {
    history.shift();
  }

  // Update Stats Objects
  stats.current = displayedDb;
  stats.max = Math.max(stats.max, displayedDb);
  stats.min = stats.min === 0 ? displayedDb : Math.min(stats.min, displayedDb);
  
  historySum += displayedDb;
  historyCount += 1;
  stats.average = Math.round(historySum / historyCount);
  
  // Re-render UI details
  updateUI();
}

// Clean up actual streams and animation loops
function stopAudioAnalysis() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (simulationIntervalId) {
    clearInterval(simulationIntervalId);
    simulationIntervalId = null;
  }
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  if (audioContext) {
    if (audioContext.state !== 'closed') {
      audioContext.close();
    }
    audioContext = null;
  }
  analyser = null;
}

// Start browser web audio recorder
async function setupMicrophone() {
  // Check if navigator.mediaDevices and getUserMedia exist
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.log('Web audio mic not supported. Launching beautiful simulation fallback mode.');
    isRealMic = false;
    return;
  }

  try {
    // Request initial mic stream to check permission
    const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // If granted, we can switch to real micro model
    tempStream.getTracks().forEach(track => track.stop());
    
    isRealMic = true;
    if (isPlaying) {
      if (simulationIntervalId) {
        clearInterval(simulationIntervalId);
        simulationIntervalId = null;
      }
      startRealMicrophoneAnalysis();
    }
  } catch (err) {
    console.log('Microphone permission deferred or denied. Working in high-fidelity simulation fallbacks.');
    isRealMic = false;
  }
}

// Real Microphone web audio analyzer frequency loop
async function startRealMicrophoneAnalysis() {
  stopAudioAnalysis();
  
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    audioContext = new AudioContextClass();
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Resume audio context if suspended (common browser security constraint)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    isRealMic = true; // Mark as real mic after successful setup
    
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    
    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);
    
    const analyzeFreq = () => {
      if (!analyser || !isPlaying) return;
      
      analyser.getFloatTimeDomainData(dataArray);
      
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        sumSquares += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sumSquares / bufferLength);
      
      // Calculate physics conversion matching sound ranges
      let dbSpl = rms > 0.0001 ? 20 * Math.log10(rms) + 94 : 30;
      
      // Fine-tune and bind values to warm classroom baseline
      if (dbSpl < 30) {
        dbSpl = 30 + Math.random() * 2;
      }
      
      registerNewDbValue(dbSpl);
      animationFrameId = requestAnimationFrame(analyzeFreq);
    };
    
    animationFrameId = requestAnimationFrame(analyzeFreq);
  } catch (err) {
    console.error('Real mic start-up failed. Using simulator fallback:', err);
    isRealMic = false;
    startSimulation();
  }
}

// High Fidelity Brownian Motion Simulator
function startSimulation() {
  if (simulationIntervalId) {
    clearInterval(simulationIntervalId);
  }
  
  simulationIntervalId = setInterval(() => {
    if (isRealMic || !isPlaying) return;
    
    let center = 38;
    let spread = 6;
    
    if (simulationScenario === 'classroom') {
      center = 38;
      spread = 6;
    } else if (simulationScenario === 'cafe') {
      center = 58;
      spread = 8;
    } else if (simulationScenario === 'subway') {
      center = 84;
      spread = 12;
    }
    
    const previous = currentDb;
    const drift = (center - previous) * 0.15;
    const bounce = (Math.random() - 0.5) * spread;
    
    let nextDb = Math.round(previous + drift + bounce);
    
    // Safety boundaries for scenario stability
    if (simulationScenario === 'classroom') nextDb = Math.max(30, Math.min(48, nextDb));
    if (simulationScenario === 'cafe') nextDb = Math.max(48, Math.min(72, nextDb));
    if (simulationScenario === 'subway') nextDb = Math.max(72, Math.min(105, nextDb));
    
    registerNewDbValue(nextDb);
  }, 120);
}

// Statistics Resetter
function resetStatistics() {
  smoothedDbVal = currentDb;
  historySum = currentDb;
  historyCount = 1;
  stats.current = currentDb;
  stats.max = currentDb;
  stats.min = currentDb;
  stats.average = currentDb;
  
  history = [currentDb];
  updateUI();
}

// State transitions with hysteresis to prevent flickering at boundaries
function updateLevelState(db) {
  if (currentLevel === 'quiet') {
    if (db >= 50) {
      currentLevel = 'warn';
    }
  } else if (currentLevel === 'warn') {
    if (db >= 70) {
      currentLevel = 'loud';
    } else if (db < 47) { // 3 dB buffer drop-down
      currentLevel = 'quiet';
    }
  } else if (currentLevel === 'loud') {
    if (db < 67) { // 3 dB buffer drop-down
      currentLevel = 'warn';
    }
  }
  return currentLevel;
}

// Retrieve status configuration based on current dB
function getStatusConfig(db) {
  const level = updateLevelState(db);
  
  if (level === 'loud') {
    return {
      level: 'loud',
      title: '시끄러워요',
      desc: '소리를 낮춰주세요 🚨',
      icon: '😨',
      colorClass: 'text-red-500',
      badgeColor: 'bg-[#F87171] text-white',
      badgeLabel: '시끄러움',
      badgeIcon: '🚨',
      recommendation: '귀가 아파요! 가급적 조용한 곳으로 자리를 옮겨 지켜주세요 🚨',
      lamp: 'red'
    };
  } else if (level === 'warn') {
    return {
      level: 'warn',
      title: '조금 시끄러워요',
      desc: '소곤소곤 이야기해요 💬',
      icon: '😐',
      colorClass: 'text-amber-500',
      badgeColor: 'bg-amber-400 text-amber-900',
      badgeLabel: '보통',
      badgeIcon: '😐',
      recommendation: '조금 시끄러워요.<br>가벼운 수다 소리가 나요! 🙂',
      lamp: 'yellow'
    };
  } else {
    return {
      level: 'quiet',
      title: '조용해요',
      desc: '딱 좋은 환경이에요! 👍',
      icon: '😊',
      colorClass: 'text-[#31B272]',
      badgeColor: 'bg-[#31B272] text-white',
      badgeLabel: '좋음',
      badgeIcon: '😊',
      recommendation: '집중하기 좋은 환경이에요!<br>지금처럼 유지해요 😊',
      lamp: 'green'
    };
  }
}

// Fully-fledged UI rendering step updating all corresponding static DOM elements
function updateUI() {
  const config = getStatusConfig(currentDb);
  
  // 1. Update Speech Bubble content
  const bubbleIcon = document.getElementById('bubble-icon');
  const bubbleTitle = document.getElementById('bubble-title');
  const bubbleDesc = document.getElementById('bubble-desc');
  
  if (bubbleIcon) bubbleIcon.textContent = config.icon;
  if (bubbleTitle) {
    bubbleTitle.textContent = config.title;
    // Reset/apply class list
    bubbleTitle.className = `font-black tracking-tight ${config.colorClass}`;
    bubbleTitle.style.fontSize = "36px";
  }
  if (bubbleDesc) bubbleDesc.textContent = config.desc;
  
  // 2. Adjust Speech bubble horizontal position based on bubble width shifts (offset right parameter)
  const mascotBubble = document.getElementById('mascot-bubble');
  if (mascotBubble) {
    // Aligns bubble beautifully nicely relative to polar bear positioning
    mascotBubble.style.right = '115px';
  }

  // 3. Update Decibel display and status description
  const dbNumber = document.getElementById('db-number');
  const dbBadge = document.getElementById('db-badge');
  const recommendationText = document.getElementById('recommendation-text');
  
  if (dbNumber) dbNumber.textContent = currentDb;
  if (dbBadge) {
    dbBadge.className = `inline-flex items-center rounded-full font-normal shadow-md tracking-tight ${config.badgeColor}`;
    dbBadge.style.fontSize = "24px";
    dbBadge.style.padding = "10px 24px";
    dbBadge.style.gap = "8px";
    dbBadge.innerHTML = `<span style="font-size: 28px;">${config.badgeIcon}</span><span>${config.badgeLabel}</span>`;
  }
  if (recommendationText) recommendationText.innerHTML = config.recommendation;

  // 4. Update cylinder Traffic Light lights
  const lampRed = document.getElementById('lamp-red');
  const lampYellow = document.getElementById('lamp-yellow');
  const lampGreen = document.getElementById('lamp-green');
  
  if (lampRed && lampYellow && lampGreen) {
    const svgRed = lampRed.querySelector('svg');
    const svgYellow = lampYellow.querySelector('svg');
    const svgGreen = lampGreen.querySelector('svg');

    // Red Light state
    if (config.lamp === 'red') {
      lampRed.className = "rounded-full flex items-center justify-center transition-all duration-300 relative bg-[#FF3B30] border-8 border-[#FF8E85] shadow-[0_0_50px_rgba(255,59,48,0.85),inset_0_4px_10px_rgba(255,255,255,0.4)] z-0 overflow-visible";
      lampRed.querySelector('.ping-ripple').classList.remove('hidden');
      if (svgRed) {
        svgRed.setAttribute('class', 'text-white transition-colors duration-300');
        svgRed.style.width = '60px';
        svgRed.style.height = '60px';
      }
    } else {
      lampRed.className = "rounded-full flex items-center justify-center transition-all duration-300 relative bg-slate-100 border-[6px] border-slate-200/50 z-0 overflow-visible shadow-inner";
      lampRed.querySelector('.ping-ripple').classList.add('hidden');
      if (svgRed) {
        svgRed.setAttribute('class', 'text-slate-300 transition-colors duration-300');
        svgRed.style.width = '60px';
        svgRed.style.height = '60px';
      }
    }
    
    // Yellow Light state
    if (config.lamp === 'yellow') {
      lampYellow.className = "rounded-full flex items-center justify-center transition-all duration-300 relative bg-[#FFCC00] border-8 border-[#FFE380] shadow-[0_0_50px_rgba(255,204,0,0.85),inset_0_4px_10px_rgba(255,255,255,0.4)] z-0 overflow-visible";
      lampYellow.querySelector('.ping-ripple').classList.remove('hidden');
      if (svgYellow) {
        svgYellow.setAttribute('class', 'text-white transition-colors duration-300');
        svgYellow.style.width = '60px';
        svgYellow.style.height = '60px';
      }
    } else {
      lampYellow.className = "rounded-full flex items-center justify-center transition-all duration-300 relative bg-slate-100 border-[6px] border-slate-200/50 z-0 overflow-visible shadow-inner";
      lampYellow.querySelector('.ping-ripple').classList.add('hidden');
      if (svgYellow) {
        svgYellow.setAttribute('class', 'text-slate-300 transition-colors duration-300');
        svgYellow.style.width = '60px';
        svgYellow.style.height = '60px';
      }
    }
    
    // Green Light state
    if (config.lamp === 'green') {
      lampGreen.className = "rounded-full flex items-center justify-center transition-all duration-300 relative bg-[#31B272] border-8 border-[#55D294] shadow-[0_0_50px_rgba(49,178,114,0.85),inset_0_4px_10px_rgba(255,255,255,0.4)] z-0 overflow-visible";
      lampGreen.querySelector('.ping-ripple').classList.remove('hidden');
      if (svgGreen) {
        svgGreen.setAttribute('class', 'text-white transition-colors duration-300');
        svgGreen.style.width = '60px';
        svgGreen.style.height = '60px';
      }
    } else {
      lampGreen.className = "rounded-full flex items-center justify-center transition-all duration-300 relative bg-slate-100 border-[6px] border-slate-200/50 z-0 overflow-visible shadow-inner";
      lampGreen.querySelector('.ping-ripple').classList.add('hidden');
      if (svgGreen) {
        svgGreen.setAttribute('class', 'text-slate-300 transition-colors duration-300');
        svgGreen.style.width = '60px';
        svgGreen.style.height = '60px';
      }
    }
  }

  // Cylinder Side Row Background dynamic highlighted states - Enhanced colors, borders, and 2x height
  const rowRed = document.getElementById('row-red');
  const rowYellow = document.getElementById('row-yellow');
  const rowGreen = document.getElementById('row-green');
  if (rowRed && rowYellow && rowGreen) {
    if (config.lamp === 'red') {
      rowRed.className = "flex flex-col justify-center rounded-3xl px-6 py-4 transition-all h-[116px] border-4 border-red-500 bg-red-100 shadow-lg scale-[1.03]";
    } else {
      rowRed.className = "flex flex-col justify-center rounded-3xl px-6 py-4 transition-all h-[116px] border-2 border-slate-300 bg-white/70 opacity-40";
    }

    if (config.lamp === 'yellow') {
      rowYellow.className = "flex flex-col justify-center rounded-3xl px-6 py-4 transition-all h-[116px] border-4 border-amber-500 bg-amber-100 shadow-lg scale-[1.03]";
    } else {
      rowYellow.className = "flex flex-col justify-center rounded-3xl px-6 py-4 transition-all h-[116px] border-2 border-slate-300 bg-white/70 opacity-40";
    }

    if (config.lamp === 'green') {
      rowGreen.className = "flex flex-col justify-center rounded-3xl px-6 py-4 transition-all h-[116px] border-4 border-emerald-500 bg-emerald-100 shadow-lg scale-[1.03]";
    } else {
      rowGreen.className = "flex flex-col justify-center rounded-3xl px-6 py-4 transition-all h-[116px] border-2 border-transparent bg-emerald-50 border-emerald-100/30 opacity-40";
    }
  }

  // 5. Drawing live Wavechart dynamic path directly inside HTML SVG!
  drawWavechart();

  // 6. Update Min, Max, Average Summary labels
  const statMinText = document.getElementById('stat-min-text');
  const statMaxText = document.getElementById('stat-max-text');
  const statAvgText = document.getElementById('stat-avg-text');
  if (statMinText) statMinText.innerHTML = `${stats.min} <span style="font-size: 20px;" class="font-normal text-slate-400">dB</span>`;
  if (statMaxText) statMaxText.innerHTML = `${stats.max} <span style="font-size: 20px;" class="font-normal text-slate-400">dB</span>`;
  if (statAvgText) statAvgText.innerHTML = `${stats.average} <span style="font-size: 20px;" class="font-normal text-slate-400">dB</span>`;

  // 7. Update bottom action button classes, labels, and 5-bar voice visualizer
  const toggleBtn = document.getElementById('toggle-btn');
  const toggleRipple1 = document.getElementById('toggle-ripple-1');
  const toggleRipple2 = document.getElementById('toggle-ripple-2');
  if (toggleBtn) {
    toggleBtn.style.height = "240px";
    toggleBtn.style.borderRadius = "32px";
    
    // Prevent rewriting innerHTML continuously on every frame; only rewrite on layout switch
    const isCurrentlyPlayingLayout = toggleBtn.getAttribute('data-playing') === 'true';
    if (isPlaying && (!isCurrentlyPlayingLayout || !document.getElementById('vbar-1'))) {
      toggleBtn.setAttribute('data-playing', 'true');
      toggleBtn.className = "w-full flex items-center justify-center hover:shadow-lg active:scale-[0.98] transition-all duration-300 relative overflow-hidden animate-gradient-mint-blue text-white shadow-[0_12px_35px_rgba(2,179,194,0.45)] cursor-pointer";
      toggleBtn.innerHTML = `
        <div class="flex items-center relative z-10 text-white" style="gap: 24px;">
          <span style="font-size: 52px; font-weight: 600;" class="tracking-tight leading-none shrink-0 border-none">측정 중</span>
          <!-- Voice Recognition Audio Visualizer (3~5 vertical round bars) -->
          <div class="flex items-center gap-[9px] select-none text-white shrink-0" style="height: 56px; padding-left: 4px;">
            <span id="vbar-1" class="w-[8px] rounded-full bg-white transition-all duration-75" style="height: 12px; min-height: 8px;"></span>
            <span id="vbar-2" class="w-[8px] rounded-full bg-white transition-all duration-75" style="height: 12px; min-height: 8px;"></span>
            <span id="vbar-3" class="w-[8px] rounded-full bg-white transition-all duration-75" style="height: 12px; min-height: 8px;"></span>
            <span id="vbar-4" class="w-[8px] rounded-full bg-white transition-all duration-75" style="height: 12px; min-height: 8px;"></span>
            <span id="vbar-5" class="w-[8px] rounded-full bg-white transition-all duration-75" style="height: 12px; min-height: 8px;"></span>
          </div>
        </div>
        <span class="absolute inset-0 bg-white/10 animate-breath pointer-events-none z-[1]"></span>
      `;
      if (toggleRipple1) toggleRipple1.className = "absolute inset-x-0 inset-y-1 bg-[#0052E0]/30 animate-ripple-1 pointer-events-none";
      if (toggleRipple2) toggleRipple2.className = "absolute inset-x-0 inset-y-1 bg-[#02b3c2]/25 animate-ripple-2 pointer-events-none";
    } else if (!isPlaying && (isCurrentlyPlayingLayout || toggleBtn.getAttribute('data-playing') === null)) {
      toggleBtn.setAttribute('data-playing', 'false');
      toggleBtn.className = "w-full flex items-center justify-center hover:shadow-lg active:scale-[0.98] transition-all duration-300 relative overflow-hidden bg-[#0052E0] text-white shadow-[0_14px_30px_rgba(0,82,224,0.3)] cursor-pointer";
      toggleBtn.innerHTML = `
        <div class="flex items-center relative z-10 text-white" style="gap: 24px;">
          <span style="font-size: 52px; font-weight: 600;" class="tracking-tight leading-none shrink-0 border-none">측정 시작</span>
          <!-- Paused visualizer dots -->
          <div class="flex items-center gap-[9px] select-none text-white/50 shrink-0" style="height: 56px; padding-left: 4px;">
            <span class="w-[8px] h-2 rounded-full bg-white/70"></span>
            <span class="w-[8px] h-2 rounded-full bg-white/70"></span>
            <span class="w-[8px] h-2 rounded-full bg-white/70"></span>
            <span class="w-[8px] h-2 rounded-full bg-white/70"></span>
            <span class="w-[8px] h-2 rounded-full bg-white/70"></span>
          </div>
        </div>
      `;
      if (toggleRipple1) toggleRipple1.className = "absolute inset-x-0 inset-y-1 bg-[#0052E0]/30 animate-ripple-1 pointer-events-none hidden";
      if (toggleRipple2) toggleRipple2.className = "absolute inset-x-0 inset-y-1 bg-[#02b3c2]/25 animate-ripple-2 pointer-events-none hidden";
    }
  }
}

// High-performance 60 FPS animation render loop for real-time wave drawing
function startWavechartRenderLoop() {
  const render = () => {
    if (isPlaying) {
      wavePhase += 0.22; // natural oscillation speed
    } else {
      wavePhase += 0.03; // tiny calm shimmers when paused
    }
    drawLiveWavechart();
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
}

// Draw the dynamic real-time wave at 60 FPS
function drawLiveWavechart() {
  const maxPoints = 50;
  const width = 720;
  const height = 120;
  const paddingLeft = 12;
  const paddingRight = 12;
  const chartWidth = width - paddingLeft - paddingRight;

  const getXCoord = (index) => {
    return paddingLeft + (index / (maxPoints - 1)) * chartWidth;
  };

  // Convert currentDb to centerY [105, 25] smoothly
  const dbMinVal = 20;
  const dbMaxVal = 100;
  const clampedDb = Math.max(dbMinVal, Math.min(dbMaxVal, currentDb));
  const centerY = 105 - ((clampedDb - dbMinVal) / (dbMaxVal - dbMinVal)) * 80;

  const rawData = [];

  const svgWaveOutline = document.getElementById('svg-wave-outline');
  const svgWaveFill = document.getElementById('svg-wave-fill');
  const svgWavePulsingDotG = document.getElementById('svg-wave-pulsing-dot-group');

  // Handle active rendering and simulation waves
  if (isPlaying && isRealMic && analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(timeData);

    const amplitude = 26 * Math.max(0.12, (currentDb - 20) / 80);

    for (let i = 0; i < maxPoints; i++) {
      const dataIndex = Math.floor((i / (maxPoints - 1)) * (bufferLength - 1));
      const val = timeData[dataIndex];
      const deviation = (val - 128) / 128; // convert [0,255] to [-1,1]
      const envelope = Math.sin((i / (maxPoints - 1)) * Math.PI); // shape is a dome to taper edges smoothly
      const yOffset = deviation * amplitude * envelope;
      rawData.push(centerY + yOffset);
    }
  } else if (isPlaying) {
    // Generate beautiful multi-layered sine wave simulator with tapering ends
    for (let i = 0; i < maxPoints; i++) {
      const xRatio = i / (maxPoints - 1);
      const rawVal = Math.sin(xRatio * Math.PI * 4.5 - wavePhase) * 0.6 + 
                     Math.sin(xRatio * Math.PI * 8.2 + wavePhase * 1.4) * 0.35 +
                     Math.sin(xRatio * Math.PI * 14.0 - wavePhase * 0.7) * 0.12;
      const envelope = Math.sin(xRatio * Math.PI); // shape is a dome, 0 at start/end, 1 at center
      const amplitude = 34 * envelope * Math.max(0.12, (currentDb - 20) / 80);
      const yOffset = rawVal * amplitude;
      rawData.push(centerY + yOffset);
    }
  } else {
    // Elegant tiny shimmers in paused state
    for (let i = 0; i < maxPoints; i++) {
      const xRatio = i / (maxPoints - 1);
      const rawVal = Math.sin(xRatio * Math.PI * 2.0 - wavePhase * 0.2) * 1.0;
      const envelope = Math.sin(xRatio * Math.PI);
      const yOffset = rawVal * envelope * 1.5;
      rawData.push(centerY + yOffset);
    }
  }

  let linePath = `M ${getXCoord(0).toFixed(1)} ${rawData[0].toFixed(1)}`;
  for (let i = 1; i < maxPoints; i++) {
    linePath += ` L ${getXCoord(i).toFixed(1)} ${rawData[i].toFixed(1)}`;
  }
  const fillPath = `${linePath} L ${getXCoord(maxPoints - 1).toFixed(1)} 105 L ${getXCoord(0).toFixed(1)} 105 Z`;

  if (svgWaveOutline) {
    svgWaveOutline.setAttribute('d', linePath);
  }
  if (svgWaveFill) {
    svgWaveFill.setAttribute('d', fillPath);
  }

  // Draw and colorize the leading pulsing indicator dot
  if (svgWavePulsingDotG && rawData.length > 0) {
    const lastIdx = rawData.length - 1;
    const endX = getXCoord(lastIdx);
    const endY = rawData[lastIdx];
    const lastDb = currentDb;
    
    // Color scheme tied tightly to current dB thresholds
    const color = lastDb >= 70 ? '#FF6B6B' : lastDb >= 55 ? '#FBBF24' : '#31B272';
    
    svgWavePulsingDotG.setAttribute('transform', `translate(${endX}, ${endY})`);
    
    const circle1 = svgWavePulsingDotG.querySelector('.pulse-core');
    const circle2 = svgWavePulsingDotG.querySelector('.pulse-glow');
    if (circle1) circle1.setAttribute('fill', color);
    if (circle2) circle2.setAttribute('stroke', color);
  }

  // Dynamic audio visualizer active bar rendering (3~5 vertical round bars)
  if (isPlaying) {
    const volumeFactor = Math.max(0, (currentDb - 20) / 80); // normalized [0.0 - 1.0]
    for (let i = 1; i <= 5; i++) {
      const vbarElement = document.getElementById(`vbar-${i}`);
      if (vbarElement) {
        const phaseOffset = i * 0.95;
        // Bouncing sine wave that matches the current volume profile
        const sineVal = Math.sin(wavePhase * 1.8 + phaseOffset) * 0.5 + 0.5; // [0.0 - 1.0]
        
        // Base height is 8px. Maximum height expansion is 44px
        const maxVarHeight = 44;
        const targetHeight = 8 + (volumeFactor * maxVarHeight * (0.3 + sineVal * 0.7));
        
        vbarElement.style.height = `${Math.max(8, Math.min(52, targetHeight))}px`;
      }
    }
  }
}

// Map the old drawWavechart function to trigger the main loop drawing
function drawWavechart() {
  drawLiveWavechart();
}
