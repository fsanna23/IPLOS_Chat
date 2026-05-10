import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sendMessage, startSession, extractAndSaveToExcel, deleteSession } from './services/chatService.js';
import { checkSupabaseConnection } from './services/dbService.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check — verifies Supabase is reachable before the chat is allowed to start
app.get('/api/health', async (req, res) => {
    const status = await checkSupabaseConnection();
    if (status.ok) {
        res.json({ ok: true });
    } else {
        res.status(503).json({ ok: false, error: status.error });
    }
});

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

// Annulla sessione
app.post('/api/cancel', (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'Missing sessionId' });
    }
    deleteSession(sessionId);
    res.json({ success: true });
});

app.listen(PORT, async () => {
    console.log(`Server web e API avviati su http://localhost:${PORT}`);
    const status = await checkSupabaseConnection();
    if (status.ok) {
        console.log('[DB] Supabase connesso e pronto.');
    } else {
        console.warn('[DB] Attenzione: Supabase non raggiungibile:', status.error);
    }
});