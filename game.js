const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("gameOverlay");
const startButton = document.getElementById("startButton");

const VIEW_WIDTH = canvas.width;
const VIEW_HEIGHT = canvas.height;

// ------------------------------------------------------------
// LARGE WORLD DIMENSIONS & CAMERA
// ------------------------------------------------------------
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1000;

const camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    lerpSpeed: 0.08,
    isManualScouting: false
};

// ------------------------------------------------------------
// PICTURE-IN-PICTURE RADAR CONFIGURATION
// ------------------------------------------------------------
const radar = {
    w: 200,
    h: 84,
    margin: 16,
    visible: true,
    isDragging: false,
    get x() { return VIEW_WIDTH - this.w - this.margin; },
    get y() { return VIEW_HEIGHT - this.h - this.margin; }
};

const keys = {};

// ------------------------------------------------------------
// GAMEPAD & TOUCH SYSTEM STATE
// ------------------------------------------------------------
const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const touchControls = {
    leftPressed: false,
    rightPressed: false,
    upPressed: false,
    downPressed: false,
    actionPressed: false,
    activeTouches: new Map()
};

let gamepadIndex = null;
let lastGamepadButtons = {};

// ------------------------------------------------------------
// FORM DEFINITIONS & PHYSICS MODIFIERS
// ------------------------------------------------------------
const FORMS = {
    NORMAL: {
        name: "NORMAL ORB",
        radius: 18,
        gravity: 1500,
        moveSpeed: 270,
        jumpPower: 560,
        bounce: 0.15,
        waterBuoyancy: 0.85,
        waterDrag: 0.92,
        colorCore: "#fff4f5",
        colorMid: "#ff91a7",
        colorOuter: "#ff3159",
        glowColor: "#ff496c"
    },
    BOUNCY: {
        name: "BALLOON ORB",
        radius: 22,
        gravity: 780,
        moveSpeed: 300,
        jumpPower: 670,
        bounce: 0.55,
        waterBuoyancy: 2.3,
        waterDrag: 0.94,
        colorCore: "#f0fdff",
        colorMid: "#7dd3fc",
        colorOuter: "#0284c7",
        glowColor: "#38bdf8"
    },
    STONE: {
        name: "STONE ORB",
        radius: 20,
        gravity: 2600,
        moveSpeed: 220,
        jumpPower: 390,
        bounce: 0.0,
        waterBuoyancy: 0.2,
        waterDrag: 0.88,
        colorCore: "#f1f5f9",
        colorMid: "#94a3b8",
        colorOuter: "#475569",
        glowColor: "#cbd5e1"
    }
};

let currentFormKey = "NORMAL";
let currentForm = FORMS[currentFormKey];

let started = false;
let gameCompleted = false;
let currentLevelIndex = 0;
let ringsCollected = 0;
let lastTime = 0;
let message = "";
let messageTimer = 0;
let globalTime = 0;

// ------------------------------------------------------------
// EXPANDED LARGE LEVELS (2400 x 1000)
// ------------------------------------------------------------
const LEVELS = [
    {
        name: "LEVEL 1: THE GREAT EXPEDITION",
        desc: "2400m Trek, Deep Water Trench, Sky High Cannons",
        spawn: { x: 80, y: 840 },
        platforms: [
            { x: 0, y: 900, w: 600, h: 100 },
            { x: 900, y: 900, w: 700, h: 100 },
            { x: 1800, y: 900, w: 600, h: 100 },

            { x: 300, y: 780, w: 180, h: 14 },
            { x: 520, y: 680, w: 160, h: 14 },

            { x: 740, y: 580, w: 200, h: 14 },
            { x: 1040, y: 520, w: 220, h: 14 },
            { x: 1340, y: 460, w: 200, h: 14 },

            { x: 1600, y: 380, w: 260, h: 14 },
            { x: 1940, y: 450, w: 180, h: 14 },
            { x: 2180, y: 530, w: 220, h: 14 }
        ],
        movingPlatforms: [
            { baseX: 700, baseY: 800, w: 120, h: 14, rangeX: 140, rangeY: 0, speed: 1.5, x: 700, y: 800, dx: 0, dy: 0 },
            { baseX: 1680, baseY: 650, w: 110, h: 14, rangeX: 0, rangeY: 120, speed: 1.3, x: 1680, y: 650, dx: 0, dy: 0 }
        ],
        movingHazards: [
            { baseX: 450, baseY: 600, radius: 14, rangeX: 60, rangeY: 40, speed: 2.0, x: 450, y: 600 },
            { baseX: 1200, baseY: 420, radius: 14, rangeX: 90, rangeY: 0, speed: 2.4, x: 1200, y: 420 }
        ],
        lasers: [
            { x: 1150, y: 534, w: 8, h: 366, cycle: 4.0, activeTime: 2.2, phase: 0.0, active: true }
        ],
        waterZones: [
            { x: 600, y: 900, w: 300, h: 100 },
            { x: 1600, y: 900, w: 200, h: 100 }
        ],
        breakables: [
            { x: 1500, y: 860, w: 36, h: 40, destroyed: false },
            { x: 2050, y: 410, w: 36, h: 40, destroyed: false }
        ],
        rings: [
            { x: 380, y: 740, collected: false },
            { x: 750, y: 870, collected: false },
            { x: 840, y: 540, collected: false },
            { x: 1150, y: 480, collected: false },
            { x: 1440, y: 420, collected: false },
            { x: 1580, y: 865, collected: false },
            { x: 1730, y: 340, collected: false },
            { x: 2280, y: 490, collected: false }
        ],
        spikes: [
            { x: 1050, y: 880, w: 100, h: 20 },
            { x: 1350, y: 880, w: 100, h: 20 }
        ],
        formPads: [
            { x: 340, y: 766, w: 36, h: 14, targetForm: "BOUNCY", label: "BALLOON" },
            { x: 1080, y: 506, w: 36, h: 14, targetForm: "STONE", label: "STONE" },
            { x: 1880, y: 886, w: 36, h: 14, targetForm: "NORMAL", label: "NORMAL" }
        ],
        cannon: {
            x: 1420, y: 420, radius: 28, angle: -Math.PI / 4,
            entered: false, cooldown: 0, power: 850
        },
        checkpoint: { x: 1060, y: 480, w: 24, h: 40, active: false },
        exit: { x: 2320, y: 470, w: 30, h: 60 }
    },
    {
        name: "LEVEL 2: FLOATING CAVERNS",
        desc: "High Altitude Ascension, Laser Mazes, Abyss Pools",
        spawn: { x: 80, y: 840 },
        platforms: [
            { x: 0, y: 900, w: 400, h: 100 },
            { x: 580, y: 900, w: 500, h: 100 },
            { x: 1300, y: 900, w: 1100, h: 100 },

            { x: 180, y: 750, w: 140, h: 14 },
            { x: 380, y: 640, w: 140, h: 14 },
            { x: 620, y: 540, w: 160, h: 14 },
            { x: 880, y: 440, w: 160, h: 14 },
            { x: 1160, y: 340, w: 180, h: 14 },
            { x: 1460, y: 260, w: 220, h: 14 },
            { x: 1800, y: 380, w: 160, h: 14 },
            { x: 2060, y: 500, w: 200, h: 14 }
        ],
        movingPlatforms: [
            { baseX: 440, baseY: 860, w: 110, h: 14, rangeX: 70, rangeY: 0, speed: 1.6, x: 440, y: 860, dx: 0, dy: 0 },
            { baseX: 1100, baseY: 850, w: 120, h: 14, rangeX: 0, rangeY: 80, speed: 1.8, x: 1100, y: 850, dx: 0, dy: 0 },
            { baseX: 1660, baseY: 480, w: 120, h: 14, rangeX: 90, rangeY: 0, speed: 1.4, x: 1660, y: 480, dx: 0, dy: 0 }
        ],
        movingHazards: [
            { baseX: 700, baseY: 480, radius: 14, rangeX: 0, rangeY: 70, speed: 2.2, x: 700, y: 480 },
            { baseX: 1340, baseY: 280, radius: 14, rangeX: 80, rangeY: 40, speed: 2.6, x: 1340, y: 280 }
        ],
        lasers: [
            { x: 800, y: 554, w: 8, h: 346, cycle: 4.2, activeTime: 2.4, phase: 0.0, active: true },
            { x: 1560, y: 274, w: 8, h: 626, cycle: 3.6, activeTime: 2.0, phase: 1.2, active: true }
        ],
        waterZones: [
            { x: 400, y: 900, w: 180, h: 100 },
            { x: 1080, y: 900, w: 220, h: 100 }
        ],
        breakables: [
            { x: 1240, y: 300, w: 36, h: 40, destroyed: false },
            { x: 1980, y: 860, w: 36, h: 40, destroyed: false }
        ],
        rings: [
            { x: 250, y: 710, collected: false },
            { x: 490, y: 850, collected: false },
            { x: 700, y: 500, collected: false },
            { x: 960, y: 400, collected: false },
            { x: 1200, y: 870, collected: false },
            { x: 1540, y: 220, collected: false },
            { x: 1880, y: 340, collected: false },
            { x: 2160, y: 460, collected: false }
        ],
        spikes: [
            { x: 750, y: 880, w: 120, h: 20 },
            { x: 1600, y: 880, w: 140, h: 20 }
        ],
        formPads: [
            { x: 200, y: 736, w: 36, h: 14, targetForm: "BOUNCY", label: "BALLOON" },
            { x: 920, y: 426, w: 36, h: 14, targetForm: "STONE", label: "STONE" },
            { x: 1400, y: 886, w: 36, h: 14, targetForm: "NORMAL", label: "NORMAL" }
        ],
        cannon: {
            x: 1000, y: 400, radius: 28, angle: -Math.PI / 3,
            entered: false, cooldown: 0, power: 880
        },
        checkpoint: { x: 940, y: 400, w: 24, h: 40, active: false },
        exit: { x: 2200, y: 440, w: 30, h: 60 }
    }
];

