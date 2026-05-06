# Codex Live Validation Prompt

Use this prompt when asking Codex to validate PR #21 in a disposable local Directus instance. This validation is for evidence gathering only. Do not merge PR #21, publish a package, or bump the version.

````text
You are validating PR #21 for directus-auto-gen-extension in a disposable local Directus instance.

Goal:
- Verify the Auto Gen formula operators from #20 work in Directus.
- Confirm Vlad's requested O2M summary can produce:
  4xA, 3xB, 1xC, 2xD
- Capture safe visual evidence for the PR after the feature works.

Formula to test:
{{ FORMAT_COUNTS(COUNT_VALUES(PLUCK(items, "Value")), "{count}x{value}", ", ") }}

Sample O2M values:
A, A, A, A, B, B, B, C, D, D

Expected result:
4xA, 3xB, 1xC, 2xD

Scope and safety:
- You may use browser/computer control for this validation.
- First verify the feature works.
- Then capture screenshots or a short recording.
- Do not merge PR #21.
- Do not publish or bump version.
- Do not expose credentials, tokens, secrets, or unrelated browser tabs in screenshots or recordings.
- Keep validation artifacts focused on Directus, the relevant collection/item, the O2M values, the Auto Gen formula, and the result.

Evidence requirement:
After verifying the live Directus test works, capture visual proof for the PR.

Preferred evidence:
1. Screenshot of the Directus extension/form showing the formula field configured.
2. Screenshot showing the calculated result:
   4xA, 3xB, 1xC, 2xD
3. Screenshot or short screen recording showing the sample O2M values:
   A, A, A, A, B, B, B, C, D, D
4. Screenshot of the browser console showing no extension/runtime errors, if practical.
5. Screenshot of the Docker/terminal logs showing the extension loaded successfully, if practical.

If screen recording is available:
- Record a short clip only after the validation works.
- Keep it focused: open Directus, show the relevant collection/item, show the O2M values, show the Auto Gen formula/result.
- Do not include credentials, tokens, secrets, or unrelated browser tabs.
- Save the recording or screenshots under a local evidence folder, for example:
  evidence/pr-21-live-validation/
- Add the evidence files to the PR only if they are safe and reasonably small.
- If files are too large for GitHub, attach screenshots to a PR comment instead and summarize the recording locally.

PR update:
After evidence is captured, update PR #21 with a comment containing:
- Live Directus validation status
- Directus version used
- Docker/Compose setup summary
- Formula tested
- Expected output
- Actual output
- Any remaining limitations
- Screenshots/recording links if available

Suggested PR comment format:

## Live Directus validation

Validated #20 in a disposable local Directus instance.

### Environment

- Directus version:
- Database:
- Extension source:
- Branch:

### Formula tested

```txt
{{ FORMAT_COUNTS(COUNT_VALUES(PLUCK(items, "Value")), "{count}x{value}", ", ") }}
```

### Sample values

A, A, A, A, B, B, B, C, D, D

### Expected result

4xA, 3xB, 1xC, 2xD

### Actual result

4xA, 3xB, 1xC, 2xD

### Evidence

- Screenshot: attached / linked
- Recording: attached / linked if available

### Notes

- No Directus app bundle errors observed.
- No extension runtime errors observed.
- PR remains draft until final release review.

One caution: do not commit bulky recordings into the repo itself unless they are very small. Prefer screenshots in a PR comment, or a short recording uploaded as an attachment/comment if GitHub accepts it.
````
