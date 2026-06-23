const canvas = document.getElementById('dessine-canvas');
const ctx = canvas.getContext('2d', {
    willReadFrequently: true, // optimization for getImageData
});

const CANVAS_WIDTH = ctx.canvas.width;
const CANVAS_HEIGHT = ctx.canvas.height;

/* COLOR PICKER */

function changeColor() {
    const colorPicker = document.getElementById('color-picker-input');
    ctx.fillStyle = colorPicker.value;
}

// initialize color
changeColor();

/* UNDO / REDO */

function enableDessineTool(tool) {
    tool.disabled = false;
}

function disableDessineTool(tool) {
    tool.disabled = true;
}

const undoButton = document.getElementById('undo-button');
const redoButton = document.getElementById('redo-button');

let previousCaptures = [];
let nextCaptures = [];
const MAX_CAPTURES = 50;

/**
 * To be called by other functions whenever a drawing action has been completed.
 */
function captureCanvas() {
    if (nextCaptures.length > 0) {
        disableDessineTool(redoButton);
        nextCaptures = [];
    }

    if (previousCaptures.length == 1) {
        // enable undo button only if previousCaptures is empty except for current state
        enableDessineTool(undoButton);
    }

    canvas.toBlob((blob) => {
        previousCaptures.push(blob);
        if (previousCaptures.length > MAX_CAPTURES) {
            previousCaptures.shift();
        }
    });
}

async function drawCanvasFromBlob(blob) {
    const img = new Image();
    return new Promise((resolve, reject) => {
        img.onload = () => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.drawImage(img, 0, 0);
            resolve();
        };
        img.src = URL.createObjectURL(blob);
    });
}

function undoCanvas() {
    if (previousCaptures.length < 2) return; // last element is current state

    nextCaptures.push(previousCaptures.pop());
    drawCanvasFromBlob(previousCaptures[previousCaptures.length - 1]);

    if (previousCaptures.length == 1) {
        disableDessineTool(undoButton);
    }

    if (nextCaptures.length == 1) {
        enableDessineTool(redoButton);
    }
}

function redoCanvas() {
    if (nextCaptures.length == 0) return;

    const blob = nextCaptures.pop();
    previousCaptures.push(blob);
    drawCanvasFromBlob(blob);

    if (previousCaptures.length == 2) {
        enableDessineTool(undoButton);
    }

    if (nextCaptures.length == 0) {
        disableDessineTool(redoButton);
    }
}

/* SAVE */

const saveDialog = document.getElementById('save-dialog');
const saveDialogImg = document.getElementById('save-dialog-img');
const saveForm = saveDialog.querySelector('form');

function openSaveModal() {
    const blob = previousCaptures[previousCaptures.length - 1];
    saveDialogImg.src = URL.createObjectURL(blob);
    saveDialog.showModal();
}

saveDialog.addEventListener('close', () => {
    if (saveDialog.returnValue !== 'submit') return;

    const formdata = new FormData(saveForm).entries();
    const data = Object.fromEntries(formdata);
    storageSaveMonsieur({
        name: data.name,
        timestamp: Date.now(),
        blob: previousCaptures[previousCaptures.length - 1]
    });
});

/**
 * @brief For external use. Load saved image from blob onto canvas.
 * @param blob 200x200 image to load to canvas 
 */
async function canvasLoadMonsieur({name, blob}) {
    await drawCanvasFromBlob(blob);
    canvasInit();
    saveDialog.querySelector('#save-dialog-name-input').value = name;
}

/* PEN TOOL FUNCTIONS */

const pixelsToDraw = [];

function drawPixel(x, y) {
    // Do not render during mouse events
    pixelsToDraw.push({ x, y });
}

function drawLine(x0, y0, x1, y1) {

    if (Math.abs(y1 - y0) < Math.abs(x1 - x0)) {
        if (x0 > x1) {
            drawLineLowPitch(x1, y1, x0, y0);
        }
        else {
            drawLineLowPitch(x0, y0, x1, y1);
        }
    }
    else {
        if (y0 > y1) {
            drawLineHighPitch(x1, y1, x0, y0);
        }
        else {
            drawLineHighPitch(x0, y0, x1, y1);
        }
    }
}

