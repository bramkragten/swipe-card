import resolve from "rollup-plugin-node-resolve";
import postcss from "rollup-plugin-postcss";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.js",
  output: {
    file: "swipe-card.js",
    format: "umd",
    name: "SwipeCard"
  },
  plugins: [
    resolve(),
    postcss({
      extensions: [".css"]
    }),
    babel({
      exclude: "node_modules/**",
      babelrc: false
    }),
    terser()
  ]
};
