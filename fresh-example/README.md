# HENDRIKS-RTE Fresh Example

Dieses Beispiel zeigt, wie der HENDRIKS-RTE Editor in einer Fresh Framework Anwendung verwendet wird.

## Setup

### Dependencies

Die notwendigen Dependencies sind bereits in `deno.json` konfiguriert:
- `preact/compat` - React-Kompatibilität für Preact
- `@iconify-icon/preact` - Icons für Preact

### Vite Config

Die `vite.config.ts` enthält Aliases, die React automatisch durch Preact ersetzen:
- `react` → `preact/compat`
- `react-dom` → `preact/compat`
- `@iconify/react` → `@iconify-icon/preact`

## Verwendung

### Starten

```bash
deno task dev
```

Dann öffne:
- Homepage: http://localhost:8000
- Editor: http://localhost:8000/editor

## Struktur

- `islands/EditorIsland.tsx` - Editor als Fresh Island (Client-seitige Interaktivität)
- `routes/editor.tsx` - Route für den Editor
- `static/rte.css` - CSS für den Editor

## Wichtige Hinweise

1. **Islands**: Der Editor muss als Island verwendet werden, da er Client-seitige Interaktivität benötigt
2. **CSS**: Das CSS wird in `routes/_app.tsx` importiert
3. **Preact Compat**: React wird automatisch durch Preact ersetzt via Vite Aliases

Siehe auch: `FRESH_INTEGRATION.md` für detaillierte Informationen.
