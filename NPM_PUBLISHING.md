# NPM Publishing Guide

## Optionen für das Publishing

### 1. Öffentlich auf npm (kostenlos)

-   Jeder kann das Paket installieren
-   `npm install hendriks-rte`
-   Kostenlos, aber öffentlich sichtbar

### 2. Privat auf npm (kostenpflichtig)

-   Nur deine Firma/Organisation kann es installieren
-   `npm install @deine-firma/hendriks-rte`
-   Ab $7/Monat pro Benutzer

### 3. GitHub Packages (kostenlos für private repos)

-   Integriert mit GitHub
-   `npm install @github-username/hendriks-rte`
-   Kostenlos für private Repos

### 4. Private npm Registry (selbst gehostet)

-   Vollständige Kontrolle
-   Eigenes Hosting erforderlich

---

## Option 1: Öffentlich auf npm publishen

### Vorbereitung

1. **npm Account erstellen:**

    ```bash
    npm adduser
    # oder
    npm login
    ```

2. **package.json anpassen:**

    ```json
    {
        "name": "hendriks-rte",
        "version": "1.0.0",
        "author": "Dein Name <deine@email.com>",
        "license": "MIT",
        "repository": {
            "type": "git",
            "url": "https://github.com/dein-username/hendriks-rte.git"
        },
        "bugs": {
            "url": "https://github.com/dein-username/hendriks-rte/issues"
        },
        "homepage": "https://github.com/dein-username/hendriks-rte#readme"
    }
    ```

3. **Build erstellen:**

    ```bash
    npm run build
    ```

4. **Publishen:**

    ```bash
    npm publish
    ```

5. **Version updaten:**
    ```bash
    npm version patch  # 1.0.0 -> 1.0.1
    npm version minor  # 1.0.0 -> 1.1.0
    npm version major  # 1.0.0 -> 2.0.0
    npm publish
    ```

---

## Option 2: Privat auf npm (npm Organizations)

### Setup

1. **npm Organization erstellen:**

    - Gehe zu https://www.npmjs.com/org/create
    - Erstelle eine Organisation (z.B. `@deine-firma`)

2. **package.json anpassen:**

    ```json
    {
        "name": "@deine-firma/hendriks-rte",
        "version": "1.0.0",
        "publishConfig": {
            "access": "restricted"
        }
    }
    ```

3. **Team-Mitglieder hinzufügen:**

    ```bash
    npm team add deine-firma:developers username
    ```

4. **Publishen:**

    ```bash
    npm publish
    ```

5. **In anderen Projekten installieren:**
    ```bash
    npm install @deine-firma/hendriks-rte
    ```

**Kosten:** Ab $7/Monat pro Benutzer (für private packages)

---

## Option 3: GitHub Packages (Empfohlen für private)

### Setup

1. **GitHub Token erstellen:**

    - GitHub → Settings → Developer settings → Personal access tokens
    - Token mit `write:packages` und `read:packages` Berechtigung erstellen

2. **.npmrc erstellen:**

    ```bash
    # In deinem Projekt
    echo "@dein-username:registry=https://npm.pkg.github.com" >> .npmrc
    echo "//npm.pkg.github.com/:_authToken=DEIN_TOKEN" >> .npmrc
    ```

3. **package.json anpassen:**

    ```json
    {
        "name": "@dein-username/hendriks-rte",
        "version": "1.0.0",
        "publishConfig": {
            "registry": "https://npm.pkg.github.com"
        },
        "repository": {
            "type": "git",
            "url": "https://github.com/dein-username/hendriks-rte.git"
        }
    }
    ```

4. **Publishen:**

    ```bash
    npm publish
    ```

5. **In anderen Projekten installieren:**

    ```bash
    # .npmrc im Projekt erstellen:
    @dein-username:registry=https://npm.pkg.github.com
    //npm.pkg.github.com/:_authToken=DEIN_TOKEN

    npm install @dein-username/hendriks-rte
    ```

**Kosten:** Kostenlos für private Repos!

---

## Option 4: Lokales/Internes Publishing (ohne Registry)

### Option A: Git URL

1. **Repository auf GitHub/GitLab/etc. erstellen**

2. **package.json anpassen:**

    ```json
    {
        "name": "hendriks-rte",
        "version": "1.0.0"
    }
    ```

3. **In anderen Projekten installieren:**
    ```bash
    npm install git+https://github.com/dein-username/hendriks-rte.git
    # oder mit Branch/Tag:
    npm install git+https://github.com/dein-username/hendriks-rte.git#main
    npm install git+https://github.com/dein-username/hendriks-rte.git#v1.0.0
    ```

### Option B: Lokales Verzeichnis

```bash
# In anderen Projekten:
npm install /pfad/zum/hendriks-rte
# oder
npm install file:../hendriks-rte
```

### Option C: Private npm Registry (Verdaccio, etc.)

1. **Verdaccio installieren:**

    ```bash
    npm install -g verdaccio
    verdaccio
    ```

2. **.npmrc anpassen:**

    ```
    registry=http://localhost:4873
    ```

3. **Publishen:**
    ```bash
    npm publish --registry http://localhost:4873
    ```

---

## Wichtige Dateien vor dem Publishing

### .npmignore (bereits vorhanden)

Stellt sicher, dass nur notwendige Dateien publisht werden:

-   `src/` wird ausgeschlossen (nur `dist/` wird publisht)
-   `example/`, `TESTING.md` werden ausgeschlossen

### README.md

Sollte vorhanden sein und dokumentieren:

-   Installation
-   Verwendung
-   API-Dokumentation
-   Beispiele

### LICENSE

Sollte vorhanden sein (z.B. MIT License)

---

## Checkliste vor dem Publishing

-   [ ] `package.json` vollständig ausgefüllt (name, version, author, description)
-   [ ] `npm run build` erfolgreich
-   [ ] `dist/` Ordner enthält alle notwendigen Dateien
-   [ ] README.md vorhanden und aktuell
-   [ ] LICENSE Datei vorhanden
-   [ ] `.npmignore` konfiguriert
-   [ ] Tests (falls vorhanden) laufen durch
-   [ ] Version in `package.json` korrekt

---

## Empfehlung

**Für interne Nutzung (Firma):**

-   **GitHub Packages** (kostenlos, einfach, integriert)
-   Oder **Git URL** (sehr einfach, keine Registry nötig)

**Für öffentliche Nutzung:**

-   **npm** (Standard, kostenlos)

**Für große Teams mit Budget:**

-   **npm Organizations** (professionell, aber kostenpflichtig)

---

## Quick Start: GitHub Packages (Privat)

```bash
# 1. GitHub Token erstellen (mit write:packages)
# 2. .npmrc erstellen:
echo "@dein-username:registry=https://npm.pkg.github.com" > .npmrc
echo "//npm.pkg.github.com/:_authToken=DEIN_TOKEN" >> .npmrc

# 3. package.json anpassen:
# "name": "@dein-username/hendriks-rte"
# "publishConfig": { "registry": "https://npm.pkg.github.com" }

# 4. Publishen:
npm publish

# 5. In anderen Projekten:
# .npmrc erstellen (wie oben)
npm install @dein-username/hendriks-rte
```
