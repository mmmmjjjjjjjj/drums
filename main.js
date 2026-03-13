console.log("✅ main.js v7.1 loaded");

// ──────────────────────────────────────────────────────────────
// Routing (outside p5)
// ──────────────────────────────────────────────────────────────
const pageCache = {};

async function loadPage(pageName, updateURL = true) {

  const content = document.getElementById("content");

  if (pageCache[pageName]) {
    content.innerHTML = pageCache[pageName];
  } else {
    const response = await fetch(`${pageName}.html?${Date.now()}`);

    const html = await response.text();

    pageCache[pageName] = html;
    content.innerHTML = html;
  }

  // update browser URL hash
  if (updateURL) {
    window.location.hash = pageName;
  }
}


// ──────────────────────────────────────────────────────────────
// Slideshow (gallery page)
// ──────────────────────────────────────────────────────────────
let slideIndex = 1;

function initGallery() {
  console.log("Initializing Gallery");
  slideIndex = 1;
  showSlides(slideIndex);
  window.plusSlides = plusSlides;
  window.currentSlide = currentSlide;
}
function plusSlides(n) { showSlides(slideIndex += n); }
function currentSlide(n) { showSlides(slideIndex = n); }

function showSlides(n) {
  console.log(`Showing slide: ${n}`);
  let i;
  const slides = document.querySelectorAll("#content .mySlides");
  const dots = document.querySelectorAll("#content .demo");

  if (!slides || slides.length === 0) { console.error("Slideshow elements not found in #content"); return; }

  if (n > slides.length) { slideIndex = 1; }
  if (n < 1) { slideIndex = slides.length; }

  for (i = 0; i < slides.length; i++) slides[i].style.display = "none";
  for (i = 0; i < dots.length; i++) dots[i].classList.remove("active");

  slides[slideIndex - 1].style.display = "block";
  if (dots[slideIndex - 1]) dots[slideIndex - 1].classList.add("active");
}

// ──────────────────────────────────────────────────────────────
// Description helpers
// - Goal: keep all description text, but strip any links from it.
// - We still show the first link separately as a "Tickets / Info" button.
// ──────────────────────────────────────────────────────────────
const htmlEscape = (s='') =>
  s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

const decodeEntities = (s='') => { const t=document.createElement('textarea'); t.innerHTML=s; return t.value; };

