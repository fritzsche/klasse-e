import fs from 'fs';
import path from 'path';

// --- Konfiguration: Array von Konvertierungs-Jobs ---
const conversionJobs = [
    {
        jsonPath: '50Ohm/50Ohm_NE.json',
        outputDir: 'tex_sections'
    },
    // Hier könnten später weitere JSON-Dateien hinzugefügt werden:
    // {
    //     jsonPath: 'andere_themen/andere_fragen.json',
    //     outputDir: 'tex_andere_sektionen'
    // }
];

const FRAGEN_SUBDIR = 'tex_fragen'; // Ordner, in dem die einzelnen Fragen-Dateien liegen

/**
 * Erstellt den Zielordner, falls er nicht existiert.
 * @param {string} dirPath - Der Pfad des zu erstellenden Ordners.
 */
function setupOutputDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`\x1b[32m✔ Ordner ${dirPath} erstellt.\x1b[0m`);
    }
}

/**
 * Generiert den LaTeX-Inhalt für eine Sektion.
 * @param {Array<Object>} fragenListe - Eine Liste von Fragen-Objekten (mit 'number' oder 'id').
 * @returns {string} Der LaTeX-Code.
 */
function generateLatexContent(fragenListe) {
    let content = '\\begin{description}\n';

    fragenListe.forEach(frage => {
        // Wir nehmen an, die ID ist unter dem Schlüssel 'number' (z.B. NA102)
        const frageID = frage.number; 
        
        // Erstelle den LaTeX-Befehl: \input{tex_fragen/NA102.tex}
        const inputCommand = `\\input{${FRAGEN_SUBDIR}/${frageID}.tex}`;
        
        content += `    ${inputCommand}\n`;
    });

    content += '\\end{description}\n';
    return content;
}

/**
 * Hauptfunktion zum Parsen und Generieren der Dateien für einen einzelnen Job.
 * @param {Object} job - Das Job-Objekt mit Pfad und Output-Ordner.
 */
function processConversionJob(job) {
    const { jsonPath, outputDir } = job;
    
    console.log(`\n\x1b[33m⏳ Verarbeite Job: ${jsonPath} -> ${outputDir}\x1b[0m`);

    // 1. Setup
    setupOutputDirectory(outputDir);
    
    // 2. Daten lesen
    let rawData;
    try {
        rawData = fs.readFileSync(jsonPath, 'utf8');
    } catch (error) {
        console.error(`Fehler beim Lesen von ${jsonPath}:\x1b[0m`, error.message);
        return;
    }
    
    const data = JSON.parse(rawData);
    
    // 3. Datenstruktur prüfen und vorbereiten
    if (!data.sections || !data.questions) {
        console.error(`JSON-Datei ${jsonPath} enthält nicht die erwarteten "sections" oder "questions" Felder.\x1b[0m`);
        return;
    }

    const sections = data.sections;
    const questions = data.questions;

    // 4. Fragen den Sektionen zuordnen
    // Wir verwenden eine Map, um alle Fragen für eine Sektion (Kapitel/Sektion-Kombination) zu gruppieren
    const sectionQuestionsMap = new Map();

    questions.forEach(q => {
        const key = `${q.chapter}-${q.section}`; // Key: "1-1", "1-2", etc.
        
        if (!sectionQuestionsMap.has(key)) {
            sectionQuestionsMap.set(key, []);
        }
        sectionQuestionsMap.get(key).push(q);
    });

    // 5. Dateien generieren
    let generatedFilesCount = 0;

    sections.forEach(sektion => {
        // Erzeuge den Key, der mit dem Fragen-Key übereinstimmt
        const key = `${sektion.chapter}-${sektion.section}`;
        const fragenListe = sectionQuestionsMap.get(key);
        
        if (fragenListe && fragenListe.length > 0) {
            
            // Definiere die Sektions-ID für den Dateinamen (z.B. 1-1, oder nutze den Titel)
            // Hier nutzen wir eine Kombination aus Kapitel- und Sektionsnummer für einen eindeutigen Namen:
            const sektionID = `${sektion.chapter}S${sektion.section}`; 
            const sektionTitle = sektion.section_txt; 

            // 1. Erzeuge den Dateinamen (z.B. 1S1.tex)
            const fileName = `${sektionID}.tex`;
            const filePath = path.join(outputDir, fileName);

            // 2. Erzeuge den LaTeX-Inhalt
            const latexContent = generateLatexContent(fragenListe);
            
            // Füge Header-Informationen hinzu
            const fileHeader = `% Kapitel ${sektion.chapter}, Sektion ${sektion.section}: ${sektionTitle}\n\n`;
            const finalContent = fileHeader + latexContent;

            // 3. Speichere die Datei
            fs.writeFileSync(filePath, finalContent, 'utf8');
            generatedFilesCount++;
        }
    });

    console.log(`Erfolgreich ${generatedFilesCount} Sektions-Dateien generiert.\x1b[0m`);
}

// Führe alle Jobs sequenziell aus
conversionJobs.forEach(processConversionJob);