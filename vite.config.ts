import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        slopeMorph: resolve(__dirname, "lab/slope-morph.html"),
        tableDifference: resolve(__dirname, "lab/table-difference.html"),
        shapeGallery: resolve(__dirname, "lab/shape-gallery.html"),
        twinPlots: resolve(__dirname, "lab/twin-plots.html"),
      },
    },
  },
});
