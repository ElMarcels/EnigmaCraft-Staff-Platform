import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Allow seamless navigation across all views during design and testing
  return NextResponse.next();
}
