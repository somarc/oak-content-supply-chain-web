# Oak Content Supply Chain Web (EDS)

EDS web app for the Oak Content Supply Chain user flow.

## Architecture
- `oak-content-supply-chain-web`: user-facing EDS site.
- `oak-ingress-normalizer`: standalone API service (runs separately).
- `oak-segment-consensus`: validator/proposal network.

This web app calls the normalizer over HTTP using the `Normalizer API URL` field in the UI.

## Local development
1. Install dependencies: `npm i`
2. Start AEM proxy: `aem up`
3. Open `http://localhost:3000`
4. Set `Normalizer API URL` (default `http://127.0.0.1:8088`)

## Lint
- `npm run lint`
