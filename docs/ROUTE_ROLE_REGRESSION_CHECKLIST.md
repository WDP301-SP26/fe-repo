# Route Role Regression Checklist

Use this after auth or routing changes.

## Auth Pages
- Unauthenticated user can open `/signin`
- Unauthenticated user can open `/signup`
- Authenticated user visiting `/signin` is redirected to the correct role home
- Authenticated user visiting `/signup` is redirected to the correct role home

## Role Matrix
- `STUDENT` lands on `/student`
- `LECTURER` lands on `/lecturer`
- `ADMIN` lands on `/dashboard/admin`
- `STUDENT` cannot access `/lecturer`
- `LECTURER` cannot access `/student`
- Non-admin user cannot access `/dashboard`
- Non-admin user cannot access `/dashboard/admin`

## Callback Flow
- Login form redirects by backend role without hitting a missing route
- OAuth callback resolves to the same role home as credential login
- Legacy `/dashboard` route redirects to a valid role home

## Dead-End Check
- No redirect targets `/register`
- No redirect targets a missing `/dashboard/admin` route
- Dashboard sidebar links point only to routes that exist
