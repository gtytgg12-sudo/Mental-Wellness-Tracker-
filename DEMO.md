# Demo Script — 90 seconds

Use this script to demo Mindful Prep in 90 seconds at the hackathon.

## Setup

Open `https://mental-wellness-tracker-gamma.vercel.app` in a fresh
incognito window so the localStorage cache is empty.

## The flow

1. **0:00–0:08** — Landing page. Point out the value prop
   ("Mental wellness companion for exam prep") and the
   "Open access · no signup" badge. Click **Start using Mindful Prep**.

2. **0:08–0:15** — Dashboard. Show the pre-seeded 14-day wellness chart
   and the daily streak. Highlight the personalised
   "Suggestions for you" list and the "Today's tip" card.

3. **0:15–0:35** — **Log a mood.** Click *Log mood* in the quick actions.
   Select 😄 *Great*, then check *Exam Pressure* trigger, drag
   intensity to 7, enter sleep = 7.5, study = 6. Click *Log my mood*.
   Toast confirms; dashboard score recomputes instantly.

4. **0:35–0:55** — **Journal reflection.** Go to *Journal*. Type
   "I am feeling overwhelmed with JEE prep, but I solved a hard
   Physics problem today and it reminded me I can do this." Click
   *Save & Reflect*. The AI returns a supportive reflection with
   keywords and a sentiment badge.

5. **0:55–1:10** — **Analytics.** Open *Analytics*. Show the 7-day
   trend line, the wellness bar, and the top-stress-trigger
   bar chart. Switch the time range to 30 days.

6. **1:10–1:20** — **Crisis resources.** Open *Wellness* (suggestions)
   page. Scroll to the bottom to show the always-visible
   crisis helplines (iCall, Vandrevala, AASRA).

7. **1:20–1:30** — **Accessibility & privacy.** Open
   *View Source* or DevTools and highlight:
   - `aria-live` regions for the toast/reflection
   - the skip-to-content link as the first focusable element
   - the security headers (Network → click a request → Headers)
   - the localStorage entry with the cached mood/journal entries

## What to say

> "Mindful Prep is a privacy-first mental wellness companion built
> specifically for students preparing for high-stakes Indian exams.
> No login, no tracking, no third-party scripts. The wellness score
> blends mood, stress, sleep, and study hours using weights chosen
> from the academic-burnout literature. The AI reflection journal uses
> a heuristic provider by default — it works offline and costs
> nothing — with an OpenAI swap for production. The whole thing is
> open-source, accessible, and ships as a Vercel deploy in under a
> minute."

## Talking points if judges ask

| Question | Answer |
| --- | --- |
| "What if the student is in crisis?" | The AI never plays therapist. It detects distress keywords and points to the iCall / Vandrevala / AASRA helplines that are always visible in the app. |
| "Is this a medical device?" | No. We are explicit about that on the crisis page and in the system prompt. This is a self-monitoring tool, not a diagnostic one. |
| "How do you keep data private?" | Open access means we collect nothing. The single shared demo user means there is no PII to leak. The optional SQLite store is local-only. |
| "Why open access?" | Hackathon requirement: zero-friction demo. We are explicit about it being a demo mode. In production we would add an opt-in account flow. |
| "How is the wellness score computed?" | Weighted average of mood (30%), stress (30%), sleep (20%), study (20%) with non-linear study and sleep curves. See `EVIDENCE.md` for citations. |

## Reset between demos

```js
// In the browser console:
localStorage.clear(); location.reload();
```
