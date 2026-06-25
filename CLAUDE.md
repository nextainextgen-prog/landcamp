@AGENTS.md

# Coder Contract — landcamp-team

อ่านไฟล์นี้ก่อนทำทุกอย่าง

## Project context
- Stack: **Next.js 16.2.9** (App Router), React 19, Tailwind v4, Supabase, GSAP, Three.js
- Package manager: **npm** (มี `package-lock.json`)
- ⚠ Next.js 16 มี breaking changes จาก training data — อ่าน `node_modules/next/dist/docs/` ทุกครั้งที่ทำงานกับ Next.js API

## Workspace rules
- ทำงาน **เฉพาะใน worktree ของตัวเอง** (`.worktrees/codex-N/`) เท่านั้น
- Branch ของตัวเอง: `agents/codex-N` (อย่าเข้า branch อื่น)
- **Target branch = `alpha`** — ห้าม merge/push เข้า `main`
- ห้ามแก้ไฟล์ในรายการ "Owner-guarded" ด้านล่าง

## Done-criteria (ต้องครบทั้ง 3 ข้อก่อน commit)
1. `npx tsc --noEmit` — green (typecheck ผ่านทั้งหมด)
2. `npm run lint` — green (eslint ผ่าน)
3. `npm run build` — green (Next.js build ผ่าน — สำคัญสุด เพราะเช็คทั้ง type + RSC + route)

## Commit rules
- Conventional commits: `feat(scope):`, `fix(scope):`, `chore(scope):`, `refactor(scope):`, `style(scope):`, `docs(scope):`
- ตัวอย่าง: `feat(hero): make CTA buttons equal width on mobile`
- commit หลังจากผ่าน done-criteria เท่านั้น
- ห้ามใช้ `--no-verify` (hook ต้องผ่าน)

## Scope per coder
- 1 task = 1 feature/fix ที่ scoped ไม่ทับไฟล์ coder อื่น
- ถ้าไม่ชัดเจน → ถาม lead ก่อนเริ่ม
- ถ้าต้องแก้ไฟล์ shared → notify lead ทันที

## Owner-guarded files (ห้ามแก้ถ้าไม่ได้รับมอบหมายชัดเจน)
- `package.json` / `package-lock.json` (ระบบจัดการ dep)
- `next.config.ts` / `eslint.config.mjs` / `postcss.config.mjs` / `tsconfig.json`
- `.env*`
- `supabase/migrations/` (database schema)
- `app/layout.tsx` (root layout — กระทบทั้งเว็บ)

## Project structure
```
app/              Next.js App Router (pages, layouts, routes)
components/       React components
data/             Static data / content
lib/              Utilities, Supabase client, helpers
public/           Static assets
supabase/         DB schema + migrations
types/            TypeScript types
```

## Database
- **Supabase** (Postgres)
- Client: `lib/supabase/` (ใช้ `@supabase/ssr` สำหรับ Next.js)
- Migrations: `supabase/migrations/` — ห้ามแก้โดยตรง

## Deployment
- Production: Vercel (`https://vercel.com/nextainextgen-progs-projects/landcamp`)
- Git remote: `https://github.com/nextainextgen-prog/landcamp.git`
- **ห้าม push เข้า `main`** — push เฉพาะ `agents/codex-N` หรือ `alpha`
