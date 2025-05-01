
(function() {
    'use strict';

    const SCRIPT_NAME = "HCK by hackermoon";
    const GEMINI_API_KEY = "AIzaSyBwEiziXQ79LP7IKq93pmLM8b3qnwXn6bQ";
    const MODEL_NAME = 'gemini-2.0-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
    const MAX_RETRIES = 2;

    const PAGE_IDENTIFIER_SELECTOR = 'p.MuiTypography-root.MuiTypography-body1.css-m576f2';
    const PAGE_IDENTIFIER_TEXT = 'Redação';
    const TITLE_TEXTAREA_PARENT_SELECTOR = 'textarea:not([aria-hidden="true"])';
    const BODY_TEXTAREA_PARENT_SELECTOR = 'textarea:not([aria-hidden="true"])';
    const COLETANEA_SELECTOR = '.ql-editor';
    const ENUNCIADO_SELECTOR = '.css-1pvvm3t';
    const GENERO_SELECTOR = '.css-1cq7p20';
    const CRITERIOS_SELECTOR = '.css-1pvvm3t';

    let menuVisible = false;
    let toggleButton = null;
    let menuPanel = null;
    let statusLine = null;
    let runButton = null;
    let isRunning = false;

    const styles = `
        #hck-toggle-button {
            position: fixed; bottom: 20px; right: 20px; background-color: #000000; color: #ffffff; padding: 10px 15px;
            border-radius: 50px; cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px; font-weight: 500; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); z-index: 9999;
            transition: background-color 0.2s ease, transform 0.2s ease;
        }
        #hck-toggle-button:hover { background-color: #333333; transform: scale(1.05); }
        #hck-menu-panel {
            position: fixed; bottom: 70px; right: 20px; width: 260px; background-color: #ffffff; border-radius: 15px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); padding: 15px; z-index: 9998;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #000000;
            display: none; flex-direction: column; gap: 12px; border: 1px solid #e0e0e0; opacity: 0; transform: translateY(10px);
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        #hck-menu-panel.visible { display: flex; opacity: 1; transform: translateY(0); }
        #hck-menu-panel h3 { margin: 0 0 10px 0; font-size: 16px; font-weight: 600; text-align: center; color: #333; }
        #hck-menu-panel button {
            background-color: #000000; color: #ffffff; border: none; padding: 12px; border-radius: 8px; cursor: pointer;
            font-size: 14px; font-weight: 500; transition: background-color 0.2s ease, transform 0.1s ease; width: 100%;
        }
        #hck-menu-panel button:hover:not(:disabled) { background-color: #333333; transform: scale(1.02); }
        #hck-menu-panel button:active:not(:disabled) { transform: scale(0.98); }
        #hck-menu-panel button:disabled { background-color: #cccccc; color: #888888; cursor: not-allowed; transform: none; }
        #hck-status-line {
            margin-top: 10px; padding: 8px; border-top: 1px solid #e0e0e0; font-size: 13px; color: #555555; min-height: 20px;
            text-align: center; background-color: #f8f8f8; border-radius: 5px; word-wrap: break-word;
        }
        #hck-status-line.error { color: #D32F2F; font-weight: 500; background-color: #FFEBEE; }
        #hck-status-line.success { color: #388E3C; font-weight: 500; background-color: #E8F5E9; }
    `;

    function addBookmarkletStyles() {
        try {
            const styleSheet = document.createElement("style");
            styleSheet.type = "text/css";
            styleSheet.innerText = styles;
            document.head.appendChild(styleSheet);
        } catch (error) {
            console.error(`${SCRIPT_NAME}: Failed to inject styles:`, error);
            alert(`${SCRIPT_NAME}: Error applying styles.`);
        }
    }

    function updateStatus(message, type = 'info') {
        if (statusLine) {
            statusLine.textContent = message;
            statusLine.className = 'hck-status-line';
            if (type === 'error') {
                statusLine.classList.add('error');
                console.error(`${SCRIPT_NAME}: ${message}`);
            } else if (type === 'success') {
                statusLine.classList.add('success');
                console.log(`${SCRIPT_NAME}: ${message}`);
            } else {
                console.log(`${SCRIPT_NAME}: ${message}`);
            }
        } else {
            if (type === 'error') console.error(`${SCRIPT_NAME}: ${message}`);
            else console.log(`${SCRIPT_NAME}: ${message}`);
        }
    }

    function createUI() {
        if (document.getElementById('hck-toggle-button')) return;
        toggleButton = document.createElement('div');
        toggleButton.id = 'hck-toggle-button';
        toggleButton.textContent = 'HCK';
        toggleButton.onclick = toggleMenu;
        document.body.appendChild(toggleButton);
        menuPanel = document.createElement('div');
        menuPanel.id = 'hck-menu-panel';
        const title = document.createElement('h3');
        title.textContent = SCRIPT_NAME;
        menuPanel.appendChild(title);
        runButton = document.createElement('button');
        runButton.textContent = 'Gerar Redação';
        runButton.onclick = () => { if (!isRunning) mainProcessWrapper(); };
        menuPanel.appendChild(runButton);
        statusLine = document.createElement('div');
        statusLine.id = 'hck-status-line';
        statusLine.textContent = 'Pronto.';
        menuPanel.appendChild(statusLine);
        document.body.appendChild(menuPanel);
    }

    function toggleMenu() {
        menuVisible = !menuVisible;
        if (menuPanel) {
             if (menuVisible) menuPanel.classList.add('visible');
             else menuPanel.classList.remove('visible');
        }
    }

    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function insertTextIntoTextarea(parentElement, textToInsert, fieldName) {
        updateStatus(`Inserindo ${fieldName}...`);
        const textareaElement = parentElement.querySelector('textarea:not([aria-hidden="true"])');
        if (!textareaElement) {
            updateStatus(`Erro: Textarea para ${fieldName} não encontrada.`, 'error');
            return false;
        }
        try {
            textareaElement.focus();
            textareaElement.value = textToInsert;
            textareaElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
            textareaElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
            await delay(50);
            textareaElement.blur();
            await delay(100);
            if (textareaElement.value === textToInsert) return true;
        } catch (error) { console.error(`[ERROR] ${fieldName} - Direct value:`, error); }
         try {
             const elementKeys = Object.keys(textareaElement);
             const reactHandlerKey = elementKeys.find(key => key.startsWith('__reactProps$') || key.startsWith('__reactEventHandlers$'));
             if (reactHandlerKey) {
                 const props = textareaElement[reactHandlerKey];
                 if (props && typeof props.onChange === 'function') {
                     const syntheticEvent = { target: { value: textToInsert }, currentTarget: { value: textToInsert }, preventDefault: () => {}, stopPropagation: () => {} };
                     props.onChange(syntheticEvent);
                     await delay(150);
                     if (textareaElement.value === textToInsert) return true;
                 }
             }
         } catch (error) { console.error(`[ERROR] ${fieldName} - React handler:`, error); }
         try {
             textareaElement.focus();
             textareaElement.value = '';
             await delay(50);
             textareaElement.value = textToInsert;
             const inputEvent = new InputEvent('input', { bubbles: true, cancelable: true, data: textToInsert, inputType: 'insertText' });
             textareaElement.dispatchEvent(inputEvent);
             await delay(100);
             textareaElement.blur();
              await delay(100);
              if (textareaElement.value === textToInsert) return true;
         } catch (error) { console.error(`[ERROR] ${fieldName} - InputEvent:`, error); }
        await delay(200);
        if (textareaElement.value === textToInsert) return true;
        else {
            updateStatus(`Erro: Falha ao inserir ${fieldName}.`, 'error');
            return false;
        }
    }

    async function getAiResponse(prompt, operationDesc) {
        updateStatus(`${operationDesc}...`);
        let attempts = 0;
        while (attempts <= MAX_RETRIES) {
            attempts++;
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.75, topP: 0.95, topK: 40, maxOutputTokens: 8192 }
                    }),
                });
                if (!response.ok) {
                     const errorBody = await response.text();
                     console.error(`API Error Status ${response.status}. Attempt ${attempts}. Body: ${errorBody}`);
                     if (attempts > MAX_RETRIES) throw new Error(`API request failed after ${attempts} attempts. Status: ${response.status}. Model: ${MODEL_NAME}`);
                     updateStatus(`Erro API (${response.status}). Tentando (${attempts}/${MAX_RETRIES})...`, 'error');
                     await delay(1000 * attempts);
                     continue;
                }
                const responseData = await response.json();
                const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) {
                    console.error("Invalid API response structure:", responseData);
                     if (attempts > MAX_RETRIES) throw new Error('Estrutura de resposta da API inválida após retentativas.');
                     updateStatus(`Erro API (formato). Tentando (${attempts}/${MAX_RETRIES})...`, 'error');
                     await delay(1000 * attempts);
                     continue;
                }
                updateStatus(`${operationDesc} concluído.`);
                return text.trim();
            } catch (error) {
                console.error(`Falha na chamada API para ${operationDesc} (tentativa ${attempts}):`, error);
                 if (attempts > MAX_RETRIES) {
                    updateStatus(`Erro fatal API para ${operationDesc}: ${error.message}`, 'error');
                    throw error;
                 }
                 updateStatus(`Erro chamada API. Tentando (${attempts}/${MAX_RETRIES})...`, 'error');
                 await delay(1000 * attempts);
            }
        }
         updateStatus(`Erro: Falha ao obter resposta da IA para ${operationDesc} após ${MAX_RETRIES} tentativas.`, 'error');
         return null;
    }

    function extractPageContext() {
        updateStatus("Extraindo contexto...");
        const context = {};
        const selectors = { coletanea: COLETANEA_SELECTOR, enunciado: ENUNCIADO_SELECTOR, generoTextual: GENERO_SELECTOR, criteriosAvaliacao: CRITERIOS_SELECTOR };
        let foundAll = true;
        for (const key in selectors) {
            try {
                const element = document.querySelector(selectors[key]);
                context[key] = element ? element.innerText.trim() : '';
                if (!context[key]) console.warn(`Contexto para '${key}' não encontrado.`);
            } catch (error) {
                console.error(`Erro ao extrair '${key}':`, error);
                foundAll = false;
            }
        }
        if (!context.enunciado) {
             updateStatus("Erro: Enunciado não encontrado.", 'error');
             return null;
        }
        updateStatus("Contexto extraído.");
        return context;
    }

    async function mainProcess() {
        updateStatus("Verificando página...");
        const identifierElement = document.querySelector(PAGE_IDENTIFIER_SELECTOR);
        if (!identifierElement || !identifierElement.textContent.includes(PAGE_IDENTIFIER_TEXT)) {
            updateStatus(`Erro: Página não parece ser de ${PAGE_IDENTIFIER_TEXT}.`, 'error');
            alert(`${SCRIPT_NAME}: Página não identificada como '${PAGE_IDENTIFIER_TEXT}'. Verifique os seletores.`);
            return;
        }
        updateStatus("Página verificada."); await delay(200);
        const redacaoContext = extractPageContext();
        if (!redacaoContext) return;
        await delay(200);
        const initialPrompt = `Você é um assistente de escrita. Com base na tarefa abaixo, gere: 1. Um título adequado. 2. O texto completo da redação.\n**Instruções:**\n* Siga o gênero textual e o enunciado.\n* Use as informações da coletânea.\n* **Formate EXATAMENTE assim:**\nTITULO: [Seu título aqui]\n\nTEXTO: [Seu texto completo aqui]\n\n**Informações da Tarefa:**\n\`\`\`json\n${JSON.stringify(redacaoContext, null, 2)}\n\`\`\``;
        const aiResponseRaw = await getAiResponse(initialPrompt, "Gerando texto inicial");
        if (!aiResponseRaw) return;
        updateStatus("Analisando resposta...");
        let extractedTitle = ''; let extractedText = '';
        try {
            if (!aiResponseRaw.includes('TITULO:') || !aiResponseRaw.includes('TEXTO:')) throw new Error("Formato inválido (sem TITULO: ou TEXTO:).");
            extractedTitle = aiResponseRaw.split('TITULO:')[1].split('TEXTO:')[0].trim();
            extractedText = aiResponseRaw.split('TEXTO:')[1].trim();
            if (!extractedTitle || !extractedText) throw new Error("Não foi possível extrair título ou texto.");
            updateStatus("Resposta inicial analisada."); await delay(200);
        } catch (error) { updateStatus(`Erro ao analisar resposta: ${error.message}`, 'error'); console.error("Raw Response:", aiResponseRaw); return; }
        const humanizationPrompt = `Reescreva o texto abaixo para soar mais natural, como um estudante comum escreveria, mantendo o sentido e parágrafos.\n**Como reescrever:**\n* **Linguagem:** Informal mas correta, evite palavras complexas. Use conectivos comuns ("aí", "então", "mas").\n* **Fluidez:** Varie tamanho das frases.\n* **Erros Leves:** *Ocasionalmente* uma repetição sutil ou frase menos polida, *se* parecer natural, sem erros graves.\n* **Foco:** Mantenha a ideia central. Mude a "voz".\n* **NÃO adicione nada extra:** Sem introduções ou comentários. Devolva *APENAS* o texto reescrito.\n\n**Texto Original:**\n\`\`\`\n${extractedText}\n\`\`\``;
        const humanizedText = await getAiResponse(humanizationPrompt, "Humanizando o texto");
        if (!humanizedText) return;
        await delay(200);
        updateStatus("Localizando campo do título...");
        const titleTextareaParent = document.querySelector(TITLE_TEXTAREA_PARENT_SELECTOR)?.parentElement;
        if (!titleTextareaParent) { updateStatus("Erro: Campo do título não encontrado.", "error"); return; }
        const titleSuccess = await insertTextIntoTextarea(titleTextareaParent, extractedTitle, "Título");
        if (!titleSuccess) return;
        await delay(500);
        updateStatus("Localizando campo do corpo...");
        const allVisibleTextareas = document.querySelectorAll(BODY_TEXTAREA_PARENT_SELECTOR);
        let bodyTextareaParent = null;
        if (allVisibleTextareas.length > 0) {
            if (allVisibleTextareas.length > 1 && allVisibleTextareas[0].parentElement === titleTextareaParent) bodyTextareaParent = allVisibleTextareas[1].parentElement;
            else bodyTextareaParent = allVisibleTextareas[allVisibleTextareas.length - 1].parentElement;
        }
        if (!bodyTextareaParent) { updateStatus("Erro: Campo do corpo não encontrado.", "error"); return; }
        const bodySuccess = await insertTextIntoTextarea(bodyTextareaParent, humanizedText, "Corpo do Texto");
        if (!bodySuccess) return;
        updateStatus("Redação gerada e inserida!", 'success');
        alert(`${SCRIPT_NAME}:\n\nRedação gerada e inserida! Verifique o conteúdo.`);
    }

     async function mainProcessWrapper() {
         if (isRunning) return;
         isRunning = true; if (runButton) runButton.disabled = true;
         updateStatus("Iniciando...", 'info');
         try { await mainProcess(); }
         catch (error) {
             console.error(`${SCRIPT_NAME}: Erro inesperado:`, error);
             updateStatus(`Erro inesperado: ${error.message}`, 'error');
             alert(`${SCRIPT_NAME}: Ocorreu um erro inesperado. Verifique o console (F12).`);
         } finally {
             isRunning = false; if (runButton) runButton.disabled = false;
         }
     }

    function initialize() {
         addBookmarkletStyles(); createUI();
         updateStatus("Pronto. Clique em 'Gerar Redação'.");
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else setTimeout(initialize, 200);

})();
