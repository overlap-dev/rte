# Lokales Testen

## Option 1: Mit Beispiel-Projekt (Empfohlen)

1. **Paket bauen:**

    ```bash
    npm run build
    ```

2. **In Beispiel-Verzeichnis wechseln:**

    ```bash
    cd example
    ```

3. **Dependencies installieren:**

    ```bash
    npm install
    ```

4. **Development-Server starten:**

    ```bash
    npm run dev
    ```

5. **Browser öffnen:** Öffne die URL, die im Terminal angezeigt wird (meist `http://localhost:5173`)

## Option 2: Mit npm link

1. **Im Hauptverzeichnis (hendriks-rte):**

    ```bash
    npm run build
    npm link
    ```

2. **In deinem Test-Projekt:**

    ```bash
    npm link hendriks-rte
    ```

3. **In deinem Test-Projekt verwenden:**
    ```tsx
    import { Editor } from "hendriks-rte";
    import "hendriks-rte/dist/styles.css";
    ```

## Option 3: Direkt mit file: Dependency

1. **In deinem Test-Projekt `package.json`:**

    ```json
    {
        "dependencies": {
            "hendriks-rte": "file:../hendriks-rte"
        }
    }
    ```

2. **Installieren:**

    ```bash
    npm install
    ```

3. **Nach Änderungen am Paket:**

    ```bash
    # Im hendriks-rte Verzeichnis
    npm run build

    # Im Test-Projekt
    npm install
    ```

## Development mit Watch-Mode

Für kontinuierliches Testen während der Entwicklung:

1. **Im Hauptverzeichnis (Terminal 1):**

    ```bash
    npm run dev
    ```

    Dies baut das Paket automatisch neu, wenn sich Dateien ändern.

2. **Im Beispiel-Verzeichnis (Terminal 2):**
    ```bash
    cd example
    npm run dev
    ```

## Troubleshooting

-   **Build-Fehler:** Stelle sicher, dass alle Dependencies installiert sind: `npm install`
-   **Module nicht gefunden:** Führe `npm run build` aus, bevor du testest
-   **CSS nicht geladen:** Stelle sicher, dass du `import 'hendriks-rte/dist/styles.css'` importierst
