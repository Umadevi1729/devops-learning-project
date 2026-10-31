import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../site/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../site/styles.css", import.meta.url), "utf8");

test("page includes its title, status, and local assets", () => {
  assert.match(html, /<title>My DevOps Learning Project<\/title>/);
  assert.match(html, /id="status"/);
  assert.match(html, /href="\/styles\.css"/);
  assert.match(html, /src="\/app\.js"/);
});

test("status check updates the page", () => {
  assert.match(script, /addEventListener\("click", showStatus\)/);
  assert.match(script, /status\.textContent/);
});

test("page styles include a visible keyboard focus state", () => {
  assert.match(styles, /button:focus-visible/);
});
