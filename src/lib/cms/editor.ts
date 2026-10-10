import { cache } from "react";
import { getCurrentUser, isAdminUser } from "@/lib/auth";

/**
 * Whether the current request should get the homepage editor UI.
 *
 * @remarks
 * Every CMS server wrapper (`CmsBox`, `CmsText`, ...) calls this to decide between plain
 * markup and its editor client component, so visitors never receive editor code. Wrapped
 * in `cache` so the whole page shares one check, and `getCurrentUser` is itself cached.
 * This only gates the UI - the actions re-check the admin role on every save.
 */
export const isCmsEditor = cache(async (): Promise<boolean> => {
    const user = await getCurrentUser();
    return user !== null && isAdminUser(user);
});