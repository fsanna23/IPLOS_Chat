import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_FILE_PATH = path.join(process.cwd(), 'dati_dipendenti.xlsx');

export async function saveToExcel(jsonData) {
    const workbook = new ExcelJS.Workbook();
    let worksheet;

    if (fs.existsSync(EXCEL_FILE_PATH)) {
        await workbook.xlsx.readFile(EXCEL_FILE_PATH);
        worksheet = workbook.getWorksheet('Dati Dipendenti') || workbook.addWorksheet('Dati Dipendenti');
    } else {
        worksheet = workbook.addWorksheet('Dati Dipendenti');
        // Impostiamo l'intestazione
        worksheet.columns = Object.keys(jsonData).map(key => ({
            header: key,
            key: key,
            width: 30
        }));
    }

    // Aggiungo la nuova riga
    worksheet.addRow(jsonData);
    
    // Salvo il file
    await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
    console.log('[ExcelService] Dati salvati con successo in', EXCEL_FILE_PATH);
}
