# Meow Jump

Mobile-first Canvas jumping game prototype for the orange cat IP.

## Run

```bash
npm install
npm run dev
```

If the dev server is restricted by the local Windows sandbox, use the verified production preview:

```bash
npm run build
npm run preview
```

The game also uses plain browser APIs, so the implementation lives mostly in `src/main.js`.

## Deployment

The public demo is deployed with GitHub Pages:

- Repository: `SpeicherHub/meowJump`
- Demo URL: `https://speicherhub.github.io/meowJump/`
- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Build command: `npm run build`
- Output directory: `dist`

To avoid uploading large image assets to GitHub, the GitHub Pages version keeps code in GitHub and loads runtime images from the public TOS bucket:

```text
https://meowgame.tos-cn-beijing.volces.com/
```

This keeps the repository light and makes deployment faster. The tradeoff is that the TOS bucket must keep public read access for the runtime image paths used by `src/main.js` and `src/styles.css`.

Do not enable public write access on the TOS bucket. Only public read is needed for the game to load images.

## Assets

Local runtime assets live in `public/assets/`, while the deployed GitHub Pages build currently reads the same asset paths from TOS.

- `character-idle.png`
- `character-jump.png`
- `character-fall.png`
- `character-rocket.png`
- `rocket-powerup.png`
- `scenes/*-background.png`
- `scenes/*-platform-normal.png`
- `scenes/*-platform-fragile.png`

The `*-source.png` files are the chroma-key generation sources kept for review and regeneration.
