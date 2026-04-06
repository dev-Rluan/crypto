'use strict';

/* ═══════════════════════════════════════════════════════════════
   HISTORY MODULE
   ═══════════════════════════════════════════════════════════════ */
const HistoryModule = (() => {
    const STORAGE_KEY = 'cryptohub_history';
    const MAX_ITEMS   = 100;

    // ── Storage helpers ──────────────────────────────────────────
    function getAll() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    function save(items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    // ── Public API ───────────────────────────────────────────────
    function add(entry) {
        const items = getAll();
        items.unshift({
            id:        Date.now() + '_' + Math.random().toString(36).slice(2),
            timestamp: new Date().toISOString(),
            algorithm: entry.algorithm  || '?',
            operation: entry.operation  || '?',
            input:     String(entry.input  || '').slice(0, 500),
            output:    String(entry.output || '').slice(0, 500),
            meta:      entry.meta || {}
        });
        if (items.length > MAX_ITEMS) items.splice(MAX_ITEMS);
        save(items);
        render();
    }

    function remove(id) {
        save(getAll().filter(i => i.id !== id));
        render();
    }

    function clear() {
        if (!confirm('히스토리를 모두 삭제하시겠습니까?')) return;
        save([]);
        render();
    }

    // ── Rendering ────────────────────────────────────────────────
    function render() {
        const items     = getAll();
        const container = document.getElementById('historyList');
        const countEl   = document.getElementById('historyCount');

        if (countEl) countEl.textContent = items.length;
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = '<div class="history-empty">아직 기록이 없습니다.</div>';
            return;
        }

        container.innerHTML = items.map((item, idx) => `
            <div class="history-item">
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <div>
                        <span class="badge ${algoBadge(item.algorithm)} algo-badge me-1">${item.algorithm}</span>
                        <span class="badge ${opBadge(item.operation)}">${opLabel(item.operation)}</span>
                        ${item.meta && item.meta.mode ? `<span class="badge bg-light text-dark border ms-1">${item.meta.mode}</span>` : ''}
                    </div>
                    <div class="d-flex gap-1 ms-1 flex-shrink-0">
                        <button class="btn btn-xs btn-outline-secondary copy-hist-btn" data-idx="${idx}" title="출력 복사">📋</button>
                        <button class="btn btn-xs btn-outline-danger del-hist-btn"  data-id="${item.id}"  title="삭제">✕</button>
                    </div>
                </div>
                <div class="snippet">▶ ${escHtml(truncate(item.input, 55))}</div>
                <div class="snippet out">◀ ${escHtml(truncate(item.output, 70))}</div>
                <div class="ts">${fmtTime(item.timestamp)}</div>
            </div>`
        ).join('');

        // Attach events via delegation snapshot
        const snapshot = items.slice();
        container.querySelectorAll('.copy-hist-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                copyText(snapshot[parseInt(btn.dataset.idx)].output);
            });
        });
        container.querySelectorAll('.del-hist-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                remove(btn.dataset.id);
            });
        });
    }

    // ── Helpers ──────────────────────────────────────────────────
    function algoBadge(a) {
        const m = { AES:'bg-primary', DES:'bg-info text-dark', '3DES':'bg-info text-dark',
                    Base64:'bg-success', Hex:'bg-teal', MD5:'bg-warning text-dark',
                    SHA1:'bg-warning text-dark', SHA256:'bg-warning text-dark',
                    SHA512:'bg-warning text-dark', 'SHA3-256':'bg-warning text-dark',
                    'SHA3-512':'bg-warning text-dark' };
        if (a && a.startsWith('HMAC')) return 'bg-orange';
        return m[a] || 'bg-secondary';
    }

    function opBadge(op) {
        const m = { encrypt:'bg-danger', decrypt:'bg-success', hash:'bg-secondary',
                    encode:'bg-primary', decode:'bg-success', hmac:'bg-orange' };
        return m[op] || 'bg-secondary';
    }

    function opLabel(op) {
        const m = { encrypt:'암호화', decrypt:'복호화', hash:'해시', encode:'인코딩', decode:'디코딩', hmac:'HMAC' };
        return m[op] || op;
    }

    function truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.slice(0, len) + '…' : str;
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function fmtTime(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('ko-KR') + ' ' +
               d.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    }

    return { add, remove, clear, render };
})();


/* ═══════════════════════════════════════════════════════════════
   CRYPTO HELPERS
   ═══════════════════════════════════════════════════════════════ */

