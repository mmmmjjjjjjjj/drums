console.log("✅ main.js v28.0 - Gyroscope Gesture Engine + Constant-Gain AUX Sends");

// 1. Prevent native loader flashing
const loaderOverride = document.createElement('style');
loaderOverride.textContent = `
  #p5_loading { 
    display: none !important; 
    opacity: 0 !important; 
    visibility: hidden !important; 
  }
`;
document.head.appendChild(loaderOverride);

const pageCache = {};

// ──────────────────────────────────────────────────────────────
// HTML5 History Routing & Dynamic Page Loader
// ──────────────────────────────────────────────────────────────
async function loadPage(pageName, updateURL = true) {
  pageName = pageName.replace('.html', '').replace(/^\/|\/$/g, '');
  if (pageName === 'index' || pageName === '' || pageName === 'home') pageName = 'home';

  const content = document.getElementById("content");
  if (!content) return;

  content.style.opacity = "0";

  try {
    const response = await fetch(`/${pageName}.html`);
    if (!response.ok) throw new Error("Fetch failed");
    const html = await response.text();

    content.innerHTML = html;
    content.scrollTop = 0;

    document.querySelectorAll('.left-nav nav a').forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href') || "";
      const cleanHref = href.replace(/^\/|\/$/g, '');
      if (cleanHref === pageName || (pageName === 'home' && (href === '/' || href === '/home'))) {
        link.classList.add('active');
      }
    });

    if (pageName === 'shows' && typeof displayShows === 'function') displayShows();
    if (pageName === 'gallery' && typeof initGallery === 'function') setTimeout(initGallery, 50);

    setTimeout(() => {
      content.style.opacity = "1";
    }, 50);

    if (updateURL) {
      const friendlyURL = pageName === 'home' ? '/' : '/' + pageName;
      window.history.pushState({ page: pageName }, '', friendlyURL);
    }
  } catch (err) {
    console.error("Routing Error:", err);
    content.innerHTML = `<p>Error loading ${pageName}.</p>`;
    content.style.opacity = "1";
  }
}

window.loadPage = loadPage;

window.addEventListener('popstate', () => {
  const page = window.location.pathname.replace(/^\/|\/$/g, '') || 'home';
  loadPage(page, false);
});

window.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.replace(/^\/|\/$/g, '') || 'home';
  loadPage(path, false);
});

