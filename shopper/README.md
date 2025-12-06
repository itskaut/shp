Shop course project - static frontend + API + Postgres + Redis + Adminer
----------------------------------------------------------------------
How to run (macOS / Linux / Windows with Docker Desktop):

1. Install Docker Desktop and start it.
2. Unzip this archive to a folder, open terminal and cd into it.
3. Run: docker-compose up --build
4. Visit:
   - Frontend: http://localhost:3000
   - API: http://localhost:4000/api/products
   - Adminer: http://localhost:8080 (server: db, user: postgres, password: password, database: shopdb)

Notes:
- Cart is stored in browser localStorage. Checkout POSTs to /api/orders (demo).
# shopper
