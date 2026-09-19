# GatewayConnect Bible Packs

The supplied `bible.eng.db` is present in this folder and has been verified as a healthy SQLite database.

It contains 51 English translations, 2,760 books, 48,742 chapters, and 1,289,753 verses. Its SHA-256 is:

```text
8F5656D12B834B09EBAAD97E03E255BBC238D3FD51C9343B1C74EE18BB60EC52
```

The database is approximately 2.63 GiB. Do not bundle it into the JavaScript bundle or normal Expo asset bundle. Install it into the device SQLite directory using `installSuppliedBibleDatabase(sourceUri)` or download it using `downloadSuppliedBibleDatabase(url)`.

The integration service is [suppliedBibleDatabase.ts](../src/bible/suppliedBibleDatabase.ts).

## Generate A Bundled Pack

The selected KJV pack is generated at `bible-packs/generated/eng_kjv.json` and bundled as the app's default Bible. Regenerate it after replacing the source database with:

```powershell
cd mobile
npm run convert:bible
```

To convert another translation without bundling it automatically:

```powershell
python scripts/convert-bible-db.py --translation engwebp
```

Keep large or numerous translations as optional downloads rather than importing all of them into the JavaScript bundle.

The complete `--all` conversion currently produces approximately 236.7 MB of JSON. The app bundles only `eng_kjv.json` by default. The remaining generated files can be uploaded to protected storage or attached to release assets and downloaded on demand after the user selects a translation.

## Supported Pack Format

The mobile app also accepts smaller JSON Bible packs with this shape:

```json
{
  "id": "shona-dzvene",
  "name": "Bhaibheri Dzvene",
  "language": "Shona",
  "version": "Shona",
  "license": "LICENSE HOLDER / LICENSE ID",
  "packVersion": "1.0.0",
  "checksum": "sha256-of-the-json-file",
  "books": [
    {
      "id": 1,
      "name": "Genesis",
      "abbreviation": "Gen",
      "testament": "OT",
      "chaptersCount": 50
    }
  ],
  "verses": [
    {
      "bookId": 1,
      "chapter": 1,
      "verse": 1,
      "text": "..."
    }
  ]
}
```

The `checksum` is optional for local development but required for production downloads. It must be the SHA-256 digest of the exact JSON payload supplied to the importer.

Use `importBiblePackFile(uri)` for a local JSON pack or `downloadBiblePack(url)` for a remote licensed JSON pack. For the supplied database, use `installSuppliedBibleDatabase(sourceUri)` or `downloadSuppliedBibleDatabase(url)`, then query it with `listSuppliedTranslations`, `getSuppliedChapter`, and `searchSuppliedBible`.

Recommended production flow:

1. Store `bible.eng.db` in protected object storage or a release download service.
2. Provide an authenticated/download-authorized URL to the mobile app.
3. Download it to the device using the resumable database downloader.
4. Verify the downloaded file against the recorded SHA-256 before opening it.
5. Let the user choose a translation and read it fully offline.

Do not commit copyrighted Bible text unless Gateway Church has redistribution rights for that translation. Keep the supplied database files in this folder or distribute them through a protected content-download endpoint.
