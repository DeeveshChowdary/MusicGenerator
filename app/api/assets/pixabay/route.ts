import { NextRequest, NextResponse } from "next/server";

const PIXABAY_ENDPOINT = "https://pixabay.com/api/";

function getApiKey(): string {
  return process.env.PIXABAY_API_KEY?.trim() || process.env.NEXT_PUBLIC_PIXABAY_API_KEY?.trim() || "";
}

export async function GET(request: NextRequest) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Pixabay API key missing. Create a free key at https://pixabay.com/api/docs/ and set NEXT_PUBLIC_PIXABAY_API_KEY in .env.local.",
      },
      { status: 400 },
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query parameter q" }, { status: 400 });
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    image_type: "photo",
    safesearch: "true",
    per_page: "12",
  });

  const response = await fetch(`${PIXABAY_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Pixabay request failed (${response.status}): ${text.slice(0, 120)}` }, { status: 502 });
  }

  const data = (await response.json()) as {
    hits?: Array<{
      id: number;
      tags: string;
      previewURL: string;
      largeImageURL: string;
      user: string;
      pageURL: string;
    }>;
  };

  return NextResponse.json(
    {
      query,
      results: (data.hits ?? []).map((hit) => ({
        id: hit.id,
        tags: hit.tags,
        previewURL: hit.previewURL,
        largeImageURL: hit.largeImageURL,
        user: hit.user,
        pageURL: hit.pageURL,
      })),
      source: "Pixabay",
      attributionRequired: true,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=600",
      },
    },
  );
}
