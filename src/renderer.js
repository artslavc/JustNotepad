const { ipcRenderer, clipboard } = require('electron');
const path = require('path');

document.getElementById('minBtn').addEventListener('click', () => ipcRenderer.send('window-min'));
document.getElementById('maxBtn').addEventListener('click', () => ipcRenderer.send('window-max'));

const viewBtn = document.getElementById('viewBtn');
const viewMenu = document.getElementById('viewMenu');
const editBtn = document.getElementById('editBtn');
const editMenu = document.getElementById('editMenu');
const fileBtn = document.getElementById('fileBtn');
const fileMenu = document.getElementById('fileMenu');
let isMenuOpen = false;
let activeMenu = null;

function closeAllMenus() {
    viewMenu.classList.remove('show');
    editMenu.classList.remove('show');
    fileMenu.classList.remove('show');
    document.getElementById('recentSubmenu').classList.remove('show');
    recentOpen = false;
    wallpaperSubmenu.classList.remove('show');
    wallpaperOpen = false;
    isMenuOpen = false;
    activeMenu = null;
}

function toggleMenu(btn, menu) {
    if (activeMenu === menu && isMenuOpen) {
        closeAllMenus();
        return;
    }
    closeAllMenus();
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 2) + 'px';
    menu.classList.add('show');
    isMenuOpen = true;
    activeMenu = menu;
}

viewBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(viewBtn, viewMenu); });
editBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(editBtn, editMenu); });
fileBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(fileBtn, fileMenu); });

document.addEventListener('click', closeAllMenus);

const themeToggle = document.getElementById('themeToggle');
const mainContent = document.getElementById('mainContent');
const body = document.body;
const zoomControls = document.querySelector('.zoom-controls');
const menuDividers = document.querySelectorAll('.menu-divider');
const slider = document.querySelector('.slider');

function applyTheme(isDark) {
    const findBar = document.getElementById('findBar');
    const wallpaperSub = document.getElementById('wallpaperSubmenu');
    const recentSub = document.getElementById('recentSubmenu');
    const toggle = (el, add) => {
        if (!el) return;
        add ? el.classList.add('dark-theme') : el.classList.remove('dark-theme');
    };
    toggle(body, isDark);
    toggle(mainContent, isDark);
    toggle(document.querySelector('header'), isDark);
    toggle(document.querySelector('.title-bar'), isDark);
    document.querySelectorAll('.button-overlay button').forEach(btn => toggle(btn, isDark));
    document.querySelectorAll('.menu-item').forEach(item => toggle(item, isDark));
    toggle(document.getElementById('resetZoom'), isDark);
    toggle(viewMenu, isDark);
    toggle(editMenu, isDark);
    toggle(fileMenu, isDark);
    toggle(findBar, isDark);
    toggle(wallpaperSub, isDark);
    toggle(recentSub, isDark);
    if (zoomControls) zoomControls.querySelectorAll('button').forEach(btn => toggle(btn, isDark));
    toggle(document.getElementById('zoomLevel'), isDark);
    menuDividers.forEach(divider => toggle(divider, isDark));
    toggle(slider, isDark);
    themeToggle.checked = isDark;
}

const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');

function applySavedOrSystem() {
    const saved = localStorage.getItem('dark-theme');
    if (saved !== null) {
        applyTheme(saved === 'true');
        darkModeMedia.removeEventListener('change', onSystemChange);
    } else {
        applyTheme(darkModeMedia.matches);
        darkModeMedia.addEventListener('change', onSystemChange);
    }
}

function onSystemChange(e) { applyTheme(e.matches); }

applySavedOrSystem();

themeToggle.addEventListener('change', () => {
    localStorage.setItem('dark-theme', themeToggle.checked);
    darkModeMedia.removeEventListener('change', onSystemChange);
    applyTheme(themeToggle.checked);
});

let zoomLevel = 100;
const zoomLevelDisplay = document.getElementById('zoomLevel');
const mainElement = document.getElementById('mainContent');

function updateZoom() {
    mainElement.style.fontSize = zoomLevel + '%';
    zoomLevelDisplay.textContent = zoomLevel + '%';
}

