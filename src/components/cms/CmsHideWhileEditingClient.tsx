"use client";

import type { ReactNode } from "react";
import { useCmsBox } from "@/hooks/useCmsBox";

export const CmsHideWhileEditingClient = ({ children }: { children: ReactNode }) => {
    const box = useCmsBox();
    return box?.isEditing ? null : <>{children}</>;
};