// Extract first URL (from <a href="..."> OR raw http/https/www URL)
const getFirstUrl = (raw='') => {
  const decoded = decodeEntities(raw);
  const mTag = decoded.match(/<a[^>]+href="([^"]+)"/i);
  let url = mTag?.[1];
  if (!url) {
    const m = decoded.match(/(?:https?:\/\/|www\.)[^\s"<]+/i);
    if (m) url = m[0].startsWith('http') ? m[0] : `https://${m[0]}`;
  }
  return (url && /^(https?:|mailto:)/i.test(url)) ? url : null;
};

// Render description but REMOVE links (keep other text + <br>)
const renderDescNoLinks = (desc='') => {
  if (!desc) return '';
  const looksHtmlish = /(&lt;|&gt;|<\/?[a-z][\s\S]*>)/i.test(desc);

  // Plain text containing raw URLs: strip URLs, keep text + newlines
  if (!looksHtmlish) {
    const withoutUrls = desc.replace(/(?:https?:\/\/|www\.)[^\s<]+/gi, '');
    return htmlEscape(withoutUrls).replace(/\r?\n/g, '<br>');
  }

  // Encoded/HTML: decode, drop <a> (including its visible text), keep <br> + other text
  const decoded = decodeEntities(desc);
  const doc = new DOMParser().parseFromString(decoded, 'text/html');

  const walk = (node) => {
    let out = '';
    node.childNodes.forEach(ch => {
      if (ch.nodeType === Node.TEXT_NODE) {
        out += htmlEscape(ch.nodeValue);
      } else if (ch.nodeType === Node.ELEMENT_NODE) {
        const tag = ch.tagName.toLowerCase();
        if (tag === 'br') out += '<br>';
        else if (tag === 'a') {
          // drop the link entirely (including anchor text)
          // If you prefer to keep the visible words, use:
          // out += htmlEscape(ch.textContent || '');
        } else {
          out += walk(ch);
        }
      }
    });
    return out;
  };

  return walk(doc.body).replace(/\r?\n/g, '<br>');
};

// ──────────────────────────────────────────────────────────────
// Google Calendar - Shows page
// ──────────────────────────────────────────────────────────────
async function displayShows() {
  const apiKey = 'AIzaSyBTDKsrV7Vjiago93e78g0xkk_GkHj7o3Y';
  const calendarId = 'u9e1t8pbgdq10e7tdmcn80l398@group.calendar.google.com';
  const showsListDiv = document.getElementById('shows-list');

  if (!showsListDiv) { console.error('Show list container not found.'); return; }
  if (!apiKey || apiKey === 'YOUR_API_KEY' || !calendarId || calendarId === 'YOUR_CALENDAR_ID') {
    showsListDiv.innerHTML = '<p style="color: red;">Error: API Key or Calendar ID not correctly set.</p>';
    console.error('API Key or Calendar ID missing or placeholder.');
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

  console.log('Fetching Calendar events...');
  showsListDiv.innerHTML = '<p>Loading shows...</p>';

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      let errorData;
      try { errorData = await response.json(); } catch {}
      let message = `Google Calendar API Error: ${response.status} ${response.statusText}`;
      if (errorData?.error?.message) message += ` - ${errorData.error.message}`;
      throw new Error(message);
    }
    const data = await response.json();
    console.log('Calendar data received:', data);

    const items = data.items || [];
    if (items.length === 0) { showsListDiv.innerHTML = '<p>No upcoming shows scheduled.</p>'; return; }

    let htmlContent = '<ul>';
    items.forEach(event => {
      const startDate = event.start.dateTime
        ? new Date(event.start.dateTime)
        : new Date(event.start.date + 'T00:00:00');

      const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      const formattedTime = event.start.dateTime
        ? startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', timeZoneName: 'short' })
        : '';

      const summary = event.summary || 'No Title';
      const location = event.location || '';
      const rawDesc = event.description || '';
      const eventUrl = getFirstUrl(rawDesc); // for Tickets/Info button

      htmlContent += `<li class="show-item">`;
      htmlContent += `<div class="show-date">${formattedDate}</div>`;
      if (formattedTime) htmlContent += `<div class="show-time">${formattedTime}</div>`;
      htmlContent += `<div class="show-summary">${summary}</div>`;
      if (location) htmlContent += `<div class="show-location">${htmlEscape(location)}</div>`;

      // keep description but strip any links from it
      if (rawDesc) {
        htmlContent += `<div class="show-desc">${renderDescNoLinks(rawDesc)}</div>`;
      }

      // put the first link in a clean button
      if (eventUrl) {
        htmlContent += `<div class="show-link"><a href="${eventUrl}" target="_blank" rel="noopener noreferrer">Tickets / Info</a></div>`;
      }

      htmlContent += `</li>`;
    });
    htmlContent += '</ul>';

    showsListDiv.innerHTML = htmlContent;
  } catch (error) {
    console.error('Failed to fetch or display shows:', error);
    showsListDiv.innerHTML = `<p style="color: red;">Could not load shows. ${htmlEscape(error.message)}</p>`;
  }
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
      console.log(`Workspace status for ${pageToFetch}:`, response.status);
      console.log('Response URL:', response.url);
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
      console.log(`Workspaceed HTML length:`, html.length);
      const content = document.getElementById("content");
      if (content) {
        console.log('Setting innerHTML...');
        content.innerHTML = html;
        content.style.opacity = "1";
        console.log('innerHTML set.');

        if (pageName === 'shows') {
          displayShows();
        } else if (pageName === 'gallery') {
          setTimeout(() => initGallery(), 0);
        }
      } else {
        console.error("#content not found");
      }
    })
    .catch(error => { console.error("Error loading initial page:", error); });
};

