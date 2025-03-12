// main.js
import OpenAI from "openai";
import promptSync from "prompt-sync";
import fs from "fs";
import Task from "./lib/task.js";

// prompt-sync initialisieren
const prompt = promptSync();

// OpenAI initialisieren (API-Key wird z.B. über die .env-Datei geladen)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Farben für die Konsolenausgabe (ANSI-Escape-Codes)
const cyan = "\x1b[36m%s\x1b[0m"; // Eingabeaufforderungen
const yellow = "\x1b[33m%s\x1b[0m"; // Kategorienliste
const green = "\x1b[32m%s\x1b[0m"; // Erfolgsmeldungen
const red = "\x1b[31m%s\x1b[0m"; // Fehlermeldungen

// Kategorien werden in einem Array gespeichert (in einer Datei "categories.json")
let storedCategories = [];
const categoriesFile = "./categories.json";
if (fs.existsSync(categoriesFile)) {
  try {
    const data = fs.readFileSync(categoriesFile, "utf8");
    storedCategories = JSON.parse(data);
  } catch (err) {
    console.error(red, "Fehler beim Laden der Kategorien:", err);
  }
}

// Interaktive Task-Erstellung starten
while (true) {
  const action = consoleLogAndInput(
    cyan,
    "Möchtest du eine Aufgabe erstellen (1) oder eine Aufgabe lesen (2)? drücke 'q' zum Beenden):"
  );

  if (action === "q") {
    break;
  }
  if (action === "1") {
    await createTask();
  } else if (action === "2") {
    await readTask();
  } else {
    console.log(red, "Ungültige Eingabe. Bitte wähle 1 oder 2.");
  }
}

/**
 * Erzeugt interaktiv eine Aufgabe.
 */
async function createTask() {
  // 1. Name abfragen
  const name = consoleLogAndInput(cyan, "Bitte gib den Namen der Aufgabe ein:");

  // 2. Beschreibung (direkt nach dem Namen)
  const description = consoleLogAndInput(
    cyan,
    "Bitte gib die Beschreibung der Aufgabe ein:"
  );

  // 3. Deadline abfragen (Eingabe kann umgangssprachlich erfolgen)
  const deadlineInput = consoleLogAndInput(
    cyan,
    "Bitte gib das Fälligkeitsdatum ein (z.B. 'morgen', 'nächste Woche Dienstag' oder im Format YYYY-MM-DD):"
  );

  const normalizedDeadline = await normalizeDate(deadlineInput);

  // 4. Status abfragen
  const status = consoleLogAndInput(
    cyan,
    "Bitte gib den Status der Aufgabe ein (z.B. offen, in Bearbeitung, abgeschlossen):"
  );

  // // 5. Kategorie-Vorschlag: Kurzer Vorschlag (max. 2 Worte) basierend auf dem Namen
  const category = await categoriesInput();

  // 6. Verantwortliche Personen abfragen
  const responsiblePersons = consoleLogAndInput(
    cyan,
    "Bitte gib die Namen der verantwortlichen Personen ein (kommasepariert):"
  )
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");

  // Neues Task-Objekt erstellen
  const newTask = new Task(
    name,
    description,
    normalizedDeadline,
    status,
    category,
    responsiblePersons
  );

  // Aufgabe anzeigen
  console.log(green, "\nErstellte Aufgabe:");
  console.log(newTask);

  // Export the task to a JSON file
  const taskJson = JSON.stringify(newTask, null, 2);
  const taskFileName = `task_${newTask.name.toLowerCase()}_${newTask.responsiblePersons
    .toString()
    .toLowerCase()}.json`; // Unique filename based on task name and responsible persons
  fs.writeFileSync(taskFileName, taskJson, "utf8");
  console.log(green, `Aufgabe wurde in ${taskFileName} exportiert.`);
}

//Asks User for Name and responsible Person and reads the Task from the JSON file
async function readTask() {
  const name = consoleLogAndInput(
    cyan,
    "Bitte wähle den Namen der Aufgabe aus:"
  );

  const responsiblePersons = consoleLogAndInput(
    cyan,
    "Bitte wähle die Person der Aufgabe aus:"
  );

  const fileName = `task_${name.toLowerCase()}_${responsiblePersons.toLowerCase()}.json`;

  try {
    const data = await fs.readFileSync(fileName, "utf8");
    const jsonData = JSON.parse(data); // Parse JSON string into an object
    console.log("JSON data:", jsonData);
  } catch (err) {
    console.log(red,'Fehler beim Lesen der Datei');
  }
}

