(function() {
    'use strict';
    console.log('[HCK] Bookmarklet Start V13');

    try {
        const SCRIPT_NAME = "HCK";
        const CREDITS = "by hackermoon";
        const GEMINI_API_KEY = "AIzaSyBwEiziXQ79LP7IKq93pmLM8b3qnwXn6bQ";
        const MODEL_NAME = 'gemini-1.5-flash-latest';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
        const MAX_RETRIES = 2;
        const TOAST_DURATION = 3500;

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
            :root {
                --hck-bg-primary: rgba(28, 28, 32, 0.94);
                --hck-bg-secondary: rgba(22, 22, 25, 0.96);
                --hck-text-primary: #e0e0e0;
                --hck-text-secondary: #b0b0b0;
                --hck-accent: #6677ff;
                --hck-accent-hover: #7788ff;
                --hck-danger: #ff6677;
                --hck-danger-hover: #ff7788;
                --hck-success: #66ffaa;
                --hck-border-color: rgba(255, 255, 255, 0.1);
                --hck-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                --hck-font-stack: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                --hck-ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
                --hck-border-radius: 12px;
            }
            #hck-toggle-button {
                position: fixed; bottom: 20px; right: 20px;
                background-color: var(--hck-accent); color: #fff;
                padding: 10px 16px; border-radius: 50px; cursor: pointer;
                font-family: var(--hck-font-stack); font-size: 14px; font-weight: 600;
                box-shadow: var(--hck-shadow); z-index: 10000;
                transition: background-color 0.3s var(--hck-ease-out), transform 0.3s var(--hck-ease-out);
                user-select: none; border: none;
            }
            #hck-toggle-button:hover { background-color: var(--hck-accent-hover); transform: scale(1.05); }
            #hck-menu-panel, #hck-log-panel {
                position: fixed; right: 20px;
                border-radius: var(--hck-border-radius); box-shadow: var(--hck-shadow);
                padding: 18px; z-index: 9999;
                font-family: var(--hck-font-stack); display: none; flex-direction: column;
                border: 1px solid var(--hck-border-color);
                opacity: 0; transform: translateY(15px) scale(0.97);
                transition: opacity 0.35s var(--hck-ease-out), transform 0.35s var(--hck-ease-out);
                backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);
            }
            #hck-menu-panel {
                bottom: 85px; width: 230px;
                background-color: var(--hck-bg-primary);
                color: var(--hck-text-primary); gap: 12px;
            }
            #hck-log-panel {
                bottom: 85px; width: 320px; max-height: 70vh;
                background-color: var(--hck-bg-secondary);
                color: var(--hck-text-primary); gap: 12px;
            }
            #hck-menu-panel.visible, #hck-log-panel.visible { display: flex; opacity: 1; transform: translateY(0) scale(1); }
            #hck-menu-panel .hck-title-bar {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--hck-border-color);
            }
            #hck-menu-panel h3 { margin: 0; font-size: 17px; font-weight: 600; color: var(--hck-text-primary); }
            #hck-menu-panel .hck-credits { font-size: 10px; color: var(--hck-text-secondary); font-weight: 400; }
            #hck-menu-panel button, #hck-log-panel button {
                background-color: rgba(255, 255, 255, 0.1); color: var(--hck-text-primary);
                border: none; padding: 10px 14px; border-radius: 8px; cursor: pointer;
                font-size: 13.5px; font-weight: 500;
                transition: background-color 0.25s ease-out, transform 0.15s ease-out;
                width: 100%; margin-top: 6px;
            }
            #hck-menu-panel button:hover:not(:disabled), #hck-log-panel button:hover:not(:disabled) { background-color: rgba(255, 255, 255, 0.15); transform: translateY(-1px); }
            #hck-menu-panel button.clear-button { background-color: rgba(255, 102, 119, 0.15); color: var(--hck-danger); }
            #hck-menu-panel button.clear-button:hover:not(:disabled) { background-color: rgba(255, 102, 119, 0.25); }
            #hck-menu-panel button:active:not(:disabled), #hck-log-panel button:active:not(:disabled) { transform: scale(0.98) translateY(0); }
            #hck-menu-panel button:disabled {
                background-color: rgba(255, 255, 255, 0.05); color: var(--hck-text-secondary);
                cursor: not-allowed; transform: none; opacity: 0.7;
            }
            #hck-status-line {
                margin-top: 10px; padding: 8px 10px; border-top: 1px solid var(--hck-border-color);
                font-size: 12px; color: var(--hck-text-secondary); min-height: 18px; text-align: center;
                word-wrap: break-word;
            }
            #hck-status-line.error { color: var(--hck-danger); font-weight: 500; }
            #hck-status-line.success { color: var(--hck-success); font-weight: 500; }
            #hck-toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10001; display: flex; flex-direction: column; align-items: center; gap: 10px; width: 90%; max-width: 400px;}
            .hck-toast {
                background-color: var(--hck-bg-primary); color: var(--hck-text-primary);
                padding: 12px 22px; border-radius: 8px;
                font-family: var(--hck-font-stack); font-size: 13.5px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
                opacity: 0; transform: translateY(-30px) scale(0.95);
                transition: opacity 0.4s var(--hck-ease-out), transform 0.4s var(--hck-ease-out);
                text-align: center; width: fit-content; max-width: 100%;
                backdrop-filter: blur(10px) saturate(150%); -webkit-backdrop-filter: blur(10px) saturate(150%);
                border: 1px solid var(--hck-border-color);
            }
            .hck-toast.show { opacity: 1; transform: translateY(0) scale(1); }
            .hck-toast.error { background-color: rgba(200, 50, 70, 0.9); color: #fff; border-color: rgba(255,255,255,0.2); }
            .hck-toast.success { background-color: rgba(50, 180, 100, 0.9); color: #fff; border-color: rgba(255,255,255,0.2); }
            #hck-log-panel .hck-title-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--hck-border-color); }
            #hck-log-panel h3 { margin: 0; font-size: 16px; font-weight: 600; color: var(--hck-text-primary); }
            #hck-log-content {
                overflow-y: auto; max-height: calc(70vh - 120px); background-color: rgba(0,0,0,0.2);
                padding: 12px; border-radius: 8px; font-size: 11px; line-height: 1.5;
                color: #c5c5c5; white-space: pre-wrap; word-break: break-word;
                border: 1px solid rgba(255,255,255,0.08);
            }
            .hck-log-entry { margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dotted rgba(255,255,255,0.15); }
            .hck-log-entry:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
            .hck-log-entry time { color: #909090; margin-right: 8px; font-weight: bold; }
            .hck-log-entry code { font-family: 'Menlo', 'Consolas', monospace; }
            .hck-log-entry.error { color: #ff8899; font-weight: 500; }
            .hck-log-entry.success { color: #88ffbb; }
            .hck-log-entry.api { color: #88aaff; }
            .hck-log-entry.debug { color: #aaaaaa; }
            #hck-log-panel .log-controls { display: flex; gap: 10px; margin-top: 12px; }
            #hck-log-panel .log-controls button { width: auto; padding: 8px 14px; background-color: rgba(255,255,255,0.1); }
            #hck-log-panel .log-controls button.clear { background-color: rgba(255, 102, 119, 0.15); color: var(--hck-danger);}
        `;

        function addBookmarkletStyles() { try { const s = document.createElement("style"); s.type = "text/css"; s.innerText = styles; document.head.appendChild(s); logToMemory("Estilos V13 injetados.", "debug"); } catch (e) { console.error(`${SCRIPT_NAME} StyleErr:`, e); logToMemory(`Erro ao injetar estilos: ${e}`, "error"); } }
        function createToastContainer() { if (!document.getElementById('hck-toast-container')) { toastContainer = document.createElement('div'); toastContainer.id = 'hck-toast-container'; document.body.appendChild(toastContainer); } else { toastContainer = document.getElementById('hck-toast-container'); } }
        function showToast(message, type = 'info', duration = TOAST_DURATION) { if (!toastContainer) createToastContainer(); const t = document.createElement('div'); t.className = 'hck-toast'; t.textContent = message; if (type === 'error') t.classList.add('error'); else if (type === 'success') t.classList.add('success'); toastContainer.appendChild(t); requestAnimationFrame(() => { requestAnimationFrame(() => { t.classList.add('show'); }); }); setTimeout(() => { t.classList.remove('show'); setTimeout(() => { if (t.parentNode === toastContainer) toastContainer.removeChild(t); }, 500); }, duration); }
        function logToMemory(message, type = 'info') { const ts = new Date(); const e = { timestamp:ts, type, message }; logArray.push(e); if (type !== 'debug') console[type === 'error' ? 'error' : 'log'](`[${formatTime(ts)}] ${type.toUpperCase()}: ${message}`); if (logPanelVisible && logContentDiv) renderSingleLogEntry(e); }
        function updateStatus(message, type = 'info', showToastFlag = false) { if (statusLine) { statusLine.textContent = message; statusLine.className = 'hck-status-line'; if (type === 'error') statusLine.classList.add('error'); else if (type === 'success') statusLine.classList.add('success'); } const lt = (type === 'info' || type === 'debug') ? type : (type === 'error' ? 'error' : 'success'); logToMemory(message, lt); if (showToastFlag) showToast(message, type); }
        function formatTime(d) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
        function renderSingleLogEntry(e) { if (!logContentDiv) return; const d = document.createElement('div'); d.className = `hck-log-entry ${e.type}`; const t = document.createElement('time'); t.textContent = `[${formatTime(e.timestamp)}]`; const c = document.createElement('code'); c.textContent = e.message; d.appendChild(t); d.appendChild(c); logContentDiv.appendChild(d); logContentDiv.scrollTop = logContentDiv.scrollHeight; }
        function renderLogs() { if (!logContentDiv) return; logContentDiv.innerHTML = ''; logArray.forEach(renderSingleLogEntry); }
        function clearLogs() { logArray = []; renderLogs(); logToMemory("Logs do painel limpos.", "info"); showToast("Logs do painel limpos"); }
        function createLogPanel() { if (document.getElementById('hck-log-panel')) return; logPanel = document.createElement('div'); logPanel.id = 'hck-log-panel'; const tb = document.createElement('div'); tb.className = 'hck-title-bar'; const ti = document.createElement('h3'); ti.textContent = 'Logs Detalhados'; tb.appendChild(ti); logPanel.appendChild(tb); logContentDiv = document.createElement('div'); logContentDiv.id = 'hck-log-content'; logPanel.appendChild(logContentDiv); const cd = document.createElement('div'); cd.className = 'log-controls'; const cb = document.createElement('button'); cb.textContent = 'Limpar'; cb.className = 'clear'; cb.onclick = clearLogs; const clb = document.createElement('button'); clb.textContent = 'Fechar'; clb.onclick = toggleLogPanel; cd.appendChild(cb); cd.appendChild(clb); logPanel.appendChild(cd); document.body.appendChild(logPanel); renderLogs(); }
        function toggleLogPanel() { if (!logPanel) createLogPanel(); logPanelVisible = !logPanelVisible; if (logPanel) logPanel.classList.toggle('visible', logPanelVisible); if (logPanelVisible) { menuPanel?.classList.remove('visible'); menuVisible = false; renderLogs(); } }

        function createUI() {
            logToMemory('Iniciando criação da UI V13', 'debug'); if (!document.body) { logToMemory('document.body não pronto em createUI', 'error'); return; } if (document.getElementById('hck-toggle-button')) { logToMemory('UI já existe, ignorando.', 'debug'); return; }
            try {
                createToastContainer();
                toggleButton = document.createElement('button');
                toggleButton.id = 'hck-toggle-button';
                toggleButton.textContent = SCRIPT_NAME;
                toggleButton.onclick = toggleMenu;
                document.body.appendChild(toggleButton);

                menuPanel = document.createElement('div');
                menuPanel.id = 'hck-menu-panel';

                const titleBar = document.createElement('div');
                titleBar.className = 'hck-title-bar';
                const titleH3 = document.createElement('h3');
                titleH3.textContent = SCRIPT_NAME;
                const creditsSpan = document.createElement('span');
                creditsSpan.className = 'hck-credits';
                creditsSpan.textContent = CREDITS;
                titleBar.appendChild(titleH3);
                titleBar.appendChild(creditsSpan);
                menuPanel.appendChild(titleBar);

                runButton = document.createElement('button');
                runButton.textContent = 'Gerar Redação';
                runButton.onclick = () => { if (!isRunning && !isClearing) mainProcessWrapper(); };
                menuPanel.appendChild(runButton);

                clearButton = document.createElement('button');
                clearButton.textContent = 'Limpar Campos';
                clearButton.className = 'clear-button';
                clearButton.onclick = () => { if (!isRunning && !isClearing) clearFieldsProcessWrapper(); };
                menuPanel.appendChild(clearButton);

                const logButton = document.createElement('button');
                logButton.textContent = 'Ver Logs';
                logButton.onclick = toggleLogPanel;
                menuPanel.appendChild(logButton);

                statusLine = document.createElement('div');
                statusLine.id = 'hck-status-line';
                statusLine.textContent = 'Pronto.';
                menuPanel.appendChild(statusLine);

                document.body.appendChild(menuPanel);
                logToMemory('UI V13 criada com sucesso.', 'success');
            } catch (e) { logToMemory(`Erro crítico ao criar UI: ${e}`, 'error'); alert('[HCK] Falha ao criar a interface do bookmarklet.'); }
        }

        function toggleMenu() { menuVisible = !menuVisible; if (menuPanel) menuPanel.classList.toggle('visible', menuVisible); if (menuVisible) { logPanel?.classList.remove('visible'); logPanelVisible = false; } }
        async function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

        async function insertTextIntoTextarea(parentElement, textToInsert, fieldName) {
            const operation = textToInsert === '' ? 'limpar' : 'inserir';
            const shortText = textToInsert.substring(0,20).replace(/\n/g, ' ');
            logToMemory(`Tentando ${operation} ${fieldName} ('${shortText}...').`, 'debug');
            updateStatus(`${operation === 'limpar' ? 'Limpando' : 'Inserindo'} ${fieldName}...`);

            const textarea = parentElement.querySelector('textarea:not([aria-hidden="true"])');
            if (!textarea) {
                updateStatus(`Erro: Textarea para ${fieldName} não encontrado.`, 'error', true);
                logToMemory(`Textarea para ${fieldName} não encontrado dentro do parentElement.`, 'error');
                return false;
            }

            let success = false;
            const originalValue = textarea.value;

            try {
                logToMemory(`M1: Direto+Eventos [${fieldName}]`, 'debug');
                textarea.focus();
                textarea.value = textToInsert;
                textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                await delay(80);
                textarea.blur();
                await delay(130);
                if (textarea.value === textToInsert) success = true;
            } catch (e) { logToMemory(`Erro M1 [${fieldName}]: ${e.message}`, 'error'); textarea.value = originalValue; }

            if (success) {
                logToMemory(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} (M1).`, 'success');
                updateStatus(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} com sucesso.`);
                return true;
            }

            try {
                logToMemory(`M2: ReactProps [${fieldName}]`, 'debug');
                const reactPropsKey = Object.keys(textarea).find(key => key.startsWith('__reactProps$') || key.startsWith('__reactEventHandlers$'));
                if (reactPropsKey) {
                    const props = textarea[reactPropsKey];
                    if (props && typeof props.onChange === 'function') {
                        textarea.focus();
                        props.onChange({ target: { value: textToInsert }, currentTarget: { value: textToInsert }, preventDefault: () => {}, stopPropagation: () => {} });
                        await delay(180); textarea.blur(); await delay(80);
                        if (textarea.value === textToInsert) success = true;
                    } else { logToMemory(`M2 [${fieldName}]: onChange não é função ou props ausente.`, 'debug');}
                } else { logToMemory(`M2 [${fieldName}]: Chave ReactProps não encontrada.`, 'debug');}
            } catch (e) { logToMemory(`Erro M2 [${fieldName}]: ${e.message}`, 'error'); textarea.value = originalValue; }


            if (success) {
                logToMemory(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} (M2).`, 'success');
                updateStatus(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} com sucesso.`);
                return true;
            }

            try {
                logToMemory(`M3: InputEvent [${fieldName}]`, 'debug');
                textarea.focus(); textarea.value = ''; await delay(70);
                textarea.value = textToInsert;
                textarea.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: textToInsert, inputType: 'insertText' }));
                await delay(130); textarea.blur(); await delay(130);
                if (textarea.value === textToInsert) success = true;
            } catch (e) { logToMemory(`Erro M3 [${fieldName}]: ${e.message}`, 'error'); textarea.value = originalValue; }

            if (success) {
                logToMemory(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} (M3).`, 'success');
                updateStatus(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} com sucesso.`);
                return true;
            }

            await delay(250);
            if (textarea.value === textToInsert) {
                logToMemory(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} (Verificação Final).`, 'success');
                updateStatus(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} com sucesso.`);
                return true;
            } else {
                logToMemory(`Falha nos métodos interativos [${fieldName}]. Tentando valor direto como fallback.`, 'debug');
                textarea.value = textToInsert; await delay(100); textarea.blur();
                if (textarea.value === textToInsert) {
                    logToMemory(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} (Fallback Valor Direto).`, 'success');
                    updateStatus(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} (fallback).`);
                    return true;
                }
            }
            logToMemory(`Falha final ao ${operation} ${fieldName}.`, 'error');
            updateStatus(`Erro final ao ${operation} ${fieldName}.`, 'error', true);
            textarea.value = originalValue; return false;
        }

        async function getAiResponse(prompt, operationDesc) {
            logToMemory(`API Req: ${operationDesc}`, 'api'); updateStatus(`IA: ${operationDesc}...`); let attempts = 0;
            while (attempts <= MAX_RETRIES) {
                attempts++; logToMemory(`API Tentativa ${attempts}/${MAX_RETRIES+1} para ${operationDesc}`, 'api');
                try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.7, topP: 0.95, topK: 40, maxOutputTokens: 8192 }
                        }),
                    });
                    if (!response.ok) {
                        const errorBody = await response.text();
                        logToMemory(`API Erro ${response.status} (Tentativa ${attempts}): ${errorBody.substring(0,150)}...`, 'error');
                        if (attempts > MAX_RETRIES) throw new Error(`Falha na API (${response.status}) para ${MODEL_NAME}`);
                        updateStatus(`Erro API (${response.status}). Tentando ${attempts}/${MAX_RETRIES+1}...`, 'error');
                        await delay(1800 * attempts); continue;
                    }
                    const data = await response.json();
                    logToMemory(`API Resp OK (Tentativa ${attempts}): ${JSON.stringify(data).substring(0,100)}...`, 'debug');
                    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (!textContent) {
                        logToMemory(`API Resposta inválida (Tentativa ${attempts}): Ausência de texto.`, 'error');
                        if (attempts > MAX_RETRIES) throw new Error('Formato de resposta da API inválido.');
                        updateStatus(`Erro API (formato). Tentando ${attempts}/${MAX_RETRIES+1}...`, 'error');
                        await delay(1800 * attempts); continue;
                    }
                    logToMemory(`API ${operationDesc} SUCESSO (Tentativa ${attempts}). Len:${textContent.length}`, 'success');
                    updateStatus(`IA: ${operationDesc} concluído.`);
                    return textContent.trim();
                } catch (e) {
                    logToMemory(`Exceção na API ${operationDesc} (Tentativa ${attempts}): ${e.message}`, 'error');
                    if (attempts > MAX_RETRIES) { updateStatus(`Erro fatal na API: ${e.message}`, 'error', true); throw e; }
                    updateStatus(`Erro API. Tentando ${attempts}/${MAX_RETRIES+1}...`, 'error');
                    await delay(1800 * attempts);
                }
            }
            logToMemory(`API Falha final para ${operationDesc}.`, 'error');
            updateStatus(`Erro: Falha na API para ${operationDesc}.`, 'error', true);
            return null;
        }

        function extractPageContext() {
            logToMemory("Extraindo contexto da página...", 'info'); updateStatus("Extraindo contexto...");
            const context = {};
            const selectors = { coletanea: COLETANEA_SELECTOR, enunciado: ENUNCIADO_SELECTOR, generoTextual: GENERO_SELECTOR, criteriosAvaliacao: CRITERIOS_SELECTOR };
            let essentialDataMissing = false;
            for (const key in selectors) {
                try {
                    const element = document.querySelector(selectors[key]);
                    context[key] = element ? element.innerText.trim() : '';
                    if (!context[key]) { logToMemory(`Contexto para '${key}' vazio (Sel: ${selectors[key]})`, 'debug'); if (key === 'enunciado') essentialDataMissing = true; }
                    else { logToMemory(`Contexto '${key}': ${context[key].substring(0,70).replace(/\s+/g, ' ')}...`, 'debug'); }
                } catch (e) { logToMemory(`Erro ao extrair contexto para '${key}': ${e.message}`, 'error'); if (key === 'enunciado') essentialDataMissing = true;}
            }
            if (essentialDataMissing || !context.enunciado) { logToMemory("Erro: Enunciado não encontrado.", 'error'); updateStatus("Erro: Enunciado não extraído.", 'error', true); return null; }
            logToMemory("Contexto extraído.", 'success'); updateStatus("Contexto extraído."); return context;
        }

         async function clearFieldsProcess() {
            logToMemory("Limpando campos...", 'info'); updateStatus("Limpando campos...");
            let titleCleared = false, bodyCleared = false, titleFieldExists = false, bodyFieldExists = false, titleTextareaParent = null;
            try {
                const titleParentCandidates = document.querySelectorAll(TITLE_TEXTAREA_PARENT_SELECTOR);
                if (titleParentCandidates.length > 0) {
                    titleTextareaParent = titleParentCandidates[0].parentElement;
                    if (titleTextareaParent) { titleFieldExists = true; titleCleared = await insertTextIntoTextarea(titleTextareaParent, '', "Título");}
                } await delay(150);

                const allTextareaParents = Array.from(document.querySelectorAll(BODY_TEXTAREA_PARENT_SELECTOR)).map(el => el.parentElement);
                let bodyTextareaParentElement = null;

                if (allTextareaParents.length === 1 && (!titleTextareaParent || allTextareaParents[0] !== titleTextareaParent)) {
                    bodyTextareaParentElement = allTextareaParents[0];
                } else if (allTextareaParents.length > 1) {
                    if (titleTextareaParent && allTextareaParents.includes(titleTextareaParent)) {
                        bodyTextareaParentElement = allTextareaParents.find(p => p !== titleTextareaParent);
                        if (!bodyTextareaParentElement) bodyTextareaParentElement = allTextareaParents[allTextareaParents.length - 1]; // Fallback
                    } else {
                        bodyTextareaParentElement = allTextareaParents[allTextareaParents.length - 1]; // Assume o último
                    }
                } else if (allTextareaParents.length === 1 && titleTextareaParent && allTextareaParents[0] === titleTextareaParent){
                    // Caso especial: só há um textarea e ele já foi identificado como título. Não há corpo para limpar.
                    bodyTextareaParentElement = null; // Explicitamente nulo para não tentar limpar.
                }


                if (bodyTextareaParentElement) { bodyFieldExists = true; bodyCleared = await insertTextIntoTextarea(bodyTextareaParentElement, '', "Corpo"); }

                if (!titleFieldExists && !bodyFieldExists) { updateStatus("Campos não encontrados para limpar.", 'error', true); return; }

                if ((titleFieldExists && titleCleared) || (bodyFieldExists && bodyCleared) || (!titleFieldExists && bodyCleared) || (!bodyFieldExists && titleCleared) ) updateStatus("Campos limpos!", 'success', true);
                else {
                    let eM = "Erro ao limpar ";
                    if (titleFieldExists && !titleCleared) eM += "Título ";
                    if (bodyFieldExists && !bodyCleared) eM += (titleFieldExists && !titleCleared && bodyFieldExists ? "e " : "") + "Corpo ";
                    if (!titleFieldExists && !bodyFieldExists) eM = "Nenhum campo encontrado para limpar." // Segurança
                    updateStatus(eM.trim() + ".", 'error', true);
                }
            } catch (e) { logToMemory(`Erro limpeza: ${e.message}`, 'error'); updateStatus("Erro ao limpar.", 'error', true); }
        }

        async function mainProcess() {
            logToMemory("Processo Principal V13 Iniciado.", 'info');
            updateStatus("Verificando página...");
            const identifierElement = document.querySelector(PAGE_IDENTIFIER_SELECTOR);
            if (!identifierElement || !identifierElement.textContent.includes(PAGE_IDENTIFIER_TEXT)) {
                updateStatus(`Erro: Página não é ${PAGE_IDENTIFIER_TEXT}.`, 'error', true); return;
            }
            updateStatus("Página OK."); await delay(150);
            const pageContext = extractPageContext(); if (!pageContext) return; await delay(150);

            const promptMelhorado = `
Você é um assistente de IA programado para redigir um texto em português do Brasil.
Seu objetivo é criar uma redação que pareça ter sido escrita por um estudante com bom domínio da língua e capacidade de argumentação, mas que não é um especialista no assunto. A redação deve ser original, coerente e seguir a estrutura dissertativo-argumentativa padrão.

**Instruções Gerais Obrigatórias:**
1.  **Foco Absoluto no Tema:** A redação DEVE abordar centralmente o tema proposto no "Enunciado Principal" fornecido abaixo. Evite desvios ou informações irrelevantes.
2.  **Linguagem e Tom:**
    *   Utilize linguagem formal, clara, objetiva e em terceira pessoa. Mantenha a impessoalidade.
    *   O tom deve ser sério e reflexivo, mas a escrita deve fluir de maneira natural, como uma pessoa comum se expressaria em um texto formal. Evite um tom excessivamente robótico ou artificial.
    *   Demonstre um nível de conhecimento equilibrado sobre o tema: nem superficial demais, nem profundo como um especialista. Use o bom senso e informações de conhecimento geral que seriam acessíveis a um bom estudante.
    *   Mantenha a coesão e a coerência entre as frases e parágrafos.
    *   NÃO desrespeite os direitos humanos.
    *   NÃO mencione estas instruções, nem o fato de ser uma IA, nem o prompt em si.
3.  **Uso do Contexto Fornecido (Coletânea, Enunciado, etc.):**
    *   As informações dos campos "Coletânea", "Enunciado Principal", "Gênero Textual Solicitado" e "Critérios de Avaliação" são seu material de base.
    *   Você DEVE utilizar as ideias, dados e argumentos relevantes presentes na "Coletânea" para construir sua redação.
    *   **IMPORTANTE:** Faça isso de forma ORGÂNICA e IMPLÍCITA. NÃO diga "segundo o texto de apoio 1...", "a coletânea informa que..." ou "como visto nos materiais fornecidos". Em vez disso, incorpore as informações como se fossem parte do seu próprio repertório de conhecimento, exemplos que você lembrou ou reflexões que você desenvolveu a partir do tema. O objetivo é mostrar que você compreendeu e sabe utilizar o material de apoio, sem fazer referência explícita a ele.
4.  **Estrutura da Redação (Título + 4 Parágrafos):**
    *   **Título:** Crie um título curto, criativo e pertinente ao tema central.
    *   **1º Parágrafo (Introdução):**
        *   Apresente o tema de forma clara e objetiva.
        *   Contextualize brevemente a problemática envolvida.
        *   Declare sua tese (seu ponto de vista ou a ideia principal que será defendida).
    *   **2º Parágrafo (Desenvolvimento 1):**
        *   Apresente o primeiro argumento principal que sustenta sua tese.
        *   Desenvolva-o com explicações, exemplos ou dados pertinentes (lembre-se de integrá-los naturalmente, como se fossem de seu conhecimento).
    *   **3º Parágrafo (Desenvolvimento 2):**
        *   Apresente um segundo argumento principal (diferente do primeiro) que também sustenta sua tese.
        *   Desenvolva-o da mesma forma que o anterior, com embasamento.
    *   **4º Parágrafo (Conclusão):**
        *   Retome brevemente a tese (sem repetir as mesmas palavras da introdução).
        *   Elabore uma proposta de intervenção social concisa, clara e detalhada para o problema discutido, que seja coerente com os argumentos apresentados. A proposta deve ser factível e especificar:
            *   **Agente:** Quem realizará a ação? (Ex: Governo Federal, ONGs, Mídia, Escolas, Sociedade Civil etc.)
            *   **Ação:** O que será feito? (Verbos no infinitivo são uma boa pedida)
            *   **Meio/Modo:** Como a ação será realizada? Quais os instrumentos ou estratégias?
            *   **Finalidade:** Qual o objetivo principal ou o impacto positivo esperado dessa ação para resolver ou mitigar o problema?
            *   **(Opcional, mas bom) Detalhamento:** Uma breve explicação adicional sobre a ação, o meio ou a finalidade, para enriquecer a proposta.

**Contexto da Tarefa (Use estas informações para construir a redação):**
---
Coletânea: ${pageContext.coletanea || "Não fornecida. Baseie-se no enunciado e no conhecimento geral."}
Enunciado Principal: ${pageContext.enunciado}
Gênero Textual Solicitado: ${pageContext.generoTextual || "Dissertativo-argumentativo"}
Critérios de Avaliação (se disponíveis): ${pageContext.criteriosAvaliacao || "Foco nos critérios comuns de uma redação dissertativo-argumentativa bem estruturada e argumentada."}
---

**Formato da Resposta (Siga ESTRITAMENTE):**
TITULO: [Seu título aqui]

TEXTO:
[Parágrafo de Introdução]

[Parágrafo de Desenvolvimento 1]

[Parágrafo de Desenvolvimento 2]

[Parágrafo de Conclusão com Proposta de Intervenção]
`;
            const rawApiResponse = await getAiResponse(promptMelhorado, "Gerando texto (V13 Melhorado)");
            if (!rawApiResponse) return;

            logToMemory("Analisando resposta IA (V13 Melhorado)...", 'info'); updateStatus("IA: Analisando...");
            let extractedTitle = "";
            let extractedText = "";

            try {
                const rawContent = rawApiResponse;
                let textMarker = rawContent.match(/TEXTO\s*:\s*/i);
                let titleMarker = rawContent.match(/TITULO\s*:\s*([\s\S]*?)(?=\n\nTEXTO:|\nTEXTO:|$)/i);

                if (titleMarker && titleMarker[1]) {
                    extractedTitle = titleMarker[1].trim();
                    if (textMarker) {
                        extractedText = rawContent.substring(textMarker.index + textMarker[0].length).trim();
                    } else {
                        const potentialTextStart = rawContent.indexOf(extractedTitle) + extractedTitle.length;
                        extractedText = rawContent.substring(potentialTextStart).trim();
                        while (extractedText.startsWith('\n')) {
                            extractedText = extractedText.substring(1).trim();
                        }
                    }
                } else if (textMarker) {
                    extractedText = rawContent.substring(textMarker.index + textMarker[0].length).trim();
                    let potentialTitleArea = rawContent.substring(0, textMarker.index).trim();
                    if (potentialTitleArea && !potentialTitleArea.toLowerCase().includes("texto:")) {
                        const linesBeforeText = potentialTitleArea.split('\n');
                        if (linesBeforeText.length > 0) {
                           extractedTitle = linesBeforeText.pop().trim();
                           if (extractedTitle.toUpperCase() === "TITULO:" && linesBeforeText.length > 0) {
                               extractedTitle = linesBeforeText.pop().trim();
                           } else if (extractedTitle.toUpperCase() === "TITULO:") {
                               extractedTitle = "";
                           }
                        }
                    }
                } else {
                    logToMemory("Marcadores TITULO:/TEXTO: não encontrados. Usando fallback de parsing por linhas.", 'debug');
                    let lines = rawContent.split('\n');
                    let currentLineIndex = 0;

                    if (lines.length > currentLineIndex && lines[currentLineIndex].toUpperCase().startsWith("TITULO:")) {
                        extractedTitle = lines[currentLineIndex].substring("TITULO:".length).trim();
                        currentLineIndex++;
                        if (lines.length > currentLineIndex && lines[currentLineIndex].trim() === "") currentLineIndex++;
                    }

                    if (lines.length > currentLineIndex && lines[currentLineIndex].toUpperCase().startsWith("TEXTO:")) {
                        currentLineIndex++;
                        if (lines.length > currentLineIndex && lines[currentLineIndex].trim() === "") currentLineIndex++;
                    }
                    
                    if (lines.length > currentLineIndex) extractedText = lines.slice(currentLineIndex).join('\n').trim();

                    if (!extractedText && extractedTitle && (extractedTitle.includes('\n') || extractedTitle.length > 100)) {
                        extractedText = extractedTitle;
                        extractedTitle = "";
                    } else if (!extractedTitle && extractedText) {
                        const textLines = extractedText.split('\n');
                        const firstLine = textLines[0].trim();
                        if (textLines.length > 1 && firstLine.length < 80 && firstLine.split(' ').length < 12 && !firstLine.endsWith(":") && !firstLine.toUpperCase().startsWith("TEXTO")) {
                            extractedTitle = firstLine;
                            extractedText = textLines.slice(1).join('\n').trim();
                        }
                    }
                    
                    if (!extractedText && !extractedTitle && rawContent.trim().length < 100 && !rawContent.includes('\n')) {
                        extractedTitle = rawContent.trim();
                    } else if (!extractedText && !extractedTitle) {
                        extractedText = rawContent.trim();
                    }
                }

                if (extractedTitle.toUpperCase().startsWith("TITULO:")) extractedTitle = extractedTitle.substring("TITULO:".length).trim();
                if (extractedText.toUpperCase().startsWith("TEXTO:")) extractedText = extractedText.substring("TEXTO:".length).trim();
                
                if (extractedTitle.length > 100 && extractedTitle.includes('\n') && !extractedText) {
                    extractedText = extractedTitle;
                    extractedTitle = "";
                }
                if (!extractedTitle && extractedText.toUpperCase().startsWith("TITULO:")) {
                    let linesOfText = extractedText.split('\n');
                    extractedTitle = linesOfText[0].substring("TITULO:".length).trim();
                    extractedText = linesOfText.slice(1).join('\n').trim();
                    if (extractedText.trim().startsWith("\n")) extractedText = extractedText.trim();
                }

                if (!extractedText && !extractedTitle && rawContent.trim()) extractedText = rawContent.trim();

                if (!extractedText && !extractedTitle) {
                    throw new Error("Falha crítica: Título e Texto não puderam ser extraídos. Resposta bruta: " + rawApiResponse.substring(0, 250));
                }

                if (extractedTitle) logToMemory(`Título extraído: ${extractedTitle}`, 'success');
                else logToMemory(`Título não extraído ou não fornecido pela IA.`, 'debug');

                if (extractedText) logToMemory(`Texto extraído (início): ${extractedText.substring(0,100).replace(/\s+/g, ' ')}... (Tamanho: ${extractedText.length})`, 'success');
                else logToMemory(`Corpo do texto não extraído.`, 'error');

                if (!extractedText) {
                    updateStatus("Erro crítico: Corpo do texto não pôde ser extraído da resposta da IA.", 'error', true);
                    return;
                }
                updateStatus("IA: Resposta analisada com sucesso."); await delay(150);

            } catch (e) {
                logToMemory(`Erro na análise da resposta da IA: ${e.message}. Resposta bruta (início): ${rawApiResponse.substring(0,250)}...`, 'error');
                updateStatus(`Erro ao analisar resposta da IA: ${e.message}`, 'error', true);
                return;
            }

            logToMemory("Inserindo Título...", 'info'); updateStatus("Inserindo Título...");
            const titleTextareaParentCandidates = document.querySelectorAll(TITLE_TEXTAREA_PARENT_SELECTOR);
            let titleTextareaParent = null;
            if (titleTextareaParentCandidates.length > 0) titleTextareaParent = titleTextareaParentCandidates[0].parentElement;

            if (extractedTitle && titleTextareaParent) {
                const titleInserted = await insertTextIntoTextarea(titleTextareaParent, extractedTitle, "Título");
                if (!titleInserted) return;
                await delay(400);
            } else if (extractedTitle && !titleTextareaParent) {
                 updateStatus("Aviso: Título gerado, mas campo de título não encontrado.", 'error', false); // Não é 'true' para não parar tudo.
                 logToMemory("Campo de Título não encontrado, mas título foi gerado pela IA.", "debug");
            } else if (!extractedTitle) {
                logToMemory("Nenhum título foi gerado/extraído pela IA.", "debug");
                updateStatus("IA: Título não gerado/extraído.");
                await delay(150);
            }

            logToMemory("Inserindo Corpo do Texto...", 'info'); updateStatus("Inserindo Corpo do Texto...");
            const allTextareaParents = Array.from(document.querySelectorAll(BODY_TEXTAREA_PARENT_SELECTOR)).map(el => el.parentElement);
            let bodyTextareaParentElement = null;

            if (allTextareaParents.length === 1) {
                // Se só há um textarea, é o corpo, a menos que já tenha sido usado para o título
                if (!titleTextareaParent || (titleTextareaParent && allTextareaParents[0] !== titleTextareaParent)) {
                    bodyTextareaParentElement = allTextareaParents[0];
                } else if (titleTextareaParent && allTextareaParents[0] === titleTextareaParent) {
                    logToMemory("Apenas um textarea encontrado e já usado para título. Nenhum campo de corpo disponível.", "debug");
                }
            } else if (allTextareaParents.length > 1) {
                if (titleTextareaParent && allTextareaParents.includes(titleTextareaParent)) {
                    bodyTextareaParentElement = allTextareaParents.find(p => p !== titleTextareaParent);
                    if (!bodyTextareaParentElement) bodyTextareaParentElement = allTextareaParents[allTextareaParents.length - 1]; // Fallback
                } else {
                    bodyTextareaParentElement = allTextareaParents[allTextareaParents.length - 1]; // Assume o último
                }
            }

            if (!bodyTextareaParentElement) {
                updateStatus("Erro crítico: Campo para o corpo do texto não encontrado.", "error", true);
                return;
            }

            const bodyInserted = await insertTextIntoTextarea(bodyTextareaParentElement, extractedText, "Corpo do Texto");
            if (!bodyInserted) return;

            logToMemory("Processo de geração e inserção concluído!", 'success');
            updateStatus("Redação inserida com sucesso!", 'success', true);
        }

         async function clearFieldsProcessWrapper() {
            if (isRunning || isClearing) return; isClearing = true; if (runButton) runButton.disabled = true; if (clearButton) clearButton.disabled = true;
            logToMemory("==== Limpeza Iniciada ====", 'info'); updateStatus("Limpando...", 'info');
            try { await clearFieldsProcess(); }
            catch (e) { logToMemory(`Erro Wrapper Limpeza: ${e.message}`, 'error'); updateStatus(`Erro ao limpar: ${e.message}`, 'error', true); }
            finally { isClearing = false; if (runButton) runButton.disabled = false; if (clearButton) clearButton.disabled = false; updateStatus("Pronto.", "info"); logToMemory("==== Limpeza Finalizada ====", 'info'); }
        }
         async function mainProcessWrapper() {
            if (isRunning || isClearing) return; isRunning = true; if (runButton) runButton.disabled = true; if (clearButton) clearButton.disabled = true;
            logToMemory("==== Gerar Iniciado ====", 'info'); updateStatus("Iniciando...", 'info');
            try { await mainProcess(); }
            catch (e) { logToMemory(`Erro Wrapper Gerar: ${e.message}`, 'error'); updateStatus(`Erro: ${e.message}`, 'error', true); }
            finally { isRunning = false; if (runButton) runButton.disabled = false; if (clearButton) clearButton.disabled = false; updateStatus("Pronto.", "info"); logToMemory("==== Gerar Finalizado ====", 'info'); }
        }

        function initialize() {
            logToMemory("Init HCK V13", 'info'); addBookmarkletStyles(); createUI();
            if (document.getElementById('hck-toggle-button')) { updateStatus("Pronto."); showToast(`${SCRIPT_NAME} V13 carregado!`, 'success', 2500); }
            else { logToMemory("UI NF. Retrying.", "error"); setTimeout(createUI, 600); }
        }

        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initialize); }
        else { setTimeout(initialize, 300); }

    } catch (globalError) {
        console.error('[HCK] SCRIPT EXECUTION ERROR:', globalError);
        if (typeof logToMemory === 'function') logToMemory(`Erro crítico: ${globalError.message}`, 'error');
        alert(`[HCK] Erro: ${globalError.message}. Verifique o console (F12).`);
    }
})();
