const allMonsieurs = {
    common: [],
    rare: [],
    legendary: [],
    custom: [],
}

defaultMonsieursList.forEach(monsieur => {
    allMonsieurs[monsieur.rarity].push(monsieur);
});

const P_COMMON = 0.88;
const P_RARE = 0.10;
const P_LEGENDARY = 0.02;
const P_CUSTOM = 0.3;

const ALL_ODDS = {
    default: {
        common: P_COMMON,
        rare: P_RARE,
        legendary: P_LEGENDARY,
        custom: 0
    },
    custom: {
        common: 0,
        rare: 0,
        legendary: 0,
        custom: 1
    },
    both: {
        common: P_COMMON * (1 - P_CUSTOM),
        rare: P_RARE * (1 - P_CUSTOM),
        legendary: P_LEGENDARY * (1 - P_CUSTOM),
        custom: P_CUSTOM
    }
}

const gameModeSelector = document.getElementById('game-mode-selector');
const gameModeSetting = new StorageObject('gameMode', 'default');

gameModeSelector.value = gameModeSetting.value;
gameModeSelector.oninput = () => {
    gameModeSetting.value = gameModeSelector.value;
}

function cliqueTitle() {
    document.getElementById('clique-page').removeEventListener('click', cliqueTitle);
    document.getElementById('title').classList.add('hidden');
    cliqueMonsieur();
    document.getElementById('monsieur').classList.remove('hidden');
}

document.getElementById('clique-page').addEventListener('click', cliqueTitle);

const monsieursCount = new StorageObject('monsieursCount', 0);

function cliqueMonsieur() {
    monsieursCount.value += 1;
    document.getElementById('compte-monsieur').innerText = 'Nombre de Monsieurs: ' + monsieursCount.value;

    shake();

    let monsieur = getNextMonsieur();

    if (monsieur.isCustom) {
        monsieur.file = URL.createObjectURL(monsieur.blob);
    }

    document.getElementById('monsieur').src = monsieur.file;
    changeFavicon(monsieur.file);
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

let lastMonsieur;

function getNextMonsieur() {
    let magicNumber = Math.random(); // between 0 and 1
    let monsieur;
    let index;

    const odds = ALL_ODDS[gameModeSetting.value];
    for (const rarity in odds) {
        if (odds[rarity] < magicNumber) {
            magicNumber -= odds[rarity];
            continue;
        } else {
            const list = allMonsieurs[rarity];
            index = Math.floor(magicNumber / odds[rarity] * list.length);
            monsieur = list[index];
            break;
        }
    }

    // Make sure same monsieur does not come up twice
    if (lastMonsieur) {
        allMonsieurs[lastMonsieur.rarity].push(lastMonsieur);
    }
    lastMonsieur = monsieur;
    allMonsieurs[monsieur.rarity].splice(index, 1);

    return monsieur;
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

async function cliqueInit() {
    if (allMonsieurs.custom.length === 0) {
        allMonsieurs.custom = await storageGetAllMonsieurs();
        allMonsieurs.custom.forEach((monsieur, index) => {
            allMonsieurs.custom[index] = { ...monsieur, rarity: 'custom', isCustom: true };
        });
    }
} 

cliqueInit();
