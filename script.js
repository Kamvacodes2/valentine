// Elements
const envelope = document.getElementById("envelope-container");
const letter = document.getElementById("letter-container");
const noBtn = document.querySelector(".no-btn");
const noWrapper = document.querySelector(".no-wrapper");
const yesBtn = document.querySelector(".btn[alt='Yes']");
const letterWindow = document.querySelector(".letter-window");

const title = document.getElementById("letter-title");
const catImg = document.getElementById("letter-cat");
const buttons = document.getElementById("letter-buttons");
const finalText = document.getElementById("final-text");
const finalNoMobile = document.getElementById("final-no-mobile");

const MOBILE_BREAKPOINT = 768;

function isMobile() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

function applyMobileBehavior() {
    if (isMobile()) {
        noBtn.style.pointerEvents = "auto";
        noBtn.style.cursor = "pointer";
        noBtn.style.transform = "translate(0, 0)";
        noOffsetX = 0;
        noOffsetY = 0;
    } else {
        noBtn.style.pointerEvents = "none";
        noBtn.style.cursor = "default";
    }
}

window.addEventListener("resize", applyMobileBehavior);
applyMobileBehavior();

// Click Envelope

envelope.addEventListener("click", () => {
    envelope.style.display = "none";
    letter.style.display = "flex";

    setTimeout(() => {
        document.querySelector(".letter-window").classList.add("open");
    }, 50);
});

// --- NO button: drifts away from mouse, stays inside letter window, unclickable ---
let noOffsetX = 0;
let noOffsetY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let lastMouseTime = 0;
const NO_DRIFT_THRESHOLD = 120;   // pixels: start drifting when mouse is this close
const NO_DRIFT_FACTOR = 1.4;      // how much the button runs per pixel of mouse movement
const NO_DRIFT_MAX_STEP = 35;     // max drift per frame so it doesn't teleport
const PADDING = 12;               // padding from letter window edge
const YES_NO_GAP = 8;             // min gap between No and Yes so No can't touch/hide behind Yes

noBtn.style.transformOrigin = "center center";
noBtn.style.transition = "transform 0.12s ease-out";
noBtn.style.pointerEvents = "none";   // No button cannot be clicked

document.addEventListener("mousemove", (e) => {
    if (isMobile()) return;

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const now = performance.now();

    const rect = noBtn.getBoundingClientRect();
    const noCenterX = rect.left + rect.width / 2;
    const noCenterY = rect.top + rect.height / 2;

    const dx = mouseX - noCenterX;
    const dy = mouseY - noCenterY;
    const distToNo = Math.hypot(dx, dy);

    if (distToNo < NO_DRIFT_THRESHOLD && distToNo > 2) {
        // Direction away from mouse: button moves that way to escape
        const dirX = -dx / distToNo;
        const dirY = -dy / distToNo;

        const moveRate = Math.hypot(mouseX - lastMouseX, mouseY - lastMouseY);
        const driftAmount = Math.min(moveRate * NO_DRIFT_FACTOR, NO_DRIFT_MAX_STEP);

        noOffsetX += dirX * driftAmount;
        noOffsetY += dirY * driftAmount;

        // Keep No button inside the letter window (contained screen)
        const baseRect = noWrapper.getBoundingClientRect();
        const winRect = letterWindow.getBoundingClientRect();
        const btnW = baseRect.width;
        const btnH = baseRect.height;
        const minNoX = winRect.left + PADDING - baseRect.left;
        const maxNoX = winRect.right - PADDING - baseRect.left - btnW;
        const minNoY = winRect.top + PADDING - baseRect.top;
        const maxNoY = winRect.bottom - PADDING - baseRect.top - btnH;
        noOffsetX = Math.max(minNoX, Math.min(maxNoX, noOffsetX));
        noOffsetY = Math.max(minNoY, Math.min(maxNoY, noOffsetY));

        // Treat Yes button as obstacle: No must not overlap or hide behind Yes (move around it)
        const yesRect = yesBtn.getBoundingClientRect();
        const noLeft = baseRect.left + noOffsetX;
        const noRight = noLeft + btnW;
        const noTop = baseRect.top + noOffsetY;
        const noBottom = noTop + btnH;
        const yesLeft = yesRect.left - YES_NO_GAP;
        const yesRight = yesRect.right + YES_NO_GAP;
        const yesTop = yesRect.top - YES_NO_GAP;
        const yesBottom = yesRect.bottom + YES_NO_GAP;

        if (noLeft < yesRight && noRight > yesLeft && noTop < yesBottom && noBottom > yesTop) {
            // Overlap with Yes: push No out using smallest move so it slides around Yes
            const pushLeft = noRight - yesLeft;
            const pushRight = yesRight - noLeft;
            const pushUp = noBottom - yesTop;
            const pushDown = yesBottom - noTop;
            const minPush = Math.min(pushLeft, pushRight, pushUp, pushDown);

            if (minPush === pushLeft) noOffsetX -= pushLeft;
            else if (minPush === pushRight) noOffsetX += pushRight;
            else if (minPush === pushUp) noOffsetY -= pushUp;
            else noOffsetY += pushDown;

            // Re-clamp to letter window after push (in case we pushed out of bounds)
            noOffsetX = Math.max(minNoX, Math.min(maxNoX, noOffsetX));
            noOffsetY = Math.max(minNoY, Math.min(maxNoY, noOffsetY));
        }

        noBtn.style.transform = `translate(${noOffsetX}px, ${noOffsetY}px)`;

        growYesButton();
    }

    lastMouseX = mouseX;
    lastMouseY = mouseY;
    lastMouseTime = now;
});

// --- YES button: grows in place as they try to follow the No option ---
let yesScale = 1;
const YES_GROW_INCREMENT = 0.08;
const YES_GROW_MAX = 4;

yesBtn.style.position = "relative";
yesBtn.style.transformOrigin = "center center";
yesBtn.style.transition = "transform 0.25s ease";

function growYesButton() {
    if (isMobile()) return;
    yesScale = Math.min(yesScale + YES_GROW_INCREMENT, YES_GROW_MAX);
    yesBtn.style.transform = `scale(${yesScale})`;
}

// Mobile only: No is clicked → show "Sorry chommie" + evil_laugh.gif + date
noBtn.addEventListener("click", () => {
    if (!isMobile()) return;

    title.textContent = "Sorry chommie!";
    catImg.style.display = "none";
    buttons.style.display = "none";
    finalNoMobile.classList.add("visible");
});

// YES is clicked

yesBtn.addEventListener("click", () => {
    title.textContent = "Yaayyy!";

    catImg.src = "love-lovey.gif";
    catImg.style.display = "";

    document.querySelector(".letter-window").classList.add("final");

    buttons.style.display = "none";
    finalNoMobile.classList.remove("visible");

    finalText.style.display = "block";
});
