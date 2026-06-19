let totalOccurrences = 0;
let monsieursList = [];

async function cliqueInit(gameMode) {
    totalOccurrences = 0;
    monsieursList = [];

    if (gameMode === 'default' || gameMode === 'both') {
        defaultMonsieursList.forEach(({file, occurrences}) => {
            monsieursList.push({
                file,
                occurrences,
                min: totalOccurrences,
                max: totalOccurrences + occurrences
            })
            totalOccurrences += occurrences;
        });
    }

    if (gameMode === 'custom' || gameMode === 'both') {
        const monsieurs = await storageGetAllMonsieurs();
        monsieurs.forEach(({name, occurrences, blob}) => {
            occurrences = Number(occurrences);
            monsieursList.push({
                name,
                file: URL.createObjectURL(blob),
                occurrences,
                min: totalOccurrences,
                max: totalOccurrences + occurrences
            })
            totalOccurrences += occurrences;
        });
    }
} 

const gameModeSelector = document.getElementById('game-mode-selector');
const gameModeSetting = new StorageObject('gameMode', 'default');

gameModeSelector.value = gameModeSetting.value;
gameModeSelector.oninput = () => {
    gameModeSetting.value = gameModeSelector.value;
}
gameModeSetting.subscribe(cliqueInit);

function cliqueTitle() {
    document.getElementById('clique-page').removeEventListener('click', cliqueTitle);
    document.getElementById('title').classList.add('hidden');
    cliqueMonsieur();
    document.getElementById('monsieur').classList.remove('hidden');
}

document.getElementById('clique-page').addEventListener('click', cliqueTitle);

let lastRange;

const monsieursCount = new StorageObject('monsieursCount', 0);

function cliqueMonsieur() {
    monsieursCount.value += 1;
    document.getElementById('compte-monsieur').innerText = 'Nombre de Monsieurs: ' + monsieursCount.value;

    shake();

    do {
        magicNumber = Math.random() * totalOccurrences;
    } while (lastRange && magicNumber >= lastRange.min && magicNumber < lastRange.max)

    monsieursList.forEach(monsieur => {
        if (magicNumber >= monsieur.min && magicNumber < monsieur.max) {
            lastRange = { min: monsieur.min, max: monsieur.max };
            document.getElementById('monsieur').src = monsieur.file;
            changeFavicon(monsieur.file);
        }
    });
}

let shaking = false;

function shake() {
    if (shaking) return;
    shaking = true;

    document.body.classList.add("shake");

    setTimeout(() => {
        document.body.classList.remove("shake");
        shaking = false;
    }, 200);
}

function changeFavicon(src) {
    const link = document.head.querySelector("link[rel~='icon']");
    document.head.removeChild(link);

    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.type = 'image/x-icon';
    newLink.href = src;

    document.head.appendChild(newLink);
}

let currentPage = 'clique';

function navigate(page) {
    if (page == currentPage) return;

    document.getElementById(`${currentPage}-nav`).classList.remove('active');
    document.getElementById(`${page}-nav`).classList.add('active');

    document.getElementById(`${currentPage}-page`).classList.add('hidden');
    document.getElementById(`${page}-page`).classList.remove('hidden');

    currentPage = page;
}

cliqueInit(gameModeSetting.value);