// ──────────────────────────────────────────────────────────────
// Google Calendar Logic
// ──────────────────────────────────────────────────────────────
async function displayShows() {
  const apiKey = 'AIzaSyBTDKsrV7Vjiago93e78g0xkk_GkHj7o3Y';
  const calendarId = 'u9e1t8pbgdq10e7tdmcn80l398@group.calendar.google.com';
  const showsListDiv = document.getElementById('shows-list');

  if (!showsListDiv) return;

  const timeMin = new Date().toISOString();
  const params = new URLSearchParams({
    key: apiKey,
    timeMin,
    orderBy: 'startTime',
    singleEvents: 'true',
    maxResults: '20',
    fields: 'items(summary,location,start,end,description)'
  });

  const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
  showsListDiv.innerHTML = '<p>Loading shows...</p>';

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Google Calendar API Error: ${response.status}`);
    
    const data = await response.json();
    const items = data.items || [];

    if (items.length === 0) {
      showsListDiv.innerHTML = '<p>No upcoming shows scheduled.</p>';
      return;
    }

    let htmlContent = '<ul class="shows-ul">';
    items.forEach(event => {
      const startDate = event.start.dateTime
        ? new Date(event.start.dateTime)
        : new Date(event.start.date + 'T00:00:00');

      const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      const formattedTime = event.start.dateTime
        ? startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })
        : '';

      const summary = event.summary || 'No Title';
      const location = event.location || '';
      const rawDesc = event.description || '';
      const eventUrl = getFirstUrl(rawDesc);

      htmlContent += `<li class="show-item">
        <div class="show-date">${formattedDate} ${formattedTime ? '@ ' + formattedTime : ''}</div>
        <div class="show-summary">${summary}</div>
        ${location ? `<div class="show-location">📍 ${htmlEscape(location)}</div>` : ''}
        ${rawDesc ? `<div class="show-desc">${renderDescNoLinks(rawDesc)}</div>` : ''}
        ${eventUrl ? `<div class="show-link"><a href="${eventUrl}" target="_blank" rel="noopener noreferrer" class="ticket-btn">Tickets / Info</a></div>` : ''}
      </li>`;
    });
    htmlContent += '</ul>';
    showsListDiv.innerHTML = htmlContent;
  } catch (error) {
    console.error('Failed to fetch shows:', error);
    showsListDiv.innerHTML = `<p style="color: red;">Could not load shows. Please try again later.</p>`;
  }
}

// ──────────────────────────────────────────────────────────────
// Gallery / Slideshow Logic
// ──────────────────────────────────────────────────────────────
let slideIndex = 1;

function initGallery() {
  slideIndex = 1;
  showSlides(slideIndex);
  window.plusSlides = plusSlides;
  window.currentSlide = currentSlide;
}

function plusSlides(n) { showSlides(slideIndex += n); }
function currentSlide(n) { showSlides(slideIndex = n); }

function showSlides(n) {
  const slides = document.querySelectorAll("#content .mySlides");
  const dots = document.querySelectorAll("#content .demo");
  const captionText = document.getElementById("caption");

  if (!slides || slides.length === 0) return;
  if (n > slides.length) { slideIndex = 1; }
  if (n < 1) { slideIndex = slides.length; }

  for (let i = 0; i < slides.length; i++) { slides[i].style.display = "none"; }
  for (let i = 0; i < dots.length; i++) { dots[i].className = dots[i].className.replace(" active", ""); }

  slides[slideIndex - 1].style.display = "block";
  if (dots.length > 0) {
    dots[slideIndex - 1].className += " active";
    if (captionText) { captionText.innerHTML = dots[slideIndex - 1].alt; }
  }
}

function getFirstUrl(text) {
  const urlRegex = /(https?:\/\/[^\s"<>]+)/g;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

function htmlEscape(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

function renderDescNoLinks(text) {
  let clean = text.replace(/<[^>]*>?/gm, ''); 
  clean = clean.replace(/(https?:\/\/[^\s"<>]+)/g, ''); 
  return htmlEscape(clean).trim();
}

// Global mobile tilt registers
window.gravityFieldX = 0;
window.gravityFieldY = 0;

// Helper to scale device rotation sensors safely
function processSensorValue(val, inMin, inMax, outMin, outMax) {
  const scaled = ((val - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  return Math.max(outMin, Math.min(outMax, scaled));
}

// Listen to secure accelerometer updates globally
if (window.isSecureContext) {
  window.addEventListener('deviceorientation', (e) => {
    if (e.gamma !== null && e.beta !== null) {
      // Maps device tilt angles cleanly to gentle acceleration vectors
      window.gravityFieldX = processSensorValue(e.gamma, -90, 90, -0.15, 0.15);
      window.gravityFieldY = processSensorValue(e.beta, -90, 90, -0.15, 0.15);
    }
  }, true);
}

/* ──────────────────────────────────────────────────────────────
   p5 sketch (Constant-Gain Auxiliary Send/Return Spatial Engine)
   ────────────────────────────────────────────────────────────── */
const sketch = (p) => {
  let elements = [];
  const maxSpeed = 3.2;
  const minElementSize = 10;
  const maxElementSize = 50;
  
  let isMuted = localStorage.getItem('siteMuted') === 'true';
  let globalVolume = parseFloat(localStorage.getItem('siteVolume'));
  if (isNaN(globalVolume)) globalVolume = 0.65; 

  let reverb;
  let preDelay; 
  let currentBg = 0;

  const voiceCount = 8;
  let voices = [];
  let currentVoiceIndex = 0;

  let sliderTrackX, sliderTrackYMin, sliderTrackYMax;
  const sliderWidth = 4;
  let isDraggingSlider = false;

  p.preload = () => {
    for (let i = 0; i < voiceCount; i++) {
      let v = p.loadSound(
        "assets/GONG.mp3",
        () => { if (i === 0) console.log("GONG.mp3 buffer cache loaded"); },
        (err) => { console.error("Error loading GONG.mp3 voice:", err); }
      );
      voices.push({ player: v });
    }
  };

  function updateSiteColors(bgValue) {
    const inverse = 255 - bgValue;
    const colorStr = `rgb(${inverse}, ${inverse}, ${inverse})`;
    
    const selectors = [
      '#content', '#content p', '#content h1', '#content h2', '#content h3', 
      '#content a', '#content li', '.left-nav a', '.left-nav h1 a'
    ];
    
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => { el.style.color = colorStr; });
    });

    const contentBox = document.getElementById("content");
    if (contentBox) contentBox.style.backgroundColor = 'transparent';
    
    document.body.style.color = colorStr;
  }

  const resetSketch = () => {
    currentBg = Math.floor(p.random(0, 255));
    p.background(currentBg);
    p.stroke(255); p.fill(0);
    elements = [];
    updateSiteColors(currentBg);
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
    
    try {
      reverb = new p5.Reverb();
      preDelay = new p5.Delay();

      preDelay.disconnect();
      preDelay.feedback(0.5);
      preDelay.delayTime(0.12);
      preDelay.filter(20000);
      preDelay.connect(reverb);
    } catch(e) {
      console.warn("Reverb init error:", e);
    }

    voices.forEach(voice => {
      let player = voice.player;
      player.disconnect(); 

      let dryGain = new p5.Gain();
      dryGain.connect(); 
      player.connect(dryGain);

      let wetGain = new p5.Gain();
      if (preDelay) {
        wetGain.connect(preDelay);
      } else if (reverb) {
        wetGain.connect(reverb);
      } else {
        wetGain.connect();
      }
      player.connect(wetGain);

      voice.dryGain = dryGain;
      voice.wetGain = wetGain;
    });

    resetSketch();
    
    // Configure p5's native motion shake sensitivity
    p.setShakeThreshold(35);
    
    const muteButton = p.select('#muteButton');
    const resetButton = p.select('#resetButton');
    
    if (muteButton) {
      muteButton.html(isMuted ? "UNMUTE" : "MUTE");
      muteButton.mousePressed(() => {
        isMuted = !isMuted;
        muteButton.html(isMuted ? "UNMUTE" : "MUTE");
        localStorage.setItem('siteMuted', isMuted);
        
        if (isMuted) {
          voices.forEach(voice => { if (voice.player.isPlaying()) voice.player.stop(); });
        }
      });
    }
    if (resetButton) { resetButton.mousePressed(() => { resetSketch(); }); }
  };

  p.draw = () => {
    p.background(currentBg, 25); 

    const forceX = window.gravityFieldX;
    const forceY = window.gravityFieldY;

    // Update kinetic elements incorporating accelerometer inputs
    for (let i = elements.length - 1; i >= 0; i--) {
      if (elements[i]) {
        elements[i].updateElement(forceX, forceY);
        elements[i].drawElement();
      }
    }

    if (isDraggingSlider) {
      updateVolumeFromMouse();
    }

    drawVolumeSlider();
  };

  // Reset physical sketch dynamically when user shakes phone physically
  p.deviceShaken = () => {
    resetSketch();
  };

  function drawVolumeSlider() {
    let gap = 15;
    let btnHeight = 36;
    let btnTop = p.height - 40 - btnHeight;
    let btnBottom = p.height - 40;

    const muteBtn = document.getElementById('muteButton');
    const resetBtn = document.getElementById('resetButton');

    if (muteBtn) {
      const muteRect = muteBtn.getBoundingClientRect();
      btnHeight = muteRect.height || btnHeight;
      btnTop = muteRect.top;
      btnBottom = muteRect.bottom;

      if (resetBtn) {
        const resetRect = resetBtn.getBoundingClientRect();
        if (resetRect.width > 0) {
          gap = resetRect.left - muteRect.right;
        }
      }
      
      sliderTrackX = muteRect.left - gap - (sliderWidth / 2);
    } else {
      sliderTrackX = p.width - 250;
    }

    sliderTrackYMin = btnTop;
    sliderTrackYMax = btnBottom;

    const themeColor = 255 - currentBg;

    p.push();
    p.rectMode(p.CENTER);
    p.ellipseMode(p.RADIUS);

    p.noStroke();
    p.fill(themeColor, 40);
    p.rect(sliderTrackX, (sliderTrackYMin + sliderTrackYMax) / 2, sliderWidth, btnHeight, 2);

    const handleY = p.map(globalVolume, 0, 1, sliderTrackYMax, sliderTrackYMin);
    p.fill(themeColor, isMuted ? 80 : 200);
    p.rect(sliderTrackX, (handleY + sliderTrackYMax) / 2, sliderWidth, sliderTrackYMax - handleY, 2);

    p.fill(themeColor, isMuted ? 140 : 255);
    p.ellipse(sliderTrackX, handleY, 5, 5);

    p.textAlign(p.CENTER, p.TOP);
    p.textSize(8);
    p.textFont('Inter, sans-serif');
    p.fill(themeColor, 160);
    
    const percentage = isMuted ? "MUTED" : Math.round(globalVolume * 100) + "%";
    p.text(percentage, sliderTrackX, sliderTrackYMax + 8);
    p.pop();
  }

  function updateVolumeFromMouse() {
    let calculatedVol = p.map(p.mouseY, sliderTrackYMax, sliderTrackYMin, 0, 1, true);
    
    globalVolume = p.constrain(calculatedVol, 0, 1);
    localStorage.setItem('siteVolume', globalVolume);

    if (globalVolume > 0 && isMuted) {
      isMuted = false;
      localStorage.setItem('siteMuted', 'false');
      const muteButton = p.select('#muteButton');
      if (muteButton) muteButton.html("MUTE");
    }
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    resetSketch();
  };

  /* ──────────────────────────────────────────────────────────────
     Dynamic Element Class with AUX Send/Return Routing + Accelerometer Pull
     ────────────────────────────────────────────────────────────── */
  class Element {
    constructor(x, y) {
      this.posX = x; 
      this.posY = y;
      
      this.dirX = p.random(-1, 1) * maxSpeed;
      this.dirY = p.random(-1, 1) * maxSpeed;
      while (this.dirX === 0 && this.dirY === 0) {
        this.dirX = p.random(-1, 1) * maxSpeed;
        this.dirY = p.random(-1, 1) * maxSpeed;
      }
      
      this.size = p.map(y, 0, p.height, minElementSize, maxElementSize);
      this.size = p.constrain(this.size, minElementSize, maxElementSize);

      this.pitch = p.map(y, 0, p.height, 7.6, 0.4);
      this.pitch = p.constrain(this.pitch, 0.4, 7.6);

      this.gray = p.random(0, 255);
    }

    updateElement(fX, fY) {
      // Apply physical acceleration pull if mobile device orientation is active
      this.dirX += fX;
      this.dirY += fY;

      // Restrain velocities safely so they don't break spatial alignment parameters
      this.dirX = p.constrain(this.dirX, -maxSpeed * 2.2, maxSpeed * 2.2);
      this.dirY = p.constrain(this.dirY, -maxSpeed * 2.2, maxSpeed * 2.2);

      this.posX += this.dirX; 
      this.posY += this.dirY;
      this.checkEdges();
    }

    drawElement() {
      p.push(); 
      p.noFill();
      p.stroke(this.gray, this.gray, this.gray, 180); 
      p.ellipse(this.posX, this.posY, this.size, this.size);
      p.noStroke();
      const inv = 255 - Math.floor(this.gray);
      p.fill(inv, inv, inv, 80); 
      p.ellipse(this.posX, this.posY, 2, 2);
      p.pop();
    }
    
    checkEdges() {
      let edgeHit = false;
      const radius = this.size / 2;
      
      if (this.posX - radius < 0) {
        this.dirX *= -1;
        this.posX = radius;
        edgeHit = true;
      } else if (this.posX + radius > p.width) {
        this.dirX *= -1;
        this.posX = p.width - radius;
        edgeHit = true;
      }
      
      if (this.posY - radius < 0) {
        this.dirY *= -1;
        this.posY = radius;
        edgeHit = true;
      } else if (this.posY + radius > p.height) {
        this.dirY *= -1;
        this.posY = p.height - radius;
        edgeHit = true;
      }
      
      if (edgeHit) this.playGongSound();
    }

    playGongSound() {
      if (isMuted || voices.length === 0) return;
      
      const sidebarWidth = window.innerWidth <= 768 ? 140 : 240;
      
      let currentWetness = p.map(this.posX, sidebarWidth, p.width, 1.0, 0.0, true);
      currentWetness = p.constrain(currentWetness, 0.0, 1.0);

      let currentDecay = p.map(this.posY, 0, p.height, 10.0, 5.0, true);
      currentDecay = p.constrain(currentDecay, 5.0, 10.0);

      const dynamicAmp = p.map(this.size, minElementSize, maxElementSize, 0.35, 0.75);
      const outputVolume = dynamicAmp * globalVolume;

      let voice = voices[currentVoiceIndex];
      currentVoiceIndex = (currentVoiceIndex + 1) % voiceCount;

      try {
        if (reverb) reverb.set(currentDecay, 0.35);

        voice.dryGain.amp(outputVolume);
        voice.wetGain.amp(currentWetness * outputVolume * 1.8);

        voice.player.rate(this.pitch);
        voice.player.play();
      } catch (e) {
        console.warn("Polyphonic voice play skipped:", e);
      }
    }
  }

  p.mousePressed = (event) => {
    // Standard secure mobile permissions prompt gateway on user gesture
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().catch(console.error);
    }
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().catch(console.error);
    }

    // Intercept vertical volume slider interactions
    const touchTargetPadding = 20;
    if (p.mouseX >= sliderTrackX - touchTargetPadding && 
        p.mouseX <= sliderTrackX + touchTargetPadding && 
        p.mouseY >= sliderTrackYMin - 10 && 
        p.mouseY <= sliderTrackYMax + 10) {
      isDraggingSlider = true;
      updateVolumeFromMouse();
      return; 
    }

    if (event.target.tagName === 'BUTTON' || event.target.closest('.left-nav')) {
      return; 
    }

    const sidebarWidth = window.innerWidth <= 768 ? 140 : 240;
    
    if (p.mouseX > sidebarWidth && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      elements.push(new Element(p.mouseX, p.mouseY));
    }
  };

  p.mouseReleased = () => {
    isDraggingSlider = false;
  };
};

new p5(sketch);