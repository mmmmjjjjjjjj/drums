console.log("✅ main.js v7 loaded");

// ──────────────────────────────────────────────────────────────
// Routing (outside p5)
// ──────────────────────────────────────────────────────────────
function loadPage(pageName) {
  const content = document.getElementById("content");
  const pageToFetch = `${pageName}.html`;
  const targetHash = `#${pageName}`;

  console.log(`loadPage: Fetching ${pageToFetch}`);
  if (!content) { console.error('#content not found in loadPage'); return; }

  content.style.transition = 'opacity 0.3s ease-out';
  content.style.opacity = "0";
  setTimeout(() => {
    fetch(pageToFetch)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} fetching ${pageToFetch}`);
        return response.text();
      })
      .then(html => {
        content.innerHTML = html;

        // shows / gallery hooks
        if (pageName === 'shows') {
          setTimeout(() => {
            console.log("Attempting to display shows after short delay (from loadPage)...");
            displayShows();
          }, 0);
        } else if (pageName === 'gallery') {
          setTimeout(() => initGallery(), 0);
        }

        if (window.location.hash !== targetHash) {
          history.pushState(null, "", targetHash);
        } else {
          history.replaceState(null, "", targetHash);
        }
        setTimeout(() => { content.style.opacity = "1"; }, 50);
      })
      .catch(error => {
        console.error("Error loading page:", error);
        content.innerHTML = `<p>Error loading page: ${pageName}.</p>`;
        content.style.opacity = "1";
      });
  }, 300);
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
/** Description rendering helpers (safe)
 * - Plain text: escape + linkify + \n → <br>
 * - HTML/encoded: decode, allow only <a> and <br>, strip other tags
 */
const htmlEscape = (s='') =>
  s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

const linkifyPlain = (text='') =>
  text.replace(/((https?:\/\/|www\.)[^\s<]+)/gi, m => {
    const href = m.startsWith('http') ? m : `https://${m}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${htmlEscape(m)}</a>`;
  });

const decodeEntities = (s='') => { const t=document.createElement('textarea'); t.innerHTML=s; return t.value; };

// Extract first url for the "Tickets / Info" button (from <a href> or raw URL)
const getFirstUrl = (raw='') => {
  const decoded = decodeEntities(raw);
  const mTag = decoded.match(/<a[^>]+href="([^"]+)"/i);
  if (mTag && /^(https?:|mailto:)/i.test(mTag[1])) return mTag[1];
  const m = decoded.match(/https?:\/\/[^\s"<]+/i);
  return m ? m[0] : null;
};

const renderDesc = (desc='') => {
  if (!desc) return '';
  const looksHtmlish = /(&lt;|&gt;|<\/?[a-z][\s\S]*>)/i.test(desc);
  if (!looksHtmlish) {
    return linkifyPlain(htmlEscape(desc)).replace(/\r?\n/g, '<br>');
  }
  const decoded = decodeEntities(desc);
  const doc = new DOMParser().parseFromString(decoded, 'text/html');

  const walk = (node) => {
    let out = '';
    node.childNodes.forEach(ch => {
      if (ch.nodeType === Node.TEXT_NODE) {
        out += htmlEscape(ch.nodeValue);
      } else if (ch.nodeType === Node.ELEMENT_NODE) {
        const tag = ch.tagName.toLowerCase();
        if (tag === 'br') {
          out += '<br>';
        } else if (tag === 'a') {
          const href = ch.getAttribute('href') || '';
          const txt  = ch.textContent || href;
          if (/^(https?:|mailto:)/i.test(href)) {
            out += `<a href="${href}" target="_blank" rel="noopener noreferrer">${htmlEscape(txt)}</a>`;
          } else {
            out += htmlEscape(txt);
          }
        } else {
          out += walk(ch); // strip other tags but keep their text
        }
      }
    });
    return out;
  };

  return walk(doc.body).replace(/\r?\n/g, '<br>');
};
// ──────────────────────────────────────────────────────────────

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
    // make sure description is included
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

      if (rawDesc) {
        htmlContent += `<div class="show-desc">${renderDesc(rawDesc)}</div>`;
      }

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
      () => { console.log("GONG.mp3 loaded successfully"); },
      (err) => { console.error("Error loading GONG.mp3:", err); }
    );
  };

  const resetSketch = () => {
    p.background(p.random(0, 255), 0, p.random(0, 255));
    p.stroke(255);
    p.fill(0);
    elements = [];
    if (reverb) {
      if (gongSound && gongSound.isLoaded()) { gongSound.disconnect(); }
      reverb.disconnect();
    }
    try { reverb = new p5.Reverb(); } catch (e) { console.error("Failed to create Reverb, sound might be disabled.", e); }
    soundQueue = [];
  };

  p.setup = () => {
    console.log("setup() called");
    p.createCanvas(p.windowWidth, p.windowHeight);
    console.log("Canvas created. Size:", p.width, "x", p.height, "WinSize:", p.windowWidth, "x", p.windowHeight);
    resetSketch();

    const muteButton = p.select("#muteButton");
    const resetButton = p.select("#resetButton");

    if (muteButton) {
      muteButton.mousePressed(() => {
        isMuted = !isMuted;
        muteButton.html(isMuted ? "UNMUTE" : "MUTE");
        if (isMuted && gongSound && gongSound.isPlaying()) {
          gongSound.stop();
          soundQueue = [];
        }
      });
    } else { console.error("Mute button not found"); }

    if (resetButton) {
      resetButton.mousePressed(() => { resetSketch(); });
    } else { console.error("Reset button not found"); }
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
          gongSound.disconnect();
          try { reverb.process(gongSound, soundData.decayTime, 1); } catch (e) { console.error("Reverb process failed", e); }
        } else { console.warn("Reverb not initialized for sound playback"); }
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
      this.R = p.random(255); this.G = p.random(255);
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
      p.push();
      p.noFill();
      p.stroke(this.R, this.G, 0, 105);
      p.ellipse(this.posX, this.posY, this.size, this.size);
      p.noStroke();
      p.fill(255, 35);
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
      if (reverb) { try { reverb.set(decayTime, 0.35); } catch(e) { console.error("Failed to set reverb", e); } }
      soundQueue.push({ pitch, decayTime });
    }
  }

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
};

new p5(sketch);
