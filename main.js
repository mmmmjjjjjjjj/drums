// --- Global variables needed by routing (if any - currently none seem needed here) ---

// --- Routing Logic (Stays outside the p5 sketch) ---

function loadPage(pageName) { // Receives 'about', 'music' etc.
    let content = document.getElementById("content");
    let pageToFetch = `${pageName}.html`; // Fetch file at root
    let targetHash = `#${pageName}`; // Target hash format, e.g., "#about"

    console.log(`loadPage: Fetching ${pageToFetch}`);
    if (!content) { console.error('#content not found in loadPage'); return; }

    content.style.transition = 'opacity 0.3s ease-out';
    content.style.opacity = "0";
    setTimeout(() => {
        fetch(pageToFetch)
            .then(response => {
                if (!response.ok) {
                   throw new Error(`HTTP error! status: ${response.status} fetching ${pageToFetch}`);
                }
                return response.text();
            })
            .then(html => {
                content.innerHTML = html;
                // Update history state with the HASH
                if (window.location.hash !== targetHash) {
                   history.pushState(null, "", targetHash); // Set the new hash
                } else {
                   // If loading same page hash again, just replace
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
} // End of loadPage

window.loadPage = loadPage; // <-- ADD THIS LINE

window.onload = function () {
    const hash = window.location.hash; // Read the hash (e.g., "#about")
    let pageName;
    const defaultPageName = 'about';
    const defaultHash = `#${defaultPageName}`; // e.g., "#about"

    // Determine pageName from the hash
    if (hash === '' || hash === '#' || hash === '#/') {
        pageName = defaultPageName;
        // Set the default hash in the URL bar without adding history
        history.replaceState(null, "", defaultHash);
    } else {
        // Extract page name from hash like "#music" -> "music"
        pageName = hash.startsWith('#') ? hash.substring(1) : hash;
        // Optional: Add validation if needed
        // if (pageName.includes('.') || pageName.includes('/')) { // Basic check
        //     console.warn(`Invalid initial hash "${hash}", loading default.`);
        //     pageName = defaultPageName;
        //     history.replaceState(null, "", defaultHash);
        // }
    }

    // Construct filename to fetch (assuming it's still at the root)
    let pageToFetch = `${pageName}.html`;

    console.log(`Initial Hash Load: Hash=${hash}, PageName=${pageName}, Fetching=${pageToFetch}`);

    // Fetch the content file (relative path still okay)
    fetch(pageToFetch)
        .then(response => {
            console.log(`Workspace status for ${pageToFetch}:`, response.status);
            console.log('Response URL:', response.url);
            if (!response.ok) {
                console.error(`Initial page "${pageToFetch}" not found, loading default.`);
                pageName = defaultPageName;
                pageToFetch = `${pageName}.html`;
                // Fetch the default content file
                return fetch(pageToFetch).then(res => {
                    if (!res.ok) throw new Error('Default fetch failed too!');
                    history.replaceState(null, "", defaultHash); // Ensure hash reflects default
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
                // History was already set by replaceState earlier
            } else { console.error("#content not found"); }
        })
        .catch(error => { console.error("Error loading initial page:", error); /* ... */ });
}; // End of window.onload

// --- p5 Sketch Logic (Wrapped in Instance Mode) ---

const sketch = (p) => { // 'p' is the p5 instance

    // Move all sketch-related variables inside
    let gongSound;
    let elements = [];
    const maxSpeed = 3;
    const minElementSize = 10;
    const maxElementSize = 50;
    // let buttonPressed = false; // Still seems unused?
    let isMuted = false;
    let reverb;
    let soundQueue = [];

    p.preload = () => {
        console.log("preload() called");
        gongSound = p.loadSound(
            "/assets/GONG.mp3",
            () => {
                // Success!
                console.log("GONG.mp3 loaded successfully");
            },
            (err) => {
                // Failure!
                console.error("Error loading GONG.mp3:", err);
            }
        );
    }

    const resetSketch = () => { // Make resetSketch an internal function
        p.background(p.random(0, 255), 0, p.random(0, 255));
        p.stroke(255);
        p.fill(0);
        elements = [];
        // buttonPressed = false;
        // Reverb needs p5 instance, might need p5.sound addon specific handling
        // For simplicity, let's assume p5.sound automatically attaches to the instance
        // Or we might need to create reverb = new p5.Reverb(p); ? - Check p5 docs if sound fails
         if (reverb) {
             if(gongSound && gongSound.isLoaded()){ gongSound.disconnect(); }
             reverb.disconnect();
            // reverb.dispose(); // Might need p argument?
         }
         try {
            reverb = new p5.Reverb(); // Try creating normally first
         } catch (e) {
             console.error("Failed to create Reverb, sound might be disabled.", e);
         }
         soundQueue = [];
    }

    p.setup = () => {
        console.log("setup() called");
        p.createCanvas(p.windowWidth, p.windowHeight); // Use p.windowWidth etc.
        console.log("Canvas created. Size:", p.width, "x", p.height, "WinSize:", p.windowWidth, "x", p.windowHeight);
        resetSketch();

        // Use p.select for DOM elements
        let muteButton = p.select("#muteButton");
        let resetButton = p.select("#resetButton");

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
            resetButton.mousePressed(() => {
                resetSketch(); // Call internal reset function
            });
        } else { console.error("Reset button not found"); }
    }

    p.draw = () => {
        // console.log("draw() called"); // Optional: uncomment for debugging
        for (let i = elements.length - 1; i >= 0; i--) {
            // Check if elements[i] exists, needed if modifying array while looping?
            if (elements[i]) {
                elements[i].updateElement(); // Need to pass 'p' to Element methods
                elements[i].drawElement();   // Need to pass 'p' to Element methods
            }
        }

        // Sound playing logic
        if (soundQueue.length > 0 && gongSound && gongSound.isLoaded()) {
           if (!gongSound.isPlaying()) { // Check before playing
                let soundData = soundQueue.shift();
                if (reverb) {
                   gongSound.disconnect(); // Ensure clean state
                   try {
                       reverb.process(gongSound, soundData.decayTime, 0.35); // Apply reverb
                   } catch (e) { console.error("Reverb process failed", e); }
                } else {
                    console.warn("Reverb not initialized for sound playback");
                }
                gongSound.rate(soundData.pitch);
                gongSound.amp(0.5);
                gongSound.play();
           }
        }
    }

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        resetSketch();
    }

    // --- Element Class (Needs 'p' instance passed or defined inside sketch) ---
    // Option 1: Define class inside sketch function scope
    class Element {
        constructor(x, y) {
            this.posX = x;
            this.posY = y;
            // Use p.random, p.width, p.height
            this.dirX = p.random(-1, 1) * maxSpeed;
            this.dirY = p.random(-1, 1) * maxSpeed;
            this.size = p.random(minElementSize, maxElementSize);
            this.R = p.random(255);
            this.G = p.random(255);
            while (this.dirX === 0 && this.dirY === 0) {
                 this.dirX = p.random(-1, 1) * maxSpeed;
                 this.dirY = p.random(-1, 1) * maxSpeed;
            }
        }

        updateElement() { // Does not need 'p' if only using instance properties
            this.posX += this.dirX;
            this.posY += this.dirY;
            this.checkEdges(); // Pass 'p' if checkEdges uses p.width/height
        }

        drawElement() { // Needs 'p' for drawing functions
            p.push();
            p.noFill();
            p.stroke(this.R, this.G, 0, 105);
            p.ellipse(this.posX, this.posY, this.size, this.size);
            p.noStroke();
            p.fill(255, 35);
            p.ellipse(this.posX, this.posY, 2, 2);
            p.pop();
        }

        checkEdges() { // Needs 'p' for width/height
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
            if (edgeHit) {
                this.playGongSound(); // Pass 'p' if needed
            }
        }

        playGongSound() { // Needs 'p' for map/constrain, sound obj access
            if (isMuted || !gongSound || !gongSound.isLoaded()) return;

            let pitch = p.map(this.size, minElementSize, maxElementSize, 0.5, 1.5);
            pitch = p.constrain(pitch, 0.5, 1.5);
            let decayTime = p.map(this.size, minElementSize, maxElementSize, 1, 5);
            decayTime = p.constrain(decayTime, 1, 5);

            // Reverb logic might need adjustment with instance mode
            if (reverb) {
                try {
                    // reverb.set(decayTime, 0.35); // Use process instead?
                } catch(e) { console.error("Failed to set reverb", e)}
            }

            soundQueue.push({
              // sound: gongSound, // No longer needed in queue? draw uses global gongSound
              pitch: pitch,
              decayTime: decayTime
            });
        }
    } // End Element Class definition inside sketch

    // --- Event Handlers (need to be assigned to p) ---
    p.mousePressed = () => {
        // Check if click is on buttons (more robust check needed?)
        let muteBtn = document.getElementById('muteButton'); // Use document directly
        let resetBtn = document.getElementById('resetButton');
        let isOverButton = false;
        if (muteBtn && event && muteBtn.contains(event.target)) isOverButton = true;
        if (resetBtn && event && resetBtn.contains(event.target)) isOverButton = true;

        if (!isOverButton && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            // Need to instantiate Element using the class defined *inside* sketch scope
            elements.push(new Element(p.mouseX, p.mouseY));
        }
        // return false; // Prevent default might be needed
    }

    p.touchStarted = () => {
        let muteBtn = document.getElementById('muteButton'); // Use document directly
        let resetBtn = document.getElementById('resetButton');
        let isOverButton = false;
        if (muteBtn && event && muteBtn.contains(event.target)) isOverButton = true; // Basic check
        if (resetBtn && event && resetBtn.contains(event.target)) isOverButton = true;

        if (!isOverButton && p.touches.length > 0) {
           const touchX = p.touches[0].clientX;
           const touchY = p.touches[0].clientY;
           if (touchX >= 0 && touchX <= p.width && touchY >= 0 && touchY <= p.height) {
                elements.push(new Element(touchX, touchY));
            }
       }
       // return false; // Prevent default might be needed
    }

}; // End of sketch function definition


// --- Start p5 ---
new p5(sketch); // Create a new p5 instance, passing it the sketch function