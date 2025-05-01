(function() {
    'use strict';

    const SCRIPT_NAME = "HCK";
    const CREDITS = "by hackermoon";
    const GEMINI_API_KEY = "AIzaSyBwEiziXQ79LP7IKq93pmLM8b3qnwXn6bQ";
    const MODEL_NAME = 'gemini-2.0-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
    const MAX_RETRIES = 2;
    const TOAST_DURATION = 4000;

    const PAGE_IDENTIFIER_SELECTOR = 'p.MuiTypography-root.MuiTypography-body1.css-m576f2';
    const PAGE_IDENTIFIER_TEXT = 'Redação';
    const TITLE_TEXTAREA_PARENT_SELECTOR = 'textarea:not([aria-hidden="true"])';
    const BODY_TEXTAREA_PARENT_SELECTOR = 'textarea:not([aria-hidden="true"])';
    const COLETANEA_SELECTOR = '.ql-editor';
    const ENUNCIADO_SELECTOR = '.css-1pvvm3t';
    const GENERO_SELECTOR = '.css-1cq7p20';
    const CRITERIOS_SELECTOR = '.css-1pvvm3t';

    let menuVisible = false;
    let logPanelVisible = false;
    let toggleButton = null;
    let menuPanel = null;
    let logPanel = null;
    let logContentDiv = null;
    let statusLine = null;
    let runButton = null;
    let clearButton = null;
    let isRunning = false;
    let isClearing = false;
    let toastContainer = null;
    let logArray = [];

    const styles = `
        :root { --hck-font-stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; --hck-ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        #hck-toggle-button { position: fixed; bottom: 20px; right: 20px; background-color: #000000; color: #ffffff; padding: 10px 15px; border-radius: 50px; cursor: pointer; font-family: var(--hck-font-stack); font-size: 14px; font-weight: 600; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); z-index: 10000; transition: background-color 0.3s var(--hck-ease-out), transform 0.3s var(--hck-ease-out); user-select: none; }
        #hck-toggle-button:hover { background-color: #333333; transform: scale(1.05); }
        #hck-menu-panel, #hck-log-panel { position: fixed; right: 20px; border-radius: 18px; box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25); padding: 20px; z-index: 9999; font-family: var(--hck-font-stack); display: none; flex-direction: column; border: 1px solid rgba(255, 255, 255, 0.1); opacity: 0; transform: translateY(20px) scale(0.95); transition: opacity 0.4s var(--hck-ease-out), transform 0.4s var(--hck-ease-out); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        #hck-menu-panel { bottom: 75px; width: 240px; background-color: rgba(30, 30, 30, 0.9); color: #ffffff; gap: 12px; }
        #hck-log-panel { bottom: 75px; width: 330px; max-height: 70vh; background-color: rgba(25, 25, 25, 0.92); color: #e0e0e0; gap: 15px; }
        #hck-menu-panel.visible, #hck-log-panel.visible { display: flex; opacity: 1; transform: translateY(0) scale(1); }
        #hck-menu-panel .hck-title-bar { display: flex; flex-direction: column; align-items: center; margin-bottom: 10px; }
        #hck-menu-panel h3 { margin: 0; font-size: 19px; font-weight: 700; color: #ffffff; }
        #hck-menu-panel .hck-credits { font-size: 10px; color: #b0b0b0; font-weight: 400; margin-top: 3px; }
        #hck-menu-panel button, #hck-log-panel button { background-color: #444444; color: #ffffff; border: none; padding: 12px 14px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.25s ease-out, transform 0.15s ease-out; width: 100%; margin-top: 6px; }
        #hck-menu-panel button.clear-button { background-color: #5a3e3e; }
        #hck-menu-panel button:hover:not(:disabled), #hck-log-panel button:hover:not(:disabled) { background-color: #5f5f5f; transform: scale(1.01); }
        #hck-menu-panel button.clear-button:hover:not(:disabled) { background-color: #7a5e5e; }
        #hck-menu-panel button:active:not(:disabled), #hck-log-panel button:active:not(:disabled) { transform: scale(0.97); }
        #hck-menu-panel button:disabled { background-color: #282828; color: #777777; cursor: not-allowed; transform: none; opacity: 0.7; }
        #hck-status-line { margin-top: 10px; padding: 10px 12px; border-top: 1px solid #555555; font-size: 13px; color: #e0e0e0; min-height: 20px; text-align: center; background-color: transparent; border-radius: 0; word-wrap: break-word; }
        #hck-status-line.error { color: #ffacac; font-weight: 500; }
        #hck-status-line.success { color: #b3f0cc; font-weight: 500; }
        #hck-toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10001; display: flex; flex-direction: column; align-items: center; gap: 12px; width: 90%; max-width: 420px;}
        .hck-toast { background-color: rgba(30, 30, 30, 0.92); color: #ffffff; padding: 13px 24px; border-radius: 10px; font-family: var(--hck-font-stack); font-size: 14px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35); opacity: 0; transform: translateY(-35px) scale(0.9); transition: opacity 0.45s var(--hck-ease-out), transform 0.45s var(--hck-ease-out); text-align: center; width: fit-content; max-width: 100%; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.15); }
        .hck-toast.show { opacity: 1; transform: translateY(0) scale(1); }
        .hck-toast.error { background-color: rgba(192, 57, 43, 0.92); color: #fff; border-color: rgba(255,255,255,0.25); }
        .hck-toast.success { background-color: rgba(39, 174, 96, 0.92); color: #fff; border-color: rgba(255,255,255,0.25); }
        #hck-log-panel .hck-title-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #555; }
        #hck-log-panel h3 { margin: 0; font-size: 17px; font-weight: 600; color: #e0e0e0; }
        #hck-log-content { overflow-y: auto; max-height: calc(70vh - 125px); background-color: #181818; padding: 14px; border-radius: 8px; font-size: 11px; line-height: 1.5; color: #c5c5c5; white-space: pre-wrap; word-break: break-word; border: 1px solid #444; }
        .hck-log-entry { margin-bottom: 7px; padding-bottom: 7px; border-bottom: 1px dotted #555; }
        .hck-log-entry time { color: #a0a0a0; margin-right: 10px; font-weight: bold; }
        .hck-log-entry code { font-family: 'Menlo', 'Consolas', monospace; }
        .hck-log-entry.error { color: #ff9c9c; font-weight: 500; }
        .hck-log-entry.success { color: #b9f6ca; }
        .hck-log-entry.api { color: #90caf9; }
        .hck-log-entry.debug { color: #bdbdbd; }
        #hck-log-panel .log-controls { display: flex; gap: 12px; margin-top: 15px; }
        #hck-log-panel .log-controls button { width: auto; padding: 9px 16px; background-color: #555; }
        #hck-log-panel .log-controls button.clear { background-color: #a04040; }
    `;

    function addBookmarkletStyles() { try { const s = document.createElement("style"); s.type = "text/css"; s.innerText = styles; document.head.appendChild(s); } catch (e) { console.error(`${SCRIPT_NAME} StyleErr:`, e); } }
    function createToastContainer() { if (!document.getElementById('hck-toast-container')) { toastContainer = document.createElement('div'); toastContainer.id = 'hck-toast-container'; document.body.appendChild(toastContainer); } else { toastContainer = document.getElementById('hck-toast-container'); } }

    function showToast(message, type = 'info', duration = TOAST_DURATION) { if (!toastContainer) createToastContainer(); const t = document.createElement('div'); t.className = 'hck-toast'; t.textContent = message; if (type === 'error') t.classList.add('error'); else if (type === 'success') t.classList.add('success'); toastContainer.appendChild(t); requestAnimationFrame(() => { requestAnimationFrame(() => { t.classList.add('show'); }); }); setTimeout(() => { t.classList.remove('show'); setTimeout(() => { if (t.parentNode === toastContainer) toastContainer.removeChild(t); }, 500); }, duration); }
    function logToMemory(message, type = 'info') { const ts = new Date(); const e = { timestamp:ts, type, message }; logArray.push(e); if (logPanelVisible && logContentDiv) renderSingleLogEntry(e); }
    function updateStatus(message, type = 'info', showToastFlag = false) { if (statusLine) { statusLine.textContent = message; statusLine.className = 'hck-status-line'; if (type === 'error') statusLine.classList.add('error'); else if (type === 'success') statusLine.classList.add('success'); } const lt = (type === 'info' || type === 'debug') ? type : (type === 'error' ? 'error' : 'success'); logToMemory(message, lt); if (showToastFlag) showToast(message, type); }
    function formatTime(d) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    function renderSingleLogEntry(e) { const d = document.createElement('div'); d.className = `hck-log-entry ${e.type}`; const t = document.createElement('time'); t.textContent = `[${formatTime(e.timestamp)}]`; const c = document.createElement('code'); c.textContent = e.message; d.appendChild(t); d.appendChild(c); logContentDiv.appendChild(d); logContentDiv.scrollTop = logContentDiv.scrollHeight; }
    function renderLogs() { if (!logContentDiv) return; logContentDiv.innerHTML = ''; logArray.forEach(renderSingleLogEntry); }
    function clearLogs() { logArray = []; renderLogs(); logToMemory("Logs limpos.", "info"); showToast("Logs limpos"); }

    function createLogPanel() { if (document.getElementById('hck-log-panel')) return; logPanel = document.createElement('div'); logPanel.id = 'hck-log-panel'; const tb = document.createElement('div'); tb.className = 'hck-title-bar'; const ti = document.createElement('h3'); ti.textContent = 'Logs Detalhados'; tb.appendChild(ti); logPanel.appendChild(tb); logContentDiv = document.createElement('div'); logContentDiv.id = 'hck-log-content'; logPanel.appendChild(logContentDiv); const cd = document.createElement('div'); cd.className = 'log-controls'; const cb = document.createElement('button'); cb.textContent = 'Limpar'; cb.className = 'clear'; cb.onclick = clearLogs; const clb = document.createElement('button'); clb.textContent = 'Fechar'; clb.onclick = toggleLogPanel; cd.appendChild(cb); cd.appendChild(clb); logPanel.appendChild(cd); document.body.appendChild(logPanel); renderLogs(); }
    function toggleLogPanel() { if (!logPanel) createLogPanel(); logPanelVisible = !logPanelVisible; if (logPanel) logPanel.classList.toggle('visible', logPanelVisible); if (logPanelVisible) { menuPanel?.classList.remove('visible'); menuVisible = false; renderLogs(); } }

    function createUI() {
        if (document.getElementById('hck-toggle-button')) return; createToastContainer(); toggleButton = document.createElement('div'); toggleButton.id = 'hck-toggle-button'; toggleButton.textContent = SCRIPT_NAME; toggleButton.onclick = toggleMenu; document.body.appendChild(toggleButton);
        menuPanel = document.createElement('div'); menuPanel.id = 'hck-menu-panel'; const tb = document.createElement('div'); tb.className = 'hck-title-bar'; const ti = document.createElement('h3'); ti.textContent = SCRIPT_NAME; const cs = document.createElement('span'); cs.className = 'hck-credits'; cs.textContent = CREDITS; tb.appendChild(ti); tb.appendChild(cs); menuPanel.appendChild(tb);
        runButton = document.createElement('button'); runButton.textContent = 'Gerar Redação'; runButton.onclick = () => { if (!isRunning && !isClearing) mainProcessWrapper(); }; menuPanel.appendChild(runButton);
        clearButton = document.createElement('button'); clearButton.textContent = 'Limpar Campos'; clearButton.className = 'clear-button'; clearButton.onclick = () => { if (!isRunning && !isClearing) clearFieldsProcessWrapper(); }; menuPanel.appendChild(clearButton);
        const logButton = document.createElement('button'); logButton.textContent = 'Ver Logs'; logButton.onclick = toggleLogPanel; menuPanel.appendChild(logButton);
        statusLine = document.createElement('div'); statusLine.id = 'hck-status-line'; statusLine.textContent = 'Pronto.'; menuPanel.appendChild(statusLine); document.body.appendChild(menuPanel);
    }

    function toggleMenu() { menuVisible = !menuVisible; if (menuPanel) menuPanel.classList.toggle('visible', menuVisible); if (menuVisible) { logPanel?.classList.remove('visible'); logPanelVisible = false; } }
    async function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    async function insertTextIntoTextarea(parentElement, textToInsert, fieldName) {
        logToMemory(`Ins ${fieldName} ('${textToInsert.substring(0,10)}') Strt`, 'debug'); updateStatus(`Inserindo ${fieldName}...`); const el = parentElement.querySelector('textarea:not([aria-hidden="true"])'); if (!el) { updateStatus(`Err: Txtarea ${fieldName} NF.`, 'error', true); logToMemory(`Txtarea ${fieldName} NF`, 'error'); return false; } let ok = false;
        try { logToMemory(`M1 Dir [${fieldName}]`, 'debug'); el.focus(); el.value = textToInsert; el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })); el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true })); await delay(60); el.blur(); await delay(110); if (el.value === textToInsert) ok = true; } catch (e) { logToMemory(`Err M1 [${fieldName}]: ${e}`, 'error'); }
        if (ok) { logToMemory(`${fieldName} ${textToInsert === '' ? 'clr' : 'ins'} (M1)`, 'success'); updateStatus(`${fieldName} ${textToInsert === '' ? 'limpo' : 'inserido'}.`); return true; }
        try { logToMemory(`M2 React [${fieldName}]`, 'debug'); const k = Object.keys(el); const h = k.find(x => x.startsWith('__reactProps$') || x.startsWith('__reactEventHandlers$')); if (h) { const p = el[h]; if (p && typeof p.onChange === 'function') { p.onChange({ target: { value: textToInsert }, currentTarget: { value: textToInsert }, preventDefault: () => {}, stopPropagation: () => {} }); await delay(160); if (el.value === textToInsert) ok = true; } } } catch (e) { logToMemory(`Err M2 [${fieldName}]: ${e}`, 'error'); }
        if (ok) { logToMemory(`${fieldName} ${textToInsert === '' ? 'clr' : 'ins'} (M2)`, 'success'); updateStatus(`${fieldName} ${textToInsert === '' ? 'limpo' : 'inserido'}.`); return true; }
        try { logToMemory(`M3 InputEv [${fieldName}]`, 'debug'); el.focus(); el.value = ''; await delay(60); el.value = textToInsert; el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: textToInsert, inputType: 'insertText' })); await delay(110); el.blur(); await delay(110); if (el.value === textToInsert) ok = true; } catch (e) { logToMemory(`Err M3 [${fieldName}]: ${e}`, 'error'); }
        if (ok) { logToMemory(`${fieldName} ${textToInsert === '' ? 'clr' : 'ins'} (M3)`, 'success'); updateStatus(`${fieldName} ${textToInsert === '' ? 'limpo' : 'inserido'}.`); return true; }
        await delay(210); if (el.value === textToInsert) { logToMemory(`${fieldName} ${textToInsert === '' ? 'clr' : 'ins'} (Final)`, 'success'); updateStatus(`${fieldName} ${textToInsert === '' ? 'limpo' : 'inserido'}.`); return true; }
        else { logToMemory(`Fail final ${textToInsert === '' ? 'clr' : 'ins'} ${fieldName}.`, 'error'); updateStatus(`Err final ${textToInsert === '' ? 'limpar' : 'inserir'} ${fieldName}.`, 'error', true); return false; }
    }

    async function getAiResponse(prompt, operationDesc) {
        logToMemory(`API: ${operationDesc}`, 'api'); updateStatus(`${operationDesc}...`); let att = 0;
        while (att <= MAX_RETRIES) { att++; logToMemory(`API Att ${att}/${MAX_RETRIES+1} ${operationDesc}`, 'api'); try { const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.75, topP: 0.95, topK: 40, maxOutputTokens: 8192 } }), }); if (!r.ok) { const eb = await r.text(); logToMemory(`API Err ${r.status} (Att ${att}): ${eb.substring(0,150)}...`, 'error'); if (att > MAX_RETRIES) throw new Error(`API fail(${r.status}) M:${MODEL_NAME}`); updateStatus(`API Err (${r.status}). Tnt(${att}/${MAX_RETRIES})...`, 'error'); await delay(1600 * att); continue; } const d = await r.json(); logToMemory(`API OK Resp (Att ${att}): ${JSON.stringify(d).substring(0,100)}...`, 'debug'); const t = d?.candidates?.[0]?.content?.parts?.[0]?.text; if (!t) { logToMemory(`API Inv Resp (Att ${att})`, 'error'); if (att > MAX_RETRIES) throw new Error('API resp fmt inv.'); updateStatus(`API Err (fmt). Tnt(${att}/${MAX_RETRIES})...`, 'error'); await delay(1600 * att); continue; } logToMemory(`API ${operationDesc} OK (Att ${att}). Len:${t.length}`, 'success'); updateStatus(`${operationDesc} ok.`); return t.trim(); } catch (e) { logToMemory(`Catch API ${operationDesc} (Att ${att}): ${e}`, 'error'); if (att > MAX_RETRIES) { updateStatus(`API Err Fatal:${e.message}`, 'error', true); throw e; } updateStatus(`API Err. Tnt(${att}/${MAX_RETRIES})...`, 'error'); await delay(1600 * att); } }
        logToMemory(`API Fail final ${operationDesc}.`, 'error'); updateStatus(`Erro: Falha API ${operationDesc}.`, 'error', true); return null;
    }

    function extractPageContext() {
        logToMemory("Ctx Extract Init", 'info'); updateStatus("Extraindo contexto..."); const ctx = {}; const sel = { coletanea: COLETANEA_SELECTOR, enunciado: ENUNCIADO_SELECTOR, generoTextual: GENERO_SELECTOR, criteriosAvaliacao: CRITERIOS_SELECTOR }; let ess = true;
        for (const k in sel) { try { const el = document.querySelector(sel[k]); ctx[k] = el ? el.innerText.trim() : ''; if (!ctx[k]) { logToMemory(`Ctx ${k} vazio (Sel: ${sel[k]})`, 'debug'); } else { logToMemory(`Ctx ${k}: ${ctx[k].substring(0,50)}...`, 'debug'); } } catch (e) { logToMemory(`Ctx Err ${k}: ${e}`, 'error'); if (k === 'enunciado') ess = false; } }
        if (!ctx.enunciado) { logToMemory("Ctx Err Fatal: Enunciado NF.", 'error'); updateStatus("Erro: Enunciado não encontrado.", 'error', true); return null; }
        logToMemory("Ctx Extract OK.", 'success'); updateStatus("Contexto extraído."); return ctx;
    }

     async function clearFieldsProcess() {
        logToMemory("Limpando campos...", 'info'); updateStatus("Limpando..."); let tOk = false, bOk = false, tF = false, bF = false; let tP = null;
        try { logToMemory("Limpando Título...", 'info'); tP = document.querySelector(TITLE_TEXTAREA_PARENT_SELECTOR)?.parentElement; if (tP) { tF = true; tOk = await insertTextIntoTextarea(tP, '', "Título"); } else { logToMemory("Título NF p/ limpar.", 'debug'); } await delay(200);
              logToMemory("Limpando Corpo...", 'info'); const areas = document.querySelectorAll(BODY_TEXTAREA_PARENT_SELECTOR); let bP = null; if (areas.length > 0) { bP = (areas.length > 1 && tF && areas[0].parentElement === tP) ? areas[1].parentElement : areas[areas.length - 1].parentElement; } if (bP) { bF = true; bOk = await insertTextIntoTextarea(bP, '', "Corpo"); } else { logToMemory("Corpo NF p/ limpar.", 'debug'); }
              if (!tF && !bF) { updateStatus("Campos NF p/ limpar.", 'error', true); return; }
              if ((tF && tOk) || (bF && bOk)) { updateStatus("Campos limpos!", 'success', true); } else { updateStatus("Erro ao limpar campos.", 'error', true); }
        } catch (e) { logToMemory(`Erro limpeza: ${e}`, 'error'); updateStatus("Erro inesperado ao limpar.", 'error', true); }
    }

    async function mainProcess() {
        logToMemory("Proc Principal Init.", 'info'); updateStatus("Verificando página..."); const idEl = document.querySelector(PAGE_IDENTIFIER_SELECTOR); if (!idEl || !idEl.textContent.includes(PAGE_IDENTIFIER_TEXT)) { logToMemory(`Fail Verif Pag. Sel:'${PAGE_IDENTIFIER_SELECTOR}', Txt:'${PAGE_IDENTIFIER_TEXT}'`, 'error'); updateStatus(`Erro: Página não é ${PAGE_IDENTIFIER_TEXT}.`, 'error', true); return; }
        logToMemory("Verif Pag OK.", 'success'); updateStatus("Página OK."); await delay(200); const ctx = extractPageContext(); if (!ctx) return; await delay(200);
        const initialPrompt = `**PROMPT OTIMIZADO V5 (FOCO NATURALIDADE HUMANA E TÍTULO INFORMATIVO)**\n\n**Objetivo:** Gerar um texto dissertativo-argumentativo com **máxima naturalidade**, soando como um **bom estudante humano**, bem estruturado, dentro dos limites de caracteres, e com um **título curto que reflita o argumento central**.\n\n**Contexto da Tarefa:**\n${JSON.stringify(ctx, null, 1)}\n\n**Instruções Detalhadas:**\n1.  **TÍTULO:** Crie um título **extremamente conciso (3-6 palavras)** que **sintetize o argumento principal ou a tese específica** desenvolvida no texto. Deve ser **informativo sobre o foco da redação**, não apenas sobre o tema geral. Ex: Se o texto argumenta sobre a responsabilidade conjunta, o título deve refletir isso.\n2.  **TEXTO (1700-3000 caracteres):**\n    *   **Estrutura:** Introdução (contextualização **natural** + tese clara), Desenvolvimento (2-3 parágrafos com argumentos lógicos e **bem conectados**), Conclusão (retomada da tese + reflexão/fechamento).\n    *   **Linguagem NATURALÍSSIMA (PRIORIDADE TOTAL):**\n        *   **Vocabulário:** Use palavras do português culto, mas que sejam **comuns e fluidas**. **EVITE A TODO CUSTO PALAVRAS/EXPRESSÕES QUE SOAM COMO IA:** 'outrossim', 'mormente', 'hodiernamente', 'precipuamente', 'salientar', 'é mister', 'é premente', 'é imperativo', 'diante desse cenário', 'sob essa ótica/perspectiva', 'nesse ínterim', 'vale ressaltar que', 'faz-se mister', 'conquanto', 'posto que', 'implementar soluções', 'mitigar problemas', etc. Use sinônimos naturais.\n        *   **Fluidez e Ritmo:** **VARIEDADE É CHAVE.** Misture frases curtas, médias e longas. Use conectivos comuns (mas, porém, contudo, então, assim, por isso, além disso, no entanto, pois, porque, etc.) para ligar ideias de forma **suave e lógica**, sem repetição excessiva ou forçada.\n        *   **Inícios de Parágrafo/Frase:** **NÃO SEJA PREVISÍVEL!** Diversifique os começos. Evite iniciar parágrafos seguidos com o mesmo tipo de conectivo ou estrutura. Comece com afirmações, retomadas, contextualizações curtas.\n        *   **Introdução:** **CRÍTICO!** Deve começar de forma **engajadora e natural**, não com uma declaração formal e óbvia. Ex: em vez de "A fome é um problema...", talvez "Discutir a fome no Brasil nos leva a pensar em...", ou "Muitos fatores contribuem para a persistência da fome...". A primeira frase NÃO PODE entregar que é IA.\n        *   **Pontuação:** Natural, ajudando no ritmo da leitura.\n    *   **Argumentação:** Lógica e plausível, baseada no contexto, mas escrita com **voz própria**, como um estudante analisando o tema.\n\n**Modelo de Resposta OBRIGATÓRIO (SEM NADA EXTRA):**\nTITULO: [Título Informativo e Conciso]\n\nTEXTO:\n[Introdução Natural e Engajadora]\n\n[Desenvolvimento Fluido 1]\n\n[Desenvolvimento Fluido 2]\n\n[Desenvolvimento Fluido 3 (se aplicável)]\n\n[Conclusão Coerente]\n\n**Foco Final:** Que alguém lendo **não consiga dizer que foi gerado por IA**. Naturalidade na escolha de palavras, estrutura de frases, pontuação e fluxo das ideias é essencial. O título deve ser um reflexo direto do argumento principal. Cumpra o tamanho solicitado.`;
        const rawResp = await getAiResponse(initialPrompt, "Gerando texto inicial"); if (!rawResp) return;
        logToMemory("Analisando resp inicial.", 'info'); updateStatus("Analisando resposta IA..."); let title = ''; let text = '';
        try { if (!rawResp.includes('TITULO:') || !rawResp.includes('TEXTO:')) throw new Error("Marcações TITULO/TEXTO ausentes."); title = rawResp.split('TITULO:')[1].split('TEXTO:')[0].trim(); text = rawResp.split('TEXTO:')[1].trim(); if (!title || !text) throw new Error("Extração falhou."); logToMemory(`Título: ${title}`, 'success'); logToMemory(`Texto (início): ${text.substring(0,60)}... | Len: ${text.length}`, 'success'); updateStatus("Resposta inicial OK."); await delay(200);
        } catch (e) { logToMemory(`Err análise resp IA: ${e.message}. Raw:${rawResp.substring(0,100)}...`, 'error'); updateStatus(`Erro análise: ${e.message}`, 'error', true); return; }
        const humanPrompt = `**Tarefa:** Refinar o texto abaixo para MÁXIMA naturalidade, eliminando QUALQUER vestígio de escrita artificial. Manter 100% do sentido, argumentos e estrutura de parágrafos.\n**Ações de Refinamento CRÍTICAS:**\n*   **Introdução:** Torná-la o mais fluida e humana possível, **removendo qualquer formalidade excessiva ou começo óbvio**.\n*   **Vocabulário:** **Caçar e substituir** CADA palavra/expressão que soe minimamente artificial ou rebuscada demais por alternativas comuns e naturais (norma culta mantida).\n*   **Conexões:** Suavizar transições entre frases/parágrafos. Usar conectivos **variados e comuns**, NADA repetitivos.\n*   **Ritmo/Fluidez:** Quebrar/unir frases para um fluxo mais agradável e menos mecânico.\n*   **Pontuação:** Assegurar naturalidade.\n*   **Retorno:** APENAS o texto refinado.\n\n**Texto Original:**\n${text}`;
        const humanText = await getAiResponse(humanPrompt, "Refinando texto (Humanizando)"); if (!humanText) return; await delay(200);
        logToMemory("Localizando Título...", 'info'); updateStatus("Localizando campo título..."); const titleP = document.querySelector(TITLE_TEXTAREA_PARENT_SELECTOR)?.parentElement; if (!titleP) { logToMemory("Erro: Pai Título NF.", 'error'); updateStatus("Erro: Campo título NF.", "error", true); return; }
        const titleOk = await insertTextIntoTextarea(titleP, title, "Título"); if (!titleOk) return; await delay(500);
        logToMemory("Localizando Corpo...", 'info'); updateStatus("Localizando campo corpo..."); const areas = document.querySelectorAll(BODY_TEXTAREA_PARENT_SELECTOR); let bodyP = null; if (areas.length > 0) { bodyP = (areas.length > 1 && areas[0].parentElement === titleP) ? areas[1].parentElement : areas[areas.length - 1].parentElement; logToMemory(`Pai corpo sel. (Total:${areas.length})`, 'debug'); }
        if (!bodyP) { logToMemory("Erro: Pai Corpo NF.", 'error'); updateStatus("Erro: Campo corpo NF.", "error", true); return; }
        const bodyOk = await insertTextIntoTextarea(bodyP, humanText, "Corpo"); if (!bodyOk) return;
        logToMemory("Processo concluído!", 'success'); updateStatus("Redação inserida com sucesso!", 'success', true);
    }

     async function clearFieldsProcessWrapper() { if (isRunning || isClearing) return; isClearing = true; if (runButton) runButton.disabled = true; if (clearButton) clearButton.disabled = true; logToMemory("==== Limpeza Iniciada ====", 'info'); updateStatus("Limpando...", 'info'); try { await clearFieldsProcess(); } catch (e) { logToMemory(`Erro Wrapper Limpeza: ${e}`, 'error'); console.error(`${SCRIPT_NAME} Erro Limpeza:`, e); updateStatus(`Erro ao limpar: ${e.message}`, 'error', true); } finally { isClearing = false; if (runButton) runButton.disabled = false; if (clearButton) clearButton.disabled = false; logToMemory("==== Limpeza Finalizada ====", 'info'); } }
     async function mainProcessWrapper() { if (isRunning || isClearing) return; isRunning = true; if (runButton) runButton.disabled = true; if (clearButton) clearButton.disabled = true; logToMemory("==== Gerar Iniciado ====", 'info'); updateStatus("Iniciando...", 'info'); try { await mainProcess(); } catch (e) { logToMemory(`Erro Wrapper Gerar: ${e}`, 'error'); console.error(`${SCRIPT_NAME} Erro Gerar:`, e); updateStatus(`Erro: ${e.message}`, 'error', true); } finally { isRunning = false; if (runButton) runButton.disabled = false; if (clearButton) clearButton.disabled = false; logToMemory("==== Gerar Finalizado ====", 'info'); } }
    function initialize() { logToMemory("Init HCK", 'info'); addBookmarkletStyles(); createUI(); updateStatus("Pronto."); logToMemory("UI Pronta.", 'info'); }
    if (document.readyState === 'loading') { logToMemory("Esperando DOM", 'debug'); document.addEventListener('DOMContentLoaded', initialize); } else { logToMemory("DOM pronto, init c/ delay.", 'debug'); setTimeout(initialize, 250); }

})();
