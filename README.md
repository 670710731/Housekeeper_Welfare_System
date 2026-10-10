# Housekeeper_Welfare_System

## Run the application

The React app runs on port `3000` and calls the Go API on port `8080`.

1. Create the PostgreSQL database and tables using `backend/create-db.sql`.
2. Configure `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT` for the backend. The defaults are `localhost`, `postgres`, `welfare_db`, and `5432`; `DB_PASSWORD` must be set.
3. Start the API:

	```bash
	cd backend
	go run .
	```

4. Optionally set `VITE_API_URL` in `frontend/.env.local`. Its default is `http://localhost:8080`.
5. Start the frontend in another terminal:

	```bash
	cd frontend
	npm install
	npm run dev
	```

Sign-in uses the employee phone number and password stored in PostgreSQL. Authenticated API requests use the JWT returned by `POST /api/login`.