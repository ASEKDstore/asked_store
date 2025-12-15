# LAB API Testing Guide

## Backend LAB API v1.16.1

### Admin Endpoints (require `x-tg-id: 930749603`)

#### Artists

**GET all artists:**
```bash
curl -H "x-tg-id: 930749603" http://localhost:4000/api/admin/lab/artists
```

**POST create artist:**
```bash
curl -X POST \
  -H "x-tg-id: 930749603" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Анастасия",
    "bio": "Кастомы и ручная роспись",
    "links": [
      {"title": "Telegram", "url": "#"},
      {"title": "Portfolio", "url": "#"}
    ],
    "active": true
  }' \
  http://localhost:4000/api/admin/lab/artists
```

**GET artist by ID:**
```bash
curl -H "x-tg-id: 930749603" http://localhost:4000/api/admin/lab/artists/{id}
```

**PUT update artist:**
```bash
curl -X PUT \
  -H "x-tg-id: 930749603" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Updated bio",
    "active": false
  }' \
  http://localhost:4000/api/admin/lab/artists/{id}
```

**DELETE artist:**
```bash
curl -X DELETE \
  -H "x-tg-id: 930749603" \
  http://localhost:4000/api/admin/lab/artists/{id}
```

#### Lab Products

**GET all products:**
```bash
curl -H "x-tg-id: 930749603" http://localhost:4000/api/admin/lab/products
```

**GET products by artistId:**
```bash
curl -H "x-tg-id: 930749603" "http://localhost:4000/api/admin/lab/products?artistId={artistId}"
```

**POST create product:**
```bash
curl -X POST \
  -H "x-tg-id: 930749603" \
  -H "Content-Type: application/json" \
  -d '{
    "artistId": "{artistId}",
    "title": "Hoodie — Chrome Drips",
    "description": "Работа выполнена аэрографом",
    "price": 5000,
    "images": ["/assets/lab-work-1.jpg"],
    "tags": ["hoodie", "airbrush"],
    "available": true
  }' \
  http://localhost:4000/api/admin/lab/products
```

**GET product by ID:**
```bash
curl -H "x-tg-id: 930749603" http://localhost:4000/api/admin/lab/products/{id}
```

**PUT update product:**
```bash
curl -X PUT \
  -H "x-tg-id: 930749603" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 6000,
    "available": false
  }' \
  http://localhost:4000/api/admin/lab/products/{id}
```

**DELETE product:**
```bash
curl -X DELETE \
  -H "x-tg-id: 930749603" \
  http://localhost:4000/api/admin/lab/products/{id}
```

### Public Endpoints (no auth required)

**GET active artists:**
```bash
curl http://localhost:4000/api/lab/artists
```

**GET available products:**
```bash
curl http://localhost:4000/api/lab/products
```

**GET products by artistId:**
```bash
curl "http://localhost:4000/api/lab/products?artistId={artistId}"
```

**GET product by ID (only if available):**
```bash
curl http://localhost:4000/api/lab/products/{id}
```

## Error Codes

- `200` - OK
- `201` - Created (POST)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid x-tg-id)
- `403` - Forbidden (not admin)
- `404` - Not Found
- `409` - Conflict (cannot delete artist with products)
- `500` - Internal Server Error

## Seed Data

On server start (dev mode), if `lab.json` is empty, seed data is automatically created:
- Artist: "Анастасия" (active)
- 3 Lab Products (all available)



