// task.js
export default class Task {
  /**
   * Erstellt eine neue Aufgabe.
   * @param {string} name - Der Name der Aufgabe.
   * @param {string} description - Die Beschreibung der Aufgabe.
   * @param {string|Date} deadline - Das Fälligkeitsdatum (als Date-Objekt oder Datumsstring).
   * @param {string} status - Der Status der Aufgabe (z.B. "offen", "in Bearbeitung", "abgeschlossen").
   * @param {string} category - Die Kategorie der Aufgabe.
   * @param {Array<string>} responsiblePersons - Ein Array mit den Namen der verantwortlichen Personen.
   */
  constructor(
    name,
    description,
    deadline,
    status,
    category,
    responsiblePersons = []
  ) {
    this.name = name;
    this.description = description;
    // Wir erwarten hier ein Datum im Format YYYY-MM-DD, also wandeln wir es in ein Date-Objekt um:
    this.deadline = deadline instanceof Date ? deadline : new Date(deadline);
    this.status = status;
    this.category = category;
    this.responsiblePersons = responsiblePersons;
  }
}
