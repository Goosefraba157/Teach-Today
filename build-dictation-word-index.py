#!/usr/bin/env python3
"""Build Teach Today's compact Section 7/8 Dictation Book word index.

The official Dictation Book PDFs are the authority for whether a word belongs
to the dictation inventory. The reviewed Reader index supplies the spelling,
substep, level, and real/nonsense classification used to reject OCR labels and
page furniture.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parent
PDF_ROOT = ROOT / "Dictation Books in PDF form"
ENHANCED_INDEX = ROOT / "enhanced-planning-index.js"
READER_CHART_INDEX = ROOT / "reader-chart-index.js"
OUTPUT = ROOT / "dictation-word-index.js"

PDFS = (
    "Wilson WRS Dictation Book Steps 1-2 - first part of book.pdf",
    "Wilson WRS Dictation Book Steps 3-4 - middle part of book.pdf",
    "Wilson WRS Dictation Book Steps 5-6 - last third of book.pdf",
    "WRS Dictation Book step 7 only .pdf",
)


def load_enhanced_index() -> dict:
    source = ENHANCED_INDEX.read_text(encoding="utf-8")
    prefix = "window.teachTodayEnhancedPlanningIndex="
    start = source.index(prefix) + len(prefix)
    end = source.rindex(";")
    return json.loads(source[start:end])


def load_window_json(path: Path, variable: str) -> dict:
    source = path.read_text(encoding="utf-8")
    prefix = f"window.{variable}="
    start = source.index(prefix) + len(prefix)
    end = source.find(";", start)
    return json.loads(source[start:end])


def substep_from_page(text: str) -> str | None:
    compact = re.sub(r"\s+", "", text[:1200]).upper()
    match = re.search(r"(?<!\d)([1-7])\.([1-6])WORDS", compact)
    return f"{match.group(1)}.{match.group(2)}" if match else None


def searchable_page_text(text: str) -> tuple[str, str]:
    lines = []
    for line in text.replace("’", "'").splitlines():
        compact = re.sub(r"\s+", "", line).upper()
        if not compact:
            continue
        if "ALLRIGHTSRESERVED" in compact or "WILSONREADINGSYSTEM" in compact:
            continue
        if re.fullmatch(r"\d+", compact):
            continue
        lines.append(line)
    original = "\n".join(lines)
    expanded = re.sub(r"\(([a-z]{1,5})\)", r"\1", original, flags=re.I)
    return original, expanded


def flexible_word_pattern(word: str) -> re.Pattern[str]:
    letters = [re.escape(char) for char in word.lower() if char.isalpha()]
    body = r"[\s'’-]*".join(letters)
    return re.compile(rf"(?<![a-z]){body}(?![a-z])", re.I)


def word_is_printed(word: str, texts: tuple[str, str]) -> bool:
    if len(re.sub(r"[^a-z]", "", word.lower())) < 2:
        return False
    pattern = flexible_word_pattern(word)
    return any(pattern.search(text) for text in texts)


def main() -> None:
    enhanced = load_enhanced_index()
    pages = list((enhanced.get("pages") or {}).values())
    known: dict[str, dict[str, set[str]]] = {}
    levels: dict[str, dict[str, set[str]]] = {}
    for page in pages:
        substep = str(page.get("s") or "")
        if not substep:
            continue
        kind = "nonsense" if page.get("n") else "real"
        level = str(page.get("l") or "AB")
        known.setdefault(substep, {"real": set(), "nonsense": set()})[kind].update(page.get("w") or [])
        for word in page.get("w") or []:
            levels.setdefault(substep, {}).setdefault(word, set()).add(level)

    reader_chart = load_window_json(READER_CHART_INDEX, "readerChartIndex")
    for substep in ("1.1", "1.2"):
        for level, level_pages in (reader_chart.get(substep) or {}).items():
            kind = "nonsense" if level == "N" else "real"
            for page in (level_pages or {}).values():
                for word in (page.get("t") or []) + (page.get("b") or []):
                    clean_word = str(word or "").strip().lower()
                    if not clean_word:
                        continue
                    known.setdefault(substep, {"real": set(), "nonsense": set()})[kind].add(clean_word)
                    levels.setdefault(substep, {}).setdefault(clean_word, set()).add(level)

    found: dict[str, dict] = {}
    for filename in PDFS:
        path = PDF_ROOT / filename
        with pdfplumber.open(path) as pdf:
            for pdf_page, page in enumerate(pdf.pages, start=1):
                text = page.extract_text(x_tolerance=2, y_tolerance=3) or ""
                substep = substep_from_page(text)
                if not substep or substep not in known:
                    continue
                texts = searchable_page_text(text)
                page_real = sorted(word for word in known[substep]["real"] if word_is_printed(word, texts))
                page_nonsense = sorted(word for word in known[substep]["nonsense"] if word_is_printed(word, texts))
                if not page_real and not page_nonsense:
                    continue
                entry = found.setdefault(substep, {"real": set(), "nonsense": set(), "pages": []})
                entry["real"].update(page_real)
                entry["nonsense"].update(page_nonsense)
                printed_page_match = re.search(r"(?m)^\s*(\d{1,3})\s+(?:Wilson Reading System|©)", text)
                printed_page = int(printed_page_match.group(1)) if printed_page_match else None
                entry["pages"].append(
                    {
                        "f": filename,
                        "p": pdf_page,
                        "b": printed_page,
                        "r": page_real,
                        "n": page_nonsense,
                    }
                )

    output_substeps = {}
    for substep in sorted(found, key=lambda value: tuple(map(int, value.split(".")))):
        entry = found[substep]
        real = sorted(entry["real"])
        nonsense = sorted(entry["nonsense"])
        output_substeps[substep] = {
            "r": real,
            "n": nonsense,
            "l": {
                word: sorted(levels.get(substep, {}).get(word, []))
                for word in real + nonsense
            },
            "p": entry["pages"],
        }

    output = {
        "schemaVersion": "teach-today-dictation-words-v1",
        "source": "Official WRS Dictation Book word pages, validated against the reviewed Reader index",
        "substeps": output_substeps,
        "stats": {
            "substeps": len(output_substeps),
            "wordPages": sum(len(entry["p"]) for entry in output_substeps.values()),
            "realWords": sum(len(entry["r"]) for entry in output_substeps.values()),
            "nonsenseWords": sum(len(entry["n"]) for entry in output_substeps.values()),
        },
    }
    banner = (
        "// Auto-generated compact Dictation Book word index for Teach Today.\n"
        "// Curriculum metadata only; contains no lesson or student data.\n"
        "// Regenerate with: python3 build-dictation-word-index.py\n"
        f"window.teachTodayDictationWordIndex={json.dumps(output, separators=(',', ':'))};\n"
    )
    OUTPUT.write_text(banner, encoding="utf-8")
    print(json.dumps({"output": str(OUTPUT), **output["stats"]}, indent=2))


if __name__ == "__main__":
    main()
