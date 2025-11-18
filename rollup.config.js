import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { createRequire } from "module";
import copy from "rollup-plugin-copy";
import dts from "rollup-plugin-dts";

const require = createRequire(import.meta.url);
const packageJson = require("./package.json");

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: packageJson.main,
                format: "cjs",
                sourcemap: true,
            },
            {
                file: packageJson.module,
                format: "esm",
                sourcemap: true,
            },
        ],
        plugins: [
            resolve({
                browser: true,
            }),
            commonjs(),
            typescript({
                tsconfig: "./tsconfig.json",
                exclude: ["**/*.test.*", "**/*.spec.*"],
            }),
            copy({
                targets: [{ src: "src/styles.css", dest: "dist" }],
            }),
        ],
        external: (id) => {
            return (
                id === "react" ||
                id === "react-dom" ||
                id === "@iconify/react" ||
                id.startsWith("react/") ||
                id.startsWith("react-dom/")
            );
        },
    },
    {
        input: "dist/index.d.ts",
        output: [{ file: "dist/index.d.ts", format: "esm" }],
        plugins: [dts()],
        external: (id) => {
            return (
                id === "react" ||
                id === "react-dom" ||
                id === "@iconify/react" ||
                id.startsWith("react/") ||
                id.startsWith("react-dom/")
            );
        },
    },
];
