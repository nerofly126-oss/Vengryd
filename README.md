# Vengryd

The waitlist form now stores signups in Supabase and triggers a Supabase Edge Function to send emails through Resend.

## Frontend environment

Copy values from [.env.example](/home/buildwithnero/vengryd/.env.example) into your local `.env`:

`VITE_SUPABASE_URL`
`VITE_SUPABASE_ANON_KEY`
`VITE_SUPABASE_WAITLIST_TABLE`
`VITE_SUPABASE_WAITLIST_EMAIL_FUNCTION`

## Supabase function setup

Deploy the function in [supabase/functions/waitlist-email/index.ts](/home/buildwithnero/vengryd/supabase/functions/waitlist-email/index.ts).

Set these Supabase secrets before deploying:

`RESEND_API_KEY`
`WAITLIST_FROM_EMAIL`
`WAITLIST_ADMIN_EMAIL`
`WAITLIST_APP_NAME`
`WAITLIST_SITE_URL`

Example deploy flow:

```bash
supabase secrets set \
  RESEND_API_KEY=your_resend_key \
  WAITLIST_FROM_EMAIL="Vengryd <waitlist@yourdomain.com>" \
  WAITLIST_ADMIN_EMAIL=you@example.com \
  WAITLIST_APP_NAME=vengryd \
  WAITLIST_SITE_URL=https://your-site-url.com

supabase functions deploy waitlist-email --no-verify-jwt
```

## Waitlist table

The waitlist expects a table like `waitlist_signups` with a unique `email` column.
