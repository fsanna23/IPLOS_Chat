import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // use service role key on the server side
);

/**
 * Checks whether Supabase is reachable and the table is accessible.
 * @returns {{ ok: boolean, error?: string }}
 */
export async function checkSupabaseConnection() {
    try {
        const { error } = await supabase
            .from('risposte')
            .select('*')
            .limit(1);

        if (error) throw error;

        return { ok: true };
    } catch (err) {
        console.error('[DB] Supabase connection check failed:', err.message);
        return { ok: false, error: err.message };
    }
}

/**
 * Inserisce una riga di risposte nella tabella `risposte`.
 * @param {Object} data - Oggetto JSON con le chiavi estratte da Gemini
 */
export async function saveToDB(data) {
    const { error } = await supabase
        .from('risposte')
        .insert(data);

    if (error) {
        console.error('[DB] Errore durante il salvataggio:', error.message);
        throw error;
    }

    console.log('[DB] Risposta salvata nel database con successo.');
}