# Manual Setup Required

## Required to Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open `http://localhost:3000`.

No API keys are required for core app usage.

## Optional API Integrations

If you want external texture/visual search in the Asset Finder, create `.env.local`:

```bash
cp .env.example .env.local
```

Then add keys:

- `NEXT_PUBLIC_FREESOUND_API_KEY=`
  - Create free key at: https://freesound.org/apiv2/apply/
- `NEXT_PUBLIC_PIXABAY_API_KEY=`
  - Create free key at: https://pixabay.com/api/docs/

Restart the dev server after adding keys.

## Optional Asset Regeneration

To regenerate built-in procedural sample pack:

```bash
npm run assets:generate
```
