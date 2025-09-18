This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

**Make sure you have [Node.js and npm](https://nodejs.org/) installed before running the development server.**
Install dependencies:
```bash
npm install
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Once you have confirmed the server is working, stop it by pressing `Ctrl+C` in the terminal before proceeding to backend setup.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Backend Setup
1. Setup and activate virtual environment
```bash
python -m venv .venv
source .venv/bin/activate    
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
python manage.py generate_ai_use_scales
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
## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
