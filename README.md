# BROCODE GHOST BOT — Vercel Pairing Website

This is a separate static website plus a Vercel serverless API proxy. The shared secret stays in Vercel's server-side environment and is never sent to the browser.

## 1. Deploy the bot on KataBump first

1. Upload and extract `BROCODE_GHOST_BOT_PAIRING_READY.zip` into the bot's server directory.
2. Use Node.js 22 or newer and start with `npm start`.
3. Allocate a public port in KataBump/Pterodactyl. Set `PAIRING_API_PORT` to that allocated port (do not assume 3001 if the panel assigned another port).
4. Add environment variables in the panel:
   - `PAIRING_API_ENABLED=true`
   - `PAIRING_API_PORT=<the allocated port>`
   - `PAIRING_API_SECRET=<a unique random secret of at least 32 characters>`
5. Keep `PAIRING_API_SECRET` private. Do not put it in the website's HTML, Git repository, or any `NEXT_PUBLIC_` variable.
6. Restart the server and check the console for `[PAIRING API] Listening on port ...`. Confirm the port is publicly reachable over HTTPS. If KataBump does not provide HTTPS on the allocated port, put a trusted HTTPS reverse proxy in front of it; the Vercel function intentionally rejects plain HTTP upstreams except localhost.
7. The health endpoint is `https://YOUR-HOST:PORT/health`. It must respond with JSON. It is informational and does not reveal the secret.

## 2. Deploy this folder to Vercel

1. Upload this folder as a new Git repository, or import it into Vercel as a project. The project root must be this folder (the one containing `index.html`, `api/`, and `vercel.json`).
2. In Vercel → Project → Settings → Environment Variables, add:
   - `KATABUMP_PAIRING_URL` = the full HTTPS URL ending in `/pair`, e.g. `https://your-public-host.example/pair`
   - `PAIRING_API_SECRET` = exactly the same secret set on KataBump
3. Redeploy after setting the variables.
4. Open the Vercel deployment URL and request a code.

## Number format

Enter the full international number, digits only, without `+`, spaces, or a leading `0`. For Nigeria, a number like `08012345678` becomes `2348012345678`.

## Security and limitations

- The secret is sent only from Vercel's serverless function to the bot API.
- The bot endpoint validates the bearer secret, number format, and limits requests per source IP. Pairing requests are serialized to avoid simultaneous code generation.
- The browser never receives the secret. Pairing codes are sensitive; only enter them in your own WhatsApp Linked Devices screen.
- Use HTTPS between Vercel and KataBump. Do not expose session/auth files publicly.
- The website cannot force the WhatsApp connection to stay online; session persistence and reconnection are handled by the bot process.
- Deployment, domain reachability, and live WhatsApp pairing have not been tested from this package.
