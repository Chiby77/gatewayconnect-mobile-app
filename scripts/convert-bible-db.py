#!/usr/bin/env python3
"""Convert selected translations from bible.eng.db into GatewayConnect JSON packs.

The converter streams SQLite rows and never loads the complete 2.8 GB database into
memory. Run from the mobile directory, for example:

  python scripts/convert-bible-db.py --translation eng_kjv
  python scripts/convert-bible-db.py --translation eng_kjv engwebp
  python scripts/convert-bible-db.py --all
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
from pathlib import Path
from typing import Any, Iterable


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--database",
        type=Path,
        default=Path("bible-packs/bible.eng.db"),
        help="Source SQLite database path",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("bible-packs/generated"),
        help="Output directory for generated packs",
    )
    parser.add_argument("--translation", nargs="+", help="Translation IDs, e.g. eng_kjv")
    parser.add_argument("--all", action="store_true", help="Convert every translation")
    return parser.parse_args()


def json_value(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def pack_path(output: Path, translation_id: str) -> Path:
    return output / f"{translation_id}.json"


def write_json_array(handle: Any, rows: Iterable[dict[str, Any]]) -> int:
    count = 0
    handle.write("[")
    for row in rows:
        if count:
            handle.write(",")
        json.dump(row, handle, ensure_ascii=False, separators=(",", ":"))
        count += 1
    handle.write("]")
    return count


def translation_ids(connection: sqlite3.Connection, requested: list[str] | None, convert_all: bool) -> list[str]:
    if requested and not convert_all:
        return requested
    return [row[0] for row in connection.execute("SELECT id FROM Translation ORDER BY id")]


def convert_translation(connection: sqlite3.Connection, output: Path, translation_id: str) -> dict[str, Any]:
    translation = connection.execute(
        """SELECT id, name, shortName, englishName, language, licenseUrl,
                  licenseNotes, licenseNotice FROM Translation WHERE id = ?""",
        (translation_id,),
    ).fetchone()
    if translation is None:
        raise ValueError(f"Translation not found: {translation_id}")

    books = [
        {
            "id": row[3],
            "name": row[1],
            "abbreviation": row[2] or row[0],
            "testament": "OT" if row[3] <= 39 else "NT",
            "chaptersCount": row[4],
            "order": row[3],
        }
        for row in connection.execute(
            """SELECT id, name, shortName, \"order\", numberOfChapters
               FROM Book WHERE translationId = ? ORDER BY \"order\"""",
            (translation_id,),
        )
    ]
    book_ids = {row[0]: row[3] for row in connection.execute(
        "SELECT id, name, shortName, \"order\", numberOfChapters FROM Book WHERE translationId = ?",
        (translation_id,),
    )}

    target = pack_path(output, translation_id)
    with target.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write('{"id":')
        json.dump(translation[0], handle, ensure_ascii=False)
        handle.write(',"name":')
        json.dump(translation[1], handle, ensure_ascii=False)
        handle.write(',"language":')
        json.dump(translation[4] or "", handle, ensure_ascii=False)
        handle.write(',"version":')
        json.dump(translation[2] or translation[0], handle, ensure_ascii=False)
        handle.write(',"license":')
        json.dump(translation[5] or "", handle, ensure_ascii=False)
        handle.write(',"licenseNotes":')
        json.dump(translation[6] or translation[7] or "", handle, ensure_ascii=False)
        handle.write(",\"packVersion\":\"1.0.0\",\"books\":")
        json.dump(books, handle, ensure_ascii=False, separators=(",", ":"))
        handle.write(",\"verses\":[")

        verse_count = 0
        cursor = connection.execute(
            """SELECT number, chapterNumber, bookId, text
               FROM ChapterVerse WHERE translationId = ?
               ORDER BY bookId, chapterNumber, number""",
            (translation_id,),
        )
        for number, chapter, book_id, text in cursor:
            if verse_count:
                handle.write(",")
            json.dump(
                {"bookId": book_ids[book_id], "chapter": chapter, "verse": number, "text": text or ""},
                handle,
                ensure_ascii=False,
                separators=(",", ":"),
            )
            verse_count += 1
        handle.write("]}")

    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    size_bytes = target.stat().st_size
    return {
        "id": translation[0],
        "name": translation[1],
        "language": translation[4],
        "license": translation[5],
        "file": target.name,
        "sizeBytes": size_bytes,
        "sha256": digest,
        "bookCount": len(books),
        "verseCount": verse_count,
    }


def main() -> None:
    args = parse_args()
    if not args.database.exists():
        raise SystemExit(f"Database not found: {args.database}")
    if not args.translation and not args.all:
        raise SystemExit("Choose --translation <id> or --all")

    args.output.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(f"file:{args.database.resolve()}?mode=ro", uri=True)
    try:
        manifest = [
            convert_translation(connection, args.output, translation_id)
            for translation_id in translation_ids(connection, args.translation, args.all)
        ]
    finally:
        connection.close()

    manifest_path = args.output / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for item in manifest:
        print(f"{item['id']}: {item['verseCount']} verses -> {item['file']} ({item['sizeBytes']} bytes)")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
