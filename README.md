# ProfitWise Manufacturing — full-stack project

- **Frontend:** React + TanStack Start (Vite) — folder root (`src/`)
- **Backend:** Django + Django REST Framework — `backend/`
- **Auth:** token authentication (`Authorization: Token <key>`)
- **Database:** SQLite for development, PostgreSQL in production (via `DATABASE_URL`)

```
.
├── src/                  React app (unchanged design)
│   └── lib/api/          API client: client.js, auth.js, profiles.js, calculations.js
├── backend/
│   ├── config/           settings.py, urls.py
│   ├── api/              models, serializers, views, urls, tests
│   ├── requirements.txt
│   └── .env.example
└── .env.example          frontend env (VITE_API_URL)
```

## 1. Run locally

You need **Node.js 20+** and **Python 3.11+**.

### Backend (terminal 1)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env
python manage.py migrate
python manage.py createsuperuser   # optional, for /admin
python manage.py runserver 8000
```

API: <http://localhost:8000/api/> · Health check: <http://localhost:8000/api/health/>

### Frontend (terminal 2)

```bash
# from the project root
cp .env.example .env               # contains VITE_API_URL=http://localhost:8000/api
npm install
npm run dev
```

Open <http://localhost:8080>, create an account, and use the calculators.

### Run the tests

```bash
cd backend && python manage.py test     # 6 API tests
cd .. && npm test                       # frontend routing tests
```

## 2. API reference

All bodies are JSON. Errors always look like
`{"detail": "Readable message", "errors": {"field": ["..."]}}`.

| Method | URL | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register/` | – | `{company_name, email, password}` → `{token, profile}` |
| POST | `/api/auth/login/` | – | `{email, password}` → `{token, profile}` |
| POST | `/api/auth/logout/` | ✔ | Deletes the token |
| POST | `/api/auth/change-password/` | ✔ | `{new_password}` → `{token}` (new token) |
| GET / PATCH | `/api/profile/` | ✔ | Company profile (`company_name, phone_number, industry, location`) |
| GET | `/api/calculations/` | ✔ | Your saved calculations, newest first |
| POST | `/api/calculations/` | ✔ | `{type, inputs, result, profit}` |
| DELETE | `/api/calculations/<id>/` | ✔ | Delete one of your calculations |
| GET | `/api/health/` | – | `{"status": "ok"}` |

`type` is one of `profit`, `units`, `input_cost`, `price_per_unit`. The server checks that the
`inputs` for that type are present and valid (positive numbers, whole numbers for `units` /
`duration`, `durationUnit` = `1` months or `12` years; `targetProfit` may be negative).

## 3. Security built in

- Passwords hashed by Django; Django's password validators enforced (min 8, not common/numeric).
- Every calculations query is filtered by the signed-in user — nobody can read or delete another user's data.
- Login/register are rate limited (10/min), other endpoints throttled per user/IP.
- Login failure message is identical for "unknown email" and "wrong password".
- Changing the password rotates the token (old sessions stop working).
- `DJANGO_SECRET_KEY` is **required** when `DJANGO_DEBUG=False`; HTTPS redirect, HSTS and secure cookies turn on automatically.
- CORS only allows the origins you list in `CORS_ALLOWED_ORIGINS`.

## 4. Deployment

### Backend (Render / Railway / Fly / any Linux server)

1. Create a **PostgreSQL** database and copy its connection URL.
2. Set these environment variables:

   | Variable | Example |
   |---|---|
   | `DJANGO_DEBUG` | `False` |
   | `DJANGO_SECRET_KEY` | long random string (see `.env.example` for a generator command) |
   | `DJANGO_ALLOWED_HOSTS` | `api.yourdomain.com` |
   | `CORS_ALLOWED_ORIGINS` | `https://app.yourdomain.com` |
   | `CSRF_TRUSTED_ORIGINS` | `https://api.yourdomain.com` (needed only for `/admin`) |
   | `DATABASE_URL` | `postgres://user:pass@host:5432/dbname` |

3. Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
4. Start command (run from `backend/`): `gunicorn config.wsgi --bind 0.0.0.0:$PORT`
5. Create an admin user once: `python manage.py createsuperuser`

### Frontend

Set `VITE_API_URL=https://api.yourdomain.com/api` **at build time**, then build.

- **Cloudflare (default target of this template):** `npm run build`, then `npx wrangler deploy` (or connect the repo to Cloudflare Pages/Workers).
- **Any Node host (Render, Railway, VPS):**
  ```bash
  NITRO_PRESET=node-server npm run build
  node .output/server/index.mjs        # listens on $PORT (default 3000)
  ```

After deploying, add the frontend's URL to the backend's `CORS_ALLOWED_ORIGINS`.

## 5. What changed from the original frontend

- Supabase replaced by the Django API (`src/lib/api/*`, `useSession`, login/register/profile/route guard). Login state is a token kept in `localStorage`; a 401 from the API signs the user out automatically.
- Removed all mouse-movement effects: the homepage pointer parallax (`usePointer` / camera offsets) is gone. Scroll animations, the intro sequence, reveal animations, hover transitions and count-ups are untouched.
- Fixed the routing test (it rendered before the router had loaded).
- Removed the unused `@supabase/supabase-js` dependency and `src/integrations/supabase/`.
