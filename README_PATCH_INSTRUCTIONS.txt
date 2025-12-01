Dream Harbour Billing - Patch Application Instructions (Layman friendly)

1) Download and unzip this patch into a new folder on your computer.
2) Open the project root folder in VS Code.
3) Install Node.js (if not installed): https://nodejs.org/ (install LTS).
4) Open a terminal in the project folder and run:
   npm install
5) Create a file `.env` or set environment variables for your Supabase:
   VITE_SUPABASE_URL and VITE_SUPABASE_KEY
6) Run development server:
   npm run dev
7) To apply database changes: Open Supabase -> SQL Editor -> paste files from /migrations and run them one-by-one.
8) When ready to build production bundle:
   npm run build
