# Proposly Ai

You are a senior full-stack engineer and UI/UX designer.

Build a production-ready web application called "Gigify" — 

an AI-powered proposal generator for freelancers.

IMPORTANT: This is a focused, single-feature SaaS product. 

Build it FAST but make it look PREMIUM and BEAUTIFUL.

----------------------------------------------------

Tech Stack

----------------------------------------------------

Frontend: React + Vite + Tailwind CSS + Framer Motion (for smooth animations)

Backend: Node.js + Express

AI: Anthropic Claude API (use environment variable ANTHROPIC_API_KEY)

Database: SQLite (simple, no external setup needed)

Auth: Email + password with JWT

----------------------------------------------------

Design (this matters a lot)

----------------------------------------------------

- Premium SaaS look — like Linear, Vercel, or Notion

- Dark theme, background: #0B0B0B

- Accent color: #0EA5E9 (sky blue)

- Font: Inter

- Smooth micro-animations on buttons, page transitions, loading states

- Clean spacing, rounded corners, subtle shadows

- Fully mobile responsive

----------------------------------------------------

Pages

----------------------------------------------------

1. Landing Page — hero section, how it works, simple pricing preview, CTA

2. Login / Register page

3. Dashboard — paste job description, select platform (Fiverr/Upwork/Freelancer), 

   select tone (Professional/Friendly/Confident), generate button

4. Generated proposal — editable text box, copy button, download as PDF button, save button

5. History page — list of saved proposals, search, delete

6. Simple Settings page — change password, logout

----------------------------------------------------

Core Feature Flow

----------------------------------------------------

1. User pastes job posting text

2. Selects platform + tone

3. Clicks Generate → AI creates tailored proposal

4. User can edit result inline

5. Copy to clipboard / Download PDF / Save to history

----------------------------------------------------

Monetization (structure only, no real payment yet)

----------------------------------------------------

- Free plan: 5 proposals/month (track in database)

- "Upgrade to Pro" UI placeholder when limit hit — no real payment gateway yet

----------------------------------------------------

Requirements

----------------------------------------------------

- Everything must work end-to-end, zero broken features

- Prioritize speed of development — avoid unnecessary complexity

- Do NOT build: resume builder, invoice generator, CRM, project 

  management, time tracker, notifications, TypeScript, Prisma, 

  or any external database service — keep it self-contained

- At the end, explain what's completed and how to test it

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://proposaly.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e9fba500-6580-42dc-aeca-fb29de183432).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