let level = null;
let respawnPoint = { x: 0, y: 0 };

const ball = {
    x: 0,
    y: 0,
    radius: currentForm.radius,
    vx: 0,
    vy: 0,
    onGround: false,
    inWater: false,
    wasInWater: false,
    groundPlatform: null
};

// ------------------------------------------------------------
// PARTICLE SYSTEM
// ------------------------------------------------------------
let particles = [];

function spawnParticle(x, y, vx, vy, size, color, life, gravityScale = 1) {
    particles.push({
        x, y, vx, vy,
        size,
        color,
        life,
        maxLife: life,
        gravityScale
    });
}

function spawnLandingDust(x, y, intensity = 6) {
    for (let i = 0; i < intensity; i++) {
        const vx = (Math.random() - 0.5) * 160;
        const vy = -Math.random() * 60 - 20;
        spawnParticle(x, y, vx, vy, Math.random() * 3 + 2, "#94a3b8", 0.35, 0.5);
    }
}

function spawnWaterSplash(x, y) {
    for (let i = 0; i < 14; i++) {
        const vx = (Math.random() - 0.5) * 180;
        const vy = -Math.random() * 140 - 40;
        spawnParticle(x, y, vx, vy, Math.random() * 3 + 2, "#7dd3fc", 0.45, 1.2);
    }
}

function spawnShatterDebris(block) {
    for (let i = 0; i < 22; i++) {
        const x = block.x + Math.random() * block.w;
        const y = block.y + Math.random() * block.h;
        const vx = (Math.random() - 0.5) * 320;
        const vy = -Math.random() * 240 - 50;
        const gray = Math.floor(Math.random() * 50 + 90);
        spawnParticle(x, y, vx, vy, Math.random() * 4 + 3, `rgb(${gray},${gray},${gray})`, 0.6, 1.6);
    }
}

function spawnMorphNova(x, y, color) {
    for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 170 + 40;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        spawnParticle(x, y, vx, vy, Math.random() * 4 + 2, color, 0.5, 0);
    }
}

function spawnCannonExhaust(x, y, angle) {
    for (let i = 0; i < 24; i++) {
        const spread = (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 260 + 80;
        const vx = -Math.cos(angle + spread) * speed;
        const vy = -Math.sin(angle + spread) * speed;
        const color = Math.random() > 0.4 ? "#ff91a7" : "#ffd166";
        spawnParticle(x, y, vx, vy, Math.random() * 5 + 3, color, 0.45, 0.2);
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        p.vy += 1200 * p.gravityScale * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.save();
        const progress = p.life / p.maxLife;
        ctx.globalAlpha = Math.max(0, progress);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * progress, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ------------------------------------------------------------
// CAMERA TRACKING SYSTEM
// ------------------------------------------------------------
function updateCamera() {
    if (!camera.isManualScouting) {
        camera.targetX = ball.x - VIEW_WIDTH / 2;
        camera.targetY = ball.y - VIEW_HEIGHT / 2;
    }

    camera.x += (camera.targetX - camera.x) * camera.lerpSpeed;
    camera.y += (camera.targetY - camera.y) * camera.lerpSpeed;

    camera.x = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - VIEW_HEIGHT, camera.y));
}

// ------------------------------------------------------------
// INTERACTIVE RADAR MINI-MAP
// ------------------------------------------------------------
function isPointInsideRadar(mx, my) {
    return (
        mx >= radar.x &&
        mx <= radar.x + radar.w &&
        my >= radar.y &&
        my <= radar.y + radar.h
    );
}

function handleRadarScout(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left) * (canvas.width / rect.width);
    const my = (clientY - rect.top) * (canvas.height / rect.height);

    if (isPointInsideRadar(mx, my)) {
        const relX = (mx - radar.x) / radar.w;
        const relY = (my - radar.y) / radar.h;

        camera.targetX = relX * WORLD_WIDTH - VIEW_WIDTH / 2;
        camera.targetY = relY * WORLD_HEIGHT - VIEW_HEIGHT / 2;
        camera.isManualScouting = true;
    }
}

