/**
 * Changes the favicon dynamically.
 * @param {string} src Path or URL to new favicon
 */
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

/**
 * Changes the displayed page.
 * @param {string} page Name of the page to navigate to
 * @note Page and corresponding nav have to be identified in the main index.html
 */
function navigate(page) {
    if (page == currentPage) return;

    document.getElementById(`${currentPage}-nav`).classList.remove('active');
    document.getElementById(`${page}-nav`).classList.add('active');

    document.getElementById(`${currentPage}-page`).classList.add('hidden');
    document.getElementById(`${page}-page`).classList.remove('hidden');

    currentPage = page;
}

let snackBarTimeout = null;

/**
 * Displays a tempoary message at the bottom of the page
 * @param {string} message  Message to be displayed in the snack bar
 * @param {number} duration (optional) How long the message will be shown, defaults to 5s
 */
function snackBarMessage(message, timeout) {
    const snackBar = document.getElementById('snack-bar');
    snackBar.innerHTML = message;

    if (snackBarTimeout) {
        clearTimeout(snackBarTimeout);
    } else {
        snackBar.classList.remove('hidden');
    }

    snackBarTimeout = setTimeout(() => {
        snackBar.classList.add('hidden');
        snackBarTimeout = null;
    }, timeout || 5000);
}
