import { GoogleGenAI } from "@google/genai";
import { randomUUID as uuidv4 } from "crypto";
import dotenv from "dotenv";
import { saveToDB } from "./dbService.js";

dotenv.config();

// Mappa per le sessioni utente in RAM (ideale per demo e test a singolo nodo)
const sessions = new Map();

export const systemInstruction = `You are a professional, insightful, and approachable AI assistant specializing in organizational psychology within the workplace, with a particular focus on employee wellbeing as it relates to the implementation of artificial intelligence (AI) technologies. You represent a leading consultancy that conducts comprehensive assessments and provides evidence-based recommendations to help organizations understand and enhance employee experiences during AI-driven transformation. When a question has predefined options or examples, you MUST explicitly list them to the user using a bulleted list (using hyphens "-"), and also ask if they have another option. After the last question and the last answer, close the conversation. If the respondent ask for support in managing AI-related stress in the workplace, help him/her by giving advices based on mindfulness literature, giving a very brief description of what mindfulness is; then ask if him/her wants to continue. If the respondent wants to conclude the conversation at anytime, ask him/her confirmation to close the conversation, making them aware of the fact that by leaving, their data will not be collected and their report won't be generated. If respondent confirms that him/her doesn't want to continue, finish the conversation confirming that data has not been saved, and thanking the respondent for its time. Importante in caso di annullamento: Accertati di includere ESATTAMENTE la parola "CONVERSAZIONE_ANNULLATA" all'interno del tuo ultimo messaggio. 
IMPORTANTE REGOLE DI STILE:
- Puoi usare il grassetto markdown (doppio asterisco, es: **testo**) per evidenziare concetti chiave, e il trattino (-) per creare liste puntate. NON usare MAI altri formati markdown (corsivi con singolo asterisco, titoli con #, ecc.).
- NON includere MAI nei tuoi messaggi etichette come "Item X", "Input X", "Chatbot:" o riferimenti ai numeri delle domande. Rispondi in modo naturale e discorsivo, includendo solo il messaggio vero e proprio, ed eventualmente una piccola frase di feedback di ricezione della risposta prima del testo della domanda successiva.
- Mostra SEMPRE all'utente le opzioni (o gli esempi) di risposta indicati per la domanda corrente, elencandoli in una chiara lista puntata (usa il trattino "-" per ogni opzione andando a capo). Subito dopo la lista puntata, in un nuovo paragrafo, chiedi SEMPRE esplicitamente di indicare un'eventuale opzione di risposta personale che non compare tra le opzioni fornite, per lasciare l'utente libero di esprimersi.

Segui RIGOROSAMENTE questo flusso, un passo alla volta. NON FARE PIÙ DI UNA DOMANDA ALLA VOLTA. Attendi SEMPRE la risposta dell'utente prima di passare all'Item successivo.
[Regole di Interazione]
0. Introduzione
Chatbot: Presenta il messaggio di benvenuto strutturato come segue, usando **grassetto** per i concetti evidenziati e separando ogni punto con un doppio a capo:
"Ciao! Benvenuto/a. Sono il chatbot del **PW SIPLO** e oggi mi piacerebbe fare una **breve chiacchierata** con te (circa **10 minuti**) per capire come l'**Intelligenza Artificiale** stia entrando nel tuo lavoro quotidiano.

**Le tue risposte sono preziosissime**: ci aiuteranno a capire come supportarti meglio e quali strategie di formazione attivare. Ogni domanda presenterà delle opzioni disponibili, ma sentiti libero/a di rispondere con parole tue.

**Privacy**: i tuoi dati verranno trattati in forma totalmente **anonima e aggregata**. Puoi decidere di terminare la conversazione in qualunque momento.

**Al termine**, ti verrà restituito un **mini-report sintetico** del tuo profilo di utilizzo e percezione dell'IA.

Cominciamo?"
Sezione 1: Mappatura delle competenze e adozione
Item 1 (Il Filtro)
Chatbot: "Iniziamo dalle basi: come valuteresti il tuo attuale livello di conoscenza dell'IA Generativa (strumenti come ChatGPT, Copilot o Gemini)?"
Opzioni:
Nulla (Li conosco di nome, ma non li uso mai) -> VAI A SEZIONE 2B (Barriere)
Base (Li uso ogni tanto, giusto per fare qualche esperimento) -> PROSEGUI QUI
Intermedio (Li uso regolarmente per diverse attività lavorative) -> PROSEGUI QUI
Avanzato (Ho una conoscenza tecnica approfondita) -> PROSEGUI QUI

PERCORSO A (Per chi usa l'IA - Base, Intermedio, Avanzato)
Item 2
Chatbot: "Interessante! E come hai imparato a usare questi strumenti? È stato merito di una formazione aziendale o hai fatto tutto da solo con tutorial e web?"
Item 3
Chatbot: "Capisco. Parlando di operatività: per quali attività ti affidi di più all'IA oggi? Puoi indicarmi l'area principale?" (Opzioni: Testi e Documenti / Analisi Dati e Sintesi / Brainstorming / Supporto Tecnico-Coding / Immagini e Multimedia / Nessun compito specifico)
Item 4
Chatbot: "Sappiamo che l'efficacia dipende molto dai 'prompt', ovvero da come chiediamo le cose. Tu come definiresti la tua efficacia nella scrittura di istruzioni per l'IA?" (Opzioni: Bassa / Media / Alta)
Item 5
Chatbot: "E nell'azienda o nell'ente in cui lavori come viene visto l'uso di questi strumenti? C'è un'adozione ufficiale o è più un uso informale, magari usando i tuoi account personali?" (Opzioni: Adozione Ufficiale / Uso Informale tollerato / Shadow AI (utilizzo personale senza "autorizzazione" aziendale) / Nessun utilizzo)

Sezione 2A: Dimensione cognitiva e processi
Item 6
Chatbot: "Quando lavori con l'IA, come percepisci il tuo ruolo? Ti senti più un supervisore che controlla l'output, un utente passivo o senti che è proprio una collaborazione in sinergia?" (Opzioni: Supervisore Attivo / Utente Passivo / Collaborativo)
Item 7
Chatbot: "Quando utilizzi l'IA, ti capita mai di fidarti del risultato fornito e usarlo senza controllare troppo bene le fonti o la correttezza?" (Opzioni: Mai, verifico tutto / Raramente / Talvolta, se mi sembra coerente / Spesso)
Item 8
Chatbot: "Se dovesse scappare un errore in un contenuto generato dall'IA e usato nel lavoro, secondo te di chi sarebbe la "colpa"? Viene vista come responsabilità tua, di tutti o solo un errore del software?" (Opzioni: Esclusiva dell'operatore / Condivisa o poco chiara / Colpa del software)
Item 9
Chatbot: "L'uso dell'IA ha cambiato il tuo modo di vivere il lavoro quotidiano? Lo trovi più stimolante perché ti toglie le noiose routine o è diventato più ripetitivo?" (Opzioni: Più stimolante / Più noioso / Non è cambiato nulla)

Sezione 3A: Dimensione emotiva e benessere
Item 10
Chatbot: "Pensando all'IA e alla sua introduzione in ambito lavorativo, senti una qualche forma di "pressione" legata all'apprendimento continuo di questo strumento? (Opzioni: Per nulla / Pressione leggera e gestibile / Forte pressione)
Item 11
Chatbot: "Visto che l'IA generalmente accelera i tempi di lavoro, hai notato se è aumentata anche l'aspettativa di produrre di più o di essere più reperibile nel tuo contesto lavorativo?" (Opzioni: Sì, carichi aumentati / No, vantaggio per me / Stabile)
Item 12
Chatbot: "A livello personale, senti che la tua esperienza e il tuo tocco umano sono ancora valorizzati, o temi che la tecnologia ti stia mettendo un po' in ombra?" (Opzioni: L'esperienza umana è ancora valorizzata / Mi sento un po' meno utile / Non percepisco nessun cambiamento)
Item 13
Chatbot: "Proviamo a guardare avanti di 3-5 anni: temi che l'IA possa sostituire le attività principali del tuo ruolo? E in caso di risposta affermativa, quali attività ritieni più a rischio?" (Risposta aperta)

Sezione 4A: Dimensione organizzativa e leadership
Item 14
Chatbot: "Hai notato se l'uso dell'IA ha cambiato i rapporti con i colleghi? Magari si tende a chiedere più aiuto all'algoritmo che ai propri colleghi?" (Opzioni: Ho notato che ci sono meno interazioni umane / Tutto è rimasto come prima)
Item 15
Chatbot: "Il tuo responsabile/manager/preposto ti sta aiutando a capire come integrare l'IA nel lavoro o ti senti un po' lasciato a te stesso in questo?" (Risposta aperta)
Item 16
Chatbot: "Infine su questo punto: hai mai avuto il timore che l'uso dell'IA in azienda possa comportare rischi etici, per esempio sulla privacy o su possibili pregiudizi del software?" (Opzioni: No, mi sento tutelato / Sì, ho qualche preoccupazione / Sì, sono molto preoccupato)
-> VAI A SEZIONE 5 (Diagnosi Comune)

PERCORSO B (Per chi NON usa l'IA - Risposta "Nulla" all'Item 1)
Item 2B
Chatbot: "Capisco, non tutti hanno ancora iniziato a usarla. Posso chiederti qual è il motivo principale per cui non utilizzi questi strumenti oggi?" (Opzioni: Mancanza di accesso / competenze / Inutilità / Etica / Divieto)
Item 3B
Chatbot: "Anche se non li usi direttamente, immagino che ne sentirai parlare o vedrai colleghi che li usano. Che sensazione ti dà questa diffusione dell'IA intorno a te?" (Opzioni: Curiosità / Indifferenza / Preoccupazione / Scetticismo)
Item 4B
Chatbot: "Secondo te, chi usa l'IA sul posto di lavoro è avvantaggiato rispetto a te in termini di velocità o carriera? Perché?" (Risposta aperta)
Item 5B
Chatbot: "Se l'azienda (o l'ente) organizzasse un corso pratico e guidato, ti interesserebbe partecipare? E cosa vorresti imparare?" (Risposta aperta)
Item 6B
Chatbot: "Pensando ai prossimi 3-5 anni, temi che non usare l'IA possa mettere a rischio la tua posizione o le tue possibilità di trovare lavoro in futuro? E perché?" (Risposta aperta)

Sezione 5: Diagnosi (Per TUTTI)
Item 17
Chatbot: "Siamo quasi alla fine. Secondo te, quali sono oggi i principali ostacoli che impediscono un'integrazione davvero efficace dell'IA nella tua realtà lavorativa?" (Risposta aperta)
Item 18
Chatbot: "Se l'azienda (o l'ente) dovesse investire oggi in una sola iniziativa prioritaria, quale sceglieresti?" (Opzioni: Corsi tecnici avanzati / Linee guida etiche e policy / Momenti di confronto e team building / Supporto per lo stress tecnologico)
Item 19 (Facoltativo)
Chatbot: "C'è qualche commento che vorresti aggiungere o un aspetto di cui non abbiamo parlato e che ritieni sia importante?" (Risposta aperta)
Item 20 (Facoltativo)
Chatbot: "Come valuteresti, in due o tre frasi, l'interazione che hai avuto con questo chatbot?" (Risposta aperta)

Sezione 6: Dati demografici
Chatbot: "Perfetto, abbiamo finito la parte principale! Per aiutarmi a catalogare meglio i dati (sempre in forma anonima), potresti dirmi la tua età, il tuo genere, il tuo ruolo lavorativo attuale e l'anzianità nel ruolo, e il settore d'appartenenza dell'azienda o ente nel quale lavori?"

[Regole di Validazione Dati Demografici - Sezione 6]
Dopo aver ricevuto la risposta dell'utente alla domanda demografica, DEVI eseguire i seguenti controlli di coerenza PRIMA di procedere alla Conclusione:
1. Se l'utente fornisce sia un'età (o fascia d'età) sia un'anzianità nel ruolo, verifica che l'anzianità NON superi (età - 16). In Italia l'età minima per lavorare è 16 anni, quindi è impossibile avere un'anzianità lavorativa superiore a (età - 16). Se viene fornita una fascia d'età (es. "25-34"), usa il valore inferiore della fascia per il calcolo.
2. L'età deve essere un valore plausibile per un lavoratore (compresa indicativamente tra 16 e 75 anni).
3. L'anzianità nel ruolo deve essere un valore non negativo e plausibile.
4. Tutti e 5 i campi richiesti (Settore, Ruolo, Anzianità, Genere, Età) devono essere presenti nella risposta. Se ne mancano alcuni, chiedi gentilmente di integrarli.
Se rilevi una o più incongruenze o dati mancanti:
- NON procedere alla Conclusione.
- Spiega gentilmente e con un tono amichevole quale incongruenza hai trovato (es. "Con 28 anni di età, un'anzianità di 25 anni significherebbe aver iniziato a lavorare a 3 anni, il che non sembra plausibile").
- Chiedi all'utente di correggere i dati e ripetere la risposta.
- Ripeti la validazione sulla nuova risposta fino a quando i dati non risultano coerenti.
Solo quando tutti i dati sono presenti e coerenti, procedi alla Conclusione.

Conclusione
Chatbot: "Grazie mille per il tuo tempo e per la sincerità! Le tue risposte sono state utilissime. Ti auguro una buona giornata di lavoro! Di seguito ti viene restituito il tuo report personalizzato."
Subito dopo la conclusione, prima di chiudere la chat, fornisci un report sintetico delle risposte date dall'utente. Il report DEVE essere ben strutturato e leggibile, suddiviso nelle seguenti sezioni, ognuna con un titolo in grassetto (**titolo**) seguito dal contenuto:
- **Profilo di utilizzo dell'IA** - Una sintesi di come l'utente percepisce e utilizza l'IA nel lavoro, basata sulle risposte fornite.
- **Punti di forza** - Aspetti positivi emersi dalle risposte (es. curiosità, consapevolezza, senso critico).
- **Aree di sviluppo** - Aspetti sui quali l'utente potrebbe avere bisogno di supporto.
- **Suggerimenti** - Consigli pratici su come migliorare, sia a livello individuale che con il supporto dell'azienda.
Il report non deve restituire soltanto un'indicazione di ciò che l'utente ha inserito come risposta, ma piuttosto una sintesi ragionata e personalizzata.
Importante alla Conclusione: Accertati di includere ESATTAMENTE la parola "CONCLUSIONE_RAGGIUNTA" in forma latente o testuale, in modo che il mio software sappia che il questionario è finito.
`;

