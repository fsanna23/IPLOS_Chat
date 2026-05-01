document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');

    let sessionId = null;
    let isWaiting = false;

    // Inizializza la chat
    async function startChat() {
        showTyping();
        try {
            const response = await fetch('/api/start', { method: 'POST' });
            const data = await response.json();
            
            if (data.error) {
                appendMessage(data.error || 'Errore di connessione', 'bot');
            } else {
                sessionId = data.sessionId;
                appendMessage(data.message, 'bot');
            }
        } catch (error) {
            console.error(error);
            appendMessage('Errore server. Assicurati che il backend sia in esecuzione e la chiave API sia valida.', 'bot');
        } finally {
            hideTyping();
        }
    }

    // Invia il messaggio
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text || isWaiting || !sessionId) return;

        // UI updates
        appendMessage(text, 'user');
        userInput.value = '';
        userInput.focus();
        toggleSendBtn();
        isWaiting = true;
        showTyping();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message: text })
            });
            const data = await response.json();

            if (data.error) {
                appendMessage(data.error, 'bot');
                return;
            }

            // Ritarda un attimo la risposta per effetto realistico
            setTimeout(async () => {
                hideTyping();
                appendMessage(data.message, 'bot');
                
                if (data.isFinished) {
                    await handleConclusion();
                } else {
                    isWaiting = false;
                }
            }, 600);
            
        } catch (error) {
            console.error(error);
            hideTyping();
            appendMessage('Errore di connessione con il server.', 'bot');
            isWaiting = false;
        }
    }

    // Gestisce la conclusione
    async function handleConclusion() {
        userInput.disabled = true;
        sendBtn.disabled = true;
        showTyping(); // Mostra elaborazione excel

        try {
            await fetch('/api/finish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });
            
            // Sostituisce l'area di input con un messaggio di fine
            const inputArea = document.querySelector('.input-area');
            inputArea.innerHTML = '<div style="width: 100%; text-align: center; color: var(--text-muted); font-weight: 500; padding: 10px;">Il questionario è terminato. Puoi scorrere per leggere il report.</div>';
            
            // Aggiunge un messaggio finale non bloccante
            appendMessage("Questionario terminato. I tuoi dati sono stati salvati correttamente. Grazie per il tuo tempo!", 'bot');
            
        } catch(e) {
            console.error('Errore durante export Excel', e);
        } finally {
            hideTyping();
            isWaiting = false;
        }
    }

    // --- Helpers UI ---

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        // Converte eventuali newline in br per formattazione
        const formattedText = text.replace(/\n/g, '<br>');
        
        msgDiv.innerHTML = `<div class="message-bubble">${formattedText}</div>`;
        chatMessages.insertBefore(msgDiv, typingIndicator);
        scrollToBottom();
    }

    function showTyping() {
        typingIndicator.classList.remove('hidden');
        scrollToBottom();
    }

    function hideTyping() {
        typingIndicator.classList.add('hidden');
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function toggleSendBtn() {
        sendBtn.disabled = userInput.value.trim() === '';
    }

    // --- Events ---

    userInput.addEventListener('input', toggleSendBtn);
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    // Header close btn
    document.querySelector('.header-action').addEventListener('click', () => {
        if(confirm('Sei sicuro di voler chiudere la pagina? I dati non salvati andranno persi.')){
            window.close();
        }
    });

    // Avvio automatico
    startChat();
});
