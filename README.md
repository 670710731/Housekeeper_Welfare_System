# Housekeeper_Welfare_System

## Run the application

The React app runs on port `3000` and the Go API on port `8080`. During Vite development, `/api` requests are proxied to the backend, so the browser does not need to connect to `localhost:8080` directly.

1. Create the PostgreSQL database and tables using `backend/create-db.sql`.
2. Configure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT` for the backend. The defaults are `localhost`, `postgres`, `welfare_db`, and `5432`; `DB_PASSWORD` must be set.
3. Start the API:

	```bash
	cd backend
	go run .
	```

4. Leave `VITE_API_URL` unset or empty in `frontend/.env.local` to use the Vite proxy. Set it to an absolute API URL only when the frontend should bypass that proxy.
5. Start the frontend in another terminal:

	```bash
	cd frontend
	npm install
	npm run dev
	```

Sign-in uses the employee phone number and password stored in PostgreSQL. Authenticated API requests use the JWT returned by `POST /api/login`.

## Run the API without PostgreSQL

For frontend development before the database is ready, start the in-memory mock API instead:

```bash
cd backend
MOCK_MODE=true go run .
```

Leave `VITE_API_URL` unset or empty in `frontend/.env.local`, then run the frontend as above. Mock accounts are `0812345678` / `123456` for HR and `0891112233` / `password123` for an employee. The mock API includes sample entitlements and one pending request. Changes are held in memory and reset when the backend restarts; this mode is for development only.