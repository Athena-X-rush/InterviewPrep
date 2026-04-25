export default {
  content: ['./client/src/**/*.{js,jsx,ts,tsx}'],
  css: ['./client/src/styles/pages.css'],
  output: './client/src/styles/clean-pages.css',
  defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
  safelist: {
    standard: [/^-/],
  },
}
