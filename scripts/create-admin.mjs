// Creates the admin login from ADMIN_EMAIL / ADMIN_PASSWORD in .env.local.
// Sign-ups are disabled, so this (or the Supabase dashboard) is the only way accounts get made.
// app_metadata.role = 'admin' is what public.is_admin() checks in the RLS policies.
//
//   node --env-file=.env.local scripts/create-admin.mjs         -> live project (needs SUPABASE_SECRET_KEY)
//   node --env-file=.env.local scripts/create-admin.mjs --dev   -> local stack
import { createClient } from "@supabase/supabase-js";

const isDev = process.argv.includes("--dev");
const url = isDev ? process.env.SUPABASE_URL_DEV : process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = isDev ? process.env.SUPABASE_SECRET_KEY_DEV : process.env.SUPABASE_SECRET_KEY;
const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;

const missing = Object.entries({ url, secretKey, email, password })
    .filter(([, value]) => !value)
    .map(([key]) => key);
if (missing.length) {
    console.error(`Missing env values: ${missing.join(", ")}`);
    process.exit(1);
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "admin" },
});

if (error?.code === "email_exists") {
    console.log(`${email} already exists on ${isDev ? "local" : "live"} - nothing to do.`);
    process.exit(0);
}
if (error) {
    console.error(error);
    process.exit(1);
}

console.log(`Created admin ${data.user.email} on ${isDev ? "local" : "live"}.`);
