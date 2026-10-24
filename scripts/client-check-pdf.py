#!/usr/bin/env python3
"""Renders docs/client-check.md to a PDF (A4 landscape, tables intact).

Usage: python3 scripts/client-check-pdf.py [output.pdf]
Needs the `markdown` package and Google Chrome (headless print-to-pdf).
"""
import pathlib, subprocess, sys, tempfile
import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "client-check.md"
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "Resources" / "client-check.pdf"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

body = markdown.markdown(SRC.read_text(encoding="utf-8"), extensions=["tables", "sane_lists"])
html = f"""<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Client Check</title>
<style>
@page {{ size: A4 landscape; margin: 14mm 12mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 9.5pt; line-height: 1.45; color: #1f1b16; }}
h1 {{ font-size: 20pt; margin: 0 0 4mm; }}
h2 {{ font-size: 13pt; margin: 8mm 0 3mm; padding-bottom: 1.5mm; border-bottom: 1px solid #c9bfa9; break-after: avoid; }}
p {{ margin: 0 0 3mm; }}
code {{ font-family: "SF Mono", Menlo, monospace; font-size: 8.5pt; background: #f0ebdf; padding: 0 1mm; }}
table {{ width: 100%; border-collapse: collapse; margin: 2mm 0 4mm; table-layout: auto; }}
th, td {{ border: 1px solid #d9d0be; padding: 1.6mm 2.2mm; text-align: left; vertical-align: top; }}
th {{ background: #efe9da; font-size: 8.5pt; text-transform: none; }}
tr {{ break-inside: avoid; }}
thead {{ display: table-header-group; }}
td:first-child, th:first-child {{ white-space: nowrap; font-weight: 600; width: 1%; }}
a {{ color: #7a5c2e; }}
</style></head><body>{body}</body></html>"""

with tempfile.TemporaryDirectory() as tmp:
    page = pathlib.Path(tmp) / "client-check.html"
    page.write_text(html, encoding="utf-8")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={OUT}", page.as_uri()], check=True, capture_output=True)
print(OUT)
