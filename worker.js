export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (url.pathname === "/api/events") {
      if (request.method !== "GET") {
        return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });
      }
      if (!env.GITHUB_TOKEN) {
        return Response.json({ error: "GITHUB_TOKEN secret is not configured on this Worker" }, { status: 500, headers: cors });
      }
      try {
        const upstream = await fetch(
          "https://api.github.com/repos/hemant190501/fulltoss18/contents/events.json?ref=private-data",
          {
            headers: {
              "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
              "Accept": "application/vnd.github.raw+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "User-Agent": "FULLTOSS18"
            }
          }
        );
        if (!upstream.ok) {
          return Response.json(
            { error: "GitHub could not provide events.json", upstreamStatus: upstream.status },
            { status: 502, headers: cors }
          );
        }
        const body = await upstream.text();
        JSON.parse(body);
        return new Response(body, {
          status: 200,
          headers: {
            ...cors,
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=30, s-maxage=30"
          }
        });
      } catch {
        return Response.json({ error: "Feed response was not valid JSON" }, { status: 502, headers: cors });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
