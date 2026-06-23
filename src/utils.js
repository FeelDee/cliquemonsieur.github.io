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