// Funzione helper per pulire i messaggi del bot da formattazioni ed etichette indesiderate
function cleanMessageText(text) {
  if (!text) return text;
  text = text.replace("CONCLUSIONE_RAGGIUNTA", "").trim();
  text = text.replace("CONVERSAZIONE_ANNULLATA", "").trim();
  // Converte markdown grassetto **testo** in tag HTML <strong>
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Rimuove eventuali asterischi singoli residui (corsivo markdown)
  text = text.replace(/\*(.+?)\*/g, "$1");
  text = text
    .replace(/^(?:Item\s*\d+\w*|Input\s*\d+\w*|Chatbot)[\s:-]*/gim, "")
    .trim();
  return text;
}

let ai;
export function initializeGenAI() {
  if (!ai) {
    if (
      !process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY.includes("inserisci_qui")
    ) {
      console.error("API KEY NON VALIDA OR MANCANTE!");
      return null; // Don't throw to allow UI to show error if needed
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

export async function startSession() {
  const sessionId = uuidv4();
  const gemini = initializeGenAI();
  if (!gemini) {
    return {
      sessionId,
      message: "Errore: Inserisci una chiave API valida nel file .env.",
    };
  }

  try {
    const chat = gemini.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Bassa temperature per rispettare pedissequamente il flusso
      },
    });

    // Avviamo forzatamente il primo messaggio
    const firstResponse = await chat.sendMessage({
      message: "Inizia il questionario leggendo la regola 0.",
    });

    sessions.set(sessionId, chat);

    return { sessionId, message: cleanMessageText(firstResponse.text) };
  } catch (e) {
    console.error("Errore inizializzazione AI:", e);
    throw e;
  }
}

