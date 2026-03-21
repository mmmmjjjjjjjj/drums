console.log("✅ main.js v8.5 - Vertical Scroll Reverted & Alias Fix");

const pageCache = {};

// ──────────────────────────────────────────────────────────────
// Routing & Page Loading
// ──────────────────────────────────────────────────────────────

async function loadPage(pageName, updateURL = true) {
  // Normalize: remove .html if present and alias 'about' to 'bio'
  pageName = pageName.replace('.html', '');
  if (pageName === 'about') pageName = 'bio';

  const content = document.getElementById("content");
  if (!content) return;
  
  // Tag the content area with the current page name for CSS targeting
  content.setAttribute('data-page', pageName);

  // 1. Update Active State in Navigation
  document.querySelectorAll('.left-nav nav a').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('onclick')?.includes(`'${pageName}'`)) {
      link.classList.add('active');
    }
  });

  // 2. Start Transition Out
  content.style.opacity = "0";

  try {
    let html;
    if (pageCache[pageName]) {
      html = pageCache[pageName];
    } else {
      const response = await fetch(`${pageName}.html?${Date.now()}`);
      if (!response.ok) throw new Error("Fetch failed");
      html = await response.text();
      pageCache[pageName] = html;
    }

    // 3. Inject content with the animation wrapper
    // Forces block display to ensure vertical scrolling is restored
    content.innerHTML = `<div class="content-entry" style="display: block !important; width: 100%;">${html}</div>`;

    // Reset scroll position so new page starts at the top
    content.scrollLeft = 0;
    content.scrollTop = 0;

    // 4. Trigger Page-Specific Logic
    if (pageName === 'shows') displayShows();
    if (pageName === 'gallery') setTimeout(() => initGallery(), 50);

    // 5. Fade In
    setTimeout(() => {
      content.style.opacity = "1";
    }, 50);

    if (updateURL) window.location.hash = pageName;
    
  } catch (err) {
    console.error("Routing Error:", err);
    content.innerHTML = `<p>Error loading ${pageName}.</p>`;
  }
}

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

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────
// p5 sketch (Interactive Background)
// ──────────────────────────────────────────────────────────────

const sketch = (p) => {
  let gongSound;
  let elements = [];
  const maxSpeed = 3;
  const minElementSize = 10;
  const maxElementSize = 50;
  let isMuted = false;
  let reverb;
  let soundQueue = [];
  let currentBg = 0;

  p.preload = () => {
    gongSound = p.loadSound(
      "assets/GONG.mp3",
      () => { console.log("GONG.mp3 loaded"); },
      (err) => { console.error("Error loading GONG.mp3:", err); }
    );
  };

  /**
   * Syncs text color with the sketch and makes content background transparent
   */
  function updateSiteColors(bgValue) {
    const inverse = 255 - bgValue;
    const colorStr = `rgb(${inverse}, ${inverse}, ${inverse})`;
    
    // Update text colors
    const selectors = ['#content', '#content p', '#content h1', '#content h2', '#content h3', '#content a', '#content li', '.left-nav a'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => { el.style.color = colorStr; });
    });

    // Make content area transparent so animation can go through
    const contentBox = document.getElementById("content");
    if (contentBox) {
      contentBox.style.backgroundColor = 'transparent';
    }
    
    document.body.style.color = colorStr;
  }

  const resetSketch = () => {
    currentBg = Math.floor(p.random(0, 255));
    p.background(currentBg);
    p.stroke(255); p.fill(0);
    elements = [];
    if (reverb) { try { reverb.disconnect(); } catch(e) {} }
    try { reverb = new p5.Reverb(); } catch (e) { reverb = null; }
    soundQueue = [];
    
    updateSiteColors(currentBg);
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    
    // Ensure the browser doesn't block the canvas with a default background
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
    
    resetSketch();
    
    const muteButton = p.select('#muteButton');
    const resetButton = p.select('#resetButton');
    
    if (muteButton) {
      muteButton.mousePressed(() => {
        isMuted = !isMuted;
        muteButton.html(isMuted ? "UNMUTE" : "MUTE");
        if (isMuted && gongSound && gongSound.isPlaying()) {
          gongSound.stop();
          soundQueue = [];
        }
      });
    }
    if (resetButton) { resetButton.mousePressed(() => { resetSketch(); }); }
  };

  p.draw = () => {
    // We redraw a very faint background to create a "trail" effect for moving elements
    p.background(currentBg, 25); 

    for (let i = elements.length - 1; i >= 0; i--) {
      if (elements[i]) {
        elements[i].updateElement();
        elements[i].drawElement();
      }
    }
    
    if (soundQueue.length > 0 && gongSound && gongSound.isLoaded()) {
      if (!gongSound.isPlaying()) {
        const soundData = soundQueue.shift();
        if (reverb) {
          try { reverb.process(gongSound, soundData.decayTime, 0.35); } catch (e) {}
        }
        gongSound.rate(soundData.pitch);
        gongSound.amp(0.5);
        gongSound.play();
      }
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    resetSketch();
  };

  class Element {
    constructor(x, y) {
      this.posX = x; this.posY = y;
      this.dirX = p.random(-1, 1) * maxSpeed;
      this.dirY = p.random(-1, 1) * maxSpeed;
      this.size = p.random(minElementSize, maxElementSize);
      this.gray = p.random(0, 255);
      while (this.dirX === 0 && this.dirY === 0) {
        this.dirX = p.random(-1, 1) * maxSpeed;
        this.dirY = p.random(-1, 1) * maxSpeed;
      }
    }
    updateElement() {
      this.posX += this.dirX; this.posY += this.dirY;
      this.checkEdges();
    }
    drawElement() {
      p.push(); p.noFill();
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
      if (this.posX - this.size / 2 < 0 || this.posX + this.size / 2 > p.width) {
        this.dirX *= -1;
        this.posX = p.constrain(this.posX, this.size / 2, p.width - this.size / 2);
        edgeHit = true;
      }
      if (this.posY - this.size / 2 < 0 || this.posY + this.size / 2 > p.height) {
        this.dirY *= -1;
        this.posY = p.constrain(this.posY, this.size / 2, p.height - this.size / 2);
        edgeHit = true;
      }
      if (edgeHit) this.playGongSound();
    }
    playGongSound() {
      if (isMuted || !gongSound || !gongSound.isLoaded()) return;
      let pitch = p.map(this.size, minElementSize, maxElementSize, 0.5, 1.5);
      pitch = p.constrain(pitch, 0.5, 1.5);
      let decayTime = p.map(this.size, minElementSize, maxElementSize, 1, 5);
      decayTime = p.constrain(decayTime, 1, 5);
      soundQueue.push({ pitch, decayTime });
    }
  }

  p.mousePressed = (event) => {
    const muteBtn = document.getElementById('muteButton');
    const resetBtn = document.getElementById('resetButton');
    let isOverButton = false;
    
    if (muteBtn && (event.target === muteBtn || muteBtn.contains(event.target))) isOverButton = true;
    if (resetBtn && (event.target === resetBtn || resetBtn.contains(event.target))) isOverButton = true;
    
    if (!isOverButton && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      elements.push(new Element(p.mouseX, p.mouseY));
    }
  };
};

new p5(sketch);

// ──────────────────────────────────────────────────────────────
// Initialization
// ──────────────────────────────────────────────────────────────

window.onload = () => {
  const hash = window.location.hash.replace("#", "") || "bio";
  loadPage(hash, false);
};

window.addEventListener("hashchange", () => {
  const page = window.location.hash.replace("#", "");
  if (page) loadPage(page, false);
});