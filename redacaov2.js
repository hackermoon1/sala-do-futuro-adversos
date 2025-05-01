(function() {
    'use strict';

    const SCRIPT_NAME = "HCK";
    const CREDITS = "by hackermoon";
    const GEMINI_API_KEY = "AIzaSyBwEiziXQ79LP7IKq93pmLM8b3qnwXn6bQ";
    const MODEL_NAME = 'gemini-2.0-flash';
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
    let isRunning = false;
    let toastContainer = null;
    let logArray = [];

    const styles = `
        #hck-toggle-button { position: fixed; bottom: 20px; right: 20px; background-color: #000000; color: #ffffff; padding: 10px 15px; border-radius: 50px; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25); z-index: 10000; transition: background-color 0.2s ease, transform 0.2s ease; user-select: none; }
        #hck-toggle-button:hover { background-color: #333333; transform: scale(1.05); }
        #hck-menu-panel, #hck-log-panel { position: fixed; right: 20px; width: 280px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); padding: 18px; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #000000; display: none; flex-direction: column; gap: 14px; border: 1px solid #eaeaea; opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease; }
        #hck-menu-panel { bottom: 75px; transform: translateY(10px) scale(0.98); }
        #hck-log-panel { bottom: 75px; max-height: 60vh; transform: translateY(10px) scale(0.98); } /* Position logs like menu */
        #hck-menu-panel.visible, #hck-log-panel.visible { display: flex; opacity: 1; transform: translateY(0) scale(1); }
        .hck-title-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .hck-title-bar .hck-title-group { display: flex; align-items: baseline; gap: 5px; }
        .hck-title-bar h3 { margin: 0; font-size: 17px; font-weight: 600; color: #222; }
        .hck-title-bar .hck-credits { font-size: 11px; color: #777; font-weight: 400; }
        #hck-menu-panel button, #hck-log-panel button { background-color: #000000; color: #ffffff; border: none; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background-color 0.2s ease, transform 0.1s ease; width: 100%; margin-top: 5px; }
        #hck-menu-panel button:hover:not(:disabled), #hck-log-panel button:hover:not(:disabled) { background-color: #333333; transform: scale(1.02); }
        #hck-menu-panel button:active:not(:disabled), #hck-log-panel button:active:not(:disabled) { transform: scale(0.98); }
        #hck-menu-panel button:disabled { background-color: #d0d0d0; color: #888888; cursor: not-allowed; transform: none; }
        #hck-status-line { margin-top: 5px; padding: 9px 12px; border-top: 1px solid #f0f0f0; font-size: 13px; color: #444; min-height: 20px; text-align: center; background-color: #f9f9f9; border-radius: 8px; word-wrap: break-word; }
        #hck-status-line.error { color: #c0392b; font-weight: 500; background-color: #fdecea; border-top-color: #f5c6cb; }
        #hck-status-line.success { color: #27ae60; font-weight: 500; background-color: #eafaf1; border-top-color: #c3e6cb; }
        #hck-toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10001; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .hck-toast { background-color: rgba(0, 0, 0, 0.85); color: #ffffff; padding: 10px 20px; border-radius: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 13px; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2); opacity: 0; transform: translateY(-20px); transition: opacity 0.3s ease, transform 0.3s ease; max-width: 80vw; text-align: center; }
        .hck-toast.show { opacity: 1; transform: translateY(0); }
        .hck-toast.error { background-color: #e74c3c; }
        .hck-toast.success { background-color: #2ecc71; }
        #hck-log-content { overflow-y: auto; max-height: calc(60vh - 100px); background-color: #f0f0f0; padding: 10px; border-radius: 8px; font-size: 11px; line-height: 1.4; color: #333; white-space: pre-wrap; word-break: break-word; }
        .hck-log-entry { margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dashed #ccc; }
        .hck-log-entry time { color: #888; margin-right: 8px; font-weight: bold; }
        .hck-log-entry code { font-family: monospace; }
        .hck-log-entry.error { color: #c0392b; font-weight: 500; }
        .hck-log-entry.success { color: #27ae60; }
        .hck-log-entry.api { color: #2980b9; }
        .hck-log-entry.debug { color: #7f8c8d; }
        #hck-log-panel .log-controls { display: flex; gap: 10px; margin-top: 10px; }
        #hck-log-panel .log-controls button { width: auto; padding: 8px 15px; background-color: #555; }
        #hck-log-panel .log-controls button.clear { background-color: #c0392b; }
    `;

    function addBookmarkletStyles() { try { const s = document.createElement("style"); s.type = "text/css"; s.innerText = styles; document.head.appendChild(s); } catch (e) { console.error(`${SCRIPT_NAME} StyleErr:`, e); } }
    function createToastContainer() { if (!document.getElementById('hck-toast-container')) { toastContainer = document.createElement('div'); toastContainer.id = 'hck-toast-container'; document.body.appendChild(toastContainer); } else { toastContainer = document.getElementById('hck-toast-container'); } }

    function showToast(message, type = 'info', duration = TOAST_DURATION) {
        if (!toastContainer) createToastContainer();
        const t = document.createElement('div'); t.className = 'hck-toast'; t.textContent = message;
        if (type === 'error') t.classList.add('error'); else if (type === 'success') t.classList.add('success');
        toastContainer.appendChild(t); requestAnimationFrame(() => { t.classList.add('show'); });
        setTimeout(() => { t.classList.remove('show'); setTimeout(() => { if (t.parentNode === toastContainer) toastContainer.removeChild(t); }, 350); }, duration);
    }

    function logToMemory(message, type = 'info') {
        const timestamp = new Date();
        const entry = { timestamp, type, message };
        logArray.push(entry);
        if (logPanelVisible && logContentDiv) renderSingleLogEntry(entry);
    }

    function updateStatus(message, type = 'info', showToastFlag = false) {
        if (statusLine) {
            statusLine.textContent = message; statusLine.className = 'hck-status-line';
            if (type === 'error') statusLine.classList.add('error'); else if (type === 'success') statusLine.classList.add('success');
        }
        const logType = (type === 'info' || type === 'debug') ? type : (type === 'error' ? 'error' : 'success');
        logToMemory(message, logType);
        if (showToastFlag) showToast(message, type);
    }

    function formatTime(date) { return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

    function renderSingleLogEntry(entry) {
        const entryDiv = document.createElement('div'); entryDiv.className = `hck-log-entry ${entry.type}`;
        const timeEl = document.createElement('time'); timeEl.textContent = `[${formatTime(entry.timestamp)}]`;
        const msgSpan = document.createElement('code'); msgSpan.textContent = entry.message;
        entryDiv.appendChild(timeEl); entryDiv.appendChild(msgSpan);
        logContentDiv.appendChild(entryDiv);
        logContentDiv.scrollTop = logContentDiv.scrollHeight;
    }

    function renderLogs() { if (!logContentDiv) return; logContentDiv.innerHTML = ''; logArray.forEach(renderSingleLogEntry); }
    function clearLogs() { logArray = []; renderLogs(); logToMemory("Logs limpos.", "info"); }

    function createLogPanel() {
        if (document.getElementById('hck-log-panel')) return;
        logPanel = document.createElement('div'); logPanel.id = 'hck-log-panel';
        const titleBar = document.createElement('div'); titleBar.className = 'hck-title-bar';
        const titleGrp = document.createElement('div'); titleGrp.className = 'hck-title-group';
        const title = document.createElement('h3'); title.textContent = 'Logs Detalhados';
        titleGrp.appendChild(title); titleBar.appendChild(titleGrp);
        logPanel.appendChild(titleBar);
        logContentDiv = document.createElement('div'); logContentDiv.id = 'hck-log-content';
        logPanel.appendChild(logContentDiv);
        const controlsDiv = document.createElement('div'); controlsDiv.className = 'log-controls';
        const clearButton = document.createElement('button'); clearButton.textContent = 'Limpar Logs'; clearButton.className = 'clear'; clearButton.onclick = clearLogs;
        const closeButton = document.createElement('button'); closeButton.textContent = 'Fechar Logs'; closeButton.onclick = toggleLogPanel;
        controlsDiv.appendChild(clearButton); controlsDiv.appendChild(closeButton);
        logPanel.appendChild(controlsDiv);
        document.body.appendChild(logPanel);
        renderLogs();
    }

    function toggleLogPanel() {
        if (!logPanel) createLogPanel();
        logPanelVisible = !logPanelVisible;
        if (logPanel) logPanel.classList.toggle('visible', logPanelVisible);
        if (logPanelVisible) { menuPanel?.classList.remove('visible'); menuVisible = false; renderLogs(); }
    }

    function createUI() {
        if (document.getElementById('hck-toggle-button')) return;
        createToastContainer();
        toggleButton = document.createElement('div'); toggleButton.id = 'hck-toggle-button'; toggleButton.textContent = SCRIPT_NAME; toggleButton.onclick = toggleMenu; document.body.appendChild(toggleButton);
        menuPanel = document.createElement('div'); menuPanel.id = 'hck-menu-panel';
        const titleBar = document.createElement('div'); titleBar.className = 'hck-title-bar';
        const titleGrp = document.createElement('div'); titleGrp.className = 'hck-title-group';
        const title = document.createElement('h3'); title.textContent = SCRIPT_NAME;
        const creditsSpan = document.createElement('span'); creditsSpan.className = 'hck-credits'; creditsSpan.textContent = CREDITS;
        titleGrp.appendChild(title); titleGrp.appendChild(creditsSpan); titleBar.appendChild(titleGrp); menuPanel.appendChild(titleBar);
        runButton = document.createElement('button'); runButton.textContent = 'Gerar Redação'; runButton.onclick = () => { if (!isRunning) mainProcessWrapper(); }; menuPanel.appendChild(runButton);
        const logButton = document.createElement('button'); logButton.textContent = 'Ver Logs'; logButton.onclick = toggleLogPanel; menuPanel.appendChild(logButton);
        statusLine = document.createElement('div'); statusLine.id = 'hck-status-line'; statusLine.textContent = 'Pronto.'; menuPanel.appendChild(statusLine);
        document.body.appendChild(menuPanel);
    }

    function toggleMenu() {
        menuVisible = !menuVisible;
        if (menuPanel) menuPanel.classList.toggle('visible', menuVisible);
        if (menuVisible) { logPanel?.classList.remove('visible'); logPanelVisible = false; }
    }

    async function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    async function insertTextIntoTextarea(parentElement, textToInsert, fieldName) {
        logToMemory(`Tentando inserir ${fieldName}...`, 'debug');
        updateStatus(`Inserindo ${fieldName}...`);
        const textareaElement = parentElement.querySelector('textarea:not([aria-hidden="true"])');
        if (!textareaElement) { updateStatus(`Erro: Textarea ${fieldName} não encontrada.`, 'error', true); logToMemory(`Textarea ${fieldName} não encontrada no elemento pai`, 'error'); return false; }
        let success = false;
        try {
            logToMemory(`Método 1: Direct Value + Events [${fieldName}]`, 'debug');
            textareaElement.focus(); textareaElement.value = textToInsert;
            textareaElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            textareaElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            await delay(50); textareaElement.blur(); await delay(100);
            if (textareaElement.value === textToInsert) success = true;
        } catch (e) { logToMemory(`Erro Método 1 [${fieldName}]: ${e}`, 'error'); }
        if (success) { logToMemory(`${fieldName} inserido com sucesso (Método 1)`, 'success'); updateStatus(`${fieldName} inserido.`); return true; }
        try {
            logToMemory(`Método 2: React Handler Check [${fieldName}]`, 'debug');
            const keys = Object.keys(textareaElement);
            const handlerKey = keys.find(k => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'));
            if (handlerKey) {
                 logToMemory(`Handler React encontrado: ${handlerKey} [${fieldName}]`, 'debug');
                 const props = textareaElement[handlerKey];
                 if (props && typeof props.onChange === 'function') {
                     props.onChange({ target: { value: textToInsert }, currentTarget: { value: textToInsert }, preventDefault: () => {}, stopPropagation: () => {} });
                     await delay(150); if (textareaElement.value === textToInsert) success = true;
                 } else { logToMemory(`Handler onChange não é função em ${handlerKey} [${fieldName}]`, 'debug');}
             } else { logToMemory(`Nenhum handler React encontrado [${fieldName}]`, 'debug'); }
         } catch (e) { logToMemory(`Erro Método 2 [${fieldName}]: ${e}`, 'error'); }
        if (success) { logToMemory(`${fieldName} inserido com sucesso (Método 2)`, 'success'); updateStatus(`${fieldName} inserido.`); return true; }
        try {
            logToMemory(`Método 3: InputEvent [${fieldName}]`, 'debug');
            textareaElement.focus(); textareaElement.value = ''; await delay(50);
            textareaElement.value = textToInsert;
            textareaElement.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: textToInsert, inputType: 'insertText' }));
            await delay(100); textareaElement.blur(); await delay(100);
            if (textareaElement.value === textToInsert) success = true;
         } catch (e) { logToMemory(`Erro Método 3 [${fieldName}]: ${e}`, 'error'); }
        if (success) { logToMemory(`${fieldName} inserido com sucesso (Método 3)`, 'success'); updateStatus(`${fieldName} inserido.`); return true; }
        await delay(200);
        if (textareaElement.value === textToInsert) { logToMemory(`${fieldName} inserido com sucesso (Verificação final)`, 'success'); updateStatus(`${fieldName} inserido.`); return true; }
        else { logToMemory(`Falha final ao inserir ${fieldName}. Valor atual: '${textareaElement.value.substring(0,30)}...'`, 'error'); updateStatus(`Erro final ao inserir ${fieldName}.`, 'error', true); return false; }
    }

    async function getAiResponse(prompt, operationDesc) {
        logToMemory(`Iniciando API: ${operationDesc}`, 'api'); updateStatus(`${operationDesc}...`);
        let attempts = 0;
        while (attempts <= MAX_RETRIES) {
            attempts++; logToMemory(`Tentativa API ${attempts}/${MAX_RETRIES+1} para ${operationDesc}`, 'api');
            try {
                const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.75, topP: 0.95, topK: 45, maxOutputTokens: 8192 } }), });
                if (!response.ok) {
                     const errorBody = await response.text(); logToMemory(`Erro API ${response.status} (Tentativa ${attempts}): ${errorBody.substring(0,150)}...`, 'error');
                     if (attempts > MAX_RETRIES) throw new Error(`API falhou (${response.status}). Modelo: ${MODEL_NAME}`);
                     updateStatus(`Erro API (${response.status}). Tentando (${attempts}/${MAX_RETRIES})...`, 'error'); await delay(1500 * attempts); continue;
                }
                const responseData = await response.json(); logToMemory(`API ${operationDesc} Raw Response (Tentativa ${attempts}): ${JSON.stringify(responseData).substring(0,100)}...`, 'debug');
                const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) { logToMemory(`API Resp Inválida (Tentativa ${attempts}): Estrutura não encontrada.`, 'error');
                     if (attempts > MAX_RETRIES) throw new Error('API resp formato inválido.');
                     updateStatus(`Erro API (formato). Tentando (${attempts}/${MAX_RETRIES})...`, 'error'); await delay(1500 * attempts); continue;
                }
                logToMemory(`API ${operationDesc} sucesso (Tentativa ${attempts}). Tam: ${text.length}`, 'success'); updateStatus(`${operationDesc} ok.`); return text.trim();
            } catch (error) {
                logToMemory(`Falha Catch API ${operationDesc} (Tentativa ${attempts}): ${error}`, 'error');
                 if (attempts > MAX_RETRIES) { updateStatus(`Erro fatal API: ${error.message}`, 'error', true); throw error; }
                 updateStatus(`Erro API. Tentando (${attempts}/${MAX_RETRIES})...`, 'error'); await delay(1500 * attempts);
            }
        }
         logToMemory(`Falha API ${operationDesc} após ${MAX_RETRIES + 1} tentativas.`, 'error'); updateStatus(`Erro: Falha API ${operationDesc}.`, 'error', true); return null;
    }

    function extractPageContext() {
        logToMemory("Iniciando extração de contexto", 'info'); updateStatus("Extraindo contexto...");
        const context = {};
        const selectors = { coletanea: COLETANEA_SELECTOR, enunciado: ENUNCIADO_SELECTOR, generoTextual: GENERO_SELECTOR, criteriosAvaliacao: CRITERIOS_SELECTOR };
        let essentialFound = true;
        for (const key in selectors) {
            try {
                const element = document.querySelector(selectors[key]); context[key] = element ? element.innerText.trim() : '';
                if (!context[key]) { logToMemory(`Ctx ${key} vazio ou não encontrado (Seletor: ${selectors[key]})`, 'debug'); }
                else { logToMemory(`Ctx ${key} encontrado: ${context[key].substring(0,50)}...`, 'debug'); }
            } catch (error) { logToMemory(`Erro ao extrair Ctx ${key}: ${error}`, 'error'); if (key === 'enunciado') essentialFound = false; }
        }
        if (!context.enunciado) { logToMemory("Erro Crítico: Enunciado não encontrado.", 'error'); updateStatus("Erro: Enunciado não encontrado.", 'error', true); return null; }
        logToMemory("Extração de contexto concluída.", 'success'); updateStatus("Contexto extraído."); return context;
    }

    async function mainProcess() {
        logToMemory("Iniciando processo principal.", 'info'); updateStatus("Verificando página...");
        const identifierElement = document.querySelector(PAGE_IDENTIFIER_SELECTOR);
        if (!identifierElement || !identifierElement.textContent.includes(PAGE_IDENTIFIER_TEXT)) {
            logToMemory(`Falha na verificação da página. Seletor: '${PAGE_IDENTIFIER_SELECTOR}', Texto esperado: '${PAGE_IDENTIFIER_TEXT}'`, 'error');
            updateStatus(`Erro: Página não parece ser ${PAGE_IDENTIFIER_TEXT}.`, 'error', true); return;
        }
        logToMemory("Verificação da página OK.", 'success'); updateStatus("Página OK."); await delay(200);
        const redacaoContext = extractPageContext(); if (!redacaoContext) return; await delay(200);
        const initialPrompt = `**Tarefa:** Gerar título e texto para uma redação.\n**Contexto Fornecido:**\n${JSON.stringify(redacaoContext, null, 1)}\n\n**Instruções:**\n1. Crie um título curto e relevante.\n2. Escreva o texto completo da redação seguindo o gênero e enunciado.\n3. Use as informações do contexto.\n4. **Formato de Saída (OBRIGATÓRIO, sem NADA antes ou depois):**\nTITULO: [Título aqui]\n\nTEXTO: [Texto completo aqui]`;
        const aiResponseRaw = await getAiResponse(initialPrompt, "Gerando texto inicial"); if (!aiResponseRaw) return;
        logToMemory("Analisando resposta inicial da IA.", 'info'); updateStatus("Analisando resposta IA...");
        let extractedTitle = ''; let extractedText = '';
        try {
            if (!aiResponseRaw.includes('TITULO:') || !aiResponseRaw.includes('TEXTO:')) throw new Error("Marcações TITULO/TEXTO ausentes.");
            extractedTitle = aiResponseRaw.split('TITULO:')[1].split('TEXTO:')[0].trim(); extractedText = aiResponseRaw.split('TEXTO:')[1].trim();
            if (!extractedTitle || !extractedText) throw new Error("Extração de título/texto falhou.");
            logToMemory(`Título extraído: ${extractedTitle}`, 'success'); logToMemory(`Texto extraído (início): ${extractedText.substring(0,60)}...`, 'success');
            updateStatus("Resposta inicial OK."); await delay(200);
        } catch (error) { logToMemory(`Erro análise resposta IA: ${error.message}. Raw: ${aiResponseRaw.substring(0,100)}...`, 'error'); updateStatus(`Erro análise: ${error.message}`, 'error', true); return; }
        const humanizationPrompt = `**Tarefa:** Reescrever o texto abaixo para soar mais natural, como um estudante escreveria, MANTENDO o sentido original, argumentos e parágrafos.\n**Como Fazer (Seja um bom aluno, não um robô!):**\n*   **Linguagem:** Use português do dia a dia, claro e direto. Evite palavras difíceis ou formais demais. Conectivos comuns (tipo, então, aí, mas, porque) são bem-vindos com moderação.\n*   **Fluidez:** Varie o tamanho das frases. Deixe o texto correr bem.\n*   **Naturalidade:** Pequenas repetições ou frases menos 'perfeitas' podem ocorrer, *se* parecerem naturais de quem está escrevendo, não force.\n*   **Foco:** Mantenha as ideias e exemplos originais. Só mude o jeito de falar.\n*   **Saída:** Devolva SÓ o texto reescrito. Sem "aqui está", sem explicações.\n\n**Texto Original:**\n${extractedText}`;
        const humanizedText = await getAiResponse(humanizationPrompt, "Humanizando texto"); if (!humanizedText) return; await delay(200);
        logToMemory("Localizando campo do título...", 'info'); updateStatus("Localizando campo título...");
        const titleParent = document.querySelector(TITLE_TEXTAREA_PARENT_SELECTOR)?.parentElement;
        if (!titleParent) { logToMemory("Erro: Elemento pai do campo título não encontrado.", 'error'); updateStatus("Erro: Campo título não encontrado.", "error", true); return; }
        const titleSuccess = await insertTextIntoTextarea(titleParent, extractedTitle, "Título"); if (!titleSuccess) return; await delay(500);
        logToMemory("Localizando campo do corpo...", 'info'); updateStatus("Localizando campo corpo...");
        const allAreas = document.querySelectorAll(BODY_TEXTAREA_PARENT_SELECTOR); let bodyParent = null;
        if (allAreas.length > 0) { bodyParent = (allAreas.length > 1 && allAreas[0].parentElement === titleParent) ? allAreas[1].parentElement : allAreas[allAreas.length - 1].parentElement; logToMemory(`Encontrado pai do corpo (total áreas: ${allAreas.length})`, 'debug'); }
        if (!bodyParent) { logToMemory("Erro: Elemento pai do campo corpo não encontrado.", 'error'); updateStatus("Erro: Campo corpo não encontrado.", "error", true); return; }
        const bodySuccess = await insertTextIntoTextarea(bodyParent, humanizedText, "Corpo"); if (!bodySuccess) return;
        logToMemory("Processo concluído com sucesso!", 'success'); updateStatus("Redação inserida com sucesso!", 'success', true);
    }

     async function mainProcessWrapper() {
         if (isRunning) return;
         isRunning = true; if (runButton) runButton.disabled = true;
         logToMemory("==== Processo Iniciado ====", 'info'); updateStatus("Iniciando...", 'info');
         try { await mainProcess(); }
         catch (error) { logToMemory(`Erro Inesperado no Wrapper: ${error}`, 'error'); console.error(`${SCRIPT_NAME} Erro Inesperado:`, error); updateStatus(`Erro inesperado: ${error.message}`, 'error', true);
         } finally { isRunning = false; if (runButton) runButton.disabled = false; logToMemory("==== Processo Finalizado ====", 'info'); }
     }

    function initialize() {
         logToMemory("Inicializando HCK Bookmarklet", 'info');
         addBookmarkletStyles(); createUI();
         updateStatus("Pronto."); logToMemory("UI Criada e pronta.", 'info');
    }

    if (document.readyState === 'loading') { logToMemory("Esperando DOMContentLoaded", 'debug'); document.addEventListener('DOMContentLoaded', initialize); }
    else { logToMemory("DOM pronto, inicializando com delay.", 'debug'); setTimeout(initialize, 250); }

})();
