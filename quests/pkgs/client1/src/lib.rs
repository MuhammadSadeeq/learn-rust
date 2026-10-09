// ============================================================================
//  QUEST client1 · Call an API                            Chapter 20 · Rust on the Web
// ----------------------------------------------------------------------------
//  Calling another service fails in three different ways, and the caller needs
//  to tell them apart: the user does not exist (404), the server took too long
//  (a timeout), or something else went wrong (a message is enough).
//
//  Write fetch_user so that:
//    - it GETs {base_url}/users/{id} and parses the JSON body as a User;
//    - a 404 response gives ApiError::NotFound;
//    - a request that runs past the client's timeout gives ApiError::Timeout;
//    - any other failure gives ApiError::Failed with the error's message.
//
//  Two tools do the work: error_for_status() turns 4xx and 5xx responses into
//  errors (so a 404 must be checked before you give up), and
//  `impl From<reqwest::Error> for ApiError` lets `?` convert errors for you.
//  Chapter 20 explains both.
//
//  The tests start a local axum mock on 127.0.0.1:0. Don't edit the tests.
//
//  cargo forge          check your work (re-runs every time you save)
//  cargo forge hint     a nudge in the right direction
// ============================================================================

use reqwest::Client;
use serde::Deserialize;

#[derive(Debug, Deserialize, PartialEq)]
pub struct User {
    pub id: u32,
    pub name: String,
}

#[derive(Debug, PartialEq)]
pub enum ApiError {
    NotFound,
    Timeout,
    Failed(String),
}

// Write the From impl here. The hints explain it.

pub async fn fetch_user(client: &Client, base_url: &str, id: u32) -> Result<User, ApiError> {
    todo!()
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::extract::Path;
    use axum::http::StatusCode;
    use axum::routing::get;
    use axum::Router;
    use std::time::Duration;
    use tokio::net::TcpListener;

    /// A mock API on a free local port. It returns the base URL.
    async fn start_mock() -> String {
        let app = Router::new().route("/users/{id}", get(mock_user));
        let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind");
        let addr = listener.local_addr().expect("address");
        tokio::spawn(async move { axum::serve(listener, app).await.expect("serve") });
        format!("http://{addr}")
    }

    async fn mock_user(Path(id): Path<u32>) -> (StatusCode, String) {
        match id {
            1 => (StatusCode::OK, r#"{"id":1,"name":"Ada"}"#.to_string()),
            2 => (StatusCode::NOT_FOUND, String::new()),
            3 => {
                // Slower than the client's timeout.
                tokio::time::sleep(Duration::from_secs(2)).await;
                (StatusCode::OK, r#"{"id":3,"name":"Late"}"#.to_string())
            }
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "boom".to_string()),
        }
    }

    fn client() -> Client {
        Client::builder()
            .timeout(Duration::from_millis(300))
            .build()
            .expect("client")
    }

    #[tokio::test]
    async fn fetches_and_parses_a_user() {
        let base = start_mock().await;
        let user = fetch_user(&client(), &base, 1).await;
        assert_eq!(
            user,
            Ok(User {
                id: 1,
                name: "Ada".to_string()
            })
        );
    }

    #[tokio::test]
    async fn a_404_is_not_found() {
        let base = start_mock().await;
        assert_eq!(fetch_user(&client(), &base, 2).await, Err(ApiError::NotFound));
    }

    #[tokio::test]
    async fn a_slow_server_is_a_timeout() {
        let base = start_mock().await;
        assert_eq!(fetch_user(&client(), &base, 3).await, Err(ApiError::Timeout));
    }

    #[tokio::test]
    async fn other_failures_keep_a_message() {
        let base = start_mock().await;
        let result = fetch_user(&client(), &base, 4).await;
        assert!(matches!(result, Err(ApiError::Failed(_))), "got {result:?}");
    }
}
