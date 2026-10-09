//! Feature tests. Laravel counterpart: `tests/Feature/NoteTest.php` with
//! `$this->postJson(...)->assertCreated()`.
//!
//! `oneshot` sends one request straight into the router: no port, no
//! network, no running server. The same middleware and handlers run.

use axum::Router;
use axum::body::Body;
use axum::http::{Request, StatusCode, header};
use http_body_util::BodyExt;
use notes_api::{AppState, app};
use serde_json::{Value, json};
use tower::ServiceExt; // for `oneshot`

/// Sends a request and returns the status and the body: parsed JSON,
/// `Value::Null` when empty, or a JSON string when the body isn't JSON.
async fn send(app: &Router, method: &str, uri: &str, body: Option<Value>) -> (StatusCode, Value) {
    let mut request = Request::builder().method(method).uri(uri);
    let body = match body {
        Some(json) => {
            request = request.header(header::CONTENT_TYPE, "application/json");
            Body::from(json.to_string())
        }
        None => Body::empty(),
    };
    // Router is cheap to clone (it is reference counted inside), and the
    // clones share the same AppState, so data survives between requests.
    let response = app
        .clone()
        .oneshot(request.body(body).unwrap())
        .await
        .unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    let body = if bytes.is_empty() {
        Value::Null
    } else {
        serde_json::from_slice(&bytes)
            .unwrap_or_else(|_| Value::String(String::from_utf8_lossy(&bytes).into_owned()))
    };
    (status, body)
}

#[tokio::test]
async fn health_check_says_ok() {
    let app = app(AppState::default());
    let response = app
        .oneshot(Request::get("/health").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(&bytes[..], b"ok");
}

#[tokio::test]
async fn create_then_show_a_note() {
    let app = app(AppState::default());

    let (status, created) = send(
        &app,
        "POST",
        "/api/notes",
        Some(json!({ "title": "  Learn axum  " })),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED);
    assert_eq!(
        created,
        json!({ "id": 1, "title": "Learn axum", "body": "", "pinned": false })
    );

    let (status, shown) = send(&app, "GET", "/api/notes/1", None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(shown, created);
}

#[tokio::test]
async fn index_lists_notes_in_creation_order() {
    let app = app(AppState::default());
    for title in ["first", "second", "third"] {
        send(&app, "POST", "/api/notes", Some(json!({ "title": title }))).await;
    }

    let (status, list) = send(&app, "GET", "/api/notes", None).await;
    assert_eq!(status, StatusCode::OK);
    let titles: Vec<&str> = list
        .as_array()
        .unwrap()
        .iter()
        .map(|note| note["title"].as_str().unwrap())
        .collect();
    assert_eq!(titles, ["first", "second", "third"]);
}

#[tokio::test]
async fn missing_note_is_a_json_404() {
    let app = app(AppState::default());
    let (status, body) = send(&app, "GET", "/api/notes/42", None).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    assert_eq!(body, json!({ "message": "Note 42 not found." }));
}

#[tokio::test]
async fn blank_title_is_a_422_with_errors() {
    let app = app(AppState::default());
    let (status, body) = send(&app, "POST", "/api/notes", Some(json!({ "title": "   " }))).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
    assert_eq!(body["errors"]["title"][0], "The title field is required.");
}

#[tokio::test]
async fn wrong_json_shape_is_rejected_before_the_handler() {
    let app = app(AppState::default());

    // Well-formed JSON, but `title` is missing: serde fails, axum says 422.
    let (status, body) = send(&app, "POST", "/api/notes", Some(json!({ "body": "x" }))).await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
    assert!(
        body["message"]
            .as_str()
            .unwrap()
            .contains("missing field `title`")
    );

    // Not JSON at all: 400, still rendered by AppError as JSON.
    let request = Request::post("/api/notes")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from("{ not json"))
        .unwrap();
    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    // An id that isn't a u64: the Path extractor rejects it with 400 before
    // `show` runs. (Its body is axum's plain-text message.)
    let (status, body) = send(&app, "GET", "/api/notes/abc", None).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert!(body.as_str().unwrap().contains("Cannot parse"));
}

#[tokio::test]
async fn patch_changes_only_the_given_fields() {
    let app = app(AppState::default());
    send(
        &app,
        "POST",
        "/api/notes",
        Some(json!({ "title": "Draft", "body": "keep me" })),
    )
    .await;

    let (status, note) = send(
        &app,
        "PATCH",
        "/api/notes/1",
        Some(json!({ "pinned": true })),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        note,
        json!({ "id": 1, "title": "Draft", "body": "keep me", "pinned": true })
    );
}

#[tokio::test]
async fn delete_removes_the_note() {
    let app = app(AppState::default());
    send(
        &app,
        "POST",
        "/api/notes",
        Some(json!({ "title": "Temporary" })),
    )
    .await;

    let (status, body) = send(&app, "DELETE", "/api/notes/1", None).await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    assert_eq!(body, Value::Null);

    let (status, _) = send(&app, "DELETE", "/api/notes/1", None).await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}
