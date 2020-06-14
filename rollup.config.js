import resolve from "@rollup/plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import babel from "rollup-plugin-babel";
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
    babel({
      exclude: "node_modules/**",
      babelrc: false,
    }),
    terser(),
    cleanup({ comments: "none" }),
  ],
};
