# Korean PDF localization workspace

Assessment completed 2026-09-11. **Five English assets, 509 pages, approximately 128,340 extracted words. No Korean PDFs have been created or released.** The word count includes repeated headings and footers and excludes text baked into images. All source PDFs were read without modification.

Open `pdf-localization.code-workspace` in VS Code to continue this as a separate workstream. This folder contains the assessment, proposed terminology, a 509-row page tracker, a release checklist, and source fingerprints. It does not contain paid program text or rendered pages. Keep translation drafts, extracted content and PDF builds outside the website repository so they cannot accidentally become public static files.

## Inventory and ordering

| Pilot order | Program | Pages | Extracted words | Main work |
| --- | --- | ---: | ---: | --- |
| 1 | The First Flame | 43 | 11,666 | Beginner explanations and workout sheets; recover cover text and video destinations; reconcile inconsistent example prescriptions. |
| 2 | Hell Joseon | 33 | 11,431 | Dense workout/nutrition tables; distinguish oz by context and preserve its custom RPE scale. |
| 3 | Dynasty | 93 | 24,424 | Image-based headers and schedule tables; recover content missing from text extraction. |
| 4 | Lotus | 180 | 36,774 | Large 14-week library; rebuild pagination, preserve weekly progression and exercise variants. |
| 5 | Total War | 160 | 44,045 | Repair damaged source content first; mixed page styles and corrupted text. |

The First Flame is the best pilot because it establishes terminology used throughout the library and is a manageable complete product. Hell Joseon is shorter but its compressed tables and advanced instructions make it a poorer template pilot. Total War source recovery can proceed while other titles are translated.

Planning allowance, not a delivery commitment: pilot 3-5 focused working days after its source issues are resolved; remaining library 15-30 focused working days including translation, layout and bilingual review. Calibrate after 8-10 representative pilot pages. Retrieving editable originals and repairing missing text may add time. This estimate assumes reusable formatting and one available bilingual reviewer; it is not measured production throughput.

## Evidence and limits

All 509 pages were text-extracted and scanned for extraction defects. Seventeen representative pages were rendered with Poppler and visually inspected: Dynasty 1/3/6; Hell Joseon 1/2/3; Lotus 1/5/87; The First Flame 1/4/30/31/32; Total War 1/2/16. This is an asset assessment, not a complete visual audit or a validation of training/nutrition claims.

`inventory.json` records SHA-256 hashes, metadata, page sizes, text volume, images, links and form fields. `page-tracker.csv` tracks every source page independently; no row is marked translated or approved. Sparse pages are flagged for recovery/review, not automatically declared blank. The audit script can regenerate private evidence from the exact source PDFs.

### Source provenance

