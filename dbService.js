import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;

// Carica le variabili d'ambiente prima di creare il pool
dotenv.config();

// Pool di connessioni riutilizzabile per tutta la vita del server
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Inserisce una riga di risposte nella tabella `risposte`.
 * @param {Object} data - Oggetto JSON con le chiavi estratte da Gemini
 */
export async function saveToDB(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);

    // Costruisce dinamicamente la query INSERT in base alle chiavi presenti
    const columnNames = columns.map(c => `"${c}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO risposte (${columnNames}) VALUES (${placeholders})`;

    try {
        await pool.query(query, values);
        console.log('[DB] Risposta salvata nel database con successo.');
    } catch (err) {
        console.error('[DB] Errore durante il salvataggio:', err.message);
        throw err;
    }
}
