// --- 公開図書館システム ---
async function initLibrary() {
    const shelf = document.getElementById('shelf');
    if (!shelf) return;

    shelf.innerHTML = '<div class="loading">SYSTEM INITIALIZING...</div>';

    try {
        // 1. 管理リスト(list.json)を取得
        const listRes = await fetch('list.json');
        if (!listRes.ok) throw new Error("LIST_NOT_FOUND");
        const archives = await listRes.json();

        shelf.innerHTML = ''; // クリア

        for (const id of archives) {
            try {
                // 2. メタデータ(.md)を取得
                const mdRes = await fetch(`contents/metadata/${id}.md`);
                const mdText = await mdRes.text();
                
                // タイトルと説明を抽出
                const title = mdText.match(/title:\s*(.*)/)?.[1] || id.toUpperCase();
                const desc = mdText.match(/description:\s*(.*)/)?.[1] || "S.R.C.C. ARCHIVE DATA";
                const pdfUrl = `contents/pdfs/${id}.pdf`;

                // 3. カードを作成
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="meta">ARCHIVE_ID: ${id.toUpperCase()}</div>
                    <h3>${title}</h3>
                    <p>${desc}</p>
                    <div class="system-access" style="color:#00f5d4; font-weight:bold; margin-top:15px;">SYSTEM_ACCESS ></div>
                `;
                card.onclick = () => openReader(pdfUrl, title);
                shelf.appendChild(card);
            } catch (e) {
                console.warn(`Data missing for ID: ${id}`);
            }
        }
    } catch (e) {
        shelf.innerHTML = `<div class="error" style="color:#ff4444;">DATABASE_CONNECTION_ERROR: list.jsonが見つかりません。</div>`;
    }
}

// 没入型リーダーを表示
function openReader(url, title) {
    const overlay = document.getElementById('readerOverlay');
    const frame = document.getElementById('pdfFrame');
    document.getElementById('readerDocTitle').innerText = `ACCESSING: ${title}`;
    
    // ダウンロードボタン等を隠すパラメータ付きで表示
    frame.src = `${url}#toolbar=0&navpanes=0&view=FitH`;
    
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeReader() {
    document.getElementById('readerOverlay').style.display = 'none';
    document.getElementById('pdfFrame').src = '';
    document.body.style.overflow = 'auto';
}

// 検索実行
document.getElementById('searchBtn').onclick = executeSearch;
async function executeSearch() {
    const input = document.getElementById('idSearchInput').value.toLowerCase().trim();
    if (!input) return;
    
    const res = await fetch('list.json');
    const list = await res.json();
    
    if (list.includes(input)) {
        openReader(`contents/pdfs/${input}.pdf`, input.toUpperCase());
    } else {
        alert("ACCESS DENIED: INVALID ID");
    }
}

// 起動
initLibrary();
