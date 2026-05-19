const CONFIG = {
    user: "shinorail",
    repo: "library",
    pdfDir: "contents/pdfs",
    mdDir: "contents/metadata"
};

let currentBaseSize = 16;

// 初期起動
async function init() {
    setupA11y();
    await loadLibrary();
    registerSW();
}

// 本棚生成
async function loadLibrary() {
    const shelf = document.getElementById('shelf');
    shelf.innerHTML = '<div class="accent">CONNECTING...</div>';

    try {
        const res = await fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${CONFIG.pdfDir}`);
        const files = await res.json();
        shelf.innerHTML = '';

        for (const file of files) {
            if (!file.name.toLowerCase().endsWith('.pdf')) continue;
            const id = file.name.toLowerCase().replace('.pdf', '');
            
            let title = id.toUpperCase(), desc = "S.R.C.C. ARCHIVE DATA";
            try {
                const mdRes = await fetch(`contents/metadata/${id}.md`);
                if (mdRes.ok) {
                    const text = await mdRes.text();
                    title = text.match(/title:\s*(.*)/)?.[1] || title;
                    desc = text.match(/description:\s*(.*)/)?.[1] || desc;
                }
            } catch(e) {}

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<span style="font-size:0.6rem; color:#666; font-family:monospace;">${id}</span><h3>${title}</h3><p>${desc}</p>`;
            // ダウンロードを阻止するため、URLを直接開かず関数を通す
            card.onclick = () => openReader(file.download_url, title);
            shelf.appendChild(card);
        }
    } catch (e) { shelf.innerHTML = "OFFLINE_ERROR"; }
}

// 【重要】ダウンロードを阻止して「その場で見せる」関数
function openReader(rawUrl, title) {
    const reader = document.getElementById('reader');
    const container = document.getElementById('viewerContainer');
    document.getElementById('docTitle').innerText = title;

    // Androidの強制DLを避けるため、GoogleのPDFビューアエンジンを使用
    // これによりブラウザに依存せず「その場」で表示可能になる
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
    
    container.innerHTML = `<iframe src="${viewerUrl}"></iframe>`;
    
    reader.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeReader() {
    document.getElementById('reader').classList.add('hidden');
    document.getElementById('viewerContainer').innerHTML = '';
    document.body.style.overflow = 'auto';
    document.getElementById('stickyLayer').innerHTML = '';
}

// 付箋機能（ドラッグ＆ドロップ完全版）
function addSticky() {
    const layer = document.getElementById('stickyLayer');
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.contentEditable = true;
    note.innerText = 'MEMO: ';
    note.style.top = '100px'; note.style.left = '50px';

    const moveNote = (e) => {
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        note.style.left = (x - 80) + 'px';
        note.style.top = (y - 50) + 'px';
    };

    note.addEventListener('mousedown', () => document.addEventListener('mousemove', moveNote));
    note.addEventListener('touchstart', () => document.addEventListener('touchmove', moveNote));
    document.addEventListener('mouseup', () => document.removeEventListener('mousemove', moveNote));
    document.addEventListener('touchend', () => document.removeEventListener('touchmove', moveNote));

    layer.appendChild(note);
}

// アクセシビリティ連動
function setupA11y() {
    document.getElementById('fontUp').onclick = () => { currentBaseSize += 2; updateA11y(); };
    document.getElementById('fontDown').onclick = () => { currentBaseSize -= 2; updateA11y(); };
}
function updateA11y() { document.documentElement.style.setProperty('--base-size', currentBaseSize + 'px'); }

// 検索
document.getElementById('searchBtn').onclick = () => {
    const input = document.getElementById('idSearchInput').value.toLowerCase().trim();
    if(input) openReader(`https://raw.githubusercontent.com/${CONFIG.user}/${CONFIG.repo}/main/contents/pdfs/${input}.pdf`, input.toUpperCase());
};

// 法務
const LEGAL = {
    terms: "【利用規約】\\n・著作権は篠ノ井乗務区に帰属します。\\n・無断転載・商用利用を禁じます。",
    privacy: "【プライバシーポリシー】\\n・個人情報は取得しません。\\n・PWAキャッシュ目的でブラウザのストレージを利用します。"
};
function showLegal(type) {
    document.getElementById('legalTitle').innerText = type.toUpperCase();
    document.getElementById('legalText').innerText = LEGAL[type];
    document.getElementById('legalOverlay').classList.remove('hidden');
}
function closeLegal() { document.getElementById('legalOverlay').classList.add('hidden'); }

// 閉じるボタン登録
document.getElementById('closeReader').onclick = closeReader;
document.getElementById('addSticky').onclick = addSticky;

// PWA
function registerSW() {
    if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js'); }
}

init();
