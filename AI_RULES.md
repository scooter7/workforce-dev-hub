# AI_RULES.md

## Tech Stack Overview

- **Framework:** Next.js 14 (App Router, Server & Client Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS (with custom theme and shadcn/ui integration)
- **UI Components:** shadcn/ui, Radix UI, and Heroicons/Lucide for icons
- **State Management:** React hooks and context (no Redux/MobX)
- **Database & Auth:** Supabase (Postgres, RLS, Auth, Storage)
- **AI Integration:** OpenAI API (for chat, embeddings, RAG)
- **Forms:** react-hook-form with zod for validation
- **Notifications:** sonner (for toasts)
- **Data Visualization:** React Flow (for mind maps)
- **Markdown Rendering:** react-markdown with remark-gfm

---

## Library Usage Rules

1. **UI Components**
   - Use **shadcn/ui** components for all new UI elements (buttons, modals, inputs, etc.).
   - Use **Radix UI** primitives only if shadcn/ui does not provide the needed component.
   - Use **Heroicons** or **Lucide** for all icons; do not use other icon libraries.

2. **Styling**
   - Use **Tailwind CSS** utility classes for all styling and layout.
   - Do not use CSS-in-JS, styled-components, or SCSS.
   - Place all custom CSS in `src/app/globals.css` if needed.

3. **Forms & Validation**
   - Use **react-hook-form** for all forms.
   - Use **zod** for schema validation and type inference in forms and API routes.

4. **State & Context**
   - Use React's built-in hooks (`useState`, `useEffect`, `useContext`) for state management.
   - Use context providers for global state (e.g., AuthProvider, SupabaseProvider).
   - Do not use Redux, MobX, or other state libraries.

5. **Database & Auth**
   - Use **Supabase** for all database, authentication, and storage needs.
   - Use the provided Supabase client utilities (`createSupabaseServerClient`, `createSupabaseAdminClient`, `createSupabaseBrowserClient`).

6. **AI & Embeddings**
   - Use the **OpenAI** package for all LLM and embedding requests.
   - Do not use other AI/ML libraries unless explicitly required.

7. **Notifications**
   - Use **sonner** for all toast notifications.
   - Do not use react-toastify or other notification libraries.

8. **Data Visualization**
   - Use **React Flow** for all mind map and node-based visualizations.
   - Do not use D3, vis.js, or other graph libraries.

9. **Markdown**
   - Use **react-markdown** with **remark-gfm** for rendering markdown content.

10. **General**
    - All new code must be written in TypeScript.
    - All new components must be placed in the appropriate `src/components/` subfolder.
    - All new pages must be placed in the appropriate `src/app/` subfolder.
    - Do not introduce new libraries without explicit approval.

---