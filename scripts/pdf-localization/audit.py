#!/usr/bin/env python3
"""Read-only PDF inventory. Private evidence must be written outside the website."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

from pypdf import PdfReader


SAMPLES = {
    "Dynasty": [1, 3, 6], "Hell Joseon": [1, 2, 3], "Lotus": [1, 5, 87],
    "The First Flame": [1, 4, 30, 31, 32], "Total War": [1, 2, 16],
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--baseline", type=Path)
    parser.add_argument("--render-samples", action="store_true")
    args = parser.parse_args()
    source, output = args.source.resolve(), args.output.resolve()
    repo = Path(__file__).resolve().parents[2]
    if output == repo or repo in output.parents:
        parser.error("Private extracted text/renders must be stored outside the website checkout.")
    if output == source or source in output.parents:
        parser.error("Output must not be inside the read-only source library.")
    files = sorted(source.glob("*.pdf"))
    if not files:
        parser.error(f"No PDF files found in {source}")
    if args.render_samples and not shutil.which("pdftoppm"):
        parser.error("Install Poppler or add bundled pdftoppm to PATH before rendering.")
    baseline = {}
    if args.baseline:
        baseline = {Path(x["file"]).name: x["sha256"] for x in json.loads(args.baseline.read_text())["assets"]}
    output.mkdir(parents=True, exist_ok=True)
    records, changes = [], []
    for path in files:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if args.baseline and baseline.get(path.name) != digest:
            changes.append(path.name)
        reader = PdfReader(path)
        slug = path.stem.lower().replace(" ", "-")
        pages, text_parts = [], []
        for number, page in enumerate(reader.pages, 1):
            content = page.extract_text() or ""
            text_parts.append(f"=== PAGE {number} ===\n{content}\n")
            pages.append({"page": number, "characters": len(content),
                          "extracted_words": len(content.split()),
                          "replacement_characters": content.count("\ufffd"),
                          "images": len(page.images),
                          "width_pt": float(page.mediabox.width),
                          "height_pt": float(page.mediabox.height),
                          "links": sum(a.get_object().get("/Subtype") == "/Link" for a in page.get("/Annots", []))})
        record = {"file": path.name, "sha256": digest, "bytes": path.stat().st_size,
                  "page_count": len(pages), "pages": pages,
                  "metadata": {str(k): str(v) for k, v in (reader.metadata or {}).items()},
                  "fields": list((reader.get_fields() or {}).keys())}
        records.append(record)
        (output / f"{slug}.txt").write_text("\n".join(text_parts), encoding="utf-8")
        if args.render_samples:
            render_dir = output / "renders"
            render_dir.mkdir(exist_ok=True)
            for number in SAMPLES.get(path.stem, [1]):
                if number <= len(pages):
                    subprocess.run(["pdftoppm", "-f", str(number), "-l", str(number),
                                    "-scale-to", "1600", "-singlefile", "-png", str(path),
                                    str(render_dir / f"{slug}-p{number:03}")], check=True,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        print(f"{path.name}: {len(pages)} pages; {sum(p['replacement_characters'] for p in pages)} replacement characters")
    if args.baseline:
        changes.extend(sorted(set(baseline) - {p.name for p in files}))
    report = {"source_directory": str(source), "assets": records,
              "source_changes": changes, "total_pages": sum(r["page_count"] for r in records)}
    (output / "inventory.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Private evidence: {output}")
    if changes:
        print("Source baseline changed; Korean versions need review: " + ", ".join(changes), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
