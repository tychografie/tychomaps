import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "#FEFBF6",
        "orange-light": "#F9EED5",
        orange: "#EEB053",
        "orange-dark": "#D99F3F",
        "orange-washed": "#E3D5BE",
        "purple": "#4A044E",
        "indigo": "#2634aa",
      },
    },
  },
  plugins: [],
}
export default config
