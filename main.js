console.log("✅ main.js v8.0 loaded - Calendar Integrated");

// ──────────────────────────────────────────────────────────────
// Routing & Page Loading
// ──────────────────────────────────────────────────────────────
const pageCache = {};

async function loadPage(pageName, updateURL = true) {
  const content = document.getElementById("content");

  try {
    if (pageCache[pageName]) {
      content.innerHTML = pageCache[pageName];
    } else {
      const response = await fetch(`${pageName}.html?${Date.now()}`);
      const html = await response.text();
      pageCache[pageName] = html;
      content.innerHTML = html;
    }

    // CRITICAL: If we just loaded the shows page, trigger the calendar fetch
    if (pageName === 'shows') {
      displayShows();
    }

    // Trigger gallery init if needed
    if (pageName === 'gallery') {
      if (typeof initGallery === 'function') {
        initGallery();
      }
    }

    if (updateURL) {
      window.location.hash = pageName;
    }
  } catch (err) {
    console.error("Error loading page:", err);
  }
}

// ──────────────────────────────────────────────────────────────
// Google Calendar Logic
// ──────────────────────────────────────────────────────────────
async function displayShows() {
  const apiKey = 'AIzaSyBTDKsrV7Vjiago93e78g0xkk_GkHj7o3Y';
  const calendarId = 'u9e1t8pbgdq10e7tdmcn80l398@group.calendar.google.com';
  const showsListDiv = document.getElementById('shows-list');

  if (!showsListDiv) {
    console.error('Show list container not found.');
    return;
  }

  const timeMin = new Date().toISOString();
  const params = new URLSearchParams({
    key: apiKey,
    timeMin,
    orderBy: 'startTime',
    singleEvents: 'true',
    maxResults: '20',
    fields: 'items(summary,location,start,end,description),nextPageToken'
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

// Helper: Extract first URL from description
function getFirstUrl(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = text.match(urlRegex);
  return match ? match[0] : null;
}

// Helper: Strip HTML and Links from description text
function renderDescNoLinks(text) {
  let clean = text.replace(/<[^>]*>?/gm, ''); // Remove HTML tags
  clean = clean.replace(/(https?:\/\/[^\s]+)/g, ''); // Remove URLs
  return htmlEscape(clean);
}

// Helper: Basic HTML escaping
function htmlEscape(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

// expose router
window.loadPage = loadPage;

// initial load
window.onload = function () {
  const hash = window.location.hash;
  let pageName;
  const defaultPageName = 'about';
  const defaultHash = `#${defaultPageName}`;

  if (hash === '' || hash === '#' || hash === '#/') {
    pageName = defaultPageName;
    history.replaceState(null, "", defaultHash);
  } else {
    pageName = hash.startsWith('#') ? hash.substring(1) : hash;
  }

  const pageToFetch = `${pageName}.html`;
  console.log(`Initial Hash Load: Hash=${hash}, PageName=${pageName}, Fetching=${pageToFetch}`);

  fetch(pageToFetch)
    .then(response => {
      if (!response.ok) {
        console.error(`Initial page "${pageToFetch}" not found, loading default.`);
        pageName = defaultPageName;
        return fetch(`${pageName}.html`).then(res => {
          if (!res.ok) throw new Error('Default fetch failed too!');
          history.replaceState(null, "", defaultHash);
          return res.text();
        });
      }
      return response.text();
    })
    .then(html => {
      const content = document.getElementById("content");
      if (content) {
        content.innerHTML = html;
        content.style.opacity = "1";

        if (pageName === 'shows') {
          displayShows();
        } else if (pageName === 'gallery') {
          if (typeof initGallery === 'function') setTimeout(() => initGallery(), 0);
        }
      }
    })
    .catch(error => { console.error("Error loading initial page:", error); });
};

// ──────────────────────────────────────────────────────────────
// p5 sketch (instance mode) - GREYSCALE + inverse text color
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

  p.preload = () => {
    console.log("preload() called");
    gongSound = p.loadSound(
      "assets/GONG.mp3",
      () => { console.log("GONG.mp3 loaded"); },
      (err) => { console.error("Error loading GONG.mp3:", err); }
    );
  };

  function updateSiteTextColor(inverseGray) {
    const colorStr = `rgb(${inverseGray}, ${inverseGray}, ${inverseGray})`;
    const selectors = [
      '#content',
      '#content p',
      '#content h1', '#content h2', '#content h3',
      '#content a', '#content li', '.left-nav a'
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.color = colorStr;
      });
    });
  }

  const resetSketch = () => {
    const g = Math.floor(p.random(0, 255));
    p.background(g);
    p.stroke(255);
    p.fill(0);
    elements = [];
    if (reverb) {
      try { reverb.disconnect(); } catch(e) {}
    }
    try { reverb = new p5.Reverb(); } catch (e) { reverb = null; }
    soundQueue = [];
    const inverse = 255 - g;
    updateSiteTextColor(inverse);
    document.body.style.color = `rgb(${inverse},${inverse},${inverse})`;
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
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

    if (resetButton) {
      resetButton.mousePressed(() => {
        resetSketch();
      });
    }
  };

  p.draw = () => {
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
          try {
            reverb.process(gongSound, soundData.decayTime, 0.35);
          } catch (e) { console.error("Reverb failed", e); }
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
      this.posX = x;
      this.posY = y;
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
      this.posX += this.dirX;
      this.posY += this.dirY;
      this.checkEdges();
    }

    drawElement() {
      p.push();
      p.noFill();
      p.stroke(this.gray, this.gray, this.gray, 105);
      p.ellipse(this.posX, this.posY, this.size, this.size);
      p.noStroke();
      const inv = 255 - Math.floor(this.gray);
      p.fill(inv, inv, inv, 35);
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
    if (muteBtn && muteBtn.contains(event.target)) isOverButton = true;
    if (resetBtn && resetBtn.contains(event.target)) isOverButton = true;

    if (!isOverButton && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      elements.push(new Element(p.mouseX, p.mouseY));
    }
  };

  p.touchStarted = (event) => {
    const muteBtn = document.getElementById('muteButton');
    const resetBtn = document.getElementById('resetButton');
    let isOverButton = false;
    if (muteBtn && muteBtn.contains(event.target)) isOverButton = true;
    if (resetBtn && resetBtn.contains(event.target)) isOverButton = true;

    if (!isOverButton && p.touches.length > 0) {
      const touchX = p.touches[0].x;
      const touchY = p.touches[0].y;
      if (touchX >= 0 && touchX <= p.width && touchY >= 0 && touchY <= p.height) {
        elements.push(new Element(touchX, touchY));
      }
    }
  };

};

new p5(sketch);

const pagesToPreload = ["bio", "shows", "music", "video", "gallery"];
pagesToPreload.forEach(page => {
  fetch(`${page}.html`)
    .then(r => r.text())
    .then(html => pageCache[page] = html);
});

window.addEventListener("hashchange", () => {
  const page = window.location.hash.replace("#", "");
  if (page) loadPage(page, false);
});

window.addEventListener("DOMContentLoaded", () => {
  const page = window.location.hash.replace("#", "");
  if (page) {
    loadPage(page, false);
  } else {
    loadPage("bio", false);
  }
});