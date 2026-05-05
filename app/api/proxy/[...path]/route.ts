import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE ?? "";

// Skip headers that must not be forwarded to the upstream server
const SKIP_REQ = new Set(["host", "connection", "transfer-encoding", "content-length"]);
const SKIP_RES = new Set(["transfer-encoding", "connection"]);

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const targetUrl = `${BACKEND}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!SKIP_REQ.has(key.toLowerCase())) headers.set(key, value);
  });

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      // Pass the raw body stream — preserves multipart boundaries intact
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
      // Required for streaming request bodies in Node fetch
      // @ts-expect-error — duplex is valid in Node 18 fetch
      duplex: "half",
    });
  } catch (err) {
    return NextResponse.json(
      { detail: `Proxy error: ${(err as Error).message}` },
      { status: 502 },
    );
  }

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!SKIP_RES.has(key.toLowerCase())) resHeaders.set(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET     = handler;
export const POST    = handler;
export const PUT     = handler;
export const PATCH   = handler;
export const DELETE  = handler;
export const OPTIONS = handler;

// Allow large file uploads (no default 4MB body size limit)
export const config = {
  api: { bodyParser: false },
};