// ──────────────────────────────────────────────────────────────
// p5 sketch
// ──────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
// p5 sketch (instance mode) - GREYSCALE + inverse text color
// Replace your existing `const sketch = (p) => { ... }` block with this
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
      "/assets/GONG.mp3",
      () => { console.log("GONG.mp3 loaded"); },
      (err) => { console.error("Error loading GONG.mp3:", err); }
    );
  };

  // updateSiteTextColor(inverseGray)
  // Apply inverse greyscale color to relevant DOM elements
  function updateSiteTextColor(inverseGray) {
    const colorStr = `rgb(${inverseGray}, ${inverseGray}, ${inverseGray})`;
    // target elements inside #content + global nav / links as desired
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

  // resetSketch: sets greyscale background and updates text color
  const resetSketch = () => {
    // choose a greyscale background value 0-255 (use full range)
    const g = Math.floor(p.random(0, 255));
    p.background(g); // greyscale background

    // set stroke/fill defaults for drawing
    p.stroke(255);
    p.fill(0);

    // clear elements and reset audio/reverb queue
    elements = [];
    if (reverb) {
      try { reverb.disconnect(); } catch(e) {}
    }
    try { reverb = new p5.Reverb(); } catch (e) { reverb = null; }

    soundQueue = [];

    // compute inverse greyscale for text (0..255)
    const inverse = 255 - g;
    updateSiteTextColor(inverse);

    // also adjust any top-level body / nav color if you want:
    document.body.style.color = `rgb(${inverse},${inverse},${inverse})`;
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    resetSketch();

    // wire up mute/reset buttons if they exist in DOM
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
    } else {
      console.warn("muteButton not found");
    }

    if (resetButton) {
      resetButton.mousePressed(() => {
        resetSketch();
      });
    } else {
      console.warn("resetButton not found");
    }
  };

  p.draw = () => {
    // update + draw elements
    for (let i = elements.length - 1; i >= 0; i--) {
      if (elements[i]) {
        elements[i].updateElement();
        elements[i].drawElement();
      }
    }

    // sound queue manager
    if (soundQueue.length > 0 && gongSound && gongSound.isLoaded()) {
      if (!gongSound.isPlaying()) {
        const soundData = soundQueue.shift();
        if (reverb) {
          try {
            reverb.process(gongSound, soundData.decayTime, 0.35);
          } catch (e) { console.error("Reverb process failed", e); }
        }
        gongSound.rate(soundData.pitch);
        gongSound.amp(0.5);
        gongSound.play();
      }
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    // keep background greyscale and update text color on resize
    resetSketch();
  };

  // Element class (greyscale visuals)
  class Element {
    constructor(x, y) {
      this.posX = x;
      this.posY = y;
      this.dirX = p.random(-1, 1) * maxSpeed;
      this.dirY = p.random(-1, 1) * maxSpeed;
      this.size = p.random(minElementSize, maxElementSize);
      // single greyscale channel for this element
      this.gray = p.random(0, 255);
      // ensure movement
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
      // stroke in greyscale with alpha
      p.stroke(this.gray, this.gray, this.gray, 105);
      p.ellipse(this.posX, this.posY, this.size, this.size);
      p.noStroke();
      // small bright dot in front for contrast (use inverse of element gray)
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

  // mouse/touch handlers
  p.mousePressed = () => {
    const muteBtn = document.getElementById('muteButton');
    const resetBtn = document.getElementById('resetButton');
    let isOverButton = false;
    if (muteBtn && event && muteBtn.contains(event.target)) isOverButton = true;
    if (resetBtn && event && resetBtn.contains(event.target)) isOverButton = true;

    if (!isOverButton && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      elements.push(new Element(p.mouseX, p.mouseY));
    }
  };

  p.touchStarted = () => {
    const muteBtn = document.getElementById('muteButton');
    const resetBtn = document.getElementById('resetButton');
    let isOverButton = false;
    if (muteBtn && event && muteBtn.contains(event.target)) isOverButton = true;
    if (resetBtn && event && resetBtn.contains(event.target)) isOverButton = true;

    if (!isOverButton && p.touches.length > 0) {
      const touchX = p.touches[0].clientX;
      const touchY = p.touches[0].clientY;
      if (touchX >= 0 && touchX <= p.width && touchY >= 0 && touchY <= p.height) {
        elements.push(new Element(touchX, touchY));
      }
    }
  };

}; // end sketch

new p5(sketch);

const pagesToPreload = [
  "bio",
  "shows",
  "music",
  "video",
  "gallery"
];

pagesToPreload.forEach(page => {
  fetch(`${page}.html`)
    .then(r => r.text())
    .then(html => pageCache[page] = html);
});

window.addEventListener("hashchange", () => {

  const page = window.location.hash.replace("#", "");

  if (page) {
    loadPage(page, false);
  }

});
window.addEventListener("DOMContentLoaded", () => {

  const page = window.location.hash.replace("#", "");

  if (page) {
    loadPage(page, false);
  } else {
    loadPage("bio", false);
  }

});
