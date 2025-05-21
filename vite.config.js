import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const repositoryName = 'internship-tracker'

export default defineConfig({
  plugins: [react()],
  base: `/${repositoryName}/`,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})