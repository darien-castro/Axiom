# Cryptography & Security Documentation

The security module (`src/crypto/crypto.ts`) protects sensitive student educational data and credentials at rest in PostgreSQL.

---

## Security Model

```
Raw Secret (API Key / Student ID)
              │
              ▼
  AES-256-GCM Cipher ──► Random 12-byte IV + 16-byte Auth Tag
              │
              ▼
    Packed Binary Buffer [ IV (12B) || AuthTag (16B) || Ciphertext ]
              │
              ▼
       Base64 String ──► Stored in Database (User_Api_Keys, User_Courses)
```

---

## Key Primitives

### 1. AES-256-GCM Encryption (`encryptValue` / `decryptValue`)
- Uses authenticated encryption with associated data (AEAD).
- Every encryption generates a cryptographically secure random 12-byte initialization vector (`iv`).
- Produces a 16-byte authentication tag (`authTag`) that guarantees ciphertext integrity and prevents tampering.
- The packed representation `[IV || AuthTag || Ciphertext]` is stored as a Base64 string.

### 2. Blinded Database Lookup (`hmacLookup`)
- Raw user IDs are never stored or queried in plaintext as primary keys.
- Uses `crypto.createHmac('sha256', LOOKUP_HMAC_KEY)` to compute a deterministic hash digest.
- The resulting digest is stored in `Users.userID` as `BYTEA`. This enables exact-match lookups without exposing student Canvas IDs.

---

## Required Environment Variables

- `ENCRYPTION_KEY`: A 32-byte secret key encoded as Base64 or 64-char Hex.
- `LOOKUP_HMAC_KEY`: A secret string used as the HMAC salt/secret.
