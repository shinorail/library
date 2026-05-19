// 設定（自分のユーザー名とリポジトリ名に変えてください）
const CONFIG = {
    user: "shinorail",
    repo: "library",
    pdfDir: "contents/pdfs",
    mdDir: "contents/metadata"
};

async function loadBooks() {
    const shelf = document.getElementById('shelf');
    
    try {
        // PDFの一覧を取得
        const response = await fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${CONFIG.pdfDir}`);
        const files = await response.json();
        
        // メタデータ(md)の一覧も取得しておく
        const mdRes = await fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${CONFIG.mdDir}`);
        const mdFiles = await mdRes.json();

        shelf.innerHTML = ''; // ローディング表示を消す

        for (const file of files) {
            if (!file.name.endsWith('.pdf')) continue;

            const baseName = file.name.replace('.pdf', '');
            let title = baseName;
            let desc = "篠ノ井乗務区 公式ドキュメント";

            // 対応するMarkdownがあれば中身を読みに行く
            const matchMd = mdFiles.find(m => m.name === `${baseName}.md`);
            if (matchMd) {
                const mdRaw = await (await fetch(matchMd.download_url)).text();
                const t = mdRaw.match(/title:\s*(.*)/);
                const d = mdRaw.match(/description:\s*(.*)/);
                if (t) title = t[1];
                if (d) desc = d[1];
            }

            // カード生成
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => window.open(file.download_url, '_blank');
            card.innerHTML = `
                <div>
                    <h3>${title}</h3>
                    <p>${desc}</p>
                </div>
                <div class="btn-read">資料をひらく</div>
            `;
            shelf.appendChild(card);
        }
    } catch (err) {
        shelf.innerHTML = '<p>GitHubのデータを読み込めませんでした。設定を確認してください。</p>';
    }
}

// 規約モーダル用
function openModal(type) {
    const body = document.getElementById('modal-body');
    if(type === 'terms') {
        body.innerHTML = '<h2>利用規約</h2><p>内部資料につき無断転載禁止。</p>';
    } else {
        body.innerHTML = '<h2>ポリシー</h2><p>アクセスログはGitHubに準拠します。</p>';
    }
    document.getElementById('modal-bg').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-bg').style.display = 'none';
}

window.onload = loadBooks;
