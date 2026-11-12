# Fixtures

All files in this folder are **synthetic**. `scripts/make-fixtures.mjs` writes them (`npm run fixtures`) from the 24 documented Amazon Settlement Flat File V2 columns (SPEC §3). They are not taken from a real Amazon file, the order IDs and SKUs are made up, and they must never be presented as real Amazon data.

| File | Purpose |
|---|---|
| `normal.tsv` | 6 orders, a refund, storage fee and reserve lines; the summary total equals the line sum |
| `german-format.tsv` | the same data with comma decimals and `dd.mm.yyyy hh:mm:ss UTC` dates |
| `yearend.tsv` | posted 28.12.2026 to 08.01.2027 |
| `unknown.tsv` | contains `FooBarFee`, which no mapping knows |
| `gbp.tsv` | currency GBP, refused |
| `negative.tsv` | negative payout |
| `v1.tsv`, `v1.xml` | retired V1 / XML formats, rejected |
| `difference.tsv` | summary total is off by 1,00 |
| `duplicate.tsv` | one row repeated |

A real file (anonymised) belongs in `fixtures/real/`; that is a human task (SPEC §11).
