# notes-api

A JSON notes API built with axum 0.8, tokio and serde. It is the companion
project for Oxidize Chapter 20, *Rust on the Web*. Notes live in memory, so a
restart clears them.

The `[workspace]` table in `Cargo.toml` makes the project build on its own,
even though it sits inside the Oxidize repository.

## Run it

Needs Rust 1.85 or newer (edition 2024).

```sh
cargo run                          # listens on http://127.0.0.1:3000
APP_ADDR=0.0.0.0:8080 cargo run    # another address; 0.0.0.0 accepts network connections
RUST_LOG=debug cargo run           # more logging, including every request
cargo test                         # 2 unit tests and 13 integration tests
```

## Try it with curl

```sh
# Health check: plain text, not JSON
curl -i http://127.0.0.1:3000/health

# Create a note. 201 Created, with the note as JSON.
curl -i -X POST http://127.0.0.1:3000/api/notes \
  -H 'Content-Type: application/json' \
  -d '{"title": "Learn axum", "body": "Routes, extractors, state"}'

# List, show, update, delete
curl http://127.0.0.1:3000/api/notes
curl http://127.0.0.1:3000/api/notes/1
curl -X PATCH http://127.0.0.1:3000/api/notes/1 \
  -H 'Content-Type: application/json' -d '{"pinned": true}'
curl -i -X DELETE http://127.0.0.1:3000/api/notes/1      # 204 No Content

# Errors
curl -i http://127.0.0.1:3000/api/notes/1               # 404: the note was deleted
curl -i -X POST http://127.0.0.1:3000/api/notes \
  -H 'Content-Type: application/json' -d '{"title": "   "}'     # 422: blank title
curl -i -X POST http://127.0.0.1:3000/api/notes \
  -H 'Content-Type: application/json' -d '{"body": "no title"}'  # 422: missing field
curl -i -X POST http://127.0.0.1:3000/api/notes \
  -H 'Content-Type: application/json' -d '{ not json'            # 400: bad JSON syntax
curl -i -X POST http://127.0.0.1:3000/api/notes -d '{"title": "x"}'  # 415: no Content-Type
curl -i http://127.0.0.1:3000/api/notes/abc                      # 400: id is not a number
curl -i http://127.0.0.1:3000/nope                               # 404: JSON "Route not found."
```

## Endpoints

| Method and path | Handler | Success | Errors |
|---|---|---|---|
| `GET /health` | inline closure | 200, `ok` | none |
| `GET /api/notes` | `index` | 200, list in id order | none |
| `POST /api/notes` | `store` | 201, the new note | 400, 415, 422 |
| `GET /api/notes/{id}` | `show` | 200 | 400, 404 |
| `PATCH /api/notes/{id}` | `update` | 200, the updated note | 400, 404, 415, 422 |
| `DELETE /api/notes/{id}` | `destroy` | 204, no body | 400, 404 |

Any URL that matches nothing returns a JSON 404 from the fallback in `routes.rs`.
A known path with the wrong method, such as `PUT /api/notes/1`, gets axum's
bare 405 with no body.

## Files and their Laravel counterparts

| File | What it does | Laravel counterpart |
|---|---|---|
| `Cargo.toml`, `Cargo.lock` | Dependencies, with exact versions locked | `composer.json`, `composer.lock` |
| `src/main.rs` | Boots the server once and waits for Ctrl+C | `public/index.php` and `bootstrap/app.php`, which run on every request in Laravel |
| `src/lib.rs` | Exposes `app()` so `main` and the tests build the same router | The application factory that tests call |
| `src/routes.rs` | Routes, the fallback, and the layers (middleware) | `routes/api.php` and the middleware in `bootstrap/app.php` |
| `src/handlers.rs` | One async function per endpoint | A resource controller such as `NoteController` |
| `src/models.rs` | `Note`, plus the request bodies `CreateNote` and `UpdateNote` | The Eloquent model, and the input shapes of Form Requests |
| `src/state.rs` | The in-memory table, shared by every handler | A singleton in the service container, plus a repository |
| `src/validation.rs` | Validation rules and the `ValidJson` extractor | Form Request `rules()` |
| `src/error.rs` | `AppError`, which every failure turns into JSON | The exception handler (`withExceptions` in `bootstrap/app.php`) |
| `tests/api.rs` | HTTP tests that send requests with `oneshot`, no server | `tests/Feature/NoteTest.php` with `$this->postJson()` |

## Known gaps

- Storage is memory only. A restart clears the notes, and ids start again at 1.
- A malformed id, such as `/api/notes/abc`, gets axum's plain-text 400 from the
  `Path` extractor. Every other error is JSON. To change that, wrap `Path` the
  way `ValidJson` wraps `Json`.
- A wrong method on a known path gets axum's empty 405. Add a JSON body the
  same way as the 404 fallback if you need one.
- No authentication, pagination or CORS. CORS needs the `cors` feature of
  `tower-http` and a `CorsLayer` in `routes.rs`.