canvas.addEventListener("mousedown", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    if (radar.visible && isPointInsideRadar(mx, my)) {
        radar.isDragging = true;
        handleRadarScout(e.clientX, e.clientY);
    }
});

window.addEventListener("mousemove", e => {
    if (radar.isDragging) {
        handleRadarScout(e.clientX, e.clientY);
    }
});

window.addEventListener("mouseup", () => {
    radar.isDragging = false;
});

function drawMiniMapRadar() {
    if (!radar.visible || !level || !started || gameCompleted) return;

    ctx.save();
    const rx = radar.x;
    const ry = radar.y;
    const rw = radar.w;
    const rh = radar.h;

    const scaleX = rw / WORLD_WIDTH;
    const scaleY = rh / WORLD_HEIGHT;

    // Radar Backing
    ctx.fillStyle = "rgba(10, 15, 30, 0.78)";
    ctx.fillRect(rx, ry, rw, rh);

    ctx.strokeStyle = radar.isDragging ? "#38bdf8" : "rgba(88, 116, 148, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(rx, ry, rw, rh);

    // Platforms
    ctx.fillStyle = "#334155";
    const allPlatforms = [...level.platforms, ...level.movingPlatforms];
    for (const p of allPlatforms) {
        ctx.fillRect(rx + p.x * scaleX, ry + p.y * scaleY, Math.max(1.5, p.w * scaleX), Math.max(1.5, p.h * scaleY));
    }

    // Water Zones
    ctx.fillStyle = "rgba(56, 189, 248, 0.55)";
    for (const w of level.waterZones) {
        ctx.fillRect(rx + w.x * scaleX, ry + w.y * scaleY, w.w * scaleX, w.h * scaleY);
    }

    // Spikes
    ctx.fillStyle = "#ff496c";
    for (const s of level.spikes) {
        ctx.fillRect(rx + s.x * scaleX, ry + s.y * scaleY, s.w * scaleX, Math.max(1.5, s.h * scaleY));
    }

    // Rings
    ctx.fillStyle = "#ffd166";
    for (const r of level.rings) {
        if (!r.collected) {
            ctx.beginPath();
            ctx.arc(rx + r.x * scaleX, ry + r.y * scaleY, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Exit & Checkpoint
    ctx.fillStyle = "#54f0a4";
    ctx.fillRect(rx + level.exit.x * scaleX, ry + level.exit.y * scaleY, 3, 5);

    ctx.fillStyle = level.checkpoint.active ? "#54f0a4" : "#64748b";
    ctx.fillRect(rx + level.checkpoint.x * scaleX, ry + level.checkpoint.y * scaleY, 2.5, 4);

    // Frustum Box
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
        rx + camera.x * scaleX,
        ry + camera.y * scaleY,
        VIEW_WIDTH * scaleX,
        VIEW_HEIGHT * scaleY
    );

    // Player Ping
    const px = rx + ball.x * scaleX;
    const py = ry + ball.y * scaleY;

    ctx.shadowColor = currentForm.glowColor;
    ctx.shadowBlur = 6;
    ctx.fillStyle = currentForm.glowColor;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.font = "9px Arial";
    ctx.textAlign = "left";
    ctx.fillText("RADAR · [TAB]", rx + 6, ry + 11);

    ctx.restore();
}

// ------------------------------------------------------------
// TOUCH SCREEN ON-SCREEN CONTROLS
// ------------------------------------------------------------
function setupMobileTouchControls() {
    if (!isTouchDevice) return;

    let touchWrapper = document.getElementById("orbboundTouchOverlay");
    if (touchWrapper) return;

    touchWrapper = document.createElement("div");
    touchWrapper.id = "orbboundTouchOverlay";
    touchWrapper.style.position = "absolute";
    touchWrapper.style.top = "0";
    touchWrapper.style.left = "0";
    touchWrapper.style.width = "100%";
    touchWrapper.style.height = "100%";
    touchWrapper.style.pointerEvents = "none";
    touchWrapper.style.zIndex = "40";
    touchWrapper.style.userSelect = "none";
    touchWrapper.style.webkitUserSelect = "none";

    touchWrapper.innerHTML = `
        <!-- Form Switching Header Carousel -->
        <div style="position:absolute; top:12px; right:16px; display:flex; gap:8px; pointer-events:auto;">
            <button id="touchFormNormal" style="background:rgba(255,73,108,0.3); border:1px solid #ff496c; color:#fff; border-radius:14px; padding:6px 12px; font-weight:bold; font-size:11px;">🔴 NORM</button>
            <button id="touchFormBouncy" style="background:rgba(56,189,248,0.3); border:1px solid #38bdf8; color:#fff; border-radius:14px; padding:6px 12px; font-weight:bold; font-size:11px;">🔵 AIR</button>
            <button id="touchFormStone" style="background:rgba(148,163,184,0.3); border:1px solid #cbd5e1; color:#fff; border-radius:14px; padding:6px 12px; font-weight:bold; font-size:11px;">⚪ STONE</button>
        </div>

        <!-- Left Virtual D-Pad -->
        <div style="position:absolute; bottom:24px; left:20px; display:flex; gap:14px; pointer-events:auto;">
            <button id="touchBtnLeft" style="width:62px; height:62px; border-radius:31px; background:rgba(30,41,59,0.75); border:2px solid #38bdf8; color:#ffffff; font-size:24px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.4); touch-action:none;">◀</button>
            <button id="touchBtnRight" style="width:62px; height:62px; border-radius:31px; background:rgba(30,41,59,0.75); border:2px solid #38bdf8; color:#ffffff; font-size:24px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.4); touch-action:none;">▶</button>
        </div>

        <!-- Cannon Aim Adjustment Buttons -->
        <div style="position:absolute; bottom:96px; left:58px; display:flex; flex-direction:column; gap:8px; pointer-events:auto;">
            <button id="touchBtnAimUp" style="width:48px; height:48px; border-radius:24px; background:rgba(30,41,59,0.6); border:1.5px solid #94a3b8; color:#ffffff; font-size:18px; display:flex; align-items:center; justify-content:center; touch-action:none;">▲</button>
            <button id="touchBtnAimDown" style="width:48px; height:48px; border-radius:24px; background:rgba(30,41,59,0.6); border:1.5px solid #94a3b8; color:#ffffff; font-size:18px; display:flex; align-items:center; justify-content:center; touch-action:none;">▼</button>
        </div>

        <!-- Right Jump / Action Button -->
        <div style="position:absolute; bottom:24px; right:20px; pointer-events:auto;">
            <button id="touchBtnAction" style="width:76px; height:76px; border-radius:38px; background:rgba(255,73,108,0.75); border:2.5px solid #ffffff; color:#ffffff; font-weight:bold; font-size:14px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(255,73,108,0.5); touch-action:none;">JUMP</button>
        </div>
    `;

    document.body.appendChild(touchWrapper);

    // Bind touch events with activeTouches state to support multi-touch
    const bindTouch = (id, keyName) => {
        const btn = document.getElementById(id);
        if (!btn) return;

        btn.addEventListener("touchstart", e => {
            e.preventDefault();
            touchControls[keyName] = true;
            camera.isManualScouting = false;

            if (keyName === "actionPressed") {
                triggerJumpOrAction();
            }
        });

        btn.addEventListener("touchend", e => {
            e.preventDefault();
            touchControls[keyName] = false;
        });

        btn.addEventListener("touchcancel", e => {
            e.preventDefault();
            touchControls[keyName] = false;
        });
    };

    bindTouch("touchBtnLeft", "leftPressed");
    bindTouch("touchBtnRight", "rightPressed");
    bindTouch("touchBtnAimUp", "upPressed");
    bindTouch("touchBtnAimDown", "downPressed");
    bindTouch("touchBtnAction", "actionPressed");

    // Form Switch buttons
    document.getElementById("touchFormNormal").onclick = () => setBallForm("NORMAL");
    document.getElementById("touchFormBouncy").onclick = () => setBallForm("BOUNCY");
    document.getElementById("touchFormStone").onclick = () => setBallForm("STONE");
}

function triggerJumpOrAction() {
    if (!started || gameCompleted || !level) return;

    if (level.cannon.entered) {
        fireCannon();
        return;
    }

    if (ball.onGround) {
        ball.vy = -currentForm.jumpPower;
        ball.onGround = false;
        ball.groundPlatform = null;
        spawnLandingDust(ball.x, ball.y + ball.radius, 7);
    } else if (ball.inWater && currentFormKey !== "STONE") {
        ball.vy = -340;
        spawnParticle(ball.x, ball.y + 6, (Math.random() - 0.5) * 40, 20, 3, "#bae6fd", 0.4, 0);
    }
}

// ------------------------------------------------------------
// GAMEPAD API POLLING SYSTEM
// ------------------------------------------------------------
window.addEventListener("gamepadconnected", e => {
    gamepadIndex = e.gamepad.index;
    setMessage(`CONTROLLER CONNECTED: ${e.gamepad.id.substring(0, 18)}...`, 2.5);
});

window.addEventListener("gamepaddisconnected", e => {
    if (gamepadIndex === e.gamepad.index) {
        gamepadIndex = null;
        setMessage("CONTROLLER DISCONNECTED", 2.0);
    }
});

function pollGamepad() {
    if (gamepadIndex === null) return;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[gamepadIndex];
    if (!gp) return;

    // Movement: Left Stick X or D-Pad (Buttons 14: Left, 15: Right)
    const axisX = gp.axes[0] || 0;
    const dpadLeft = gp.buttons[14] && gp.buttons[14].pressed;
    const dpadRight = gp.buttons[15] && gp.buttons[15].pressed;

    keys.GamepadLeft = axisX < -0.3 || dpadLeft;
    keys.GamepadRight = axisX > 0.3 || dpadRight;

    // Cannon Aim: Left Stick Y or D-Pad (Buttons 12: Up, 13: Down)
    const axisY = gp.axes[1] || 0;
    const dpadUp = gp.buttons[12] && gp.buttons[12].pressed;
    const dpadDown = gp.buttons[13] && gp.buttons[13].pressed;

    if (level && level.cannon && level.cannon.entered) {
        if (axisY < -0.3 || dpadUp) {
            level.cannon.angle = Math.max(-Math.PI / 2, level.cannon.angle - 0.08);
        }
        if (axisY > 0.3 || dpadDown) {
            level.cannon.angle = Math.min(0, level.cannon.angle + 0.08);
        }
    }

    // Button 0 (A / Cross): Jump / Launch
    const btnJump = gp.buttons[0] && gp.buttons[0].pressed;
    if (btnJump && !lastGamepadButtons[0]) {
        camera.isManualScouting = false;
        triggerJumpOrAction();
    }
    lastGamepadButtons[0] = btnJump;

    // Form Quick-Switch Hotkeys:
    // Button 1 (B / Circle) -> Normal
    const btnFormNorm = gp.buttons[1] && gp.buttons[1].pressed;
    if (btnFormNorm && !lastGamepadButtons[1]) setBallForm("NORMAL");
    lastGamepadButtons[1] = btnFormNorm;

    // Button 2 (X / Square) -> Balloon
    const btnFormBouncy = gp.buttons[2] && gp.buttons[2].pressed;
    if (btnFormBouncy && !lastGamepadButtons[2]) setBallForm("BOUNCY");
    lastGamepadButtons[2] = btnFormBouncy;

    // Button 3 (Y / Triangle) -> Stone
    const btnFormStone = gp.buttons[3] && gp.buttons[3].pressed;
    if (btnFormStone && !lastGamepadButtons[3]) setBallForm("STONE");
    lastGamepadButtons[3] = btnFormStone;

    // Button 9 (Start / Options) -> Menu
    const btnStart = gp.buttons[9] && gp.buttons[9].pressed;
    if (btnStart && !lastGamepadButtons[9]) openLevelSelectMenu();
    lastGamepadButtons[9] = btnStart;

    // Button 8 (Select / Share) -> Quick Restart
    const btnSelect = gp.buttons[8] && gp.buttons[8].pressed;
    if (btnSelect && !lastGamepadButtons[8]) {
        if (gameCompleted) startWithLevel(0);
        else loadLevel(currentLevelIndex);
    }
    lastGamepadButtons[8] = btnSelect;

    // Clear scouting if moving controller stick
    if (keys.GamepadLeft || keys.GamepadRight) {
        camera.isManualScouting = false;
    }
}

// ------------------------------------------------------------
// LEVEL SETUP & CONTROL
// ------------------------------------------------------------
function loadLevel(index) {
    currentLevelIndex = index;
    const src = LEVELS[index];

    level = {
        name: src.name,
        spawn: { ...src.spawn },
        platforms: src.platforms.map(p => ({ ...p })),
        movingPlatforms: src.movingPlatforms.map(mp => ({ ...mp })),
        movingHazards: src.movingHazards.map(mh => ({ ...mh })),
        lasers: src.lasers.map(l => ({ ...l })),
        waterZones: src.waterZones.map(w => ({ ...w })),
        breakables: src.breakables.map(b => ({ ...b })),
        rings: src.rings.map(r => ({ ...r })),
        spikes: src.spikes.map(s => ({ ...s })),
        formPads: src.formPads.map(f => ({ ...f })),
        cannon: { ...src.cannon },
        checkpoint: { ...src.checkpoint },
        exit: { ...src.exit }
    };

    ringsCollected = 0;
    respawnPoint = { ...level.spawn };
    setBallForm("NORMAL");
    resetBall();

    camera.x = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH, ball.x - VIEW_WIDTH / 2));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - VIEW_HEIGHT, ball.y - VIEW_HEIGHT / 2));
    camera.isManualScouting = false;

    const ringCountEl = document.getElementById("ringCount");
    if (ringCountEl) ringCountEl.textContent = `0 / ${level.rings.length}`;

    setMessage(level.name, 2.5);
}

