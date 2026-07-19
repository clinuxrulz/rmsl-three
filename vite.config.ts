import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'rmsl-three',
      fileName: 'rmsl-three',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['three', 'three/tsl', 'three/nodes', '@random-mesh/rmsl'],
    },
  },
  plugins: [
    dts({
      outDir: 'dist',
    }),
  ],
})