function parseKey(keyStr, keyType, sizeBytes) {
    if (keyType === 'hex') {
        let hex = keyStr.replace(/\s+/g, '');
        while (hex.length < sizeBytes * 2) hex += '0';
        return CryptoJS.enc.Hex.parse(hex.slice(0, sizeBytes * 2));
    }
    // UTF-8: pad with null bytes or truncate
    let str = keyStr;
    while (str.length < sizeBytes) str += '\0';
    return CryptoJS.enc.Utf8.parse(str.slice(0, sizeBytes));
}

function parseIV(ivStr, keyType, sizeBytes) {
    if (!ivStr) return CryptoJS.enc.Hex.parse('00'.repeat(sizeBytes));
    return parseKey(ivStr, keyType, sizeBytes);
}

function getMode(m) {
    return ({ CBC: CryptoJS.mode.CBC, ECB: CryptoJS.mode.ECB,
              CFB: CryptoJS.mode.CFB, OFB: CryptoJS.mode.OFB,
              CTR: CryptoJS.mode.CTR })[m] || CryptoJS.mode.CBC;
}

function getPadding(p) {
    return ({ Pkcs7: CryptoJS.pad.Pkcs7, ZeroPadding: CryptoJS.pad.ZeroPadding,
              NoPadding: CryptoJS.pad.NoPadding, Iso10126: CryptoJS.pad.Iso10126,
              AnsiX923: CryptoJS.pad.AnsiX923 })[p] || CryptoJS.pad.Pkcs7;
}

function toCipherParams(ciphertext, fmt) {
    const wa = fmt === 'base64'
        ? CryptoJS.enc.Base64.parse(ciphertext)
        : CryptoJS.enc.Hex.parse(ciphertext);
    return CryptoJS.lib.CipherParams.create({ ciphertext: wa });
}


/* ═══════════════════════════════════════════════════════════════
   AES
   ═══════════════════════════════════════════════════════════════ */

function aesEncrypt() {
    try {
        const input     = gv('aesInput');
        const keyStr    = gv('aesKey');
        const ivStr     = gv('aesIv');
        const keySize   = parseInt(gv('aesKeySize'));
        const mode      = gv('aesMode');
        const padding   = gv('aesPadding');
        const keyType   = gv('aesKeyType');
        const outFmt    = gv('aesOutputFmt');

        if (!input)  return showErr('aesResult', '입력 텍스트를 입력하세요.');
        if (!keyStr) return showErr('aesResult', '키를 입력하세요.');

        const key = parseKey(keyStr, keyType, keySize);
        const cfg = { mode: getMode(mode), padding: getPadding(padding) };
        if (mode !== 'ECB') cfg.iv = parseIV(ivStr, keyType, 16);

        const enc    = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(input), key, cfg);
        const result = outFmt === 'base64'
            ? enc.toString()
            : enc.ciphertext.toString(CryptoJS.enc.Hex);

        showOk('aesResult', result);
        HistoryModule.add({ algorithm:'AES', operation:'encrypt', input, output:result,
                            meta:{ mode, keySize: keySize * 8, fmt: outFmt } });
    } catch (e) {
        showErr('aesResult', '암호화 실패: ' + e.message);
    }
}

function aesDecrypt() {
    try {
        const input     = gv('aesInput');
        const keyStr    = gv('aesKey');
        const ivStr     = gv('aesIv');
        const keySize   = parseInt(gv('aesKeySize'));
        const mode      = gv('aesMode');
        const padding   = gv('aesPadding');
        const keyType   = gv('aesKeyType');
        const outFmt    = gv('aesOutputFmt');

        if (!input)  return showErr('aesResult', '입력 텍스트를 입력하세요.');
        if (!keyStr) return showErr('aesResult', '키를 입력하세요.');

        const key = parseKey(keyStr, keyType, keySize);
        const cfg = { mode: getMode(mode), padding: getPadding(padding) };
        if (mode !== 'ECB') cfg.iv = parseIV(ivStr, keyType, 16);

        const dec    = CryptoJS.AES.decrypt(toCipherParams(input, outFmt), key, cfg);
        const result = dec.toString(CryptoJS.enc.Utf8);

        if (!result) throw new Error('결과가 비어 있습니다. 키·IV·포맷을 확인하세요.');
        showOk('aesResult', result);
        HistoryModule.add({ algorithm:'AES', operation:'decrypt', input, output:result,
                            meta:{ mode, keySize: keySize * 8, fmt: outFmt } });
    } catch (e) {
        showErr('aesResult', '복호화 실패: ' + e.message);
    }
}


/* ═══════════════════════════════════════════════════════════════
   DES / 3DES
   ═══════════════════════════════════════════════════════════════ */

