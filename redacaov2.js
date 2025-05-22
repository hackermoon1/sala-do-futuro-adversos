(function() {
    'use strict';
    console.log('[HCK] Bookmarklet Start V8');

    try {
        const SCRIPT_NAME = "HCK";
        const CREDITS = "by hackermoon";
        const GEMINI_API_KEY = "AIzaSyBwEiziXQ79LP7IKq93pmLM8b3qnwXn6bQ"; // Mantenha sua chave aqui
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
            :root { --hck-font-stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; --hck-ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94); }
            #hck-toggle-button { position: fixed; bottom: 18px; right: 18px; background-color: #1a1a1a; color: #f0f0f0; padding: 9px 14px; border-radius: 40px; cursor: pointer; font-family: var(--hck-font-stack); font-size: 13.5px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35); z-index: 10000; transition: background-color 0.25s var(--hck-ease-out), transform 0.25s var(--hck-ease-out); user-select: none; }
            #hck-toggle-button:hover { background-color: #303030; transform: scale(1.03); }
            #hck-menu-panel, #hck-log-panel { position: fixed; right: 18px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.28); padding: 18px; z-index: 9999; font-family: var(--hck-font-stack); display: none; flex-direction: column; border: 1px solid rgba(255, 255, 255, 0.08); opacity: 0; transform: translateY(15px) scale(0.97); transition: opacity 0.35s var(--hck-ease-out), transform 0.35s var(--hck-ease-out); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
            #hck-menu-panel { bottom: 70px; width: 220px; background-color: rgba(28, 28, 28, 0.92); color: #e8e8e8; gap: 10px; }
            #hck-log-panel { bottom: 70px; width: 300px; max-height: 65vh; background-color: rgba(22, 22, 22, 0.94); color: #d8d8d8; gap: 12px; }
            #hck-menu-panel.visible, #hck-log-panel.visible { display: flex; opacity: 1; transform: translateY(0) scale(1); }
            #hck-menu-panel .hck-title-bar { display: flex; flex-direction: column; align-items: center; margin-bottom: 8px; }
            #hck-menu-panel h3 { margin: 0; font-size: 18px; font-weight: 700; color: #f0f0f0; }
            #hck-menu-panel .hck-credits { font-size: 9.5px; color: #a0a0a0; font-weight: 400; margin-top: 2px; }
            #hck-menu-panel button, #hck-log-panel button { background-color: #3a3a3a; color: #f0f0f0; border: none; padding: 10px 12px; border-radius: 9px; cursor: pointer; font-size: 13.5px; font-weight: 500; transition: background-color 0.2s ease-out, transform 0.1s ease-out; width: 100%; margin-top: 5px; }
            #hck-menu-panel button.clear-button { background-color: #523838; }
            #hck-menu-panel button:hover:not(:disabled), #hck-log-panel button:hover:not(:disabled) { background-color: #505050; }
            #hck-menu-panel button.clear-button:hover:not(:disabled) { background-color: #6e4d4d; }
            #hck-menu-panel button:active:not(:disabled), #hck-log-panel button:active:not(:disabled) { transform: scale(0.98); }
            #hck-menu-panel button:disabled { background-color: #2a2a2a; color: #666666; cursor: not-allowed; transform: none; opacity: 0.6; }
            #hck-status-line { margin-top: 8px; padding: 8px 10px; border-top: 1px solid #484848; font-size: 12.5px; color: #dadada; min-height: 18px; text-align: center; background-color: transparent; border-radius: 0; word-wrap: break-word; }
            #hck-status-line.error { color: #ff9c9c; font-weight: 500; }
            #hck-status-line.success { color: #a8e6cf; font-weight: 500; }
            #hck-toast-container { position: fixed; top: 18px; left: 50%; transform: translateX(-50%); z-index: 10001; display: flex; flex-direction: column; align-items: center; gap: 10px; width: 90%; max-width: 400px;}
            .hck-toast { background-color: rgba(28, 28, 28, 0.94); color: #f0f0f0; padding: 12px 20px; border-radius: 9px; font-family: var(--hck-font-stack); font-size: 13.5px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); opacity: 0; transform: translateY(-30px) scale(0.95); transition: opacity 0.4s var(--hck-ease-out), transform 0.4s var(--hck-ease-out); text-align: center; width: fit-content; max-width: 100%; backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.12); }
            .hck-toast.show { opacity: 1; transform: translateY(0) scale(1); }
            .hck-toast.error { background-color: rgba(192, 57, 43, 0.94); color: #fff; border-color: rgba(255,255,255,0.2); }
            .hck-toast.success { background-color: rgba(39, 174, 96, 0.94); color: #fff; border-color: rgba(255,255,255,0.2); }
            #hck-log-panel .hck-title-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #484848; }
            #hck-log-panel h3 { margin: 0; font-size: 16px; font-weight: 600; color: #d8d8d8; }
            #hck-log-content { overflow-y: auto; max-height: calc(65vh - 115px); background-color: #161616; padding: 12px; border-radius: 7px; font-size: 10.5px; line-height: 1.45; color: #c0c0c0; white-space: pre-wrap; word-break: break-word; border: 1px solid #3a3a3a; }
            .hck-log-entry { margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dotted #484848; }
            .hck-log-entry:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
            .hck-log-entry time { color: #999999; margin-right: 8px; font-weight: bold; }
            .hck-log-entry code { font-family: 'Menlo', 'Consolas', monospace; }
            .hck-log-entry.error { color: #ff8c8c; font-weight: 500; }
            .hck-log-entry.success { color: #b0e8c8; }
            .hck-log-entry.api { color: #88c0f0; }
            .hck-log-entry.debug { color: #b0b0b0; }
            #hck-log-panel .log-controls { display: flex; gap: 10px; margin-top: 12px; }
            #hck-log-panel .log-controls button { width: auto; padding: 8px 14px; background-color: #484848; }
            #hck-log-panel .log-controls button.clear { background-color: #903838; }
        `;

        function addBookmarkletStyles() { try { const s = document.createElement("style"); s.type = "text/css"; s.innerText = styles; document.head.appendChild(s); logToMemory("Estilos injetados.", "debug"); } catch (e) { console.error(`${SCRIPT_NAME} StyleErr:`, e); logToMemory(`Erro ao injetar estilos: ${e}`, "error"); } }
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
            logToMemory('Iniciando criação da UI', 'debug'); if (!document.body) { logToMemory('document.body não pronto em createUI', 'error'); return; } if (document.getElementById('hck-toggle-button')) { logToMemory('UI já existe, ignorando.', 'debug'); return; }
            try {
                createToastContainer(); toggleButton = document.createElement('div'); toggleButton.id = 'hck-toggle-button'; toggleButton.textContent = SCRIPT_NAME; toggleButton.onclick = toggleMenu; document.body.appendChild(toggleButton); menuPanel = document.createElement('div'); menuPanel.id = 'hck-menu-panel'; const tb = document.createElement('div'); tb.className = 'hck-title-bar'; const ti = document.createElement('h3'); ti.textContent = SCRIPT_NAME; const cs = document.createElement('span'); cs.className = 'hck-credits'; cs.textContent = CREDITS; tb.appendChild(ti); tb.appendChild(cs); menuPanel.appendChild(tb); runButton = document.createElement('button'); runButton.textContent = 'Gerar Redação'; runButton.onclick = () => { if (!isRunning && !isClearing) mainProcessWrapper(); }; menuPanel.appendChild(runButton); clearButton = document.createElement('button'); clearButton.textContent = 'Limpar Campos'; clearButton.className = 'clear-button'; clearButton.onclick = () => { if (!isRunning && !isClearing) clearFieldsProcessWrapper(); }; menuPanel.appendChild(clearButton); const logButton = document.createElement('button'); logButton.textContent = 'Ver Logs'; logButton.onclick = toggleLogPanel; menuPanel.appendChild(logButton); statusLine = document.createElement('div'); statusLine.id = 'hck-status-line'; statusLine.textContent = 'Pronto.'; menuPanel.appendChild(statusLine); document.body.appendChild(menuPanel); logToMemory('UI criada com sucesso.', 'success');
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
            } catch (e) {
                logToMemory(`Erro M1 [${fieldName}]: ${e.message}`, 'error');
                textarea.value = originalValue;
            }

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
                        await delay(180);
                        textarea.blur();
                        await delay(80);
                        if (textarea.value === textToInsert) success = true;
                    } else {
                         logToMemory(`M2 [${fieldName}]: onChange não é função ou props ausente.`, 'debug');
                    }
                } else {
                    logToMemory(`M2 [${fieldName}]: Chave ReactProps não encontrada.`, 'debug');
                }
            } catch (e) {
                logToMemory(`Erro M2 [${fieldName}]: ${e.message}`, 'error');
                textarea.value = originalValue;
            }

            if (success) {
                logToMemory(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} (M2).`, 'success');
                updateStatus(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} com sucesso.`);
                return true;
            }
            
            try {
                logToMemory(`M3: InputEvent [${fieldName}]`, 'debug');
                textarea.focus();
                textarea.value = '';
                await delay(70);
                textarea.value = textToInsert;
                textarea.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: textToInsert, inputType: 'insertText' }));
                await delay(130);
                textarea.blur();
                await delay(130);
                if (textarea.value === textToInsert) success = true;
            } catch (e) {
                logToMemory(`Erro M3 [${fieldName}]: ${e.message}`, 'error');
                textarea.value = originalValue;
            }

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
                textarea.value = textToInsert;
                await delay(100);
                textarea.blur();
                if (textarea.value === textToInsert) {
                    logToMemory(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} (Fallback Valor Direto).`, 'success');
                    updateStatus(`${fieldName} ${operation === 'limpar' ? 'limpo' : 'inserido'} (fallback).`);
                    return true;
                }
            }
            
            logToMemory(`Falha final ao ${operation} ${fieldName}. Valor atual: '${textarea.value.substring(0,20)}...' vs esperado: '${textToInsert.substring(0,20)}...'`, 'error');
            updateStatus(`Erro final ao ${operation} ${fieldName}. Verifique o console.`, 'error', true);
            textarea.value = originalValue;
            return false;
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
            const selectors = {
                coletanea: COLETANEA_SELECTOR,
                enunciado: ENUNCIADO_SELECTOR,
                generoTextual: GENERO_SELECTOR,
                criteriosAvaliacao: CRITERIOS_SELECTOR
            };
            let essentialDataMissing = false;

            for (const key in selectors) {
                try {
                    const element = document.querySelector(selectors[key]);
                    context[key] = element ? element.innerText.trim() : '';
                    if (!context[key]) {
                        logToMemory(`Contexto para '${key}' vazio ou não encontrado (Seletor: ${selectors[key]})`, 'debug');
                        if (key === 'enunciado') essentialDataMissing = true;
                    } else {
                        logToMemory(`Contexto '${key}': ${context[key].substring(0,70).replace(/\s+/g, ' ')}...`, 'debug');
                    }
                } catch (e) {
                    logToMemory(`Erro ao extrair contexto para '${key}': ${e.message}`, 'error');
                    if (key === 'enunciado') essentialDataMissing = true;
                }
            }

            if (essentialDataMissing || !context.enunciado) {
                logToMemory("Erro fatal na extração: Enunciado não encontrado ou vazio.", 'error');
                updateStatus("Erro: Enunciado não pôde ser extraído.", 'error', true);
                return null;
            }
            logToMemory("Extração de contexto concluída.", 'success');
            updateStatus("Contexto extraído com sucesso.");
            return context;
        }

         async function clearFieldsProcess() {
            logToMemory("Iniciando limpeza de campos...", 'info'); updateStatus("Limpando campos...");
            let titleCleared = false, bodyCleared = false;
            let titleFieldExists = false, bodyFieldExists = false;
            let titleTextareaParent = null;

            try {
                const titleParentCandidates = document.querySelectorAll(TITLE_TEXTAREA_PARENT_SELECTOR);
                if (titleParentCandidates.length > 0) {
                    titleTextareaParent = titleParentCandidates[0].parentElement;
                    if (titleTextareaParent) {
                        titleFieldExists = true;
                        logToMemory("Tentando limpar campo Título...", 'info');
                        titleCleared = await insertTextIntoTextarea(titleTextareaParent, '', "Título");
                    } else {
                         logToMemory("Elemento pai do Título não encontrado via seletor.", 'debug');
                    }
                } else {
                    logToMemory("Nenhum textarea para Título encontrado.", 'debug');
                }
                await delay(150);

                const bodyTextareaParents = Array.from(document.querySelectorAll(BODY_TEXTAREA_PARENT_SELECTOR)).map(el => el.parentElement);
                let bodyTextareaParentElement = null;

                if (bodyTextareaParents.length > 0) {
                    if (bodyTextareaParents.length > 1 && titleTextareaParent && bodyTextareaParents[0] === titleTextareaParent) {
                        bodyTextareaParentElement = bodyTextareaParents[1];
                    } else if (bodyTextareaParents.length > 0) {
                        bodyTextareaParentElement = bodyTextareaParents[bodyTextareaParents.length - 1];
                    }
                }

                if (bodyTextareaParentElement) {
                    bodyFieldExists = true;
                    logToMemory("Tentando limpar campo Corpo...", 'info');
                    bodyCleared = await insertTextIntoTextarea(bodyTextareaParentElement, '', "Corpo");
                } else {
                    logToMemory("Nenhum textarea para Corpo encontrado ou seu pai não foi localizado.", 'debug');
                }

                if (!titleFieldExists && !bodyFieldExists) {
                    updateStatus("Nenhum campo (Título/Corpo) encontrado para limpar.", 'error', true);
                    return;
                }

                if ((titleFieldExists && titleCleared) || (bodyFieldExists && bodyCleared) || (!titleFieldExists && bodyCleared) || (!bodyFieldExists && titleCleared) ) {
                    updateStatus("Campos limpos com sucesso!", 'success', true);
                } else {
                    let errorMsg = "Erro ao limpar ";
                    if (titleFieldExists && !titleCleared) errorMsg += "Título ";
                    if (bodyFieldExists && !bodyCleared) errorMsg += (titleFieldExists && !titleCleared ? "e " : "") + "Corpo ";
                    errorMsg += ".";
                    updateStatus(errorMsg, 'error', true);
                }

            } catch (e) {
                logToMemory(`Erro inesperado durante a limpeza: ${e.message}`, 'error');
                updateStatus("Erro inesperado ao limpar campos.", 'error', true);
            }
        }

        async function mainProcess() {
            logToMemory("Processo Principal Iniciado.", 'info');
            updateStatus("Verificando página de redação...");
            const identifierElement = document.querySelector(PAGE_IDENTIFIER_SELECTOR);
            if (!identifierElement || !identifierElement.textContent.includes(PAGE_IDENTIFIER_TEXT)) {
                logToMemory(`Verificação de página falhou. Seletor:'${PAGE_IDENTIFIER_SELECTOR}', Texto esperado:'${PAGE_IDENTIFIER_TEXT}'`, 'error');
                updateStatus(`Erro: Esta não parece ser a página de ${PAGE_IDENTIFIER_TEXT}.`, 'error', true);
                return;
            }
            logToMemory("Verificação de página OK.", 'success');
            updateStatus("Página de redação identificada.");
            await delay(150);

            const pageContext = extractPageContext();
            if (!pageContext) return;
            await delay(150);

            const initialPrompt = `**PROMPT OTIMIZADO V8 (FOCO TOTAL EM AUTENTICIDADE ESTUDANTIL E LINGUAGEM NATURAL)**

**Objetivo Primário:** Gerar um texto dissertativo-argumentativo que soe **extremamente natural e autêntico, como se escrito por um estudante de ensino médio/pré-vestibular dedicado e bem informado, NÃO por uma IA ou um especialista**. A linguagem deve ser culta, mas fluida e acessível. O título deve ser conciso e refletir a tese.

**Contexto da Tarefa (Coletânea, Enunciado, Gênero, Critérios Fornecidos):**
${JSON.stringify(pageContext, null, 1)}

**Instruções Detalhadas para a Geração:**

1.  **TÍTULO (OBRIGATÓRIO):**
    *   Crie um título **curto, direto e informativo (idealmente 3 a 7 palavras)**.
    *   Deve **sintetizar a ideia central ou a tese** do texto.
    *   **EVITE:** Títulos sensacionalistas, excessivamente criativos, poéticos ou que pareçam manchetes. Deve ser sóbrio e acadêmico, no nível esperado para uma redação.

2.  **TEXTO (2000-2800 caracteres, idealmente ~2400):**
    *   **Estrutura:** Introdução, Desenvolvimento (2 ou 3 parágrafos), Conclusão.
    *   **Introdução (CRÍTICO PARA NATURALIDADE):**
        *   **ABSOLUTAMENTE ESSENCIAL:** Deve soar como uma redação **humana e autêntica, escrita por um estudante**.
        *   Apresente o tema e a tese de forma clara, objetiva, mas **FUJA DE INÍCIOS ROBÓTICOS, CLICHÊS BATIDOS ou frases de efeito que soem artificiais.**
        *   **NÃO USE (exemplos de clichês a evitar):** "Desde os primórdios da humanidade...", "É notório que...", "Hodiernamente, muito se discute...", "Em um mundo cada vez mais...", "Sob uma primeira análise...", "Indubitavelmente...".
        *   **BUSQUE:** Uma abordagem direta, contextualizada, por exemplo: "A questão de [tema] tem gerado debates significativos na sociedade brasileira..." ou "O cenário de [tema] impõe a necessidade de refletir sobre...".
        *   **A PRIMEIRA FRASE É CRUCIAL para estabelecer um tom crível.**
    *   **Desenvolvimento (ARGUMENTOS ACESSÍVEIS, SEM AFIRMAÇÕES CATEGÓRICAS DE ESPECIALISTA):**
        *   Construa parágrafos com **argumentos lógicos, coerentes e plausíveis, baseados no bom senso, conhecimento geral e no contexto fornecido (sem copiar trechos do material de apoio)**.
        *   **APRESENTE AS IDEIAS COMO CONSTATAÇÕES, ANÁLISES OU RACIOCÍNIOS LÓGICOS, NÃO COMO OPINIÕES PESSOAIS DIRETAS ("eu acho", "na minha visão") NEM COMO VERDADES ABSOLUTAS DE UM ESPECIALISTA.**
        *   A profundidade deve ser adequada a um estudante bem informado, **sem recorrer a estatísticas complexas (a menos que fornecidas), citações diretas de filósofos/sociólogos pouco conhecidos pelo público geral, ou jargões acadêmicos excessivos.** O foco é demonstrar capacidade de reflexão crítica e uso do conhecimento de mundo de forma pertinente.
    *   **Linguagem e Estilo (EQUILÍBRIO, CLAREZA E AUTENTICIDADE ESTUDANTIL):**
        *   **Vocabulário:** Português culto padrão, mas **PRIORIZE palavras de uso CORRENTE, precisas e compreensíveis, com naturalidade.** A linguagem deve ser formal, mas **SEM PEDANTISMO, ARCAÍSMOS OU REBUSCAMENTO DESNECESSÁRIO.**
        *   **TERMINANTEMENTE PROIBIDO USAR (ou usar com extrema parcimônia e apenas se MUITO natural):** 'outrossim', 'mormente', 'hodiernamente' (prefira 'atualmente', 'nos dias de hoje', ou reformule), 'precipuamente', 'salientar' (prefira 'destacar', 'ressaltar', 'apontar'), 'é mister', 'é premente', 'urge que', 'implementar' (prefira 'adotar', 'realizar', 'aplicar'), 'mitigar' (prefira 'reduzir', 'amenizar'), 'diante disso/desse cenário' (use com moderação, varie), 'sob essa ótica/perspectiva' (use com moderação, varie), 'nesse ínterim', 'constata-se que' (prefira voz ativa ou outras construções), 'infere-se que', 'paradigma', 'intrínseco', 'extrínseco', 'corroborar' (prefira 'confirmar', 'reforçar'), 'destarte', 'ademais' (use com moderação e varie), 'conquanto', 'por conseguinte' (use com moderação). **BUSQUE SINÔNIMOS MAIS NATURAIS E COMUNS.**
        *   **Evite gírias e coloquialismos extremos.**
        *   **Fluidez e Coesão:** Varie a estrutura das frases. Use conectivos comuns (mas, porém, contudo, no entanto, então, assim, por isso, além disso, pois, porque, etc.) com **NATURALIDADE, PRECISÃO E VARIEDADE**, sem repetição excessiva ou uso forçado.
        *   **Inícios de Parágrafo/Frase:** **DIVERSIFICAR OBRIGATORIAMENTE** para evitar monotonia e soar como um template.
    *   **Pontuação:** **Use PREDOMINANTEMENTE PONTO FINAL (.) e VÍRGULA (,).** Use vírgulas para pausas, clareza e organização das ideias, sem excessos e de forma correta. **EVITE USO EXCESSIVO de ponto e vírgula (;), dois pontos (:), travessões (—) ou aspas duplas ("") para citações (que não devem ser diretas e formais aqui).**

**Modelo de Resposta OBRIGATÓRIO (Estrutura Limpa e Direta):**
TITULO: [Título Conciso e Informativo Gerado]

TEXTO:
[Introdução natural, contextualizada, com tom de autoria de estudante.]

[Parágrafo de Desenvolvimento 1, com argumento lógico, acessível e bem explicado.]

[Parágrafo de Desenvolvimento 2, com outro argumento lógico, acessível e bem explicado. Se necessário, um terceiro parágrafo de desenvolvimento pode ser adicionado, mantendo a mesma qualidade.]

[Conclusão coerente, retomando a tese de forma sutil e apresentando uma reflexão final ou uma breve sugestão (sem detalhar propostas de intervenção complexas, a menos que o gênero peça explicitamente).]

**Foco Final e Inegociável:** O texto DEVE soar como um estudante talentoso, não uma IA. Prioridade MÁXIMA na naturalidade da introdução, argumentos que demonstrem reflexão (não erudição forçada), vocabulário equilibrado (culto, mas comum), pontuação simples e correta, título focado. **Cumprir a faixa de caracteres (2000-2800).**`;

            const rawApiResponse = await getAiResponse(initialPrompt, "Gerando texto base");
            if (!rawApiResponse) return;

            logToMemory("Analisando resposta inicial da IA...", 'info');
            updateStatus("IA: Analisando resposta...");
            let extractedTitle = '';
            let extractedText = '';

            try {
                if (!rawApiResponse.includes('TITULO:') || !rawApiResponse.includes('TEXTO:')) {
                    throw new Error("Marcações 'TITULO:' ou 'TEXTO:' ausentes na resposta da IA. Verifique o log da API para a resposta completa.");
                }
                extractedTitle = rawApiResponse.split('TITULO:')[1].split('TEXTO:')[0].trim();
                extractedText = rawApiResponse.split('TEXTO:')[1].trim();
                if (!extractedTitle || !extractedText) {
                    throw new Error("Falha ao extrair título ou texto da resposta da IA. Conteúdo pode estar malformado.");
                }
                logToMemory(`Título extraído: ${extractedTitle}`, 'success');
                logToMemory(`Texto extraído (início): ${extractedText.substring(0,80).replace(/\s+/g, ' ')}... | Comprimento: ${extractedText.length}`, 'success');
                updateStatus("IA: Resposta inicial analisada.");
                await delay(150);
            } catch (e) {
                logToMemory(`Erro ao analisar resposta da IA: ${e.message}. Resposta bruta (início): ${rawApiResponse.substring(0,200)}...`, 'error');
                updateStatus(`Erro análise IA: ${e.message}`, 'error', true);
                return;
            }

            const humanizingPrompt = `**Tarefa CRÍTICA:** Revisão final e polimento do texto abaixo para ASSEGURAR MÁXIMA NATURALIDADE, AUTENTICIDADE e adequação ao perfil de um **estudante de ensino médio/pré-vestibular bem preparado e articulado**. O texto deve ser refinado para **eliminar QUALQUER resquício de artificialidade, linguagem excessivamente formal, tom professoral, clichês de IA ou erudição forçada**, mantendo 100% do sentido, dos argumentos e da estrutura originais.

**Texto Original para Refinamento:**
TITULO: ${extractedTitle}

TEXTO:
${extractedText}

**Ações OBRIGATÓRIAS de Refinamento (FOCO TOTAL NA VOZ DE ESTUDANTE):**
1.  **Introdução:** DEVE ser natural, engajadora e soar como um estudante articulando suas primeiras ideias sobre o tema. Eliminar qualquer formalismo desnecessário ou frase de efeito que pareça artificial.
2.  **Argumentos:** Verificar se são apresentados como reflexões e raciocínios lógicos de um estudante, não como afirmações de um especialista. A linguagem deve ser clara e os argumentos bem fundamentados no conhecimento geral, sem parecerem retirados de um paper acadêmico.
3.  **Vocabulário e Linguagem:**
    *   **SUBSTITUIR IMEDIATAMENTE** qualquer termo que soe artificial, excessivamente formal, rebuscado, arcaico, clichê de IA (como 'implementar', 'mitigar', 'paradigma', 'destarte', 'outrossim', 'hodiernamente', 'é mister', 'salientar', 'corroborar' etc.) por alternativas **MAIS COMUNS, FLUIDAS e NATURAIS**, mantendo a norma culta, mas sem pedantismo. O objetivo é uma escrita elegante e clara, não uma demonstração de vocabulário raro.
    *   Garantir que a linguagem seja direta e precisa.
4.  **Conexões e Fluidez:** Suavizar TODAS as transições entre frases e parágrafos. Usar conectivos variados e de forma natural, como um bom escritor faria, evitando repetições ou uso forçado.
5.  **Pontuação:** Confirmar o uso predominante de ponto final e vírgula, de forma correta e que auxilie a clareza. Simplificar se necessário.
6.  **Tom Geral:** AJUSTAR para que o texto final pareça **INEQUIVOCAMENTE escrito por um estudante inteligente e dedicado**, que domina a norma culta sem afetação. **NÃO PODE soar como uma IA, um acadêmico, um jornalista formal ou alguém tentando impressionar com palavras difíceis.** Deve ser convincente pela clareza, lógica e autenticidade.
7.  **Extensão:** Manter o texto dentro da faixa de 2000-2800 caracteres.

**Formato do Retorno:** APENAS o texto final TOTALMENTE REFINADO, sem NENHUM comentário, tag, ou o título novamente (apenas o corpo do texto).`;

            const humanizedText = await getAiResponse(humanizingPrompt, "Refinando texto (Humanizando)");
            if (!humanizedText) return;
            await delay(150);

            logToMemory("Localizando campo de Título para inserção...", 'info');
            updateStatus("Inserindo Título...");
            const titleTextareaParentCandidates = document.querySelectorAll(TITLE_TEXTAREA_PARENT_SELECTOR);
            let titleTextareaParent = null;
            if (titleTextareaParentCandidates.length > 0) {
                 titleTextareaParent = titleTextareaParentCandidates[0].parentElement;
            }

            if (!titleTextareaParent) {
                logToMemory("Erro: Elemento pai do campo de Título não encontrado.", 'error');
                updateStatus("Erro: Campo de Título não localizado.", "error", true);
                return;
            }
            const titleInserted = await insertTextIntoTextarea(titleTextareaParent, extractedTitle, "Título");
            if (!titleInserted) return;
            await delay(400);

            logToMemory("Localizando campo de Corpo para inserção...", 'info');
            updateStatus("Inserindo Corpo do Texto...");

            const allTextareaParents = Array.from(document.querySelectorAll(BODY_TEXTAREA_PARENT_SELECTOR)).map(el => el.parentElement);
            let bodyTextareaParentElement = null;

            if (allTextareaParents.length > 1 && titleTextareaParent && allTextareaParents[0] === titleTextareaParent) {
                bodyTextareaParentElement = allTextareaParents[1];
                logToMemory(`Múltiplos textareas. Corpo identificado como o segundo.`, 'debug');
            } else if (allTextareaParents.length === 1 && allTextareaParents[0] !== titleTextareaParent) {
                bodyTextareaParentElement = allTextareaParents[0];
                logToMemory(`Apenas um textarea (diferente do título) identificado como Corpo.`, 'debug');
            } else if (allTextareaParents.length > 0) {
                bodyTextareaParentElement = allTextareaParents.find(p => p !== titleTextareaParent) || allTextareaParents[allTextareaParents.length -1];
                logToMemory(`Fallback para seleção do campo Corpo. Total de textareas: ${allTextareaParents.length}`, 'debug');
            }


            if (!bodyTextareaParentElement) {
                logToMemory("Erro: Elemento pai do campo de Corpo do Texto não encontrado.", 'error');
                updateStatus("Erro: Campo de Corpo do Texto não localizado.", "error", true);
                return;
            }

            const bodyInserted = await insertTextIntoTextarea(bodyTextareaParentElement, humanizedText, "Corpo do Texto");
            if (!bodyInserted) return;

            logToMemory("Processo de geração e inserção concluído com sucesso!", 'success');
            updateStatus("Redação gerada e inserida com sucesso!", 'success', true);
        }

         async function clearFieldsProcessWrapper() {
            if (isRunning || isClearing) { logToMemory("Ação de limpeza ignorada: outra operação em curso.", "debug"); return; }
            isClearing = true; if (runButton) runButton.disabled = true; if (clearButton) clearButton.disabled = true;
            logToMemory("==== Limpeza de Campos Iniciada ====", 'info');
            updateStatus("Limpando campos...", 'info');
            try { await clearFieldsProcess(); }
            catch (e) { logToMemory(`Erro no wrapper de limpeza: ${e.message}`, 'error'); console.error(`${SCRIPT_NAME} Erro na Limpeza:`, e); updateStatus(`Erro ao limpar: ${e.message}`, 'error', true); }
            finally { isClearing = false; if (runButton) runButton.disabled = false; if (clearButton) clearButton.disabled = false; updateStatus("Pronto.", "info"); logToMemory("==== Limpeza de Campos Finalizada ====", 'info'); }
        }

         async function mainProcessWrapper() {
            if (isRunning || isClearing) { logToMemory("Ação de geração ignorada: outra operação em curso.", "debug"); return; }
            isRunning = true; if (runButton) runButton.disabled = true; if (clearButton) clearButton.disabled = true;
            logToMemory("==== Geração de Redação Iniciada ====", 'info');
            updateStatus("Iniciando geração...", 'info');
            try { await mainProcess(); }
            catch (e) { logToMemory(`Erro no wrapper de geração: ${e.message}`, 'error'); console.error(`${SCRIPT_NAME} Erro na Geração:`, e); updateStatus(`Erro fatal: ${e.message}`, 'error', true); }
            finally { isRunning = false; if (runButton) runButton.disabled = false; if (clearButton) clearButton.disabled = false; updateStatus("Pronto.", "info"); logToMemory("==== Geração de Redação Finalizada ====", 'info'); }
        }

        function initialize() {
            logToMemory("Inicializando HCK Bookmarklet V8", 'info');
            addBookmarkletStyles();
            createUI();
            if (document.getElementById('hck-toggle-button')) {
                updateStatus("Pronto.");
                logToMemory("UI pronta e operacional.", 'info');
                showToast(`${SCRIPT_NAME} V8 carregado!`, 'success', 2500);
            } else {
                 logToMemory("Falha na criação inicial da UI. Tentando novamente em breve.", "error");
                 setTimeout(createUI, 600);
            }
        }

        if (document.readyState === 'loading') {
            logToMemory("Documento ainda carregando. Aguardando DOMContentLoaded.", 'debug');
            document.addEventListener('DOMContentLoaded', initialize);
        } else {
            logToMemory("DOM já carregado. Inicializando com pequeno delay.", 'debug');
            setTimeout(initialize, 300);
        }

    } catch (globalError) {
        console.error('[HCK] ERRO CRÍTICO NA EXECUÇÃO DO SCRIPT:', globalError);
        if (typeof logToMemory === 'function') {
            logToMemory(`Erro global catastrófico no script: ${globalError.message} \nStack: ${globalError.stack}`, 'error');
        }
        alert(`[HCK] Erro crítico no script: ${globalError.message}. Verifique o console (F12) para detalhes.`);
    }
})();
