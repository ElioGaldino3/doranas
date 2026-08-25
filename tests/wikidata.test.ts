import { describe, it, expect, vi } from "vitest";
import {
  resolveSeriesQidsByTmdbIds,
  fetchCastForQid,
  sparqlQuery,
  qidFromUri,
  WikidataHttpError,
} from "../src/services/wikidata";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string>) },
    ...init,
  });
}

describe("qidFromUri", () => {
  it("extrai o QID de uma URI do Wikidata", () => {
    expect(qidFromUri("http://www.wikidata.org/entity/Q2263")).toBe("Q2263");
    expect(qidFromUri("https://www.wikidata.org/entity/Q1")).toBe("Q1");
  });
});

describe("sparqlQuery", () => {
  it("monta a URL com query e format=json e usa User-Agent", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      const u = new URL(url as string);
      expect(u.pathname).toBe("/sparql");
      expect(u.searchParams.get("format")).toBe("json");
      expect(u.searchParams.get("query")).toBeTruthy();
      return jsonResponse({ results: { bindings: [] } });
    });

    await sparqlQuery("SELECT * WHERE {}", { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    // valida o header User-Agent no objeto de opções
    const call = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = call[1].headers as Record<string, string>;
    expect(headers["User-Agent"]).toContain("dorama-actors");
  });

  it("lança WikidataHttpError em resposta não-ok com Retry-After", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response("", { status: 429, headers: { "Retry-After": "5" } });
    });

    await expect(
      sparqlQuery("QUERY", { fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toMatchObject({ name: "WikidataHttpError", status: 429, retryAfterMs: 5000 });
  });

  it("retryAfterMs é null quando não há Retry-After", async () => {
    const fetchImpl = vi.fn(async () => new Response("", { status: 500 }));
    try {
      await sparqlQuery("QUERY", { fetchImpl: fetchImpl as unknown as typeof fetch });
      throw new Error("não deveria chegar aqui");
    } catch (e) {
      expect(e).toBeInstanceOf(WikidataHttpError);
      expect((e as WikidataHttpError).retryAfterMs).toBeNull();
    }
  });
});

describe("resolveSeriesQidsByTmdbIds", () => {
  const bindings = [
    { item: { type: "uri", value: "http://www.wikidata.org/entity/Q208072" }, tmdb: { type: "literal", value: "52" } },
    { item: { type: "uri", value: "http://www.wikidata.org/entity/Q12345" }, tmdb: { type: "literal", value: "99" } },
  ];

  it("mapeia TMDB id → QID e ignora duplicados/ausentes", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ results: { bindings } }));
    const map = await resolveSeriesQidsByTmdbIds(["52", "99", "99"], {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(map).toEqual({ "52": "Q208072", "99": "Q12345" });
  });

  it("retorna {} para lista vazia sem chamar a API", async () => {
    const fetchImpl = vi.fn();
    const map = await resolveSeriesQidsByTmdbIds([], { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(map).toEqual({});
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("a query montada usa VALUES com os ids escapados", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      const query = new URL(url as string).searchParams.get("query") ?? "";
      expect(query).toContain("VALUES ?tmdb { \"1\" \"2\" }");
      expect(query).toContain("wdt:P4983");
      return jsonResponse({ results: { bindings: [] } });
    });
    await resolveSeriesQidsByTmdbIds(["1", "2"], { fetchImpl: fetchImpl as unknown as typeof fetch });
  });
});

describe("fetchCastForQid", () => {
  const castBinding = {
    actor: { type: "uri", value: "http://www.wikidata.org/entity/Q211051" },
    actorLabel: { type: "literal", value: "Hyun Bin" },
    tmdbPerson: { type: "literal", value: "681980" },
    img: { type: "uri", value: "http://commons.wikimedia.org/wiki/Special:FilePath/foo.jpg" },
  };

  it("normaliza linhas de elenco com qid, nome, tmdbId e imagem", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ results: { bindings: [castBinding] } }));
    const rows = await fetchCastForQid("Q12345", { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(rows).toEqual([
      {
        qid: "Q211051",
        name: "Hyun Bin",
        tmdbPersonId: "681980",
        imageUrl: "http://commons.wikimedia.org/wiki/Special:FilePath/foo.jpg",
      },
    ]);
  });

  it("faz fallback do nome para o QID quando não há label", async () => {
    const noLabel = {
      actor: { type: "uri", value: "http://www.wikidata.org/entity/Q999" },
    };
    const fetchImpl = vi.fn(async () => jsonResponse({ results: { bindings: [noLabel] } }));
    const rows = await fetchCastForQid("Q1", { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(rows).toEqual([{ qid: "Q999", name: "Q999" }]);
  });

  it("lança para QID inválido sem chamar a API", async () => {
    const fetchImpl = vi.fn();
    await expect(
      fetchCastForQid("not-a-qid", { fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toThrow("QID inválido");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("a query usa wdt:P161 e label service pt,en", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      const query = new URL(url as string).searchParams.get("query") ?? "";
      expect(query).toContain("wdt:P161");
      expect(query).toContain('wikibase:language "pt,en"');
      return jsonResponse({ results: { bindings: [] } });
    });
    await fetchCastForQid("Q42", { fetchImpl: fetchImpl as unknown as typeof fetch });
  });
});
