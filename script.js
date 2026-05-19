// --- 設定項目 ---
const CONFIG = {
    user: "shinorail", // ユーザー名
    repo: "library",   // リポジトリ名
    pdfDir: "contents/pdfs",
    mdDir: "contents/metadata"
};

// --- 自動実行 ---
async function initLibrary() {
    const shelf = document.getElementById('shelf');
    if (!shelf) return;

    shelf.innerHTML = '<div class="loading">CONNECTING TO S.R.C.C. DATABASE...</div>';

    try {
        // 1. GitHub APIでPDFフォルダのファイル一覧を取得
        const pdfApiUrl = `https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${CONFIG.pdfDir}`;
        const response = await fetch(pdfApiUrl);
        
        if (!response.ok) throw new Error("API接続に失敗しました");
        const files = await response.json();

        shelf.innerHTML = ''; // ローディング消去

        // 2. ファイルごとにカードを作成
        for (const file of files) {
            if (!file.name.toLowerCase().endsWith('.pdf')) continue;

            const id = file.name.toLowerCase().replace('.pdf', '');
            
            // メタデータ(.md)を取得してタイトルなどを反映
            let title = id.toUpperCase();
            let desc = "S.R.C.C. ARCHIVE DATA";

            try {
                const mdUrl = `https://raw.githubusercontent.com/${CONFIG.user}/${CONFIG.repo}/main/${CONFIG.mdDir}/${id}.md`;
                const mdRes = await fetch(mdUrl);
                if (mdRes.ok) {
                    const mdText = await mdRes.text();
                    title = mdText.match(/title:\s*(.*)/)?.[1] || title;
                    desc = mdText.match(/description:\s*(.*)/)?.[1] || desc;
                }
            } catch (e) {
                console.warn(`Metadata not found for: ${id}`);
            }

            const card = createCard(id, title, desc, file.download_url);
            shelf.appendChild(card);
        }

    } catch (e) {
        console.error(e);
        shelf.innerHTML = `<div class="error">DATABASE_OFFLINE: リポジトリの公開設定を確認してください。</div>`;
    }
}

// カード生成
function createCard(id, title, desc, url) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
        <div class="meta">ARCHIVE_ID: ${id.toUpperCase()}</div>
        <h3>${title}</h3>
        <p>${desc}</p>
        <div class="system-access" style="color:var(--accent-color); font-weight:bold; margin-top:15px;">SYSTEM_ACCESS ></div>
    `;
    div.onclick = () => openReader(url, title);
    return div;
}

// リーダー表示
function openReader(url, title) {
    const overlay = document.getElementById('readerOverlay');
    const frame = document.getElementById('pdfFrame');
    document.getElementById('readerDocTitle').innerText = `ACCESSING: ${title}`;
    frame.src = `${url}#toolbar=0&navpanes=0&view=FitH`;
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeReader() {
    document.getElementById('readerOverlay').style.display = 'none';
    document.getElementById('pdfFrame').src = '';
    document.body.style.overflow = 'auto';
}

// 検索機能
document.getElementById('searchBtn').onclick = async () => {
    const input = document.getElementById('idSearchInput').value.toLowerCase().trim();
    if (!input) return;
    
    // 現在表示されているカードから探す
    const cards = document.querySelectorAll('.card');
    let found = false;
    cards.forEach(card => {
        if (card.querySelector('.meta').innerText.includes(input.toUpperCase())) {
            card.click();
            found = true;
        }
    });
    if(!found) alert("ID NOT FOUND");
};

// 起動！
initLibrary();
