const CONFIG = {
    user: "shinorail",
    repo: "library",
    pdfDir: "contents/pdfs",
    mdDir: "contents/metadata"
};

let currentBaseSize = 16;

// 1. 本棚初期化
async function init() {
    setupA11y();
    await loadLibrary();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
}

// 2. 本棚読み込み
async function loadLibrary() {
    const shelf = document.getElementById('shelf');
    shelf.innerHTML = '<div class="accent">CONNECTING TO DATABASE...</div>';
    
    try {
        const res = await fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${CONFIG.pdfDir}`);
        const files = await res.json();
        shelf.innerHTML = '';

        for (const file of files) {
            if (!file.name.toLowerCase().endsWith('.pdf')) continue;
            const id = file.name.replace('.pdf', '');
            
            let title = id.toUpperCase(), desc = "篠ノ井アーカイブ・データ";
            try {
                const mdRes = await fetch(`contents/metadata/${id}.md`);
                if (mdRes.ok) {
                    const text = await mdRes.text();
                    title = text.match(/title:\s*(.*)/)?.[1] || title;
                    desc = text.match(/description:\s*(.*)/)?.[1] || desc;
                }
            } catch(e){}

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `<span style="font-family:monospace;font-size:0.7rem;color:#555">ID: ${id}</span><h3>${title}</h3><p>${desc}</p>`;
            card.onclick = () => openReader(file.download_url, title);
            shelf.appendChild(card);
        }
    } catch(e) { shelf.innerHTML = "CONNECTION_FAILED."; }
}

// 3. リーダー起動 (URLパラメータでAndroidのDLを回避)
function openReader(rawUrl, title) {
    const reader = document.getElementById('reader');
    const wrapper = document.getElementById('viewerWrapper');
    document.getElementById('docTitle').innerText = title;

    // Googleドキュメントビューア経由で、埋め込みパラメータを付与
    // これによりAndroidスマホでも「ダウンロード」にならず、その場で開く
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true&chrome=false&dov=1`;
    
    wrapper.innerHTML = `<iframe src="${viewerUrl}" allow="fullscreen"></iframe>`;
    reader.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeReader() {
    document.getElementById('reader').classList.add('hidden');
    document.getElementById('viewerWrapper').innerHTML = '';
    document.body.style.overflow = 'auto';
    document.getElementById('stickyLayer').innerHTML = '';
}

// 4. メモ機能 (付箋)
function addSticky() {
    const layer = document.getElementById('stickyLayer');
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.contentEditable = true;
    note.innerText = 'MEMO: ';
    note.style.top = '100px';
    note.style.left = '50px';

    // ドラッグ機能
    let active = false, currentX, currentY, initialX, initialY;
    
    const dragStart = (e) => {
        initialX = (e.type === "touchstart" ? e.touches[0].clientX : e.clientX) - note.offsetLeft;
        initialY = (e.type === "touchstart" ? e.touches[0].clientY : e.clientY) - note.offsetTop;
        if (e.target === note) active = true;
    };
    const dragEnd = () => { active = false; };
    const drag = (e) => {
        if (!active) return;
        e.preventDefault();
        currentX = (e.type === "touchmove" ? e.touches[0].clientX : e.clientX) - initialX;
        currentY = (e.type === "touchmove" ? e.touches[0].clientY : e.clientY) - initialY;
        note.style.left = currentX + "px";
        note.style.top = currentY + "px";
    };

    note.addEventListener("mousedown", dragStart);
    note.addEventListener("touchstart", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("touchmove", drag, {passive: false});
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("touchend", dragEnd);

    layer.appendChild(note);
}

// 5. A11y & Legal
function setupA11y() {
    document.getElementById('fontUp').onclick = () => { currentBaseSize += 2; updateSize(); };
    document.getElementById('fontDown').onclick = () => { currentBaseSize -= 2; updateSize(); };
}
function updateSize() { document.documentElement.style.setProperty('--base-size', currentBaseSize + 'px'); }

const LEGAL = {
    terms: "【利用規約】\\n1.著作権は篠ノ井乗務区に帰属します。\\n2.本データを利用した商用活動を禁じます。\\n3.システム改変は許可された範囲内に限ります。",
    privacy: "【プライバシーポリシー】\\n1.個人情報は収集しません。\\n2.キャッシュ目的でブラウザのローカルストレージを使用します。"
};
function showLegal(type) {
    document.getElementById('legalTitle').innerText = type.toUpperCase();
    document.getElementById('legalText').innerText = LEGAL[type];
    document.getElementById('legalOverlay').classList.remove('hidden');
}
function closeLegal() { document.getElementById('legalOverlay').classList.add('hidden'); }

// 検索
document.getElementById('searchBtn').onclick = () => {
    const val = document.getElementById('idSearchInput').value.toLowerCase().trim();
    if(val) openReader(`https://raw.githubusercontent.com/${CONFIG.user}/${CONFIG.repo}/main/contents/pdfs/${val}.pdf`, val.toUpperCase());
};

document.getElementById('closeReader').onclick = closeReader;
document.getElementById('addSticky').onclick = addSticky;

init();
