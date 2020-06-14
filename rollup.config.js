import resolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import { terser } from "rollup-plugin-terser";
import cleanup from "rollup-plugin-cleanup";

export default {
  input: "src/index.js",
  output: {
    file: "dist/swipe-card.js",
    format: "es",
  },
  plugins: [
    resolve(),
    postcss({
      extensions: [".css"],
    }),
    terser(),
    cleanup({ comments: "none" }),
  ],
};
