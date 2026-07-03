# Firestore Data Contract

**Date**: 2026-07-03

## Document Path

```
users/{uid}/graphData
```

## Document Shape

```typescript
interface GraphDocument {
  nodes: Array<{
    id: string;       // TMDB series or person ID as string
    label: string;    // Display name
    group: "dorama" | "actor";
    imgUrl: string;   // Full TMDB image URL, empty string if none
  }>;
  links: Array<{
    source: string;   // Actor node id
    target: string;   // Dorama node id
  }>;
  updatedAt: Timestamp;  // Firestore server timestamp
}
```

## Security Rules

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

## Read/Write Patterns

- **Read**: On app load / auth state change — fetch document once,
  cache in Zustand store
- **Write**: On Dorama addition — replace entire document
  (nodes + links + updatedAt)
- **Optimistic**: Update Zustand store immediately on add, persist
  to Firestore in background
