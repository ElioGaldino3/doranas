# TMDB API Contracts

**Date**: 2026-07-03

## Search TV by Text

`GET /search/tv?query={title}&language=en-US`

**Response shape** (relevant fields):

```typescript
{
  results: Array<{
    id: number;            // TMDB series ID
    name: string;          // Dorama title
    poster_path: string | null;  // relative poster URL
    first_air_date: string;      // "2024-01-15"
  }>
}
```

## Find by IMDb ID

`GET /find/{imdb_id}?external_source=imdb_id`

**Response shape** (relevant fields):

```typescript
{
  tv_results: Array<{
    id: number;
    name: string;
    poster_path: string | null;
    first_air_date: string;
  }>
}
```

## TV Series Credits (Cast)

`GET /tv/{series_id}/credits?language=en-US`

**Response shape** (relevant fields):

```typescript
{
  cast: Array<{
    id: number;            // TMDB person ID
    name: string;          // Actor name
    profile_path: string | null;  // relative profile URL
    character: string;     // Character name in the show
  }>
}
```

## Notes

- All image paths are relative (`/xxx.jpg`). Full URL:
  `https://image.tmdb.org/t/p/w500{path}`
- API key is passed as query param: `api_key={KEY}`
- Rate limit: 50 requests/second (pro-tier). Implement local
  throttling if exceeded.