function setBallForm(formKey) {
    if (!FORMS[formKey] || currentFormKey === formKey) return;
    currentFormKey = formKey;
    currentForm = FORMS[formKey];
    ball.radius = currentForm.radius;

    spawnMorphNova(ball.x, ball.y, currentForm.glowColor);

    const ballFormEl = document.getElementById("ballForm");
    if (ballFormEl) ballFormEl.textContent = currentForm.name;

    setMessage(`MORPHED INTO ${currentForm.name}!`, 1.2);
}

function setMessage(text, duration = 2) {
    message = text;
    messageTimer = duration;
    const statusEl = document.getElementById("gameStatus");
    if (statusEl) statusEl.textContent = text;
}

function resetBall() {
    ball.x = respawnPoint.x;
    ball.y = respawnPoint.y;
    ball.vx = 0;
    ball.vy = 0;
    ball.onGround = false;
    ball.inWater = false;
    ball.wasInWater = false;
    ball.groundPlatform = null;
    camera.isManualScouting = false;

    if (level && level.cannon) {
        level.cannon.entered = false;
        level.cannon.cooldown = 0.4;
    }
    particles = [];
}

function startWithLevel(index) {
    gameCompleted = false;
    started = true;
    if (overlay) overlay.style.display = "none";
    loadLevel(index);
}

