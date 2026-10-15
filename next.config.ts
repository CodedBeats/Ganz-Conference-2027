import type { NextConfig } from "next";

// Uploaded files are served from the Supabase `files` bucket, and next/image only loads
// remote images from hosts listed here
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const storagePattern = supabaseUrl ? new URL("/storage/v1/object/public/files/**", supabaseUrl) : null;
const isLocalSupabase = storagePattern?.hostname === "127.0.0.1" || storagePattern?.hostname === "localhost";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: storagePattern ? [storagePattern] : [],
    // Next 16 refuses to optimise images from local IPs - only allow it for the local Supabase stack
    dangerouslyAllowLocalIP: isLocalSupabase,
  },
};

export default nextConfig;