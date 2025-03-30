# 🧠 Task Manager CLI

Ein einfacher, benutzerfreundlicher Task-Manager für die Konsole – mit Benutzerverwaltung, Aufgabenorganisation und Adminfunktionen.

## 🚀 Installation und Start

1. **Projekt entpacken**  
   Stelle sicher, dass die `.env`-Datei im **Hauptverzeichnis** liegt.

2. **Abhängigkeiten installieren**  
   Öffne die Konsole im Hauptverzeichnis und führe aus:
   ```bash
   npm install
   ```

3. **Anwendung starten**
   ```bash
   npm start
   ```

4. **Ersten Benutzer erstellen**  
   Beim ersten Start wirst du aufgefordert, einen neuen Benutzer anzulegen:  
   - 👤 Benutzername  
   - 🔒 Passwort  
   - 🧾 Vollständiger Name  
   - 📧 E-Mail-Adresse  
   - 🎂 Geburtsdatum im Format `YYYY-MM-DD`  

   > Der erste erstellte Benutzer erhält automatisch **Admin-Rechte**.

## 🧭 Bedienung

Die Navigation erfolgt über die **Pfeiltasten** `⬆️` `⬇️`.  
Alle Menüs können mit `⬅️ Back to menu` verlassen werden, um ins Hauptmenü zurückzukehren.

## ✨ Funktionen

### 1. ➕ Neuen Task erstellen

1. Menüpunkt `➕ Add Task` auswählen und `Enter` drücken  
2. Bestätigen mit `✅ Yes, create task`  
3. Details eingeben:  
   - 📝 **Task Title**: z. B. `Projekt1`  
   - 📄 **Task Description**: z. B. `Code schreiben für Projekt`  
   - 👤 **Assign to**: Benutzername, z. B. `Benutzer1`  
   - 📂 **Select Category**: Vorhandene oder neue Kategorie wählen  
   - ⏳ **Deadline**: z. B. `morgen` oder `30.03.2024 12:00pm`

### 2. 📋 Tasks anzeigen

Unter `📋 List Tasks` werden alle Aufgaben aufgelistet.  
Sortierung nach Eigenschaften wie z. B. **Deadline** ist möglich.  
🗂 Beispiel: `Sort by Deadline` → Zeigt Tasks von "kurz vor Deadline" bis "viel Zeit verbleibend" an.

### 3. ✏️ Tasks bearbeiten

Unter `✏️ Edit Task` können bestehende Tasks geändert werden.  
Funktioniert identisch wie das Erstellen eines Tasks.

### 4. 🗑️ Tasks löschen

1. Menüpunkt `🗑️ Delete Task` wählen  
2. Task auswählen  
3. Im Bestätigungsdialog:  
   ```
   ⚠️ Are you sure you want to delete "exampletask"? (y/N)
   ```
   - Mit `y` löschen  
   - Mit `n` abbrechen

### 5. 🛠️ Admin Panel

Im Admin Panel können Admins:  
- Kategorien **anzeigen**, **erstellen**, **bearbeiten** oder **löschen**  
- Alle Tasks einer bestimmten Kategorie anzeigen  
- Alle Tasks aller Benutzer anzeigen  
- Tasks eines bestimmten Benutzers filtern

### 6. ❌ Anwendung beenden

Mit `❌ Exit` wird das Programm geschlossen.  
Benutzer und Passwörter bleiben für zukünftige Logins **gespeichert**.

## 📝 Hinweis

Dieses CLI-Tool ist ideal für kleine Teams oder Einzelpersonen, die Aufgaben effizient organisieren möchten – komplett lokal und ohne externe Abhängigkeiten.
