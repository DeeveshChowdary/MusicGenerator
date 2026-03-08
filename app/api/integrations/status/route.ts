import { NextResponse } from "next/server";

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export async function GET() {
  const freesound = env("FREESOUND_API_KEY") || env("NEXT_PUBLIC_FREESOUND_API_KEY");
  const pixabay = env("PIXABAY_API_KEY") || env("NEXT_PUBLIC_PIXABAY_API_KEY");

  return NextResponse.json(
    {
      freesoundConfigured: Boolean(freesound),
      pixabayConfigured: Boolean(pixabay),
      freesoundReachable: Boolean(freesound),
      pixabayReachable: Boolean(pixabay),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