document.getElementById('zoomIn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (zoomLevel < 200) { zoomLevel += 10; updateZoom(); }
});

document.getElementById('zoomOut').addEventListener('click', (e) => {
    e.stopPropagation();
    if (zoomLevel > 50) { zoomLevel -= 10; updateZoom(); }
});

document.getElementById('resetZoom').addEventListener('click', (e) => {
    e.stopPropagation();
    zoomLevel = 100;
    updateZoom();
    closeAllMenus();
});

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
        switch (e.code) {
            case 'KeyZ': e.preventDefault(); undo(); break;
            case 'KeyX': e.preventDefault(); cutText(); break;
            case 'KeyC': e.preventDefault(); copyText(); break;
            case 'KeyV': e.preventDefault(); pasteText(); break;
            case 'KeyA': e.preventDefault(); selectAllText(); break;
            case 'KeyF': e.preventDefault(); findText(false); break;
            case 'KeyH': e.preventDefault(); findText(true); break;
            case 'Equal': e.preventDefault(); if (zoomLevel < 200) { zoomLevel += 10; updateZoom(); } break;
            case 'Minus': e.preventDefault(); if (zoomLevel > 50) { zoomLevel -= 10; updateZoom(); } break;
        }
    } else if (e.key === 'Delete' || e.key === 'Del') {
        deleteText();
    } else if (e.key === 'Escape') {
        if (findBar && findBar.classList.contains('show')) {
            findBar.classList.remove('show');
            clearHighlights();
        }
        closeAllMenus();
    }
});

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        if (!e.target.closest('.switch') && !e.target.closest('.zoom-controls') && !e.target.closest('#wallpaperItem') && !e.target.closest('.wallpaper-submenu') && !e.target.closest('#recentItem') && !e.target.closest('.recent-submenu') && !e.target.closest('#langItem')) {
            closeAllMenus();
        }
    });
});

const undoStack = [];
const MAX_UNDO = 20;
let undoLock = false;

function saveState() {
    if (undoLock) return;
    const state = mainContent.innerHTML;
    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== state) {
        undoStack.push(state);
        if (undoStack.length > MAX_UNDO) undoStack.shift();
    }
}

function undo() {
    if (undoStack.length > 1) {
        undoStack.pop();
        const state = undoStack[undoStack.length - 1];
        undoLock = true;
        mainContent.innerHTML = state;
        undoLock = false;
    }
}

mainContent.addEventListener('input', saveState);
saveState();

function cutText() { mainContent.focus(); document.execCommand('cut'); closeAllMenus(); }
function copyText() { mainContent.focus(); document.execCommand('copy'); closeAllMenus(); }
function pasteText() { mainContent.focus(); const text = clipboard.readText(); document.execCommand('insertText', false, text); closeAllMenus(); }
function deleteText() { mainContent.focus(); document.execCommand('delete'); closeAllMenus(); }
function selectAllText() { mainContent.focus(); document.execCommand('selectAll'); closeAllMenus(); }

document.getElementById('undoItem').addEventListener('click', undo);
document.getElementById('cutItem').addEventListener('click', cutText);
document.getElementById('copyItem').addEventListener('click', copyText);
document.getElementById('pasteItem').addEventListener('click', pasteText);
document.getElementById('deleteItem').addEventListener('click', deleteText);
document.getElementById('selectAllItem').addEventListener('click', selectAllText);

const findBar = document.getElementById('findBar');
const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');
const replaceRow = document.getElementById('replaceRow');
let findMode = 'find';
let currentMatchIndex = -1;
let matchResults = [];

function findText(showReplace) {
    findMode = showReplace ? 'replace' : 'find';
    replaceRow.style.display = showReplace ? 'flex' : 'none';
    findBar.classList.add('show');
    findInput.value = '';
    replaceInput.value = '';
    matchResults = [];
    currentMatchIndex = -1;
    clearHighlights();
    findInput.focus();
    closeAllMenus();
}

function clearHighlights() {
    const marks = mainContent.querySelectorAll('mark');
    marks.forEach(m => {
        const parent = m.parentNode;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
    });
}

