const CONFIG = {
    user: "shinorail", // あなたのGitHubユーザー名
    repo: "library",   // あなたのリポジトリ名
    pdfDir: "contents/pdfs",
    mdDir: "contents/metadata"
};

// 1. 起動時：本棚を自動生成
async function initLibrary() {
    const shelf = document.getElementById('shelf');
    try {
        const response = await fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${CONFIG.pdfDir}`);
        const files = await response.json();
        
        // メタデータ一覧を取得
        const mdRes = await fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${CONFIG.mdDir}`);
        const mds = await mdRes.json();

        shelf.innerHTML = '';

        for (const file of files) {
            if (!file.name.endsWith('.pdf')) continue;
            const id = file.name.replace('.pdf', '');
            
            // 対応するMDから情報を取得
            let title = id, desc = "NO DESCRIPTION AVAILABLE";
            const matchMd = mds.find(m => m.name === `${id}.md`);
            
            if (matchMd) {
                const raw = await (await fetch(matchMd.download_url)).text();
                title = raw.match(/title:\s*(.*)/)?.[1] || title;
                desc = raw.match(/description:\s*(.*)/)?.[1] || desc;
            }

            const card = createCard(id, title, desc, file.download_url);
            shelf.appendChild(card);
        }
    } catch (e) {
        shelf.innerHTML = '<div class="error">DATABASE_OFFLINE: リポジトリ設定を確認してください。</div>';
    }
}

function createCard(id, title, desc, url) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <div class="meta">ID: ${id.toUpperCase()}</div>
        <h3>${title}</h3>
        <p>${desc}</p>
        <div style="color:var(--accent-color); font-size:0.8rem; margin-top:20px;">SYSTEM_ACCESS ></div>
    `;
    div.onclick = () => openReader(url, title);
    return div;
}

// 2. 没入型リーダー（ダウンロードを阻止して表示）
function openReader(url, title) {
    const overlay = document.getElementById('readerOverlay');
    const frame = document.getElementById('pdfFrame');
    document.getElementById('readerDocTitle').innerText = `VIEWING: ${title}`;
    
    // #toolbar=0 を付けてブラウザ標準のダウンロードボタンを隠す（気休めだが効果的）
    frame.src = `${url}#toolbar=0&navpanes=0&view=FitH`;
    
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeReader() {
    document.getElementById('readerOverlay').style.display = 'none';
    document.getElementById('pdfFrame').src = '';
    document.body.style.overflow = 'auto';
    document.getElementById('stickyContainer').innerHTML = ''; // 付箋をリセット
}

// 3. ID検索機能
document.getElementById('searchBtn').onclick = async () => {
    const input = document.getElementById('idSearchInput').value.toLowerCase().trim();
    const status = document.getElementById('searchStatus');
    if(!input) return;

    status.innerText = "SEARCHING...";
    
    try {
        const response = await fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${CONFIG.pdfDir}`);
        const files = await response.json();
        const match = files.find(f => f.name.toLowerCase().includes(input));

        if(match) {
            status.innerText = "MATCH FOUND.";
            openReader(match.download_url, input.toUpperCase());
        } else {
            status.innerText = "ID NOT FOUND.";
            status.style.color = "#ff4444";
        }
    } catch(e) { status.innerText = "CONNECTION ERROR."; }
};

// 4. 付箋機能
function addStickyNote() {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.contentEditable = true;
    note.innerText = 'MEMO: ';
    note.style.top = '100px';
    note.style.left = '50px';
    
    // ドラッグ可能にする
    let isDragging = false;
    note.onmousedown = () => isDragging = true;
    window.onmousemove = (e) => {
        if (!isDragging) return;
        note.style.left = e.pageX - 90 + 'px';
        note.style.top = e.pageY - 50 + 'px';
    };
    window.onmouseup = () => isDragging = false;
    
    document.getElementById('stickyContainer').appendChild(note);
}

// 5. アクセシビリティ（フォントサイズ変更）
let currentSize = 16;
function adjustFontSize(delta) {
    currentSize += delta;
    document.documentElement.style.setProperty('--font-base', currentSize + 'px');
}

initLibrary();
