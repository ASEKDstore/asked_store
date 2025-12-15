# LAB API Documentation

## Admin API (Protected - requires `x-tg-id` header)

### Artists

#### GET /api/admin/lab/artists
Get all artists.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "avatar": "string?",
    "bio": "string",
    "links": [{"title": "string", "url": "string"}],
    "active": true,
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  }
]
```

#### POST /api/admin/lab/artists
Create new artist.

**Request Body:**
```json
{
  "name": "string (required)",
  "avatar": "string?",
  "bio": "string (required)",
  "links": [{"title": "string", "url": "string"}],
  "active": true
}
```

#### PUT /api/admin/lab/artists/:id
Update artist.

**Request Body:** (all fields optional)
```json
{
  "name": "string",
  "avatar": "string",
  "bio": "string",
  "links": [{"title": "string", "url": "string"}],
  "active": true
}
```

#### DELETE /api/admin/lab/artists/:id
Delete artist. Cannot delete if artist has products.

---

### LAB Products

#### GET /api/admin/lab/products?artistId=...
Get all lab products, optionally filtered by artistId.

**Query Params:**
- `artistId` (optional): Filter by artist ID

**Response:**
```json
[
  {
    "id": "uuid",
    "artistId": "string",
    "title": "string",
    "description": "string",
    "price": 0,
    "images": ["string"],
    "tags": ["string"],
    "available": true,
    "createdAt": "ISO string",
    "updatedAt": "ISO string"
  }
]
```

#### POST /api/admin/lab/products
Create new lab product.

**Request Body:**
```json
{
  "artistId": "string (required)",
  "title": "string (required)",
  "description": "string",
  "price": 0 (required),
  "images": ["string"],
  "tags": ["string"],
  "available": true
}
```

#### PUT /api/admin/lab/products/:id
Update lab product.

**Request Body:** (all fields optional)
```json
{
  "artistId": "string",
  "title": "string",
  "description": "string",
  "price": 0,
  "images": ["string"],
  "tags": ["string"],
  "available": true
}
```

#### DELETE /api/admin/lab/products/:id
Delete lab product.

---

## Public API

### GET /api/lab/artists
Get all active artists (active=true only).

**Response:** Same as admin GET /api/admin/lab/artists, but filtered.

### GET /api/lab/products?artistId=...
Get all available lab products (available=true only), optionally filtered by artistId.

**Query Params:**
- `artistId` (optional): Filter by artist ID

**Response:** Same as admin GET /api/admin/lab/products, but filtered.

---

## Validation Rules

- **Artists:**
  - `name` - required
  - `bio` - required

- **LAB Products:**
  - `artistId` - required, must exist
  - `title` - required
  - `price` - required, number

## Error Responses

- `400` - Bad Request (validation errors, cannot delete artist with products)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error



