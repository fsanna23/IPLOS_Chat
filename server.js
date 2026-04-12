import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sendMessage, startSession, extractAndSaveToExcel } from './services/chatService.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Avvia una nuova sessione e ottiene il messaggio di benvenuto.
app.post('/api/start', async (req, res) => {
    try {
        const data = await startSession();
        res.json(data);
    } catch (error) {
        console.error('Errore avvio sessione:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Invia un messaggio alla sessione corrente
app.post('/api/chat', async (req, res) => {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
        return res.status(400).json({ error: 'Missing sessionId or message' });
    }

    try {
        const responseData = await sendMessage(sessionId, message);
        res.json(responseData);
    } catch (error) {
        console.error('Errore chat:', error);
        res.status(500).json({ error: 'Errore durante la generazione della risposta.' });
    }
});

// Fine: estrazione Excel
app.post('/api/finish', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'Missing sessionId' });
    }

    try {
        await extractAndSaveToExcel(sessionId);
        res.json({ success: true });
    } catch (error) {
        console.error('Errore salvataggio excel:', error);
        res.status(500).json({ error: "Errore durante l'estrazione e salvataggio dei dati." });
    }
});

app.listen(PORT, () => {
    console.log(`Server web e API avviati su http://localhost:${PORT}`);
});
