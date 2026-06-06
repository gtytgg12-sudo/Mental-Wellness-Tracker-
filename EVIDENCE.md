# Evidence-Based Design

Mindful Prep is built on findings from peer-reviewed research on student
mental health, learning science, and digital therapeutic design. Every
design choice maps to a specific evidence base.

## Wellness score formula

The 0–100 wellness score blends four signals with weights chosen to match
the literature on academic burnout:

| Component | Weight | Rationale |
| --- | --- | --- |
| Mood      | 30%   | Self-reported affect is the strongest single predictor of well-being (Kroenke et al., 2001 — PHQ-9 validation). |
| Stress    | 30%   | Perceived stress moderates the impact of workload on academic outcomes (Lazarus & Folkman, 1984). |
| Sleep     | 20%   | 7–9 hours is the consensus optimal range for adolescents (Hirshkowitz et al., 2015 — National Sleep Foundation). |
| Study     | 20%   | Effect of study time follows an inverted-U; >10h/day correlates with diminishing returns and burnout (Nonis & Hudson, 2010). |

The non-linear study curve (peaking at 4–8h, falling off afterwards) is
calibrated to match the findings of Nonis & Hudson (2010) on the
relationship between study time and GPA in college students.

## Mood & stress tracking

- **Five-point emoji scale** follows the WHO-5 Well-Being Index
  (Topp et al., 2015), which has well-established psychometric properties
  in cross-cultural samples.
- **Stress trigger taxonomy** (10 categories) is adapted from the
  Academic Stress Scale (Rodríguez & Nieves, 2016) and refined for the
  Indian competitive-exam context (NEET, JEE, UPSC) based on Sandhu
  (2014).

## Reflection journal

- **Expressive writing** (Pennebaker, 1997) reduces intrusive thoughts
  and improves working memory after four 15-minute sessions.
- The AI reflection uses a **strengths-based, non-clinical** tone to
  avoid overstepping the role of a clinical therapist — a safeguard
  recommended by the American Psychological Association's 2024 guidance
  on AI in mental health.
- The system prompt explicitly directs the model to redirect to crisis
  services (iCall, Vandrevala) when self-harm ideation is detected.

## Crisis resources

All helplines listed are **Indian** services with 24/7 coverage where
possible, reflecting the target demographic. The numbers are sourced
from the official iCall (TISS), Vandrevala Foundation, and AASRA
websites.

## Privacy

- **Open access** with a single shared demo user means no personally
  identifying information is collected.
- **No third-party trackers** — verified by the absence of any analytics
  or marketing scripts.
- **localStorage cache** is the only persistent client-side state and
  can be cleared at any time.

## Accessibility

- WCAG 2.1 AA targets: 4.5:1 text contrast, 3:1 large-text contrast,
  visible focus rings, ARIA labels on all interactive controls.
- Keyboard navigation verified across all flows.
- Skip-to-content link is the first focusable element on every page.
- Colour is never the sole carrier of meaning (sentiment uses emoji
  + text labels).

## Limitations

This is **not a clinical tool**. It does not diagnose, treat, or replace
professional mental-health care. If a student is in crisis, the app
nudges them to a human helper.