function desEncrypt() {
    try {
        const input   = gv('desInput');
        const keyStr  = gv('desKey');
        const ivStr   = gv('desIv');
        const algo    = gv('desAlgo');
        const mode    = gv('desMode');
        const padding = gv('desPadding');
        const outFmt  = gv('desOutputFmt');

        if (!input)  return showErr('desResult', '입력 텍스트를 입력하세요.');
        if (!keyStr) return showErr('desResult', '키를 입력하세요.');

        const keySize = algo === 'DES' ? 8 : 24;
        const key     = parseKey(keyStr, 'utf8', keySize);
        const cfg     = { mode: getMode(mode), padding: getPadding(padding) };
        if (mode !== 'ECB') cfg.iv = parseIV(ivStr, 'utf8', 8);

        const fn     = algo === 'DES' ? CryptoJS.DES : CryptoJS.TripleDES;
        const enc    = fn.encrypt(CryptoJS.enc.Utf8.parse(input), key, cfg);
        const result = outFmt === 'base64'
            ? enc.toString()
            : enc.ciphertext.toString(CryptoJS.enc.Hex);

        showOk('desResult', result);
        HistoryModule.add({ algorithm: algo, operation:'encrypt', input, output:result,
                            meta:{ mode, fmt: outFmt } });
    } catch (e) {
        showErr('desResult', '암호화 실패: ' + e.message);
    }
}

function desDecrypt() {
    try {
        const input   = gv('desInput');
        const keyStr  = gv('desKey');
        const ivStr   = gv('desIv');
        const algo    = gv('desAlgo');
        const mode    = gv('desMode');
        const padding = gv('desPadding');
        const outFmt  = gv('desOutputFmt');

        if (!input)  return showErr('desResult', '입력 텍스트를 입력하세요.');
        if (!keyStr) return showErr('desResult', '키를 입력하세요.');

        const keySize = algo === 'DES' ? 8 : 24;
        const key     = parseKey(keyStr, 'utf8', keySize);
        const cfg     = { mode: getMode(mode), padding: getPadding(padding) };
        if (mode !== 'ECB') cfg.iv = parseIV(ivStr, 'utf8', 8);

        const fn     = algo === 'DES' ? CryptoJS.DES : CryptoJS.TripleDES;
        const dec    = fn.decrypt(toCipherParams(input, outFmt), key, cfg);
        const result = dec.toString(CryptoJS.enc.Utf8);

        if (!result) throw new Error('결과가 비어 있습니다. 키·IV·포맷을 확인하세요.');
        showOk('desResult', result);
        HistoryModule.add({ algorithm: algo, operation:'decrypt', input, output:result,
                            meta:{ mode, fmt: outFmt } });
    } catch (e) {
        showErr('desResult', '복호화 실패: ' + e.message);
    }
}


/* ═══════════════════════════════════════════════════════════════
   BASE64 / HEX
   ═══════════════════════════════════════════════════════════════ */

function base64Encode() {
    try {
        const input = gv('encodingInput');
        if (!input) return showErr('encodingResult', '입력 텍스트를 입력하세요.');
        // UTF-8 safe
        const result = btoa(
            encodeURIComponent(input).replace(/%([0-9A-F]{2})/g,
                (_, p) => String.fromCharCode(parseInt(p, 16)))
        );
        showOk('encodingResult', result);
        HistoryModule.add({ algorithm:'Base64', operation:'encode', input, output:result });
    } catch (e) {
        showErr('encodingResult', '인코딩 실패: ' + e.message);
    }
}

function base64Decode() {
    try {
        const input = gv('encodingInput');
        if (!input) return showErr('encodingResult', '입력 텍스트를 입력하세요.');
        // UTF-8 safe
        const result = decodeURIComponent(
            Array.from(atob(input))
                .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );
        showOk('encodingResult', result);
        HistoryModule.add({ algorithm:'Base64', operation:'decode', input, output:result });
    } catch (e) {
        showErr('encodingResult', '디코딩 실패: 유효한 Base64 문자열이 아닙니다.');
    }
}

function hexEncode() {
    try {
        const input = gv('encodingInput');
        if (!input) return showErr('encodingResult', '입력 텍스트를 입력하세요.');
        const result = Array.from(new TextEncoder().encode(input))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        showOk('encodingResult', result);
        HistoryModule.add({ algorithm:'Hex', operation:'encode', input, output:result });
    } catch (e) {
        showErr('encodingResult', '인코딩 실패: ' + e.message);
    }
}