function openLevelSelectMenu() {
    started = false;
    if (overlay) overlay.style.display = "flex";
}

// ------------------------------------------------------------
// LEVEL SELECT UI
// ------------------------------------------------------------
function setupLevelSelectUI() {
    if (!overlay) return;

    let selectContainer = document.getElementById("levelSelectGrid");
    if (!selectContainer) {
        selectContainer = document.createElement("div");
        selectContainer.id = "levelSelectGrid";
        selectContainer.style.display = "flex";
        selectContainer.style.flexDirection = "column";
        selectContainer.style.gap = "10px";
        selectContainer.style.marginTop = "16px";
        selectContainer.style.marginBottom = "10px";
        selectContainer.style.width = "100%";
        selectContainer.style.maxWidth = "420px";

        LEVELS.forEach((lvl, idx) => {
            const btn = document.createElement("button");
            btn.innerHTML = `<span style="font-weight:bold; color:#7dd3fc;">LEVEL ${idx + 1}</span> — <span style="font-size:12px; color:#cbd5e1;">${lvl.name.split(':')[1] || lvl.name}</span><br><span style="font-size:10px; color:#94a3b8;">${lvl.desc}</span>`;
            btn.style.padding = "10px 14px";
            btn.style.background = "#1e293b";
            btn.style.border = "1px solid #334155";
            btn.style.borderRadius = "8px";
            btn.style.color = "#ffffff";
            btn.style.cursor = "pointer";
            btn.style.textAlign = "left";
            btn.style.transition = "all 0.15s ease";

            btn.onmouseenter = () => {
                btn.style.background = "#334155";
                btn.style.borderColor = "#38bdf8";
                btn.style.transform = "translateX(4px)";
            };
            btn.onmouseleave = () => {
                btn.style.background = "#1e293b";
                btn.style.borderColor = "#334155";
                btn.style.transform = "translateX(0px)";
            };

            btn.onclick = () => {
                startWithLevel(idx);
            };

            selectContainer.appendChild(btn);
        });

        if (startButton && startButton.parentNode) {
            startButton.parentNode.insertBefore(selectContainer, startButton.nextSibling);
            startButton.textContent = "PLAY FROM LEVEL 1";
        } else {
            overlay.appendChild(selectContainer);
        }
    }
}

if (startButton) {
    startButton.addEventListener("click", () => startWithLevel(0));
}

// ------------------------------------------------------------
// INPUT HANDLING
// ------------------------------------------------------------
document.addEventListener("keydown", event => {
    const blockedKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Tab"];
    if (blockedKeys.includes(event.code)) event.preventDefault();

    keys[event.code] = true;
    if (event.repeat) return;

    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD", "KeyW", "KeyS", "Space"].includes(event.code)) {
        camera.isManualScouting = false;
    }

    if (event.code === "Tab") {
        radar.visible = !radar.visible;
        return;
    }

    if (event.code === "KeyR" && started) {
        if (gameCompleted) startWithLevel(0);
        else loadLevel(currentLevelIndex);
        return;
    }

    if (event.code === "KeyM") {
        openLevelSelectMenu();
        return;
    }

    if (started && !gameCompleted) {
        if (event.code === "Digit1") setBallForm("NORMAL");
        if (event.code === "Digit2") setBallForm("BOUNCY");
        if (event.code === "Digit3") setBallForm("STONE");
    }

    if (!started || gameCompleted || !level) return;

    if (level.cannon.entered) {
        if (event.code === "ArrowUp" || event.code === "KeyW") {
            level.cannon.angle = Math.max(-Math.PI / 2, level.cannon.angle - 0.08);
        }
        if (event.code === "ArrowDown" || event.code === "KeyS") {
            level.cannon.angle = Math.min(0, level.cannon.angle + 0.08);
        }
        if (event.code === "Enter" || event.code === "Space") {
            fireCannon();
        }
        return;
    }

    if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
        triggerJumpOrAction();
    }
});

document.addEventListener("keyup", event => {
    keys[event.code] = false;
});

function fireCannon() {
    if (!level.cannon.entered || level.cannon.cooldown > 0) return;

    ball.x = level.cannon.x;
    ball.y = level.cannon.y;
    ball.vx = Math.cos(level.cannon.angle) * level.cannon.power;
    ball.vy = Math.sin(level.cannon.angle) * level.cannon.power;

    spawnCannonExhaust(level.cannon.x, level.cannon.y, level.cannon.angle);

    level.cannon.entered = false;
    level.cannon.cooldown = 0.7;
    setMessage("LAUNCHED!", 1);
}

