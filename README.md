# Oak Content Supply Chain Web (EDS)

EDS web app for the Oak Content Supply Chain user flow.

## Architecture
- `oak-content-supply-chain-web`: user-facing EDS site.
- `oak-ingress-normalizer`: standalone API service (runs separately).
- `oak-segment-consensus`: validator/proposal network.

This web app calls validator + normalizer APIs over HTTP.
Default local settings route through the localhost edge worker proxy:
- Validator URL: `http://127.0.0.1:8787/ops/v1/content-chain/validator`
- Normalizer API URL: `http://127.0.0.1:8787/ops/v1/content-chain/normalizer`

## Local development
1. Install dependencies: `npm i`
2. Start AEM proxy: `aem up`
3. Open `http://localhost:3000`
4. Confirm default API URLs point at localhost edge worker (`:8787`) in Developer Settings
5. Ensure `oak-ingress-normalizer` is running on `:8088` and the edge worker on `:8787`

## Lint
- `npm run lint`
