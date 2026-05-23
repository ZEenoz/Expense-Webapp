<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tech Stack
- Framework: Next.js (React)
- Language: TypeScript
- Styling: Tailwind CSS
- State Management: React Hooks (useState, useEffect, etc.)
- Data Fetching: Server Actions, Client Components (useQuery, etc.)

# Development Workflow
1. Always use Server Actions for data mutations (e.g., add expense).
2. Use Client Components for interactive UIs (e.g., ExpenseTable, Settings).
3. Protect routes using Middleware (e.g., /dashboard, /settings must be logged in).
4. Use Google Sheets API for data storage.
5. Handle environment variables via .env.local.
6. Always use Thai language for UI text.

# Coding Standards
- Follow React best practices.
- Ensure responsive design.
- Optimize for mobile (LINE mini-app format).
- Use Tailwind classes for styling.

# Google Sheets API
- Use the service account for server-side operations.
- Do not expose API keys or service account credentials to the client.

# Security
- All sensitive operations must be server-side.
- Validate all incoming data.
