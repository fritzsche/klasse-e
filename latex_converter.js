// konvertieren.js

const fs = require('fs')
const path = require('path')

// Definition der Eingabedatei und des Ausgabeordners
const inputFile = path.join('Fragen', 'fragenkatalog3b.json')
const outputDir = 'tex_fragen'


function escape(text) {
    if (typeof text !== 'string') {
        return ''
    }
    let escapedText = text
 //   escapedText = escapedText.replace(/\\/g, '\\textbackslash{}')
    escapedText = escapedText.replace(/&/g, '\\&')
    escapedText = escapedText.replace(/%/g, '\\%')
//    escapedText = escapedText.replace(/\$/g, '\\$')
    escapedText = escapedText.replace(/#/g, '\\#')
    escapedText = escapedText.replace(/_/g, '\\_')
    escapedText = escapedText.replace(/{/g, '\\{')
    escapedText = escapedText.replace(/}/g, '\\}')
    escapedText = escapedText.replace(/~/g, '\\textasciitilde{}')
    escapedText = escapedText.replace(/\^/g, '\\textasciicircum{}')
    escapedText = escapedText.replace(/"/g, '""')
    return escapedText
}


// --- Hauptfunktion ---
function main() {
    // 1. Ausgabeordner erstellen, falls nicht vorhanden
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
        console.log(`Verzeichnis '${outputDir}' wurde erstellt.`)
    }

    // 2. JSON-Datei einlesen und parsen
    let allQuestionsRaw
    try {
        const fileContent = fs.readFileSync(inputFile, 'utf8')
        allQuestionsRaw = JSON.parse(fileContent)
    } catch (error) {
        console.error(`Fehler beim Lesen der Datei '${inputFile}'. Stellen Sie sicher, dass die Datei existiert und im richtigen Ordner liegt.`)
        console.error(error.message)
        return // Skript beenden bei Fehler
    }

    // 3. Alle Fragen aus der verschachtelten JSON-Struktur extrahieren
    const allQuestions = []
    const traverse = (jsonObj) => {
        if (jsonObj !== null && typeof jsonObj === "object") {
            Object.entries(jsonObj).forEach(([key, value]) => {
                if (key === 'questions') {
                    allQuestions.push(...value) // Fügt alle Fragen aus dem Array hinzu
                } else {
                    traverse(value) // Rekursiver Aufruf für andere Objekte
                }
            })
        }
    }
    traverse(allQuestionsRaw)

    // 4. Information über die Anzahl der gefundenen Fragen
    console.log(`🔎 ${allQuestions.length} Fragen insgesamt gefunden und werden verarbeitet.`);

    let filesCreated = 0
    // 5. Für JEDE Frage eine .tex-Datei erstellen
    allQuestions.forEach(question => {

        // NEU: Prüfen, ob es sich um eine Frage mit Bild handelt.
        // Der !!-Operator wandelt einen "truthy" Wert (wie einen String) in `true`
        // und einen "falsy" Wert (wie `undefined`) in `false` um.
        const hasPicture = !!question.picture_question;

        const hasPictureA = !!question.picture_a;
        // Der LaTeX-Befehl wird um den booleschen Parameter {true}/{false} erweitert
        const latexFragment =
`
\\frage{${escape(question.number)}}
    {${escape(question.question)}}
    {${escape(question.answer_a)}}
    {${escape(question.answer_b)}}
    {${escape(question.answer_c)}}
    {${escape(question.answer_d)}}
    {${hasPicture}}{${hasPictureA}}
`
        const fileName = `${question.number}.tex`
        const filePath = path.join(outputDir, fileName)

        try {
            fs.writeFileSync(filePath, latexFragment.trim(), 'utf8')
            filesCreated++
        } catch (error) {
            console.error(`Fehler beim Schreiben der Datei ${filePath}:`, error.message)
        }
    })

    console.log(`\n✅ Fertig! Es wurden ${filesCreated} .tex-Dateien im Ordner '${outputDir}' erstellt.`)
}

// Skript ausführen
main()