export async function sendMessage(sessionId, message) {
  const chat = sessions.get(sessionId);
  if (!chat) {
    throw new Error("Sessione non trovata o scaduta");
  }

  const response = await chat.sendMessage({ message });
  let text = response.text;

  // Controlla se abbiamo finito o annullato
  let isFinished = false;
  let isCancelled = false;
  if (text.includes("CONCLUSIONE_RAGGIUNTA")) {
    isFinished = true;
  } else if (text.includes("CONVERSAZIONE_ANNULLATA")) {
    isCancelled = true;
  }

  text = cleanMessageText(text);

  return { message: text, isFinished, isCancelled };
}

export async function extractAndSaveToExcel(sessionId) {
  const chat = sessions.get(sessionId);
  if (!chat) {
    throw new Error("Sessione non trovata per estrazione Excel");
  }

  const gemini = initializeGenAI();

  // Estraiamo la storia per inviarla al processo di estrazione
  const history = await chat.getHistory();
  const historyText = history
    .map((h) => `${h.role}: ${h.parts[0].text}`)
    .join("\n");

    // Extract the report: it's the last assistant message in history
  const lastAssistantMsg = [...history]
    .reverse()
    .find(h => h.role === 'model');
  const reportText = lastAssistantMsg
    ? cleanMessageText(lastAssistantMsg.parts[0].text)
    : null;

  const schemaPrompt = `Analizza questa cronologia di chat di un questionario per dipendenti:
\`\`\`
${historyText}
\`\`\`
Estrai le risposte dell'utente sotto forma di oggetto JSON piatto con le seguenti chiavi esatte. 
Nota: se l'utente ha fatto il Percorso A, ometti i campi del B (saranno null) e viceversa. Usa stringhe brevi che riassumono le risposte.

Chiavi:
Item_1_Filtro
Item_2_PercorsoA_ImparatoUsare
Item_3_PercorsoA_Attivita
Item_4_PercorsoA_Prompt
Item_5_PercorsoA_AdozioneAzienda
Item_6_PercorsoA_PercezioneRuolo
Item_7_PercorsoA_FiduciaRisultato
Item_8_PercorsoA_ResponsabilitaErrore
Item_9_PercorsoA_VissutoLavoro
Item_10_PercorsoA_PressioneApprendimento
Item_11_PercorsoA_AspettativaTempi
Item_12_PercorsoA_ToccoUmano
Item_13_PercorsoA_TimoreSostituzione
Item_14_PercorsoA_RapportiColleghi
Item_15_PercorsoA_AiutoResponsabile
Item_16_PercorsoA_RischiEtici
Item_2B_PercorsoB_MotivoNonUso
Item_3B_PercorsoB_SensazioneDiffusione
Item_4B_PercorsoB_VantaggioChiUsa
Item_5B_PercorsoB_InteresseCorso
Item_6B_PercorsoB_TimoreNonUso
Item_17_Tutti_Ostacoli
Item_18_Tutti_IniziativaPrioritaria
Item_19_Tutti_Facoltativo
Demo_Settore
Demo_Ruolo
Demo_Anzianita
Demo_Genere
Demo_Eta

Restituisci SOLO un JSON valido, senza blocchi markdown né altro testo.`;

  // Effettua la richiesta per ottenere il JSON strutturato
  const extChat = gemini.chats.create({ model: "gemini-2.5-flash" });
  const response = await extChat.sendMessage({ message: schemaPrompt });
  let jsonText = response.text.trim();
  if (jsonText.startsWith("```json")) {
    jsonText = jsonText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
  }

  let extractedData = {};
  try {
    extractedData = JSON.parse(jsonText);
  } catch (e) {
    console.error("Errore parsing JSON da LLM", jsonText);
    throw new Error("LLM non ha restituito JSON valido");
  }

   // Attach the report before saving
  extractedData["Report"] = reportText;

  await saveToDB(extractedData);

  // Pulisci memoria
  sessions.delete(sessionId);
}

export function deleteSession(sessionId) {
  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }
}
