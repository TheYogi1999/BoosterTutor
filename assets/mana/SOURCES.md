# Mana symbols

The renderer in `mana-symbols.js` is adapted directly from [MagicEditor `js/app.js`](https://github.com/TheYogi1999/MagicEditor/blob/cebd57c7c079de8a29ed027290be4461878afb2c/js/app.js), inspected 2026-11-14. It retains the Mana glyph mapping, 100×100 canvas, 46px circle, color palette, glyph sizes and hybrid geometry. Only the Fabric image wrapper is replaced with a returned canvas.

`W.png`, `U.png`, `B.png`, `R.png` and `G.png` are rendered locally from that code and the bundled unmodified **Mana 1.18.0** font. This keeps the same shapes without a runtime CDN or font-loading flash. `mana.woff` is from <https://cdn.jsdelivr.net/npm/mana-font@1.18.0/fonts/mana.woff>.

Mana is designed by **Andrew Gioia**: <https://mana.andrewgioia.com/>. The font is distributed under **SIL Open Font License 1.1**, included in `OFL.txt`. The mana symbol images are copyright Wizards of the Coast. Upstream licensing: <https://github.com/andrewgioia/mana#license>.
