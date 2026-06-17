# CountIT Label Print From Stock Count

Creates a CountIT Print labels file from products in a Stock Count whose Current stock is `0` or negative.

## Usage

```bash
npm run label-print -- --stock-count "Atariya 16-06-2026 #47088" --dry-run
npm run label-print -- --stock-count "Atariya 16-06-2026 #47088" --semi-auto --limit 3
npm run label-print -- --stock-count "Atariya 16-06-2026 #47088"
npm run label-print -- --append-to-label-print "Atariya 16-06-2026 #47088" --stock-count "Atariya 15-06-2026 #47070" --semi-auto
```

Dry run opens the Stock Count, reads matching rows, writes a log, clicks Save to leave the edit screen, and does not create a Print labels file.

Semi-auto mode creates the Print labels draft, adds each detected product with amount `1`, then pauses in the terminal before final Save. Review the browser, then press Enter in the terminal to let the automation click Save. Use Ctrl+C to cancel before Save.

Normal mode creates a Print labels file with the same name as the Stock Count description, adds each detected product with amount `1`, and clicks final Save. If a Print labels file with the same name already exists, the run stops without creating another one.

Append mode uses `--append-to-label-print "<existing Print labels name>"`. It opens the existing Print labels file via Edit, reads existing product rows when product codes are reliable, skips duplicate product codes, adds only new products into the next blank rows, then follows the same semi-auto or normal Save behavior. If existing rows cannot be read safely, the run stops for manual review.

Use `--limit N` to detect all matching Stock Count rows but only add the first `N` products to the Print labels file. This is useful for safe semi-auto testing before adding a large batch.

The automation only reads and saves the Stock Count edit screen; it does not trigger inventory processing.

## Logs

Each run writes a JSON file under `pos-label-print/logs/`.
