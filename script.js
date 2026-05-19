const CONFIG = {
    user: "shinorail",
    repo: "library",
    pdfDir: "contents/pdfs",
    mdDir: "contents/metadata"
};

// 1. 本棚の展開
async function init() {
    const shelf = document.getElementById('shelf');
    try {
        const [pdfRes, mdRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${CONFIG.pdfDir}`),
            fetch(`https://api.github.com/repos/${CONFIG.user}/${CONFIG.repo}/contents/${CONFIG.mdDir}`)
        ]);
        
        const pdfs = await pdfRes.json();
        const mds = await mdRes.json();
        shelf.innerHTML = '';

        for (const file of pdfs) {
            if (!file.name.endsWith('.pdf')) continue;
            const base = file.name.replace('.pdf', '');
            
            let meta = { title: base, desc: "S.R.C.C. DATA LOG" };
            const matchMd = mds.find(m => m.name === `${base}.md`);

            if (matchMd) {
                const raw = await (await fetch(matchMd.download_url)).text();
                meta.title = raw.match(/title:\s*(.*)/)?.[1] || meta.title;
                meta.desc = raw.match(/description:\s*(.*)/)?.[1] || meta.desc;
            }

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="meta">ARCHIVE NO. ${Math.random().toString(16).substr(2, 6)}</div>
                <h3>${meta.title}</h3>
                <p>${meta.desc}</p>
                <div style="color:var(--accent); font-size:0.8rem">SYSTEM ACCESS ></div>
            `;
            // ダウンロード不可の設定（URLに#toolbar=0を追加して標準メニューを隠す）
            card.onclick = () => openReader(`${file.download_url}#toolbar=0&navpanes=0&scrollbar=0`);
            shelf.appendChild(card);
        }
    } catch (e) { shelf.innerHTML = "DATABASE CONNECTION ERROR."; }
}

// 2. 没入型リーダー
function openReader(url) {
    document.getElementById('pdfViewer').src = url;
    document.getElementById('reader').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeReader() {
    document.getElementById('reader').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('sticky-container').innerHTML = '';
}

// 3. 付箋機能
document.getElementById('addSticky').onclick = () => {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.contentEditable = true;
    note.innerText = 'MEMO: ';
    note.style.top = '100px';
    note.style.left = '100px';
    
    // 簡易ドラッグ
    let isDragging = false;
    note.onmousedown = () => isDragging = true;
    window.onmousemove = (e) => {
        if (!isDragging) return;
        note.style.left = e.pageX - 75 + 'px';
        note.style.top = e.pageY - 20 + 'px';
    };
    window.onmouseup = () => isDragging = false;
    
    document.getElementById('sticky-container').appendChild(note);
};

// 4. アクセシビリティ（文字サイズ）
let currentSize = 16;
document.getElementById('fontSizeUp').onclick = () => {
    currentSize += 2;
    document.documentElement.style.setProperty('--font-size', currentSize + 'px');
};
document.getElementById('fontSizeDown').onclick = () => {
    currentSize -= 2;
    document.documentElement.style.setProperty('--font-size', currentSize + 'px');
};

init();
