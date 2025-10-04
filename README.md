## Backend Setup
1. Setup and activate virtual environment (Macbook)
```bash
python -m venv .venv
source .venv/bin/activate    
```
for Windows, run this instead
```
python -m venv .venv
source .venv/Scripts/activate
```
2. Install packages 
```bash
pip install -r requirements.txt
```
3. Setup database
```bash
python manage.py makemigrations ai_scale_app
python manage.py migrate
```
4. Load data into database (in root directory)
```bash
python manage.py loaddata ai_scale_app/table_data/dummy_data.json
python manage.py hash_passwords
```
5. Create superuser 
```bash
python manage.py createsuperuser
```
6. Start backend django server
```bash
python manage.py runserver
```
Visit http://127.0.0.1:8000/admin/ for admin log in page for server.

**Not working?**
- Remove the generated "migrations" folder
- Remove db.sqlite3
- Try the above commands again

## Frontend Setup
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

To run the app
- Make sure you have [Node.js and npm](https://nodejs.org/) installed before running the development server:
```bash
npm install
```
- Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
- Then open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

*Credits: This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.*
