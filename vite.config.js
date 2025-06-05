import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'spa',
  build: {
    // Add this line:
    
    outDir: 'docs' // <--- Tell Vite to build into the 'docs' folder
  }
  // Make sure commas are correct if other options exist
});