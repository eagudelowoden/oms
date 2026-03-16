import type { Config } from "tailwindcss";

const config: Config = {
    // 1. IMPORTANTE: 'class' permite que tú controles el modo claro/oscuro
    // añadiendo la clase "dark" al <html>. Si no está, el diseño falla.
    darkMode: 'class',

    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Aquí puedes definir los colores corporativos de Woden si los necesitas
                primary: {
                    light: '#3b82f6',
                    dark: '#1e40af',
                }
            },
        },
    },
    plugins: [],
};

export default config;