#!/usr/bin/env python3
"""Flag incomplete bilingual JSONL blocks and numeric drift. Not a semantic QA substitute."""
import argparse
from collections import Counter
import json
from pathlib import Path
import re
import sys
import unicodedata


def numbers(text):
    normalized = unicodedata.normalize("NFKC", text)
    # Counts decimals, ratios, fractions and range endpoints separately, so
    # ordering may change in natural Korean. Unit/association checks stay manual.
    return Counter(re.findall(r"\d+(?:\.\d+)?", normalized))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("segments", type=Path)
    args = parser.parse_args()
    seen, problems, reviewed_exceptions = set(), [], []
    for line_number, line in enumerate(args.segments.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            block = json.loads(line)
        except json.JSONDecodeError as exc:
            problems.append(f"line {line_number}: invalid JSON: {exc.msg}")
            continue
        if not isinstance(block, dict):
            problems.append(f"line {line_number}: expected an object")
            continue
        block_id = block.get("id")
        if not isinstance(block_id, str) or not block_id.strip():
            problems.append(f"line {line_number}: missing stable string id")
            continue
        if block_id in seen:
            problems.append(f"{block_id}: duplicate id")
        seen.add(block_id)
        if not isinstance(block.get("source_page"), int) or isinstance(block.get("source_page"), bool) or block["source_page"] < 1:
            problems.append(f"{block_id}: source_page must be a positive integer")
        en, ko = block.get("en"), block.get("ko")
        if not isinstance(en, str) or not en.strip() or not isinstance(ko, str) or not ko.strip():
            problems.append(f"{block_id}: source and Korean text are required")
            continue
        if "\ufffd" in en or "\ufffd" in ko:
            problems.append(f"{block_id}: replacement character requires source/glyph recovery")
        if not re.search(r"[가-힣]", ko) and not block.get("intentional_non_korean"):
            problems.append(f"{block_id}: no Hangul; document intentional brands/numeric-only blocks")
        if numbers(en) != numbers(ko):
            exception = block.get("numeric_exception")
            if isinstance(exception, dict) and all(isinstance(exception.get(k), str) and exception[k].strip() for k in ("reason", "reviewer", "date")):
                reviewed_exceptions.append(block_id)
            else:
                problems.append(f"{block_id}: numeric drift: EN {dict(numbers(en))}; KO {dict(numbers(ko))}")
    if not seen:
        problems.append("No bilingual blocks found")
    for problem in problems:
        print(problem, file=sys.stderr)
    print(f"Checked {len(seen)} blocks; {len(problems)} issues; {len(reviewed_exceptions)} documented numeric exceptions.")
    if reviewed_exceptions:
        print("Recheck exceptions in context: " + ", ".join(reviewed_exceptions))
    print("This check does not verify units, table alignment, exercise meaning, omitted blocks or visual layout.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
