# Preact / Fresh Framework Support

## Aktueller Status

Der Editor verwendet aktuell:

-   ✅ **React Hooks** (`useState`, `useEffect`, etc.) - **Kompatibel mit Preact**
-   ❌ **`@iconify/react`** - React-spezifisch, nicht direkt mit Preact kompatibel
-   ⚠️ **React Types** (`React.FC`, `React.ReactNode`) - Können durch Preact Types ersetzt werden

## Lösungsoptionen

### Option 1: Preact-Alias (Empfohlen für Fresh)

Erstelle eine separate Build-Konfiguration für Preact:

1. **Rollup-Alias hinzufügen:**

```js
// rollup.config.preact.js
import alias from "@rollup/plugin-alias";

export default {
    // ... andere config
    plugins: [
        alias({
            entries: [
                { find: "react", replacement: "preact/compat" },
                { find: "react-dom", replacement: "preact/compat" },
                { find: "@iconify/react", replacement: "@iconify-icon/preact" },
            ],
        }),
        // ... andere plugins
    ],
};
```

2. **Package.json anpassen:**

```json
{
    "peerDependencies": {
        "react": ">=18.0.0 || preact >=10.0.0",
        "react-dom": ">=18.0.0 || preact >=10.0.0"
    },
    "devDependencies": {
        "@iconify-icon/preact": "^1.0.0"
    }
}
```

### Option 2: Framework-agnostische Icon-Komponente

Erstelle eine Icon-Komponente, die beide Frameworks unterstützt:

```tsx
// src/utils/icon.tsx
import { h } from "preact"; // oder React

export function Icon({ icon, width = 18, height = 18 }: IconProps) {
    // Prüfe ob Preact oder React
    const isPreact = typeof h !== "undefined";

    if (isPreact) {
        const { Icon } = require("@iconify-icon/preact");
        return h(Icon, { icon, width, height });
    } else {
        const { Icon } = require("@iconify/react");
        return <Icon icon={icon} width={width} height={height} />;
    }
}
```

### Option 3: Iconify optional machen

Icons als Props übergeben, damit der Benutzer eigene Icon-Komponenten verwenden kann:

```tsx
interface EditorProps {
    // ...
    iconComponent?: (props: {
        icon: string;
        width?: number;
        height?: number;
    }) => JSX.Element;
}
```

## Empfehlung für Fresh

**Option 1** ist die sauberste Lösung:

1. Separate Build-Konfiguration für Preact
2. Preact als Peer Dependency
3. `@iconify-icon/preact` für Icons

## Migration zu Preact

Wenn du den Editor komplett auf Preact umstellen willst:

1. **React → Preact ersetzen:**

    - `React.FC` → `preact.Component` oder Funktionskomponenten
    - `React.ReactNode` → `preact.ComponentChildren`
    - `React.ReactElement` → `preact.VNode`

2. **Iconify ersetzen:**

    - `@iconify/react` → `@iconify-icon/preact`

3. **Types anpassen:**
    - `@types/react` → `@types/preact`

## Quick Start für Fresh

```tsx
// In deiner Fresh-App
import { Editor } from "hendriks-rte/preact"; // wenn separate Build
// oder
import { Editor } from "hendriks-rte";

// Fresh verwendet Preact automatisch
```

## Aktuelle Kompatibilität

-   ✅ **Hooks:** 100% kompatibel
-   ✅ **JSX:** Kompatibel (Preact verwendet JSX)
-   ❌ **Iconify:** Muss ersetzt werden
-   ⚠️ **Types:** Müssen angepasst werden