function hexDecode() {
    try {
        const input = gv('encodingInput').replace(/\s+/g, '');
        if (!input) return showErr('encodingResult', '입력 텍스트를 입력하세요.');
        if (input.length % 2 !== 0) throw new Error('Hex 문자열 길이가 홀수입니다.');
        if (!/^[0-9a-fA-F]+$/.test(input)) throw new Error('유효한 Hex 문자열이 아닙니다.');
        const bytes  = new Uint8Array(input.match(/.{2}/g).map(b => parseInt(b, 16)));
        const result = new TextDecoder().decode(bytes);
        showOk('encodingResult', result);
        HistoryModule.add({ algorithm:'Hex', operation:'decode', input, output:result });
    } catch (e) {
        showErr('encodingResult', '디코딩 실패: ' + e.message);
    }
}


/* ═══════════════════════════════════════════════════════════════
   HASH
   ═══════════════════════════════════════════════════════════════ */

function computeHash() {
    try {
        const input   = gv('hashInput');
        const algo    = gv('hashAlgo');
        const hmacKey = gv('hmacKey');

        if (!input) return showErr('hashResult', '입력 텍스트를 입력하세요.');

        let result, algorithm, operation;

        if (hmacKey) {
            const hmacFns = {
                MD5:    CryptoJS.HmacMD5,
                SHA1:   CryptoJS.HmacSHA1,
                SHA256: CryptoJS.HmacSHA256,
                SHA512: CryptoJS.HmacSHA512,
            };
            if (!hmacFns[algo]) throw new Error('이 알고리즘은 HMAC을 지원하지 않습니다 (SHA3 제외).');
            result    = hmacFns[algo](input, hmacKey).toString();
            algorithm = 'HMAC-' + algo;
            operation = 'hmac';
        } else {
            const hashFns = {
                MD5:      CryptoJS.MD5,
                SHA1:     CryptoJS.SHA1,
                SHA256:   CryptoJS.SHA256,
                SHA512:   CryptoJS.SHA512,
                'SHA3-256': (m) => CryptoJS.SHA3(m, { outputLength: 256 }),
                'SHA3-512': (m) => CryptoJS.SHA3(m, { outputLength: 512 }),
            };
            if (!hashFns[algo]) throw new Error('지원하지 않는 알고리즘입니다.');
            result    = hashFns[algo](input).toString();
            algorithm = algo;
            operation = 'hash';
        }

        showOk('hashResult', result);
        HistoryModule.add({ algorithm, operation, input, output:result });
    } catch (e) {
        showErr('hashResult', '해시 실패: ' + e.message);
    }
}


/* ═══════════════════════════════════════════════════════════════
   UI HELPERS
   ═══════════════════════════════════════════════════════════════ */

function gv(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function showOk(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value;
    el.classList.remove('is-invalid');
    el.classList.add('is-valid');
    showToast('완료!', 'success');
}

function showErr(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.value = '';
        el.classList.remove('is-valid');
        el.classList.add('is-invalid');
    }
    showToast(msg, 'danger');
}

function copyResult(id) {
    const el = document.getElementById(id);
    if (el && el.value) copyText(el.value);
    else showToast('복사할 내용이 없습니다.', 'warning');
}

function copyText(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        showToast('클립보드에 복사됨', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const ta = Object.assign(document.createElement('textarea'),
            { value: text, style: 'position:fixed;opacity:0' });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('클립보드에 복사됨', 'success');
    });
}

function useAsInput(resultId, inputId) {
    const result = document.getElementById(resultId);
    const input  = document.getElementById(inputId);
    if (result && input && result.value) {
        input.value = result.value;
        result.value = '';
        result.classList.remove('is-valid', 'is-invalid');
        showToast('입력 필드로 이동했습니다.', 'info');
    }
}

function clearFields(inputId, resultId) {
    [inputId, resultId].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
            el.classList.remove('is-valid', 'is-invalid');
        }
    });
}

/** Generate a cryptographically random hex string of `bytes` length and put it in the input */
function generateRandom(id, bytes) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    const el  = document.getElementById(id);
    if (el) {
        el.value = hex;
        showToast(`랜덤 ${bytes * 8}비트 값 생성됨`, 'info');
    }
}

function generateDesRandom(id) {
    const algo  = document.getElementById('desAlgo');
    const bytes = (algo && algo.value === '3DES') ? 24 : 8;
    generateRandom(id, bytes);
}


/* ═══════════════════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════════════════ */

function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const id   = 'toast_' + Date.now();
    const icon = { success:'✔', danger:'✖', warning:'⚠', info:'ℹ' }[type] || '•';
    container.insertAdjacentHTML('beforeend', `
        <div id="${id}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive">
            <div class="d-flex">
                <div class="toast-body">${icon} ${msg}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>`);

    const el    = document.getElementById(id);
    const toast = new bootstrap.Toast(el, { delay: 2000 });
    toast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}


/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    HistoryModule.render();
});
