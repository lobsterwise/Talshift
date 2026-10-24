use std::path::{Component, Path, PathBuf};

use rocket::fs::NamedFile;
use rocket::http::Status;
use rocket::request::Request;
use rocket::response::status;
use rocket::serde::json::Json;
use rocket::{catch, catchers, get, routes, Build, Rocket, State};
use serde::Serialize;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: &'static str,
}

#[get("/api/health")]
async fn health(pool: &State<PgPool>) -> Result<Json<HealthResponse>, Status> {
    sqlx::query("SELECT 1")
        .execute(pool.inner())
        .await
        .map_err(|_| Status::ServiceUnavailable)?;

    Ok(Json(HealthResponse { status: "ok" }))
}

#[get("/")]
async fn index() -> Option<NamedFile> {
    NamedFile::open(frontend_dist().join("index.html")).await.ok()
}

#[get("/<path..>")]
async fn frontend_file(path: PathBuf) -> Option<NamedFile> {
    if is_api_path(&path)
        || path
            .components()
            .any(|component| !matches!(component, Component::Normal(_)))
    {
        return None;
    }

    if let Ok(file) = NamedFile::open(frontend_dist().join(&path)).await {
        return Some(file);
    }

    if path.extension().is_none() {
        return NamedFile::open(frontend_dist().join("index.html")).await.ok();
    }

    None
}

#[catch(404)]
fn not_found(request: &Request<'_>) -> status::Custom<Json<ErrorResponse>> {
    let request_path = request.uri().path();
    let error = if request_path == "/api" || request_path.starts_with("/api/") {
        "api route not found"
    } else {
        "not found"
    };

    status::Custom(Status::NotFound, Json(ErrorResponse { error }))
}

fn is_api_path(path: &Path) -> bool {
    path.components()
        .next()
        .is_some_and(|component| component.as_os_str() == "api")
}

fn frontend_dist() -> PathBuf {
    std::env::var_os("FRONTEND_DIST")
        .map(PathBuf::from)
        .unwrap_or_else(|| Path::new(env!("CARGO_MANIFEST_DIR")).join("../frontend/dist"))
}

fn rocket(pool: PgPool) -> Rocket<Build> {
    rocket::build()
        .manage(pool)
        .mount("/", routes![health, index, frontend_file])
        .register("/", catchers![not_found])
}

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set to a reachable PostgreSQL database");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("failed to connect to PostgreSQL");

    rocket(pool).launch().await?;
    Ok(())
}