function overlaps(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

function getBallBox() {
    return {
        x: ball.x - ball.radius,
        y: ball.y - ball.radius,
        w: ball.radius * 2,
        h: ball.radius * 2
    };
}

// ------------------------------------------------------------
// GAME LOOP & PHYSICS UPDATE
// ------------------------------------------------------------
function update(dt) {
    if (!started || gameCompleted || !level) return;

    globalTime += dt;
    messageTimer = Math.max(0, messageTimer - dt);
    level.cannon.cooldown = Math.max(0, level.cannon.cooldown - dt);

    pollGamepad();
    updateParticles(dt);

    // Touch D-Pad Aim for Cannon
    if (level.cannon.entered) {
        if (touchControls.upPressed) {
            level.cannon.angle = Math.max(-Math.PI / 2, level.cannon.angle - 0.08);
        }
        if (touchControls.downPressed) {
            level.cannon.angle = Math.min(0, level.cannon.angle + 0.08);
        }
    }

    // 1. Moving Platforms
    for (const mp of level.movingPlatforms) {
        const oldX = mp.x;
        const oldY = mp.y;

        const sinT = Math.sin(globalTime * mp.speed);
        mp.x = mp.baseX + sinT * mp.rangeX;
        mp.y = mp.baseY + Math.cos(globalTime * mp.speed) * mp.rangeY;

        mp.dx = mp.x - oldX;
        mp.dy = mp.y - oldY;
    }

    if (ball.onGround && ball.groundPlatform) {
        ball.x += ball.groundPlatform.dx;
        ball.y += ball.groundPlatform.dy;
    }

    // 2. Moving Hazards
    for (const mh of level.movingHazards) {
        mh.x = mh.baseX + Math.sin(globalTime * mh.speed) * mh.rangeX;
        mh.y = mh.baseY + Math.cos(globalTime * mh.speed) * mh.rangeY;
    }

    // 3. Pulsing Lasers
    for (const laser of level.lasers) {
        const localTime = (globalTime + laser.phase) % laser.cycle;
        laser.active = localTime < laser.activeTime;
    }

    if (level.cannon.entered) {
        ball.x = level.cannon.x;
        ball.y = level.cannon.y;
        ball.vx = 0;
        ball.vy = 0;
        updateCamera();
        return;
    }

    // Horizontal Movement (Keyboard + Gamepad + Touch Controls)
    ball.vx = 0;
    const moveLeft = keys.ArrowLeft || keys.KeyA || keys.GamepadLeft || touchControls.leftPressed;
    const moveRight = keys.ArrowRight || keys.KeyD || keys.GamepadRight || touchControls.rightPressed;

    if (moveLeft) ball.vx = -currentForm.moveSpeed;
    if (moveRight) ball.vx = currentForm.moveSpeed;

    // Water Detection
    ball.wasInWater = ball.inWater;
    ball.inWater = false;
    const ballBox = getBallBox();
    for (const pool of level.waterZones) {
        if (overlaps(ballBox, pool)) {
            ball.inWater = true;
            break;
        }
    }

    if (ball.inWater && !ball.wasInWater) {
        spawnWaterSplash(ball.x, 900);
    } else if (!ball.inWater && ball.wasInWater) {
        spawnWaterSplash(ball.x, 900);
    }

    if (ball.inWater && (Math.abs(ball.vx) > 30 || Math.abs(ball.vy) > 30)) {
        if (Math.random() < 0.3) {
            spawnParticle(ball.x + (Math.random() - 0.5) * 8, ball.y + 4, 0, -40, Math.random() * 2 + 1.5, "#bae6fd", 0.5, -0.4);
        }
    }

    // Movement & Drag
    if (ball.inWater) {
        ball.vx *= currentForm.waterDrag;
        ball.x += ball.vx * dt;

        const netUpwardForce = (currentForm.waterBuoyancy - 1) * 1200;
        ball.vy -= netUpwardForce * dt;
        ball.vy *= currentForm.waterDrag;
    } else {
        ball.x += ball.vx * dt;
        ball.vy += currentForm.gravity * dt;
    }

    const previousBottom = ball.y + ball.radius;
    ball.y += ball.vy * dt;

    // World Boundary Clamp
    ball.x = Math.max(ball.radius, Math.min(WORLD_WIDTH - ball.radius, ball.x));

    const wasOnGround = ball.onGround;
    ball.onGround = false;
    ball.groundPlatform = null;

    // Platform Collisions
    const allPlatforms = [
        ...level.platforms,
        ...level.movingPlatforms
    ];

    const currentBottom = ball.y + ball.radius;
    for (const platform of allPlatforms) {
        if (
            ball.vy >= 0 &&
            previousBottom <= platform.y + 8 &&
            currentBottom >= platform.y &&
            ball.x + ball.radius > platform.x &&
            ball.x - ball.radius < platform.x + platform.w
        ) {
            ball.y = platform.y - ball.radius;

            if (!wasOnGround && Math.abs(ball.vy) > 180) {
                spawnLandingDust(ball.x, platform.y, Math.min(10, Math.floor(Math.abs(ball.vy) / 60)));
            }

            if (currentForm.bounce > 0 && Math.abs(ball.vy) > 120) {
                ball.vy = -ball.vy * currentForm.bounce;
                ball.onGround = false;
            } else {
                ball.vy = 0;
                ball.onGround = true;
                if (platform.dx !== undefined) {
                    ball.groundPlatform = platform;
                }
            }
        }
    }

    // Breakables
    for (const block of level.breakables) {
        if (block.destroyed) continue;

        const currentBox = getBallBox();
        if (overlaps(currentBox, block)) {
            if (currentFormKey === "STONE") {
                block.destroyed = true;
                spawnShatterDebris(block);
                setMessage("WALL SMASHED!", 1.2);
            } else {
                if (ball.x < block.x) {
                    ball.x = block.x - ball.radius;
                } else {
                    ball.x = block.x + block.w + ball.radius;
                }
                ball.vx = 0;
            }
        }
    }

    // Form Pads
    for (const pad of level.formPads) {
        if (overlaps(getBallBox(), pad)) {
            if (currentFormKey !== pad.targetForm) {
                setBallForm(pad.targetForm);
            }
        }
    }

    // Flying Drone Collisions
    for (const mh of level.movingHazards) {
        const dist = Math.hypot(ball.x - mh.x, ball.y - mh.y);
        if (dist < ball.radius + mh.radius) {
            spawnMorphNova(ball.x, ball.y, "#ff0055");
            resetBall();
            setMessage("DESTROYED BY DRONE!", 1.5);
            return;
        }
    }

    // Pulsing Lasers
    for (const laser of level.lasers) {
        if (laser.active && overlaps(getBallBox(), laser)) {
            if (currentFormKey === "STONE") {
                if (Math.random() < 0.2) {
                    spawnParticle(ball.x, ball.y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 2, "#00f0ff", 0.2, 0);
                }
            } else {
                spawnMorphNova(ball.x, ball.y, "#00f0ff");
                resetBall();
                setMessage("ZAPPED BY LASER!", 1.5);
                return;
            }
        }
    }

    // Cannon Entry
    if (level.cannon.cooldown <= 0) {
        const distance = Math.hypot(ball.x - level.cannon.x, ball.y - level.cannon.y);
        if (distance < ball.radius + level.cannon.radius) {
            level.cannon.entered = true;
            ball.x = level.cannon.x;
            ball.y = level.cannon.y;
            ball.vx = 0;
            ball.vy = 0;
            ball.onGround = false;
            ball.groundPlatform = null;
            setMessage("CANNON READY", 2);
            updateCamera();
            return;
        }
    }

    // Checkpoint
    if (!level.checkpoint.active && overlaps(getBallBox(), level.checkpoint)) {
        level.checkpoint.active = true;
        respawnPoint = {
            x: level.checkpoint.x + level.checkpoint.w / 2,
            y: level.checkpoint.y - ball.radius
        };
        spawnMorphNova(level.checkpoint.x + 10, level.checkpoint.y + 15, "#54f0a4");
        setMessage("CHECKPOINT SAVED!", 2);
    }

    // Rings
    for (const ring of level.rings) {
        if (ring.collected) continue;
        const distance = Math.hypot(ball.x - ring.x, ball.y - ring.y);
        if (distance < ball.radius + 10) {
            ring.collected = true;
            ringsCollected++;
            spawnMorphNova(ring.x, ring.y, "#ffd166");
            const ringCountEl = document.getElementById("ringCount");
            if (ringCountEl) ringCountEl.textContent = `${ringsCollected} / ${level.rings.length}`;
            setMessage("RING COLLECTED!", 1);
        }
    }

    // Spikes (Stone is immune)
    for (const spike of level.spikes) {
        if (overlaps(getBallBox(), spike)) {
            if (currentFormKey === "STONE") {
                ball.y = spike.y - ball.radius;
                ball.vy = 0;
                ball.onGround = true;
            } else {
                spawnMorphNova(ball.x, ball.y, "#ff496c");
                resetBall();
                setMessage("SPIKES! RESPAWNING", 1);
                return;
            }
        }
    }

    // Fall out of world bounds
    if (ball.y > WORLD_HEIGHT + 60) {
        resetBall();
        setMessage("FALLEN! RESPAWNING", 1);
        return;
    }

    // Exit
    if (overlaps(getBallBox(), level.exit)) {
        if (ringsCollected === level.rings.length) {
            if (currentLevelIndex + 1 < LEVELS.length) {
                loadLevel(currentLevelIndex + 1);
            } else {
                gameCompleted = true;
                setMessage("ORBBOUND CHAMPION!", 0);
            }
        } else if (messageTimer <= 0) {
            setMessage(`COLLECT ${level.rings.length - ringsCollected} MORE RINGS`, 1);
        }
    }

    updateCamera();
}

// ------------------------------------------------------------
// PARALLAX BACKGROUND & RENDERING
// ------------------------------------------------------------
const stars = Array.from({ length: 140 }, () => ({
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
    r: Math.random() * 1.5 + 0.4,
    layer: Math.random() > 0.5 ? 0.2 : 0.4,
    phase: Math.random() * Math.PI * 2
}));

function drawParallaxBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    gradient.addColorStop(0, "#080d1a");
    gradient.addColorStop(1, "#03060d");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    for (const star of stars) {
        const renderX = (star.x - camera.x * star.layer + WORLD_WIDTH) % WORLD_WIDTH;
        const renderY = (star.y - camera.y * star.layer + WORLD_HEIGHT) % WORLD_HEIGHT;

        if (renderX < 0 || renderX > VIEW_WIDTH || renderY < 0 || renderY > VIEW_HEIGHT) continue;

        const alpha = 0.4 + Math.sin(performance.now() * 0.001 + star.phase) * 0.25;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#dbe5ff";
        ctx.fillRect(renderX, renderY, star.r, star.r);
    }

    ctx.globalAlpha = 1;
}

