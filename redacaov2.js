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
        :root { --hck-font-stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; --hck-ease-out: cubic-bezier(0.25, 0.1, 0.25, 1); }
        #hck-toggle-button { position: fixed; bottom: 20px; right: 20px; background-color: #000000; color: #ffffff; padding: 10px 15px; border-radius: 50px; cursor: pointer; font-family: var(--hck-font-stack); font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25); z-index: 10000; transition: background-color 0.25s var(--hck-ease-out), transform 0.25s var(--hck-ease-out); user-select: none; }
        #hck-toggle-button:hover { background-color: #333333; transform: scale(1.05); }
        #hck-menu-panel, #hck-log-panel { position: fixed; right: 20px; border-radius: 18px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); padding: 18px; z-index: 9999; font-family: var(--hck-font-stack); display: none; flex-direction: column; border: 1px solid rgba(255, 255, 255, 0.1); opacity: 0; transform: translateY(15px) scale(0.95); transition: opacity 0.35s var(--hck-ease-out), transform 0.35s var(--hck-ease-out); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        #hck-menu-panel { bottom: 75px; width: 240px; background-color: rgba(0, 0, 0, 0.85); color: #ffffff; gap: 10px; }
        #hck-log-panel { bottom: 75px; width: 320px; max-height: 70vh; background-color: rgba(20, 20, 20, 0.9); color: #e0e0e0; gap: 14px; }
        #hck-menu-panel.visible, #hck-log-panel.visible { display: flex; opacity: 1; transform: translateY(0) scale(1); }
        #hck-menu-panel .hck-title-bar { display: flex; flex-direction: column; align-items: center; margin-bottom: 8px; }
        #hck-menu-panel h3 { margin: 0; font-size: 18px; font-weight: 700; color: #ffffff; }
        #hck-menu-panel .hck-credits { font-size: 10px; color: #aaaaaa; font-weight: 400; margin-top: 2px; }
        #hck-menu-panel button, #hck-log-panel button { background-color: #333333; color: #ffffff; border: none; padding: 11px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background-color 0.2s ease-out, transform 0.1s ease-out; width: 100%; margin-top: 5px; }
        #hck-menu-panel button.clear-button { background-color: #5a3e3e; }
        #hck-menu-panel button:hover:not(:disabled), #hck-log-panel button:hover:not(:disabled) { background-color: #555555; transform: scale(1.02); }
        #hck-menu-panel button.clear-button:hover:not(:disabled) { background-color: #7a5e5e; }
        #hck-menu-panel button:active:not(:disabled), #hck-log-panel button:active:not(:disabled) { transform: scale(0.98); }
        #hck-menu-panel button:disabled { background-color: #222222; color: #777777; cursor: not-allowed; transform: none; opacity: 0.6; }
        #hck-status-line { margin-top: 8px; padding: 9px 12px; border-top: 1px solid #444444; font-size: 13px; color: #ffffff; min-height: 20px; text-align: center; background-color: transparent; border-radius: 0; word-wrap: break-word; }
        #hck-status-line.error { color: #ff9a9a; font-weight: 500; }
        #hck-status-line.success { color: #a6f0c6; font-weight: 500; }
        #hck-toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10001; display: flex; flex-direction: column; align-items: center; gap: 10px; width: 90%; max-width: 400px;}
        .hck-toast { background-color: rgba(25, 25, 25, 0.9); color: #ffffff; padding: 12px 22px; border-radius: 8px; font-family: var(--hck-font-stack); font-size: 14px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); opacity: 0; transform: translateY(-30px) scale(0.95); transition: opacity 0.4s var(--hck-ease-out), transform 0.4s var(--hck-ease-out); text-align: center; width: fit-content; max-width: 100%; backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.1); }
        .hck-toast.show { opacity: 1; transform: translateY(0) scale(1); }
        .hck-toast.error { background-color: rgba(192, 57, 43, 0.9); color: #fff; border-color: rgba(255,255,255,0.2); }
        .hck-toast.success { background-color: rgba(39, 174, 96, 0.9); color: #fff; border-color: rgba(255,255,255,0.2); }
        #hck-log-panel .hck-title-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #444; }
        #hck-log-panel h3 { margin: 0; font-size: 17px; font-weight: 600; color: #e0e0e0; }
        #hck-log-content { overflow-y: auto; max-height: calc(70vh - 120px); background-color: #111; padding: 12px; border-radius: 8px; font-size: 11px; line-height: 1.45; color: #c5c5c5; white-space: pre-wrap; word-break: break-word; border: 1px solid #333; }
        .hck-log-entry { margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed #444; }
        .hck-log-entry time { color: #999; margin-right: 8px; font-weight: bold; }
        .hck-log-entry code { font-family: 'Menlo', 'Consolas', monospace; }
        .hck-log-entry.error { color: #ff8a80; font-weight: 500; }
        .hck-log-entry.success { color: #b9f6ca; }
        .hck-log-entry.api { color: #82b1ff; }
        .hck-log-entry.debug { color: #9e9e9e; }
        #hck-log-panel .log-controls { display: flex; gap: 10px; margin-top: 12px; }
        #hck-log-panel .log-controls button { width: auto; padding: 8px 15px; background-color: #444; }
        #hck-log-panel .log-controls button.clear { background-color: #a04040; }
    `;

    function addBookmarkletStyles() { try { const s = document.createElement("style"); s.type = "text/css"; s.innerText = styles; document.head.appendChild(s); } catch (e) { console.error(`${SCRIPT_NAME} StyleErr:`, e); } }
    function createToastContainer() { if (!document.getElementById('hck-toast-container')) { toastContainer = document.createElement('div'); toastContainer.id = 'hck-toast-container'; document.body.appendChild(toastContainer); } else { toastContainer = document.getElementById('hck-toast-container'); } }

    function showToast(message, type = 'info', duration = TOAST_DURATION) {
        if (!toastContainer) createToastContainer(); const t = document.createElement('div'); t.className = 'hck-toast'; t.textContent = message;
        if (type === 'error') t.classList.add('error'); else if (type === 'success') t.classList.add('success');
        toastContainer.appendChild(t); requestAnimationFrame(() => { requestAnimationFrame(() => { t.classList.add('show'); }); });
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => { if (t.parentNode === toastContainer) toastContainer.removeChild(t); }, 450); }, duration);
    }

    function logToMemory(message, type = 'info') { const ts = new Date(); const e = { timestamp:ts, type, message }; logArray.push(e); if (logPanelVisible && logContentDiv) renderSingleLogEntry(e); }
    function updateStatus(message, type = 'info', showToastFlag = false) { if (statusLine) { statusLine.textContent = message; statusLine.className = 'hck-status-line'; if (type === 'error') statusLine.classList.add('error'); else if (type === 'success') statusLine.classList.add('success'); } const lt = (type === 'info' || type === 'debug') ? type : (type === 'error' ? 'error' : 'success'); logToMemory(message, lt); if (showToastFlag) showToast(message, type); }
    function formatTime(d) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    function renderSingleLogEntry(e) { const d = document.createElement('div'); d.className = `hck-log-entry ${e.type}`; const t = document.createElement('time'); t.textContent = `[${formatTime(e.timestamp)}]`; const c = document.createElement('code'); c.textContent = e.message; d.appendChild(t); d.appendChild(c); logContentDiv.appendChild(d); logContentDiv.scrollTop = logContentDiv.scrollHeight; }
    function renderLogs() { if (!logContentDiv) return; logContentDiv.innerHTML = ''; logArray.forEach(renderSingleLogEntry); }
    function clearLogs() { logArray = []; renderLogs(); logToMemory("Logs limpos.", "info"); showToast("Logs limpos"); }

    function createLogPanel() {
        if (document.getElementById('hck-log-panel')) return; logPanel = document.createElement('div'); logPanel.id = 'hck-log-panel'; const tb = document.createElement('div'); tb.className = 'hck-title-bar'; const ti = document.createElement('h3'); ti.textContent = 'Logs Detalhados'; tb.appendChild(ti); logPanel.appendChild(tb);
        logContentDiv = document.createElement('div'); logContentDiv.id = 'hck-log-content'; logPanel.appendChild(logContentDiv); const cd = document.createElement('div'); cd.className = 'log-controls'; const cb = document.createElement('button'); cb.textContent = 'Limpar'; cb.className = 'clear'; cb.onclick = clearLogs; const clb = document.createElement('button'); clb.textContent = 'Fechar'; clb.onclick = toggleLogPanel; cd.appendChild(cb); cd.appendChild(clb); logPanel.appendChild(cd); document.body.appendChild(logPanel); renderLogs();
    }

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
        while (att <= MAX_RETRIES) { att++; logToMemory(`API Att ${att}/${MAX_RETRIES+1} ${operationDesc}`, 'api'); try { const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, topP: 0.95, topK: 40, maxOutputTokens: 8192 } }), }); if (!r.ok) { const eb = await r.text(); logToMemory(`API Err ${r.status} (Att ${att}): ${eb.substring(0,150)}...`, 'error'); if (att > MAX_RETRIES) throw new Error(`API fail(${r.status}) M:${MODEL_NAME}`); updateStatus(`API Err (${r.status}). Tnt(${att}/${MAX_RETRIES})...`, 'error'); await delay(1600 * att); continue; } const d = await r.json(); logToMemory(`API OK Resp (Att ${att}): ${JSON.stringify(d).substring(0,100)}...`, 'debug'); const t = d?.candidates?.[0]?.content?.parts?.[0]?.text; if (!t) { logToMemory(`API Inv Resp (Att ${att})`, 'error'); if (att > MAX_RETRIES) throw new Error('API resp fmt inv.'); updateStatus(`API Err (fmt). Tnt(${att}/${MAX_RETRIES})...`, 'error'); await delay(1600 * att); continue; } logToMemory(`API ${operationDesc} OK (Att ${att}). Len:${t.length}`, 'success'); updateStatus(`${operationDesc} ok.`); return t.trim(); } catch (e) { logToMemory(`Catch API ${operationDesc} (Att ${att}): ${e}`, 'error'); if (att > MAX_RETRIES) { updateStatus(`API Err Fatal:${e.message}`, 'error', true); throw e; } updateStatus(`API Err. Tnt(${att}/${MAX_RETRIES})...`, 'error'); await delay(1600 * att); } }
        logToMemory(`API Fail final ${operationDesc}.`, 'error'); updateStatus(`Erro: Falha API ${operationDesc}.`, 'error', true); return null;
    }

    function extractPageContext() {
        logToMemory("Ctx Extract Init", 'info'); updateStatus("Extraindo contexto..."); const ctx = {}; const sel = { coletanea: COLETANEA_SELECTOR, enunciado: ENUNCIADO_SELECTOR, generoTextual: GENERO_SELECTOR, criteriosAvaliacao: CRITERIOS_SELECTOR }; let ess = true;
        for (const k in sel) { try { const el = document.querySelector(sel[k]); ctx[k] = el ? el.innerText.trim() : ''; if (!ctx[k]) { logToMemory(`Ctx ${k} vazio (Sel: ${sel[k]})`, 'debug'); } else { logToMemory(`Ctx ${k}: ${ctx[k].substring(0,50)}...`, 'debug'); } } catch (e) { logToMemory(`Ctx Err ${k}: ${e}`, 'error'); if (k === 'enunciado') ess = false; } }
        if (!ctx.enunciado) { logToMemory("Ctx Err Fatal: Enunciado NF.", 'error'); updateStatus("Erro: Enunciado não encontrado.", 'error', true); return null; }
        logToMemory("Ctx Extract OK.", 'success'); updateStatus("Contexto extraído."); return ctx;
    }

    async function clearFieldsProcess() {
        logToMemory("Limpando campos...", 'info'); updateStatus("Limpando..."); let titleOk = false, bodyOk = false, titleFound = false, bodyFound = false; let titleP = null;
        try { logToMemory("Limpando Título...", 'info'); titleP = document.querySelector(TITLE_TEXTAREA_PARENT_SELECTOR)?.parentElement; if (titleP) { titleFound = true; titleOk = await insertTextIntoTextarea(titleP, '', "Título"); } else { logToMemory("Título NF p/ limpar.", 'debug'); } await delay(200);
              logToMemory("Limpando Corpo...", 'info'); const areas = document.querySelectorAll(BODY_TEXTAREA_PARENT_SELECTOR); let bodyP = null; if (areas.length > 0) { bodyP = (areas.length > 1 && titleFound && areas[0].parentElement === titleP) ? areas[1].parentElement : areas[areas.length - 1].parentElement; } if (bodyP) { bodyFound = true; bodyOk = await insertTextIntoTextarea(bodyP, '', "Corpo"); } else { logToMemory("Corpo NF p/ limpar.", 'debug'); }
              if (!titleFound && !bodyFound) { updateStatus("Campos NF p/ limpar.", 'error', true); return; }
              if ( (titleFound && titleOk) || (bodyFound && bodyOk) ) { updateStatus("Campos limpos!", 'success', true); } else { updateStatus("Erro ao limpar campos.", 'error', true); }
        } catch (e) { logToMemory(`Erro limpeza: ${e}`, 'error'); updateStatus("Erro inesperado ao limpar.", 'error', true); }
    }

    async function mainProcess() {
        logToMemory("Proc Principal Init.", 'info'); updateStatus("Verificando página..."); const idEl = document.querySelector(PAGE_IDENTIFIER_SELECTOR); if (!idEl || !idEl.textContent.includes(PAGE_IDENTIFIER_TEXT)) { logToMemory(`Fail Verif Pag. Sel:'${PAGE_IDENTIFIER_SELECTOR}', Txt:'${PAGE_IDENTIFIER_TEXT}'`, 'error'); updateStatus(`Erro: Página não é ${PAGE_IDENTIFIER_TEXT}.`, 'error', true); return; }
        logToMemory("Verif Pag OK.", 'success'); updateStatus("Página OK."); await delay(200); const ctx = extractPageContext(); if (!ctx) return; await delay(200);
        const initialPrompt = `**PROMPT OTIMIZADO PARA REDAÇÃO DISSERTATIVA NATURAL**\n\n**Objetivo Final:**\nProduzir uma redação coesa e fluida que demonstre:\n- Domínio da estrutura dissertativa\n- Raciocínio lógico desenvolvido\n- Linguagem natural mas adequada ao gênero\n- Conhecimento médio sobre o tema (sem especialização)\n\n**Contexto da Tarefa:**\n${JSON.stringify(ctx, null, 1)}\n\n**Parâmetros Essenciais:**\n1. TÍTULO:\n- Criativo porém objetivo\n- Reflete o núcleo da tese\n- Máximo 12 palavras\n2. INTRODUÇÃO (40-60 palavras):\n- Contextualização suave do tema\n- Apresentação clara da tese\n- Transição natural para desenvolvimento\n3. DESENVOLVIMENTO (2 parágrafos de 60-80 palavras cada):\n- Argumentação progressiva\n- Encadeamento lógico entre ideias\n- Fundamentação plausível (sem dados específicos)\n- Transições orgânicas entre parágrafos\n4. CONCLUSÃO (40-60 palavras):\n- Síntese não repetitiva\n- Proposta concreta e realista\n- Encerramento impactante\n\n**Restrições de Estilo:**\n❗ Evitar:\n- Citações diretas\n- Dados estatísticos \n- Termos técnicos complexos\n- Estruturas muito rígidas\n✅ Priorizar:\n- Progressão temática natural\n- Vocabulário preciso mas acessível\n- Argumentação plausível\n- Variação sintática\n\n**Modelo de Resposta OBRIGATÓRIO (SEM NADA EXTRA):**\nTITULO: [Título contextualizado]\n\nTEXTO:\n[Introdução com contextualização e tese]\n\n[Desenvolvimento 1 com primeiro argumento]\n\n[Desenvolvimento 2 com argumento complementar] \n\n[Conclusão com síntese e proposta]\n\n**Dica:** A redação deve soar como produção de um estudante bem preparado, mas não especialista, demonstrando capacidade de organizar ideias com clareza e coerência, sem artificialismos.`;
        const rawResp = await getAiResponse(initialPrompt, "Gerando texto inicial"); if (!rawResp) return;
        logToMemory("Analisando resp inicial.", 'info'); updateStatus("Analisando resposta IA..."); let title = ''; let text = '';
        try { if (!rawResp.includes('TITULO:') || !rawResp.includes('TEXTO:')) throw new Error("Marcações TITULO/TEXTO ausentes."); title = rawResp.split('TITULO:')[1].split('TEXTO:')[0].trim(); text = rawResp.split('TEXTO:')[1].trim(); if (!title || !text) throw new Error("Extração falhou."); logToMemory(`Título: ${title}`, 'success'); logToMemory(`Texto (início): ${text.substring(0,60)}...`, 'success'); updateStatus("Resposta inicial OK."); await delay(200);
        } catch (e) { logToMemory(`Err análise resp IA: ${e.message}. Raw:${rawResp.substring(0,100)}...`, 'error'); updateStatus(`Erro análise: ${e.message}`, 'error', true); return; }
        const humanPrompt = `**Tarefa:** Reescreva o texto de redação abaixo para soar mais natural e fluida, como um bom estudante escreveria, MANTENDO o sentido original, a estrutura (parágrafos), os argumentos e a adequação ao formato de redação (evitando excesso de informalidade, principalmente na introdução).\n**Como Fazer:**\n*   **Linguagem:** Use um português claro e correto, mas natural. Varie o vocabulário sem ser pedante. Conectivos comuns (ex: 'além disso', 'no entanto', 'por isso', 'então') são bons para fluidez.\n*   **Fluidez:** Varie o tamanho e a estrutura das frases. Garanta que as ideias se conectem bem entre parágrafos.\n*   **Naturalidade:** Permita pequenas variações ou construções menos rígidas que soem humanas, mas evite gírias ou coloquialismos inadequados para uma redação.\n*   **Saída:** Retorne APENAS o texto reescrito, mantendo os parágrafos originais separados por linha em branco.\n\n**Texto Original:**\n${text}`;
        const humanText = await getAiResponse(humanPrompt, "Humanizando texto"); if (!humanText) return; await delay(200);
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
