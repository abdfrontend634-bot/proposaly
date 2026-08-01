export const BRAND = {
  name: "Pitchly",
  legalName: "Pitchly",
  tagline: "AI proposals that win the gig",
  description:
    "Turn any job posting into a polished, client-ready proposal in seconds. Built for freelancers on Upwork, Fiverr and Freelancer.",
  version: "2.5.0",
  domain: "https://gigify.lovable.app",
} as const;

/**
 * Edit these values to personalise the public "About the developer" page.
 */
export const DEVELOPER = {
  name: "Pitchly Studio",
  role: "Independent product engineer & founder",
  location: "Remote",
  bio: "I design and build focused, fast software for freelancers. Pitchly started as a personal tool to stop rewriting the same proposal every night — it grew into a full product for people who bid for a living.",
  focus: [
    "Product design & front-end engineering",
    "Applied AI and prompt systems",
    "Full-stack TypeScript",
  ],
  stack: [
    "React",
    "TypeScript",
    "TanStack Start",
    "Tailwind CSS",
    "Postgres",
    "Lovable Cloud",
    "AI Gateway",
  ],
  email: "hello@pitchly.app",
  website: "https://gigify.lovable.app",
} as const;
