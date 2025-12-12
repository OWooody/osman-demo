# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## Project Overview

**Managed ChatKit Starter** — A Vite + React frontend with FastAPI backend for OpenAI ChatKit workflow sessions. Demonstrates a financial/business intelligence use case with chat interface and P&L visualization.

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite 7, TypeScript, Tailwind CSS 4, @openai/chatkit-react, Framer Motion, recharts |
| **Backend** | FastAPI, httpx, uvicorn, Python 3.11+ |
| **UI System** | shadcn/ui, Radix UI primitives, CVA (Class Variance Authority) |
| **Tooling** | ESLint, ruff, mypy |

### Architecture

```
.
├── chatkit-js/               # Git submodule: official ChatKit JS library
└── managed-chatkit/
    ├── frontend/             # React + Vite + TypeScript
    │   └── src/
    │       ├── components/   # UI components (ChatKitPanel.tsx)
    │       └── lib/          # Utilities (chatkitSession.ts)
    ├── backend/              # FastAPI + Python 3.11+
    │   └── app/main.py       # /api/create-session endpoint
    └── package.json          # Root: runs both via concurrently
```

### Data Flow

1. Frontend → `/api/create-session` with workflow ID
2. Backend → OpenAI API (exchanges workflow ID + API key for client secret)
3. Frontend → establishes ChatKit session with client secret
4. Vite proxies `/api/*` → backend :8000

---

## Quick Reference

### Commands

```bash
# Development (from managed-chatkit/)
npm install && npm run dev    # Both servers (:3000 + :8000)

# Frontend only (from managed-chatkit/frontend/)
npm run dev                   # Vite :3000
npm run build                 # Production build
npm run lint                  # ESLint (--max-warnings=0)

# Backend only (from managed-chatkit/backend/)
./scripts/run.sh              # Creates venv, runs uvicorn

# Linting
npm run lint                              # Frontend
python -m ruff check app                  # Backend
python -m mypy app --ignore-missing-imports
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key (sk-proj-...) |
| `VITE_CHATKIT_WORKFLOW_ID` | Yes | ChatKit workflow ID (wf_...) |
| `CHATKIT_API_BASE` | No | Override API endpoint |
| `VITE_API_URL` | No | Override dev proxy target |

---

## ChatKit Documentation

**ALWAYS check `chatkit-js/` submodule before writing ChatKit-related code.**

```bash
git submodule update --init --recursive   # Initialize after clone
```

### Key Paths

| Purpose | Path |
|---------|------|
| Full docs | `chatkit-js/packages/docs/src/content/docs/` |
| React bindings | `chatkit-js/packages/chatkit-react/` |
| Core library | `chatkit-js/packages/chatkit/` |
| Quickstart | `chatkit-js/packages/docs/src/content/docs/quickstart.mdx` |
| Theming | `chatkit-js/packages/docs/src/content/docs/customize.mdx` |
| useChatKit API | `chatkit-js/packages/docs/src/content/docs/quick-reference/use-chatkit.mdx` |

### Frontend Patterns

- **Hook**: `useChatKit` with theme, tools, start screen prompts
- **Client tools**: `search_docs`, `generate_report` via `onClientTool`
- **Widget actions**: `request.submit`, `request.discard` via `sendCustomAction`
- **Styling**: Purple accent (#8000ff), OpenAI Sans font

---

## Code Standards

### Core Principles

1. **Follow requirements precisely** — implement exactly what's requested
2. **Think step-by-step** — describe architecture plan before coding
3. **Complete implementation** — no TODOs, placeholders, or missing pieces
4. **Accessibility first** — WCAG 2.1 AA, keyboard nav, screen readers
5. **Performance aware** — 60fps animations, GPU-accelerated transforms
6. **Be concise** — minimize prose, maximize working code

### TypeScript & React

- Use `forwardRef` for all interactive components
- Strict typing for all props, variants, and motion configs
- Proper interfaces over inline types
- Export with `displayName` for debugging

### Component Architecture (shadcn/ui)

```typescript
// Pattern: CVA variants + forwardRef + cn()
const buttonVariants = cva("base-classes", {
  variants: { size: { sm: "...", lg: "..." } },
  defaultVariants: { size: "sm" }
});

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ size }), className)} {...props} />
  )
);
Button.displayName = "Button";
```

- Extend existing shadcn components, don't rebuild
- Use Radix UI primitives as foundation
- Compound components for complex UI (Card.Header, Card.Content)
- Support controlled and uncontrolled modes

### Styling (Tailwind CSS 4)

- Use shadcn design tokens: `hsl(var(--primary))`
- Conditional classes via `cn()` utility
- Dark mode through CSS variables
- Focus states and accessibility indicators required

### Animation & Motion (Framer Motion)

```typescript
// Pattern: Reusable variants + AnimatePresence
const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 } };

<AnimatePresence>
  {show && <motion.div {...fadeIn} exit={{ opacity: 0 }} />}
</AnimatePresence>
```

- **Prefer**: `transform`, `opacity` (GPU-accelerated)
- **Avoid**: `width`, `height`, `top`, `left` animations
- Use `motion.create()` to wrap shadcn components
- `layoutId` for shared element transitions
- Spring physics for natural feel

### CSS Animation (Tailwind)

- Use `tw-animate-css` for Tailwind v4 (NOT tailwindcss-animate)
- Custom keyframes in CSS/config for complex animations
- CSS custom properties for dynamic values
- Responsive animations with breakpoint modifiers

### Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Reduced motion | `useReducedMotion()` hook, `prefers-reduced-motion` media query |
| Keyboard nav | Focus management, tab order, escape handlers |
| Screen readers | ARIA labels, roles, live regions |
| Animation duration | < 500ms for micro-interactions |
| Focus indicators | Visible focus rings on all interactive elements |

### Performance Standards

- 60fps animations (use Performance DevTools)
- `will-change` sparingly, clean up after animations
- `useCallback` for motion event handlers
- Intersection observers for scroll-triggered animations
- Proper cleanup in `useEffect` dependencies

---

## Response Protocol

1. **Uncertainty** — State explicitly when unsure about performance impact or API behavior
2. **Knowledge gaps** — Admit when unfamiliar with specific APIs rather than guessing
3. **Stay current** — Search for latest docs on Framer Motion, shadcn/ui, Radix when needed
4. **Focus** — Prioritize implementation over general explanations
5. **Examples** — Provide only when requested
