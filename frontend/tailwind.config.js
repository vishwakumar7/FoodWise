/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FBFBF9',
          subtle: '#F4F4EE',
          muted: '#ECECE6',
        },
        card: '#FFFFFF',
        ink: {
          950: '#121513',
          900: '#1F2421',
          800: '#2E3430',
          700: '#434A45',
          600: '#5C645E',
          500: '#77807A',
          400: '#9BA39D',
          300: '#C3C9C4',
          200: '#DFE3E0',
          100: '#F0F2F0',
        },
        line: {
          DEFAULT: '#E5E5DF',
          strong: '#D3D3CB',
          subtle: '#EEEEEE',
        },
        olive: {
          900: '#1A2D21',
          800: '#253E2E',
          700: '#314F3B',
          600: '#41634D',
          500: '#537760',
          300: '#9CB7A4',
          200: '#CAD8CE',
          100: '#E4EDE6',
          50: '#F2F7F3',
        },
        terracotta: {
          900: '#6F2613',
          800: '#8E331B',
          700: '#AF4326',
          600: '#C85435',
          500: '#D86C4E',
          300: '#EEA28C',
          200: '#F4CEBF',
          100: '#FBE5DC',
          50: '#FDF3EE',
        },
        warm: {
          700: '#8A6217',
          600: '#A4771D',
          200: '#EAD7A6',
          100: '#F6ECCF',
          50: '#FBF7EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
