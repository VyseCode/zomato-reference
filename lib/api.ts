import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return fail(error.issues[0]?.message ?? "Invalid input", 400);
  }
  if (error instanceof SyntaxError) {
    return fail("Invalid JSON body", 400);
  }
  console.error("[api] unexpected error:", error);
  return fail("Something went wrong. Please try again.", 500);
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export function paginationFrom(searchParams: URLSearchParams, defaultLimit = 12) {
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const rawLimit = Number(searchParams.get("limit") ?? defaultLimit);
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : defaultLimit, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json();
}