let findTimeout;

function performFind() {
    clearTimeout(findTimeout);
    findTimeout = setTimeout(() => {
        clearHighlights();
        const query = findInput.value.trim();
        if (!query) {
            matchResults = [];
            currentMatchIndex = -1;
            return;
        }
        const text = mainContent.innerText;
        const indices = [];
        let idx = text.toLowerCase().indexOf(query.toLowerCase());
        while (idx !== -1) {
            indices.push(idx);
            idx = text.toLowerCase().indexOf(query.toLowerCase(), idx + 1);
        }
        matchResults = indices;
        currentMatchIndex = -1;
        if (indices.length > 0) {
            const html = mainContent.innerText;
            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escaped})`, 'gi');
            mainContent.innerHTML = html.replace(regex, '<mark>$1</mark>');
            goToMatch(0);
        }
    }, 200);
}

function goToMatch(index) {
    if (matchResults.length === 0) return;
    if (index < 0) index = matchResults.length - 1;
    if (index >= matchResults.length) index = 0;
    currentMatchIndex = index;
    const marks = mainContent.querySelectorAll('mark');
    marks.forEach((m, i) => {
        m.style.background = i === currentMatchIndex ? '#FFEB3B' : '#FFF59D';
        m.style.color = i === currentMatchIndex ? '#000' : '#333';
    });
    if (marks[currentMatchIndex]) marks[currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function findNext() { if (matchResults.length === 0) performFind(); goToMatch(currentMatchIndex + 1); }
function findPrev() { if (matchResults.length === 0) performFind(); goToMatch(currentMatchIndex - 1); }

function replaceOne() {
    if (currentMatchIndex < 0 || currentMatchIndex >= matchResults.length) return;
    const marks = mainContent.querySelectorAll('mark');
    if (marks[currentMatchIndex]) {
        marks[currentMatchIndex].textContent = replaceInput.value;
        mainContent.innerHTML = mainContent.innerText;
        performFind();
        saveState();
    }
}

function replaceAll() {
    const query = findInput.value.trim();
    const replacement = replaceInput.value;
    if (!query) return;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    mainContent.innerHTML = mainContent.innerText.replace(regex, replacement);
    matchResults = [];
    currentMatchIndex = -1;
    findInput.value = '';
    saveState();
}

document.getElementById('findItem').addEventListener('click', () => findText(false));
document.getElementById('replaceItem').addEventListener('click', () => findText(true));
document.getElementById('findNextBtn').addEventListener('click', findNext);
document.getElementById('findPrevBtn').addEventListener('click', findPrev);
document.getElementById('findCloseBtn').addEventListener('click', () => { findBar.classList.remove('show'); clearHighlights(); });
document.getElementById('replaceOneBtn').addEventListener('click', replaceOne);
document.getElementById('replaceAllBtn').addEventListener('click', replaceAll);
findInput.addEventListener('input', performFind);
findInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); findNext(); } });
replaceInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); replaceOne(); } });

const grammarToggle = document.getElementById('grammarToggle');
const grammarSaved = localStorage.getItem('grammar-check');
if (grammarSaved === 'false') {
    grammarToggle.checked = false;
    mainContent.setAttribute('spellcheck', 'false');
} else {
    grammarToggle.checked = true;
    mainContent.setAttribute('spellcheck', 'true');
}

grammarToggle.addEventListener('change', () => {
    const enabled = grammarToggle.checked;
    mainContent.setAttribute('spellcheck', enabled.toString());
    localStorage.setItem('grammar-check', enabled.toString());
});

const marginToggle = document.getElementById('marginToggle');
const marginSaved = localStorage.getItem('uniform-margin');
if (marginSaved === 'true') {
    marginToggle.checked = true;
    mainContent.classList.add('uniform-margin');
}

marginToggle.addEventListener('change', () => {
    const enabled = marginToggle.checked;
    mainContent.classList.toggle('uniform-margin', enabled);
    localStorage.setItem('uniform-margin', enabled.toString());
});

const wallpaperItem = document.getElementById('wallpaperItem');
const wallpaperSubmenu = document.getElementById('wallpaperSubmenu');
const wallpaperName = document.getElementById('wallpaperName');
let wallpaperOpen = false;

wallpaperItem.addEventListener('click', (e) => {
    e.stopPropagation();
    wallpaperOpen = !wallpaperOpen;
    wallpaperSubmenu.classList.toggle('show', wallpaperOpen);
});

document.querySelectorAll('.wallpaper-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const file = opt.dataset.wallpaper;
        wallpaperName.textContent = opt.textContent;
        wallpaperSubmenu.classList.remove('show');
        wallpaperOpen = false;
        closeAllMenus();
        document.querySelectorAll('.wallpaper-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        if (file) {
            body.style.backgroundImage = `url(wallpapers/${file})`;
            body.classList.add('has-wallpaper');
        } else {
            body.style.backgroundImage = '';
            body.classList.remove('has-wallpaper');
        }
        localStorage.setItem('wallpaper', file);
    });
});

const savedWallpaper = localStorage.getItem('wallpaper');
if (savedWallpaper) {
    const matchOpt = document.querySelector(`.wallpaper-option[data-wallpaper="${savedWallpaper}"]`);
    if (matchOpt) {
        body.style.backgroundImage = `url(wallpapers/${savedWallpaper})`;
        body.classList.add('has-wallpaper');
        wallpaperName.textContent = matchOpt.textContent;
        matchOpt.classList.add('active');
    }
}

document.addEventListener('click', () => {
    wallpaperSubmenu.classList.remove('show');
    wallpaperOpen = false;
});

mainContent.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) { if (zoomLevel < 200) { zoomLevel += 10; updateZoom(); } }
        else { if (zoomLevel > 50) { zoomLevel -= 10; updateZoom(); } }
    }
}, { passive: false });

let currentFilePath = null;
let isModified = false;
const fileInfo = document.getElementById('fileInfo');
const unsavedStar = document.getElementById('unsavedStar');

function updateTitle() {
    if (currentFilePath) {
        fileInfo.textContent = '- ' + path.basename(currentFilePath);
    } else {
        fileInfo.textContent = '- NewFile';
    }
    const hideStar = autosaveToggle && autosaveToggle.checked && currentFilePath;
    unsavedStar.style.display = (isModified && !hideStar) ? 'inline' : 'none';
}

function markModified() {
    if (!isModified) {
        isModified = true;
        updateTitle();
    }
}

async function loadFile(filePath) {
    try {
        const result = await ipcRenderer.invoke('read-file', filePath);
        currentFilePath = result.filePath;
        mainContent.innerHTML = result.content.replace(/\n/g, '<br>');
        isModified = false;
        undoStack.length = 0;
        saveState();
        updateTitle();
        return true;
    } catch (e) {
        return false;
    }
}

async function saveFile() {
    if (!currentFilePath) {
        const result = await ipcRenderer.invoke('show-save-dialog');
        if (result.canceled || !result.filePath) return false;
        currentFilePath = result.filePath;
        addRecentFile(currentFilePath);
    }
    const content = mainContent.innerText;
    await ipcRenderer.invoke('save-file', { filePath: currentFilePath, content });
    isModified = false;
    updateTitle();
    return true;
}

function getRecentFiles() {
    try { return JSON.parse(localStorage.getItem('recent-files') || '[]'); }
    catch { return []; }
}

function addRecentFile(filePath) {
    let files = getRecentFiles().filter(f => f !== filePath);
    files.unshift(filePath);
    if (files.length > 10) files = files.slice(0, 10);
    localStorage.setItem('recent-files', JSON.stringify(files));
    renderRecentList();
}

function renderRecentList() {
    const sub = document.getElementById('recentSubmenu');
    const count = document.getElementById('recentCount');
    const files = getRecentFiles();
    count.textContent = files.length;
    const isDark = document.body.classList.contains('dark-theme');
    sub.innerHTML = '';
    const t = lang[getLang()];
    if (files.length === 0) {
        sub.innerHTML = `<div class="menu-item" style="color:#888;cursor:default;">${t.noNotes}</div>`;
    } else {
        files.forEach(f => {
            const div = document.createElement('div');
            div.className = 'menu-item' + (isDark ? ' dark-theme' : '');
            div.style.display = 'flex'; div.style.alignItems = 'center'; div.style.justifyContent = 'space-between';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = path.basename(f);
            nameSpan.style.overflow = 'hidden'; nameSpan.style.textOverflow = 'ellipsis'; nameSpan.style.flex = '1';
            nameSpan.title = f;
            nameSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                loadFile(f);
                closeAllMenus();
                document.getElementById('recentSubmenu').classList.remove('show');
            });
            const closeBtn = document.createElement('span');
            closeBtn.textContent = '×';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.color = '#888';
            closeBtn.style.fontSize = '16px';
            closeBtn.style.marginLeft = '8px';
            closeBtn.style.padding = '0 4px';
            closeBtn.style.lineHeight = '1';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                let files = getRecentFiles().filter(x => x !== f);
                localStorage.setItem('recent-files', JSON.stringify(files));
                renderRecentList();
                if (files.length === 0) {
                    document.getElementById('recentSubmenu').classList.remove('show');
                    recentOpen = false;
                }
            });
            div.appendChild(nameSpan);
            div.appendChild(closeBtn);
            sub.appendChild(div);
        });
    }
    if (isDark) { sub.classList.add('dark-theme'); }
    else { sub.classList.remove('dark-theme'); }
}

function newFile() {
    mainContent.innerHTML = '';
    currentFilePath = null;
    isModified = false;
    undoStack.length = 0;
    saveState();
    updateTitle();
    closeAllMenus();
}

async function openFile() {
    const result = await ipcRenderer.invoke('show-open-dialog');
    if (result.canceled || result.filePaths.length === 0) return;
    const filePath = result.filePaths[0];
    await loadFile(filePath);
    addRecentFile(filePath);
    closeAllMenus();
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'KeyN' && !e.shiftKey) { e.preventDefault(); newFile(); }
    else if (e.ctrlKey && e.code === 'KeyS') { e.preventDefault(); saveFile(); }
    else if (e.ctrlKey && e.code === 'KeyO') { e.preventDefault(); openFile(); }
    else if (e.ctrlKey && e.shiftKey && e.code === 'KeyN') { e.preventDefault(); ipcRenderer.invoke('open-new-window'); }
});

document.getElementById('newFileItem').addEventListener('click', newFile);
document.getElementById('saveItem').addEventListener('click', saveFile);
document.getElementById('openItem').addEventListener('click', openFile);
document.getElementById('newWindowItem').addEventListener('click', () => { ipcRenderer.invoke('open-new-window'); closeAllMenus(); });

const recentItem = document.getElementById('recentItem');
const recentSubmenu = document.getElementById('recentSubmenu');
let recentOpen = false;

recentItem.addEventListener('click', (e) => {
    e.stopPropagation();
    recentOpen = !recentOpen;
    recentSubmenu.classList.toggle('show', recentOpen);
    if (recentOpen) renderRecentList();
});

const autosaveToggle = document.getElementById('autosaveToggle');
const autosaveSaved = localStorage.getItem('autosave');
if (autosaveSaved === 'true') {
    autosaveToggle.checked = true;
}

let autosaveTimer;
mainContent.addEventListener('input', () => {
    markModified();
    if (autosaveToggle.checked && currentFilePath) {
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(saveFile, 1000);
    }
});

autosaveToggle.addEventListener('change', () => {
    localStorage.setItem('autosave', autosaveToggle.checked.toString());
    updateTitle();
});

document.getElementById('closeBtn').addEventListener('click', async () => {
    if (isModified) {
        const response = await ipcRenderer.invoke('show-unsaved-dialog');
        if (response === 0) {
            const saved = await saveFile();
            if (saved) ipcRenderer.send('window-close');
        } else if (response === 1) {
            ipcRenderer.send('window-close');
        }
    } else {
        ipcRenderer.send('window-close');
    }
});

document.addEventListener('click', () => {
    recentSubmenu.classList.remove('show');
    recentOpen = false;
});

let isEnglish = false;
const langDisplay = document.getElementById('langDisplay');
const sysLang = navigator.language || navigator.userLanguage || '';
const savedLang = localStorage.getItem('language');
if (savedLang === 'en' || (savedLang !== 'ru' && !sysLang.startsWith('ru'))) isEnglish = true;
langDisplay.textContent = isEnglish ? 'EN' : 'RU';

function getLang() { return isEnglish ? 'en' : 'ru'; }

function applyLanguage() {
    const l = lang[getLang()];
    function setMenuText(id, key) {
        const el = document.getElementById(id);
        if (!el || !l[key]) return;
        if (el.tagName === 'SPAN' || el.tagName === 'BUTTON') { el.textContent = l[key]; }
        else { const span = el.querySelector('span:first-child'); if (span) span.textContent = l[key]; }
    }
    function setSwitchLabel(switchId, key) {
        const toggle = document.getElementById(switchId);
        if (!toggle || !l[key]) return;
        const item = toggle.closest('.menu-item');
        if (item) { const span = item.querySelector('span:first-child'); if (span) span.textContent = l[key]; }
    }
    setMenuText('fileBtn', 'file');
    setMenuText('editBtn', 'edit');
    setMenuText('viewBtn', 'view');
    setMenuText('newWindowItem', 'newWindow');
    setMenuText('newFileItem', 'newFile');
    setMenuText('openItem', 'open');
    setMenuText('saveItem', 'save');
    setMenuText('recentItem', 'recent');
    setMenuText('undoItem', 'undo');
    setMenuText('cutItem', 'cut');
    setMenuText('copyItem', 'copy');
    setMenuText('pasteItem', 'paste');
    setMenuText('deleteItem', 'del');
    setMenuText('findItem', 'find');
    setMenuText('replaceItem', 'replace');
    setMenuText('selectAllItem', 'selectAll');
    setSwitchLabel('themeToggle', 'theme');
    setSwitchLabel('grammarToggle', 'grammar');
    setSwitchLabel('marginToggle', 'margins');
    setSwitchLabel('autosaveToggle', 'autosave');
    const zoomItems = document.querySelectorAll('#viewMenu .menu-item');
    for (const item of zoomItems) {
        if (item.querySelector('.zoom-controls')) {
            const span = item.querySelector('span:first-child');
            if (span) span.textContent = l.zoom;
        }
    }
    const resetZoomBtn = document.getElementById('resetZoom');
    if (resetZoomBtn) resetZoomBtn.textContent = l.resetZoom;
    setMenuText('wallpaperItem', 'wallpapers');
    const wpIds = ['wpNone', 'wpForestEvening', 'wpForestTuchi', 'wpSand', 'wpNewyork', 'wpVlad', 'wpBeach'];
    wpIds.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = l[id] || el.textContent; });
    const savedWp = localStorage.getItem('wallpaper') || '';
    const matchOpt = document.querySelector(`.wallpaper-option[data-wallpaper="${savedWp}"]`);
    wallpaperName.textContent = matchOpt ? matchOpt.textContent : l.none;
    document.getElementById('langLabel').textContent = l.langLabel;
    document.getElementById('findInput').placeholder = l.findPlaceholder;
    document.getElementById('replaceInput').placeholder = l.replacePlaceholder;
    setMenuText('findPrevBtn', 'findBack');
    setMenuText('findNextBtn', 'findNext');
    setMenuText('replaceOneBtn', 'replaceBtn');
    setMenuText('replaceAllBtn', 'replaceAll');
    renderRecentList();
}

renderRecentList();
updateTitle();

(async () => {
    const filePath = await ipcRenderer.invoke('get-initial-file');
    if (filePath) loadFile(filePath);
})();
ipcRenderer.on('open-file', (event, filePath) => { loadFile(filePath); });

applyLanguage();

document.getElementById('langItem').addEventListener('click', (e) => {
    e.stopPropagation();
    isEnglish = !isEnglish;
    langDisplay.textContent = isEnglish ? 'EN' : 'RU';
    localStorage.setItem('language', isEnglish ? 'en' : 'ru');
    applyLanguage();
});
