import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GATE_COOKIE_NAME, getExpectedGateToken, isValidGateToken } from "@/lib/gate";

export function proxy(request: NextRequest) {
    const expectedToken = getExpectedGateToken();
    // if SITE_PASSWORD not set - gate disabled
    if (!expectedToken) return NextResponse.next();

    const token = request.cookies.get(GATE_COOKIE_NAME)?.value;
    if (isValidGateToken(token)) return NextResponse.next();

    const gateUrl = new URL("/gate", request.url);
    gateUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(gateUrl);
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon\\.ico|design/|gate(?:$|/)).*)"],
};
