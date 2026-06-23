class GalleryCard extends HTMLElement {
    connectedCallback() {
        let template = document.getElementById('gallery-card-template');
        let templateContent = template.content;
        this.appendChild(document.importNode(templateContent, true));

        const img = this.querySelector('#gallery-card-image');
        img.src = this.getAttribute('imageSrc');

        const name = this.querySelector('#gallery-card-name');
        this.name = this.getAttribute('name');
        name.innerHTML = this.name;

        const timestamp = this.querySelector('#gallery-card-timestamp');
        timestamp.innerHTML = new Date(Number(this.getAttribute('timestamp'))).toLocaleDateString();

        const editButton = this.querySelector('#gallery-card-edit');
        editButton.onclick = async () => {
            const monsieur = await storageGetMonsieur(this.name);
            await canvasLoadMonsieur(monsieur);
            navigate('dessine');
        }

        const deleteButton = this.querySelector('#gallery-card-delete');
        deleteButton.onclick = this.confirmDeletion.bind(this);

        const downloadLink = this.querySelector('#gallery-card-download');
        downloadLink.href = this.getAttribute('imageSrc');
        downloadLink.download = this.getAttribute('name') + '.png';
    }

    confirmDeletion() {
        const confirmDialog = document.getElementById('confirm-deletion-dialog');

        confirmDialog.addEventListener('close', () => {
            if (confirmDialog.returnValue !== 'submit') return;
            storageDeleteMonsieur(this.name);
        }, { once: true });
        
        const p = document.getElementById('confirm-deletion-dialog-text');
        p.innerHTML = `Supprimer ${this.name}?`;

        confirmDialog.showModal();
    }
}

customElements.define("gallery-card", GalleryCard);

const galleryList = document.getElementById('gallery-list');

function galleryCreateCard({ name, timestamp, blob }) {
    const el = document.createElement('gallery-card');

    el.setAttribute('name', name);
    el.setAttribute('timestamp', timestamp);
    el.setAttribute('imageSrc', URL.createObjectURL(blob));
    galleryList.appendChild(el);
}

function galleryRemoveCard(name) {
    const card = galleryList.querySelector(`[name="${name}"]`);
    if (!card) return;
    card.remove();
}

onMonsieurSave.subscribe((monsieur) => {
    galleryRemoveCard(monsieur.name);
    galleryCreateCard(monsieur)
});

onMonsieurDelete.subscribe(galleryRemoveCard);

/* INIT */

async function galleryInit() {
    const monsieurs = await storageGetAllMonsieurs();
    monsieurs.forEach(galleryCreateCard);
}

galleryInit();