- Dynasty and Hell Joseon identify Google Docs' Skia renderer. Hell Joseon's title metadata includes `.docx`. These are clues to an editable source, not evidence that the originals are available or who authored them.
- Lotus identifies LibreOffice Writer 25.2.3.2. Its embedded dates are April 16, 2026. The storefront calls the product **Lotus V2**, while the PDF identifies itself as **Lotus**; confirm the edition before starting.
- The First Flame supplies only a creation timestamp. Its pages are 768 x 1024 points; the other four use 612 x 792 points. Do not assume a shared original layout.
- Total War identifies CM Strength as author and Powerlifting Program as subject; no source editor is identified.
- A targeted GitHub connector check on 2026-09-11 found [ChiliMadrid/ebook/TotalWar](https://github.com/ChiliMadrid/ebook/tree/main/TotalWar), containing only `CM Strength Total War.pdf` and a cover PNG. The current PDF is a **confirmed identical copy** of the website asset: both are 8,743,856 bytes and share Git blob hash `174e8771c7d67f3c15b347cb290845c8e41af695`. It therefore contains the same damage and is not an editable original. Folder history records an initial PDF on May 22, 2026 at [commit ff552559](https://github.com/ChiliMadrid/ebook/commit/ff5525599d4118e093362a5025333a6e7a8828f7), followed by [Fix Total War PDF references](https://github.com/ChiliMadrid/ebook/commit/c0a44e40a604cf3a0f6ee5ae2b42a1a64b58019c) the same day. The earlier PDF has different blob hash `c2d7058daf5fb17ebb1818549c98c003deec7c22`; it is a **candidate recovery version only**, with content and damage status not yet inspected. No DOCX, ODT or other editable original was found in this specific folder or its two observed commits. The cover PNG is a candidate design asset, not a text source.
- No AcroForm fields were found. No link annotations were found in the first four; Total War has one. Several documents refer to demonstration videos in visible text, so recover and verify intended destinations from editable originals rather than inventing links.

### Concrete source issues to resolve

1. **Total War:** 2,454 replacement characters across pages 2, 4, 12, 13, 22, 23, 30, 38, 53, 70, 78, 115, 117, 125, 131, 135, 147 and 151. Page 2 visibly contains white rectangles covering sentence fragments; this is not solely an extraction problem. The cover also contains small missing-glyph boxes below the title. Obtain an intact editable export and repair before translating affected content. Do not guess missing exercise or technique instructions.
2. **Dynasty:** 105 image instances across 93 pages. Rendered page 3 includes section headers and a training split table absent from extracted text. Page 6 repeats exercise number 5. Recover table cells and headings from source or manual transcription; resolve numbering editorially without changing programming.
3. **Lotus:** page 87 contains only a goal/RPE continuation and footer. Page 5 is crowded and continues an exercise over the page break. Korean layout should keep prescriptions and their RPE/goal together. All source content must survive repagination; matching the English page count is not a release requirement.
4. **The First Flame:** page 32's squat paragraph prescribes 3 sets of 8, while one nearby example lists 3 sets of 10. Page 43's Tate press paragraph prescribes 3 sets of 12, while adjacent examples also mention 4 sets of 10. Clarify example association and intended numbers before translation. Do not silently normalize the discrepancy. Sparse pages 31/33/39/41 are rest-day separators, not missing translations. Its table of contents needs verification and rebuilding against final pagination.
5. **Hell Joseon:** page 2 uses a custom RPE reference extending to 13, and combines nutrition quantities in g, oz, cups, tbsp and scoops. Preserve this program's definitions; do not silently substitute a conventional scale or infer scoop size. Training includes a 28-day/no-rest framing and advanced intensity methods; have the coach review Korean wording for the same intended meaning and audience.

## Repeatable workflow

1. **Freeze the source.** Run the audit against current English files and compare with the committed hashes. Record original document location, edition, source owner and any corrected English version. A source hash change invalidates the old translation baseline until its content diff is reviewed.
2. **Recover source structure.** Prefer editable DOCX/ODT/Google Docs exports. Otherwise rebuild structured paragraphs, exercise blocks and table cells from the PDF plus visual transcription of image text. Give each block a stable ID such as `first-flame.week-01.wed.squat.prescription`; retain source page/region references. Keep corrected source text and unresolved questions separately. Do not translate raw extraction blindly.
3. **Approve a pilot style.** Translate cover, introduction, an explanation page, a dense workout and a rest-day page from The First Flame. Use professional, direct Korean in 합니다/하세요 style. Keep CM Strength and program names as brands; add Korean descriptors. Use Korean exercise names with English on first occurrence where useful. The glossary is a proposed starting point until a bilingual fitness reviewer checks it.
4. **Translate in complete sections.** Reuse approved glossary entries and repeated instructions, but inspect each week for changed loads, sets, reps, rest and RPE. Preserve each condition, negation, alternative, left/right instruction and per-side qualifier. Never change training programming as part of translation. Log discrepancies for coach resolution.
5. **Verify structured content.** Store bilingual blocks in JSONL with `id`, `source_page`, `en`, `ko`, and review fields. Run `check_segments.py`. It checks completeness and numeric token parity and flags issues; it cannot prove meaning or correct table associations. Independently compare exercise prescriptions in a structured table with columns for program/week/day/exercise/sets/reps/load/rest/RPE/tempo/sides/alternatives. Units and numeral conversions require documented, reviewed exceptions.
6. **Lay out the Korean master.** Use an editable master with reusable paragraph/table styles and a Korean font whose embedding license is suitable. Embed fonts, include Korean PDF language metadata, preserve text selection, rebuild the contents/bookmarks and repair links. Recreate English text baked into artwork as editable Korean text over an appropriate source design; do not leave descriptions in the cover image untranslated. Preserve supplied photographs and brand treatment. Prefer readable repagination to shrinking every page to fit.
7. **Review every page.** Render all final pages with Poppler. A bilingual reviewer checks source/target content and a coach verifies exercise/nutrition prescriptions and unresolved source issues. Inspect every table, header, footer, cover, illustration label, page break, cross-reference and URL. Record reviewer, date and evidence in the tracker; target pages may differ from source pages.
8. **Release one title at a time.** Complete `release-checklist.md`, checksum the final Korean file, record its corresponding English source hash and set status `released`. Integrate only verified files into private delivery. Preserve previous release files for rollback and keep a concise bilingual change log.
9. **Maintain parity.** On every English PDF change, rerun the audit and mark affected Korean versions `needs_update`. Compare content by stable block ID, revise changed translations, and repeat numeric, bilingual, visual and fulfillment checks. Do not keep advertising a Korean version as current while its source baseline differs without review.

## Running the assessment tools

Requires Python with `pypdf` and Poppler's `pdftoppm`. The tools only read source PDFs. Use an output directory outside the website checkout:

```sh
python3 scripts/pdf-localization/audit.py --source api/_private/EnglishPDF --output "$HOME/Documents/CM-Strength-PDF-localization/evidence" --baseline docs/pdf-localization/inventory.json --render-samples
python3 scripts/pdf-localization/check_segments.py "$HOME/Documents/CM-Strength-PDF-localization/first-flame/segments.jsonl"
```

The audit refuses an output directory inside the website checkout and returns a nonzero exit code if source hashes drift. It does not overwrite the committed baseline or tracker. Keep the external project organized as `evidence/`, `originals/`, `segments/`, `masters/`, `drafts/`, `renders/`, and `releases/`; originals remain read-only reference copies.

## Website handoff once a Korean title is ready

At assessment time, `api/_lib/products.js` contains only `-en` PDF product keys and resolves every attachment under `api/_private/EnglishPDF`; `pdf-delivery.js` originally sent English copy; the website update now localizes email copy to the checkout language while explicitly identifying the attachments as English PDFs. `vercel.json` includes only the English private folder in fulfillment functions. Website language must remain distinct from purchased PDF language.

After QA, add an explicit Korean product variant and locale-to-private-file mapping; include its private assets in both fulfillment functions; carry the chosen asset language through cart, checkout metadata, confirmation and email. Validate unsupported/missing variants on the server. Test mixed-language carts, Korean attachment filenames, missing-file failure, duplicate fulfillment handling and email delivery with payment/provider test mode. A Korean website must clearly disclose English-only files until the Korean edition actually exists. Never enable a Korean purchase option backed by the English file.
