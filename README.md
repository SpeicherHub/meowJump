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

The game implementation lives mostly in `src/main.js`. GitHub Pages builds the app with Vite and loads runtime images from the public TOS bucket.
