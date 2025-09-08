// Minimal Style Dictionary v4 ESM config

const impactRE = /(--impact|-impact)$/i;

const kebab = (s) =>
  String(s)
    .replace(/[^\w\s-]/g, "")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const looksType = (o) =>
  o && typeof o === "object" && (o.fontSize || o.fontFamily || o.lineHeight);

const toCssVal = (key, tok) => {
  const t = tok?.$type ?? tok?.type;
  let v = tok?.$value ?? tok?.value ?? tok;
  if (v == null) return null;

  const dimKeys = new Set([
    "fontSize",
    "lineHeight",
    "letterSpacing",
    "paragraphIndent",
    "paragraphSpacing",
  ]);
  if (t === "dimension" || (typeof v === "number" && dimKeys.has(key))) {
    return typeof v === "number"
      ? `${v}px`
      : /[a-z%]+$/i.test(v)
        ? v
        : `${v}px`;
  }
  if (key === "fontFamily" && typeof v === "string") {
    return /[\s"']/.test(v) ? `"${v.replace(/"/g, '\\"')}"` : v;
  }
  return v;
};

const normalize = (obj) => {
  if (Array.isArray(obj)) return obj.map(normalize);
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = k === "type" ? "$type" : k === "value" ? "$value" : k;
      out[key] = normalize(v);
    }
    return out;
  }
  return obj;
};

export default {
  source: ["tokens/design-tokens.tokens.json"],

  hooks: {
    parsers: [
      {
        pattern: /\.json$/,
        parse: ({ contents }) => normalize(JSON.parse(contents)),
      },
    ],
    transforms: {
      // use FULL PATH for names to avoid collisions (e.g., spacing-sm vs radius-corner-sm)
      "name/full-path": {
        type: "name",
        transform: (t) => kebab(t.path.join("-")),
      },
    },
    formats: {
      // one file: :root vars (non-typography) + impact-only typography classes
      "css/vars+impact-classes": ({ dictionary }) => {
        const out = [];

        // :root variables (skip typography; skip color *tint*)
        out.push(":root {");
        for (const t of dictionary.allTokens) {
          const top = t.path?.[0];
          if (top === "typography") continue;
          if (top === "color") {
            const name = (t.name || t.path.join("-")).toLowerCase();
            if (name.includes("tint") || name.includes("shade")) continue;
          }
          const varName = kebab(t.path.join("-"));
          const val = toCssVal("value", { $type: t.type, $value: t.value });
          out.push(`  --${varName}: ${val};`);
        }
        out.push("}\n");

        // Typography classes for names ending in --impact / -impact (suffix removed)
        const classes = [];
        const walk = (path, node) => {
          if (!node || typeof node !== "object") return;
          if (looksType(node)) {
            const key = path[path.length - 1] || "";
            if (impactRE.test(key)) {
              const p = path[0] === "typography" ? path.slice(1) : path.slice();
              p[p.length - 1] = key.replace(impactRE, "");
              const className = `.${kebab(p.join("-"))}`;
              const decls = [];
              for (const [k, v] of Object.entries(node)) {
                const prop = kebab(k)
                  .replace(/^fontsize$/, "font-size")
                  .replace(/^lineheight$/, "line-height")
                  .replace(/^letterspacing$/, "letter-spacing")
                  .replace(/^fontfamily$/, "font-family")
                  .replace(/^fontweight$/, "font-weight")
                  .replace(/^fontstyle$/, "font-style")
                  .replace(/^fontstretch$/, "font-stretch")
                  .replace(/^textdecoration$/, "text-decoration")
                  .replace(/^textcase$/, "text-transform")
                  .replace(/^paragraphindent$/, "text-indent")
                  .replace(/^paragraphspacing$/, "margin-bottom");
                const val = toCssVal(k, v);
                if (val != null) decls.push(`  ${prop}: ${val};`);
              }
              if (decls.length)
                classes.push(`${className} {\n${decls.join("\n")}\n}`);
            }
          } else {
            for (const [k, v] of Object.entries(node)) walk([...path, k], v);
          }
        };
        walk([], dictionary.tokens);

        if (classes.length) out.push(classes.join("\n\n"), "");

        return out.join("\n");
      },
    },
  },

  platforms: {
    css: {
      transforms: ["name/full-path"], // ensures collision-proof var names
      buildPath: "build/css/",
      files: [{ destination: "tokens.css", format: "css/vars+impact-classes" }],
    },
  },
};