function drawLevel() {
    if (!level) return;

    // Static Platforms
    for (const platform of level.platforms) {
        ctx.fillStyle = "#23334c";
        ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
        ctx.fillStyle = "#587494";
        ctx.fillRect(platform.x, platform.y, platform.w, 4);
    }

    // Moving Platforms
    for (const mp of level.movingPlatforms) {
        ctx.save();
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(mp.x, mp.y, mp.w, mp.h);

        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.strokeRect(mp.x, mp.y, mp.w, mp.h);

        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(mp.x + mp.w / 2 - 8, mp.y + 3, 16, 6);
        ctx.restore();
    }

    // Water
    for (const pool of level.waterZones) {
        ctx.save();
        ctx.fillStyle = "rgba(14, 165, 233, 0.45)";
        ctx.fillRect(pool.x, pool.y, pool.w, pool.h);

        ctx.fillStyle = "#38bdf8";
        const waveOffset = Math.sin(performance.now() * 0.005) * 3;
        ctx.fillRect(pool.x, pool.y + waveOffset, pool.w, 3);
        ctx.restore();
    }

    // Lasers
    for (const laser of level.lasers) {
        ctx.save();
        ctx.fillStyle = "#334155";
        ctx.fillRect(laser.x - 4, laser.y - 6, laser.w + 8, 6);
        ctx.fillRect(laser.x - 4, laser.y + laser.h, laser.w + 8, 6);

        if (laser.active) {
            ctx.shadowColor = "#00f0ff";
            ctx.shadowBlur = 16;
            ctx.fillStyle = "#e0faff";
            ctx.fillRect(laser.x + 2, laser.y, laser.w - 4, laser.h);

            ctx.fillStyle = "rgba(0, 240, 255, 0.4)";
            ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
        } else {
            ctx.fillStyle = "rgba(0, 240, 255, 0.12)";
            ctx.fillRect(laser.x + 2, laser.y, laser.w - 4, laser.h);
        }
        ctx.restore();
    }

    // Moving Hazards
    for (const mh of level.movingHazards) {
        ctx.save();
        ctx.shadowColor = "#ff0055";
        ctx.shadowBlur = 14;

        ctx.fillStyle = "#ff0055";
        ctx.beginPath();
        ctx.arc(mh.x, mh.y, mh.radius - 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffd166";
        for (let a = 0; a < 4; a++) {
            const angle = (a * Math.PI / 2) + globalTime * 3;
            const sx = mh.x + Math.cos(angle) * (mh.radius + 5);
            const sy = mh.y + Math.sin(angle) * (mh.radius + 5);
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // Breakables
    for (const block of level.breakables) {
        if (block.destroyed) continue;
        ctx.save();
        ctx.fillStyle = "#64748b";
        ctx.fillRect(block.x, block.y, block.w, block.h);

        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(block.x + 6, block.y + 4);
        ctx.lineTo(block.x + 18, block.y + 20);
        ctx.lineTo(block.x + 12, block.y + 36);
        ctx.stroke();

        ctx.strokeStyle = "#94a3b8";
        ctx.strokeRect(block.x, block.y, block.w, block.h);
        ctx.restore();
    }

    // Form Pads
    for (const pad of level.formPads) {
        const isCurrent = currentFormKey === pad.targetForm;
        let padColor = "#a5b4fc";
        if (pad.targetForm === "BOUNCY") padColor = "#38bdf8";
        if (pad.targetForm === "STONE") padColor = "#94a3b8";
        if (pad.targetForm === "NORMAL") padColor = "#ff496c";

        ctx.save();
        ctx.fillStyle = isCurrent ? padColor : "#1e293b";
        ctx.strokeStyle = padColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect 
            ? ctx.roundRect(pad.x, pad.y, pad.w, pad.h, 4) 
            : ctx.rect(pad.x, pad.y, pad.w, pad.h);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px Arial";
        ctx.textAlign = "center";
        ctx.fillText(pad.label, pad.x + pad.w / 2, pad.y - 6);
        ctx.restore();
    }

    // Rings
    for (const ring of level.rings) {
        if (ring.collected) continue;
        ctx.save();
        ctx.shadowColor = "#ffd166";
        ctx.shadowBlur = 12;
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Spikes
    for (const spike of level.spikes) {
        const count = Math.max(1, Math.floor(spike.w / 16));
        const width = spike.w / count;

        ctx.fillStyle = "#ff496c";
        for (let i = 0; i < count; i++) {
            ctx.beginPath();
            ctx.moveTo(spike.x + i * width, spike.y + spike.h);
            ctx.lineTo(spike.x + i * width + width / 2, spike.y);
            ctx.lineTo(spike.x + (i + 1) * width, spike.y + spike.h);
            ctx.closePath();
            ctx.fill();
        }
    }

    // Cannon
    ctx.save();
    ctx.translate(level.cannon.x, level.cannon.y);
    ctx.rotate(level.cannon.angle);
    ctx.fillStyle = "#64748b";
    ctx.fillRect(-10, -16, 50, 32);
    ctx.fillStyle = "#a5b4fc";
    ctx.fillRect(5, -10, 38, 20);
    ctx.restore();

    if (level.cannon.entered) {
        const length = 75;
        ctx.strokeStyle = "#ffd166";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(level.cannon.x, level.cannon.y);
        ctx.lineTo(
            level.cannon.x + Math.cos(level.cannon.angle) * length,
            level.cannon.y + Math.sin(level.cannon.angle) * length
        );
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "13px Arial";
        ctx.fillText("AIM · FIRE", level.cannon.x, level.cannon.y - 48);
    }

    // Checkpoint
    ctx.fillStyle = level.checkpoint.active ? "#54f0a4" : "#64748b";
    ctx.fillRect(level.checkpoint.x, level.checkpoint.y, level.checkpoint.w, level.checkpoint.h);
    ctx.beginPath();
    ctx.moveTo(level.checkpoint.x + level.checkpoint.w, level.checkpoint.y);
    ctx.lineTo(level.checkpoint.x + level.checkpoint.w + 25, level.checkpoint.y + 10);
    ctx.lineTo(level.checkpoint.x + level.checkpoint.w, level.checkpoint.y + 20);
    ctx.closePath();
    ctx.fill();

    // Exit
    ctx.fillStyle = ringsCollected === level.rings.length ? "#54f0a4" : "#64748b";
    ctx.fillRect(level.exit.x, level.exit.y, level.exit.w, level.exit.h);
    ctx.fillStyle = "#10172d";
    ctx.fillRect(level.exit.x + 7, level.exit.y + 8, level.exit.w - 14, level.exit.h - 16);
}

function drawBall() {
    ctx.save();
    ctx.shadowColor = currentForm.glowColor;
    ctx.shadowBlur = currentFormKey === "STONE" ? 8 : 22;

    const gradient = ctx.createRadialGradient(
        ball.x - 6,
        ball.y - 7,
        2,
        ball.x,
        ball.y,
        ball.radius
    );

    gradient.addColorStop(0, currentForm.colorCore);
    gradient.addColorStop(0.3, currentForm.colorMid);
    gradient.addColorStop(1, currentForm.colorOuter);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    if (currentFormKey === "STONE") {
        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.arc(ball.x - 5, ball.y - 4, 3, 0, Math.PI * 2);
        ctx.arc(ball.x + 6, ball.y + 3, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

function drawHUD() {
    if (started && level) {
        ctx.save();
        ctx.fillStyle = "rgba(16, 23, 45, 0.85)";
        ctx.fillRect(16, 12, 250, 28);
        ctx.strokeStyle = "#23334c";
        ctx.strokeRect(16, 12, 250, 28);

        ctx.fillStyle = "#7dd3fc";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(level.name, 26, 30);

        const progressPct = Math.round((ball.x / WORLD_WIDTH) * 100);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`${progressPct}% · [M] Menu`, VIEW_WIDTH - 20, 30);
        ctx.restore();
    }

    if (messageTimer > 0 && started && !gameCompleted) {
        ctx.save();
        ctx.fillStyle = "#080c18dd";
        ctx.fillRect(VIEW_WIDTH / 2 - 180, 18, 360, 34);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "bold 14px Arial";
        ctx.fillText(message, VIEW_WIDTH / 2, 40);
        ctx.restore();
    }

    if (gameCompleted) {
        ctx.fillStyle = "#080c18dd";
        ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px Arial";
        ctx.fillText("CITADEL CONQUERED! 🏆", VIEW_WIDTH / 2, VIEW_HEIGHT / 2 - 20);

        ctx.fillStyle = "#54f0a4";
        ctx.font = "18px Arial";
        ctx.fillText("All vast worlds mastered across all orb forms.", VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 25);

        ctx.fillStyle = "#b8c5df";
        ctx.font = "14px Arial";
        ctx.fillText("Press M for Level Select · Press R to Restart Level 1", VIEW_WIDTH / 2, VIEW_HEIGHT / 2 + 70);
    }
}

function render() {
    drawParallaxBackground();

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    drawLevel();
    drawParticles();

    if (started && !gameCompleted) {
        drawBall();
    }

    ctx.restore();

    drawHUD();
    drawMiniMapRadar();
}

function loop(timestamp) {
    const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.033) : 0;
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(loop);
}

// Initialize Menu UI, Touch Controls & Loop
setupLevelSelectUI();
setupMobileTouchControls();
document.getElementById("gameStatus").textContent = "READY";
requestAnimationFrame(loop);