function drawLineLowPitch(x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = Math.abs(y1 - y0);
    const yi = y1 > y0 ? 1 : -1;

    let err = 2 * dy - dx;
    let y = y0;

    for (let x = x0; x <= x1; x++) {
        drawPixel(x, y);
        if (err > 0) {
            y += yi;
            err += 2 * (dy - dx);
        } else {
            err += 2 * dy;
        }
    }

    drawPixel(x1, y1);
}

function drawLineHighPitch(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = y1 - y0;
    const xi = x1 > x0 ? 1 : -1;

    let err = 2 * dx - dy;
    let x = x0;

    for (let y = y0; y <= y1; y++) {
        drawPixel(x, y);
        if (err > 0) {
            x += xi;
            err += 2 * (dx - dy);
        } else {
            err += 2 * dx;
        }
    }

    drawPixel(x1, y1);
}

function draw() {
    while ({ x, y } = pixelsToDraw.shift() ?? false) {
        ctx.fillRect(x, y, 1, 1);
    }
}

let isDrawing = false;
let drawFunctionIntervalId = -1;

function startDrawing() {
    isDrawing = true;

    if (drawFunctionIntervalId < 0) {
        drawFunctionIntervalId = setInterval(draw, 50)
    }
}

function stopDrawing() {
    if (!isDrawing) return;

    isDrawing = false;
    clearInterval(drawFunctionIntervalId);
    drawFunctionIntervalId = -1;

    // draw remaining pixels
    draw();

    captureCanvas();
}

/* BUCKET TOOL FUNCTIONS */

function getPixelData(data, { x, y }) {
    // In ImageData object, pixel data is encoded as [r, g, b, a, r, g, b, a, ...]
    const pos = x + y * CANVAS_WIDTH;
    return `rgba(${data[pos * 4 + 0]}, ${data[pos * 4 + 1]}, ${data[pos * 4 + 2]}, ${data[pos * 4 + 3] / 255})`;
}

function getPixelNeighbors({ x, y }) {
    const neighbors = [];
    if (x > 0) neighbors.push({ x: x - 1, y });
    if (y > 0) neighbors.push({ x, y: y - 1 });
    if (x < CANVAS_WIDTH) neighbors.push({ x: x + 1, y });
    if (y < CANVAS_HEIGHT) neighbors.push({ x, y: y + 1 });
    return neighbors;
}

function stringifyPixel({ x, y }) {
    return `x${x}y${y}`;
}

function fill(x, y) {
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // rgba
    const pixels = imageData.data;
    const visited = new Set();
    const neighbors = [{ x, y }];
    const areaColor = getPixelData(pixels, { x, y });

    while (neighbors.length > 0) {
        const pixel = neighbors.shift();
        ctx.fillRect(pixel.x, pixel.y, 1, 1); // could be optimized with putImageData

        for (const neighbor of getPixelNeighbors(pixel)) {
            const hash = stringifyPixel(neighbor);
            if (visited.has(hash)) continue;
            visited.add(hash);

            if (getPixelData(pixels, neighbor) == areaColor) {
                neighbors.push(neighbor);
            }
        }
    }

    captureCanvas();
}

let line = { lastX: 0, lastY: 0 }

function noop() { }

let tools = {
    pen: {
        mousedown: (x, y) => {
            startDrawing();
            drawPixel(x, y);
            line.lastX = x;
            line.lastY = y;
        },
        mousemove: (x, y) => {
            if (!isDrawing) return;
            drawLine(line.lastX, line.lastY, x, y)
            drawPixel(x, y);
            line.lastX = x;
            line.lastY = y;
        },
        mouseup: stopDrawing,
        mouseleave: stopDrawing,
    },
    bucket: {
        mousedown: fill,
        mousemove: noop,
        mouseup: noop,
        mouseleave: noop,
    }
}

