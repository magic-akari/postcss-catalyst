const postcss = require("postcss");

const plugin = require("./index.js");

const fs = require("fs");

async function run(input, output, opts = {}) {
  let result = await postcss([plugin(opts)]).process(input, {
    from: undefined,
  });
  // console.log(result);
}

run(fs.readFileSync("./input.css", "utf8"));
