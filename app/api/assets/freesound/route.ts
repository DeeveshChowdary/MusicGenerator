import { NextRequest, NextResponse } from "next/server";

const FREESOUND_ENDPOINT = "https://freesound.org/apiv2/search/text/";

function getApiKey(): string {
  return process.env.FREESOUND_API_KEY?.trim() || process.env.NEXT_PUBLIC_FREESOUND_API_KEY?.trim() || "";
}

export async function GET(request: NextRequest) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Freesound API key missing. Create a free key at https://freesound.org/apiv2/apply/ and set NEXT_PUBLIC_FREESOUND_API_KEY in .env.local.",
      },
      { status: 400 },
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query parameter q" }, { status: 400 });
  }

  const params = new URLSearchParams({
    token: apiKey,
    query,
    page_size: "10",
    fields: "id,name,previews,duration,username,license,url,tags",
    filter: "duration:[2 TO 120]",
  });

  const response = await fetch(`${FREESOUND_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Freesound request failed (${response.status}): ${text.slice(0, 120)}` }, { status: 502 });
  }

  const data = (await response.json()) as {
    results?: Array<{
      id: number;
      name: string;
      previews?: { [k: string]: string };
      duration: number;
      username: string;
      license: string;
      url: string;
      tags?: string[];
    }>;
  };

  const results = (data.results ?? [])
    .filter((item) => item.previews?.["preview-hq-mp3"])
    .map((item) => ({
      id: item.id,
      name: item.name,
      preview: item.previews?.["preview-hq-mp3"] ?? item.previews?.["preview-lq-mp3"] ?? "",
      duration: item.duration,
      username: item.username,
      license: item.license,
      url: item.url,
      tags: item.tags ?? [],
      attribution: `Sound \"${item.name}\" by ${item.username} (${item.license})`,
    }));

  return NextResponse.json(
    {
      query,
      results,
      source: "Freesound",
      attributionRequired: true,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
