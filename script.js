const CONFIG = {
    user: "shinorail",
    repo: "library",
    pdfDir: "contents/pdfs",
    mdDir: "contents/metadata"
};

let baseFontSize = 16;

// 1. 本棚の自動生成
async function initLibrary() {
    const shelf = document.getElementById('shelf');
    try {
        const res = await fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${CONFIG.pdfDir}`);
        const files = await res.json();
        shelf.innerHTML = '';

        for (const file of files) {
            if (!file.name.endsWith('.pdf')) continue;
            const id = file.name.replace('.pdf', '');
            
            // メタデータ取得
            let title = id.toUpperCase(), desc = "S.R.C.C. ARCHIVE";
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
            card.innerHTML = `<div class="id" style="font-family:monospace; font-size:0.7rem; color:gray">ID: ${id}</div><h3>${title}</h3><p>${desc}</p>`;
            card.onclick = () => openReader(file.download_url, title);
            shelf.appendChild(card);
        }
    } catch (e) {
        shelf.innerHTML = '<p>DATABASE CONNECTION ERROR.</p>';
    }
}

// 2. リーダー制御（Android対応）
function openReader(url, title) {
    const reader = document.getElementById('reader');
    const viewer = document.getElementById('pdfViewer');
    const dlLink = document.getElementById('downloadLink');
    
    document.getElementById('docTitle').innerText = title;
    viewer.data = url;
    dlLink.href = url; // 表示できない場合用

    reader.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeReader() {
    document.getElementById('reader').classList.add('hidden');
    document.getElementById('pdfViewer').data = '';
    document.body.style.overflow = 'auto';
    document.getElementById('stickyLayer').innerHTML = '';
}

// 3. 付箋機能（ドラッグ＆ドロップ修正）
function addSticky() {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.contentEditable = true;
    note.innerText = 'MEMO: ';
    note.style.top = '100px';
    note.style.left = '50px';

    let isDragging = false;
    note.onmousedown = (e) => { isDragging = true; };
    document.onmousemove = (e) => {
        if (!isDragging) return;
        note.style.left = e.clientX - 75 + 'px';
        note.style.top = e.clientY - 50 + 'px';
    };
    document.onmouseup = () => { isDragging = false; };
    
    // スマホ用タッチ対応
    note.ontouchmove = (e) => {
        const touch = e.touches[0];
        note.style.left = touch.clientX - 75 + 'px';
        note.style.top = touch.clientY - 50 + 'px';
    };

    document.getElementById('stickyLayer').appendChild(note);
}

// 4. アクセシビリティ & 法的ページ
function setA11y() {
    document.getElementById('fontUp').onclick = () => { baseFontSize += 2; updateFont(); };
    document.getElementById('fontDown').onclick = () => { baseFontSize -= 2; updateFont(); };
}
function updateFont() { document.documentElement.style.setProperty('--base-size', baseFontSize + 'px'); }

const LEGAL = {
    terms: "【利用規約】\\n1. 著作権は篠ノ井乗務区に帰属します。\\n2. 無断転載を禁じます。\\n3. システムの改変・悪用を禁止します。",
    privacy: "【プライバシーポリシー】\\n1. 本サイトは利用者の個人情報を収集しません。\\n2. キャッシュ機能(PWA)のためブラウザストレージを使用します。"
};

function showLegal(type) {
    const overlay = document.getElementById('legalOverlay');
    document.getElementById('legalTitle').innerText = type === 'terms' ? '利用規約' : 'プライバシーポリシー';
    document.getElementById('legalText').innerText = LEGAL[type];
    overlay.classList.remove('hidden');
}

// 5. 初期化
document.getElementById('closeReader').onclick = closeReader;
document.getElementById('addSticky').onclick = addSticky;
document.getElementById('btnTerms').onclick = () => showLegal('terms');
document.getElementById('btnPrivacy').onclick = () => showLegal('privacy');
document.getElementById('closeLegal').onclick = () => document.getElementById('legalOverlay').classList.add('hidden');

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

initLibrary();
setA11y();
