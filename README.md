# Free.ai

A free, multi-provider AI chat app — text and image generation, with Firebase auth and per-user API key storage.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Firebase Auth + Firestore
- Base UI, Tailwind v4, shadcn-style components
- Lucide / Hugeicons

## Providers

| Provider | Text | Image | Key required | Model list |
|---|---|---|---|---|
| Pollinations.ai | yes | yes | yes | static |
| Puter | yes | no | yes | static |
| Ollama (local) | yes | no | no (set base URL) | dynamic (fetched from `/api/tags`) |
| Groq | yes | no | yes | static |
| OpenRouter | yes | no | yes | dynamic (`:free` models from public endpoint, cached 1h) |
| Hugging Face | no | yes | yes | static |

The default is Pollinations, which works with no key. To use a different provider, sign in, open Settings → API Keys, paste a key, then switch to that provider in Settings → Models.

**Ollama** runs locally. Start it with CORS enabled so the browser can fetch your model list:

```bash
OLLAMA_ORIGINS=* ollama serve
```

Then paste `http://localhost:11434` (or your remote URL) into Settings → API Keys → Ollama base URL. The model dropdown pulls whatever you have pulled locally.

**OpenRouter** has a long list of free models (`:free` suffix). The Models tab fetches them from `https://openrouter.ai/api/v1/models`, filters to free ones, and caches the result in `localStorage` for an hour. Use the Refresh button to bypass the cache.

**Puter** needs no setup — it's a free public service. Useful for trying the app before adding a key.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in values
pnpm dev
```

## Environment variables

### Client (exposed to the browser — safe values only)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Get these from the Firebase Console → Project Settings → Your apps → Web app config.

### Server (never committed)

```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Get these from the Firebase Console → Project Settings → Service Accounts → **Generate new private key**. Use the values from the downloaded JSON.

On Vercel: paste `FIREBASE_PRIVATE_KEY` with literal `\n` in the value field — the server code replaces them with real newlines at runtime.

## Firestore setup

1. In the Firebase Console, enable **Firestore Database** (Native mode).
2. Go to Firestore → Rules, paste the contents of [`firestore.rules`](./firestore.rules), and publish.

The rules deny client reads of user documents, so API keys are only ever read by the Next.js server using the Admin SDK. The client can write its own document but never read it back.

## Ollama (local)

To use Ollama from the browser, allow CORS for your dev origin:

```bash
OLLAMA_ORIGINS='http://localhost:3000' ollama serve
```

Then pull a model:

```bash
ollama pull llama3.2
```

## Scripts

```bash
pnpm dev      # dev server
pnpm build    # production build
pnpm start    # serve production build
pnpm lint     # eslint
```