function consoleLogAndInput(color, promptText) {
  console.log(color, promptText);
  const input = prompt(">>> ").trim();
  return input;
}

async function categoriesInput() {
  // 5. Kategorie-Vorschlag: Kurzer Vorschlag (max. 2 Worte) basierend auf dem Namen
  const categoryPrompt = `Gib mir bitte eine kurze, prägnante Kategorie (maximal 2 Worte) basierend auf dem Aufgabennamen "${name}".`;
  let suggestedCategory = "";
  try {
    const categoryCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: categoryPrompt }],
    });
    suggestedCategory = categoryCompletion.choices[0].message.content.trim();
    // Falls der Vorschlag sehr lang ist, nehmen wir nur die ersten zwei Worte:
    const shortSuggestion = suggestedCategory.split(" ").slice(0, 2).join(" ");
    suggestedCategory = shortSuggestion;
  } catch (err) {
    console.error(red, "Fehler beim Abrufen des Kategorie-Vorschlags:", err);
    // Fallback: leeren String verwenden
    suggestedCategory = "";
  }

  // Falls bereits Kategorien vorhanden sind, diese anzeigen:
  if (storedCategories.length > 0) {
    console.log(yellow, "Verfügbare Kategorien:");
    storedCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat}`);
    });
  }

  console.log(cyan, `Vorgeschlagene Kategorie: ${suggestedCategory}`);

  const categoryInput = consoleLogAndInput(
    cyan,
    "Bitte wähle eine Kategorie aus (Tippe die Nummer, den Namen oder drücke Enter, um den Vorschlag zu übernehmen):"
  );

  let category = "";
  if (
    storedCategories.length > 0 &&
    categoryInput !== "" &&
    !isNaN(categoryInput)
  ) {
    // Wenn Kategorien vorhanden sind und der Nutzer eine Nummer eingibt:
    const index = parseInt(categoryInput, 10) - 1;
    if (index >= 0 && index < storedCategories.length) {
      category = storedCategories[index];
    } else {
      category = suggestedCategory;
    }
  } else {
    // Falls der Nutzer etwas anderes eingibt oder Enter drückt:
    category = categoryInput === "" ? suggestedCategory : categoryInput;
  }

  // Kategorie speichern, falls sie noch nicht vorhanden ist (aber nur, wenn sie nicht leer ist)
  if (category && !storedCategories.includes(category)) {
    storedCategories.push(category);
    try {
      fs.writeFileSync(
        categoriesFile,
        JSON.stringify(storedCategories, null, 2),
        "utf8"
      );
      console.log(green, "Kategorie gespeichert.");
    } catch (err) {
      console.error(red, "Fehler beim Speichern der Kategorien:", err);
    }
  }
  return category;
}

/**
 * Normalisiert ein Datum, das in umgangssprachlichen Begriffen eingegeben wurde,
 * mithilfe der OpenAI-API in das Format YYYY-MM-DD.
 * @param {string} dateInput - Die Benutzereingabe für das Datum.
 * @returns {string} Das Datum im Format YYYY-MM-DD.
 */
async function normalizeDate(dateInput) {
  // Heutiges Datum im Format YYYY-MM-DD ermitteln
  const today = new Date().toISOString().slice(0, 10); // z.B. "2025-02-12"

  // Den Prompt so formulieren, dass er den heutigen Tag als Referenz nennt
  const promptText = `Angenommen, heute ist ${today}. Konvertiere folgende Datumsangabe in das Format YYYY-MM-DD: "${dateInput}". Gib ausschließlich das Datum im Format YYYY-MM-DD zurück.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: promptText }],
    });
    const normalizedDate = completion.choices[0].message.content.trim();
    return normalizedDate;
  } catch (err) {
    console.error("Fehler bei der Datumskonvertierung:", err);
    // Fallback: Rückgabe der Originaleingabe
    return dateInput;
  }
}