let currentTool = 'pen';

function changeTool(tool) {
    if (tool == currentTool) return;

    document.getElementById(`${currentTool}-tool`).classList.remove('active');
    document.getElementById(`${tool}-tool`).classList.add('active');

    currentTool = tool;
}

let zoomFactor = window.innerWidth > 780 ? 3 : 1;

addEventListener('resize', () => {
    zoomFactor = window.innerWidth > 780 ? 3 : 1;
})

/* CANVAS MOUSE EVENTS MAPPING */

canvas.addEventListener('mousedown', (ev) => {
    const x = Math.floor(ev.offsetX / zoomFactor);
    const y = Math.floor(ev.offsetY / zoomFactor);
    tools[currentTool].mousedown(x, y);
});

canvas.addEventListener('mousemove', (ev) => {
    const x = Math.floor(ev.offsetX / zoomFactor);
    const y = Math.floor(ev.offsetY / zoomFactor);
    tools[currentTool].mousemove(x, y);
});

canvas.addEventListener('mouseup', (ev) => {
    const x = Math.floor(ev.offsetX / zoomFactor);
    const y = Math.floor(ev.offsetY / zoomFactor);
    tools[currentTool].mouseup(x, y);
});

canvas.addEventListener('mouseleave', (ev) => {
    const x = Math.floor(ev.offsetX / zoomFactor);
    const y = Math.floor(ev.offsetY / zoomFactor);
    tools[currentTool].mouseleave(x, y);
});

/* CANVAS TOUCH EVENTS MAPPING */

function getCanvasTouchCoordinates(touch) {
    const rect = touch.target.getBoundingClientRect();

    return {
        x: Math.floor((touch.clientX - rect.left) / zoomFactor),
        y: Math.floor((touch.clientY - rect.top) / zoomFactor)
    };
}

canvas.addEventListener('touchstart', (ev) => {
    if (ev.targetTouches.length != 1) return;
    ev.preventDefault();
    const { x, y } = getCanvasTouchCoordinates(ev.targetTouches[0]);
    tools[currentTool].mousedown(x, y);
});

canvas.addEventListener('touchmove', (ev) => {
    if (ev.targetTouches.length != 1) return;
    ev.preventDefault();
    const { x, y } = getCanvasTouchCoordinates(ev.targetTouches[0]);
    tools[currentTool].mousemove(x, y);
});

canvas.addEventListener('touchend', (ev) => {
    const { x, y } = getCanvasTouchCoordinates(ev.changedTouches[0]);
    tools[currentTool].mouseup(x, y);
});

canvas.addEventListener('touchcancel', (ev) => {
    const { x, y } = getCanvasTouchCoordinates(ev.changedTouches[0]);
    tools[currentTool].mouseleave(x, y);
});

/* KEY BINDINGS */

document.addEventListener('keydown', (event) => {
    if (currentPage != 'dessine') return;

    const key = event.key.toLowerCase();

    const isUndo = (event.ctrlKey || event.metaKey) && key === 'z' && !event.shiftKey;

    if (isUndo) {
        event.preventDefault();
        undoCanvas();
        return;
    }

    const isRedo =
        (event.ctrlKey || event.metaKey) &&
        (key === 'y' || (key === 'z' && event.shiftKey));

    if (isRedo) {
        event.preventDefault();
        redoCanvas();
        return;
    }

    const isSave = (event.ctrlKey || event.metaKey) && key === 's' && !event.shiftKey;

    if (isSave) {
        event.preventDefault();
        openSaveModal();
        return;
    }
});

/* INIT */
function canvasInit() {
    // reset captures
    previousCaptures = [];
    nextCaptures = [];

    // initialize previous captures with initial canvas
    captureCanvas();

    // ensure undo / redo is disabled
    disableDessineTool(undoButton);
    disableDessineTool(redoButton);
}

canvasInit();
