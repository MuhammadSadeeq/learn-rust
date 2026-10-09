//! The command-line entry point. Laravel counterpart: an artisan command.
//! The `Cli` struct plays the role of `$signature` and of the option
//! descriptions. clap reads the options, validates them, and prints `--help`.

use std::io::{IsTerminal, Write};
use std::path::PathBuf;
use std::process::ExitCode;
use std::time::Duration;

use anyhow::Context;
use clap::Parser;
use tokio_util::sync::CancellationToken;
use tool_runner::agent::{Agent, AgentConfig, AgentError};
use tool_runner::client::Client;
use tool_runner::protocol::StopReason;
use tool_runner::tools;

/// Exit code for a run stopped by Ctrl+C: 128 plus the signal number (SIGINT is 2).
const EXIT_CANCELLED: u8 = 130;

#[derive(Debug, Parser)]
#[command(
    version,
    about = "Runs a model with a few tools, and keeps the tools on a leash."
)]
struct Cli {
    /// What to ask the model.
    prompt: String,

    /// The model server. The demo mock listens on 127.0.0.1:8080.
    #[arg(long, default_value = "http://127.0.0.1:8080")]
    base_url: String,

    /// The folder that read_file and run_command are sandboxed to.
    #[arg(long, default_value = ".")]
    root: PathBuf,

    /// A program that run_command may start. Repeat the flag to allow more.
    #[arg(long = "allow", default_values = ["echo", "date", "wc"])]
    allow: Vec<String>,

    /// The most model turns before we stop a model that will not finish.
    #[arg(long, default_value_t = 8, value_parser = clap::value_parser!(u32).range(1..))]
    max_turns: u32,

    /// How many tool calls may run at the same time.
    #[arg(long, default_value_t = 4, value_parser = clap::value_parser!(u32).range(1..))]
    parallel: u32,

    /// Seconds allowed for one model turn, including its stream.
    #[arg(long, default_value_t = 60)]
    timeout: u64,
}

#[tokio::main]
async fn main() -> ExitCode {
    init_logging();
    match run(Cli::parse()).await {
        Ok(code) => code,
        Err(error) => {
            eprintln!("error: {error:#}");
            ExitCode::FAILURE
        }
    }
}

/// Logs go to stderr, so stdout holds only the model's answer.
fn init_logging() {
    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        // Colors only when a person is watching. Redirected logs stay plain text.
        .with_ansi(std::io::stderr().is_terminal())
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("tool_runner=info")),
        )
        .init();
}

async fn run(cli: Cli) -> anyhow::Result<ExitCode> {
    let registry = tools::standard(&cli.root, cli.allow)
        .with_context(|| format!("could not open the sandbox folder {}", cli.root.display()))?;

    let mut client = Client::new(cli.base_url).with_timeout(Duration::from_secs(cli.timeout));
    // The key comes from the environment. A flag would show up in shell
    // history and in `ps`.
    if let Ok(key) = std::env::var("TOOL_RUNNER_API_KEY") {
        client = client.with_api_key(key);
    }
    let agent = Agent::new(
        client,
        registry,
        AgentConfig {
            max_turns: cli.max_turns,
            // The range check above means this is at least 1.
            max_parallel_tools: cli.parallel as usize,
        },
    );

    // Ctrl+C cancels the run. The loop notices at its next wait.
    let cancel = CancellationToken::new();
    let trigger = cancel.clone();
    tokio::spawn(async move {
        tokio::select! {
            _ = tokio::signal::ctrl_c() => trigger.cancel(),
            _ = trigger.cancelled() => {}
        }
    });

    let mut show = |piece: &str| {
        print!("{piece}");
        // Show each piece now, rather than when the line ends.
        let _ = std::io::stdout().flush();
    };
    match agent.run(&cli.prompt, &cancel, &mut show).await {
        Ok(answer) => {
            println!();
            if answer.stop_reason == StopReason::MaxTokens {
                eprintln!("note: the answer hit the model's length limit");
            }
            Ok(ExitCode::SUCCESS)
        }
        Err(AgentError::Cancelled) => {
            eprintln!("cancelled");
            Ok(ExitCode::from(EXIT_CANCELLED))
        }
        Err(error) => Err(error.into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_parallel_calls_is_refused() {
        assert!(Cli::try_parse_from(["tool-runner", "--parallel", "0", "hi"]).is_err());
    }

    #[test]
    fn the_default_allowlist_is_small() {
        let cli = Cli::try_parse_from(["tool-runner", "hi"]).unwrap();
        assert_eq!(cli.allow, ["echo", "date", "wc"]);
    }

    #[test]
    fn an_allow_flag_replaces_the_default_list() {
        let cli = Cli::try_parse_from(["tool-runner", "hi", "--allow", "ls"]).unwrap();
        assert_eq!(cli.allow, ["ls"]);
    }
}
