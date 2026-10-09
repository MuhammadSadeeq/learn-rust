# tool-runner

An agent harness in Rust. A model asks for tools, the harness runs them under
strict rules, and the results go back to the model until it is done. It is the
companion project for Oxidize Chapter 21, *Capstone: a tool-calling agent
harness*.

The model is a mock server, so there is no network and no API key. Every test
runs offline. Read the code in this order: `src/protocol.rs`, `src/sse.rs`,
`src/client.rs`, `src/tools/`, `src/agent.rs`, then `src/main.rs`. Each file
starts with a comment that says what it does and what its Laravel counterpart is.

## Run it

Edition 2024 needs Rust 1.85 or newer. We built and tested it with Rust 1.97
only, so older versions are unchecked.

```sh
cargo run --example mock_server     # terminal 1: the mock model on http://127.0.0.1:8080
cargo run -- "What is 6 times 7?"   # terminal 2: the harness
cargo test                          # 51 tests, all offline
```

The answer goes to stdout. The logs go to stderr, so `2>/dev/null` leaves only
the answer:

```text
6 times 7 is 42.
```

The logs look like this (timestamps trimmed):

```text
INFO tool_runner::agent: asking the model turn=1
INFO tool_runner::agent: running tool tool=calculator
INFO tool_runner::agent: asking the model turn=2
```

The demo mock plays one fixed script. It asks for the calculator once, then
answers. Ignore the prompt. The integration tests in `tests/` script other
conversations, including refusals, timeouts and retries.

### Options

| Flag | Default | What it does |
|---|---|---|
| `--base-url` | `http://127.0.0.1:8080` | The model server |
| `--root` | `.` | The folder that `read_file` and `run_command` are sandboxed to |
| `--allow` | `echo date wc` | A program `run_command` may start. Repeat the flag for more. Giving it replaces the default list. |
| `--max-turns` | `8` | Model turns before the run stops |
| `--parallel` | `4` | Tool calls that may run at once. Must be 1 or more. |
| `--timeout` | `60` | Seconds allowed for one model turn, stream included |

`TOOL_RUNNER_API_KEY` sets a bearer token. It comes from the environment and
not from a flag, so it stays out of shell history and out of `ps`. `RUST_LOG`
overrides the default log filter.

## Architecture

```text
   you
    |
    v
 +-----------------------------+
 | main.rs                     |   flags, logs, Ctrl+C
 +--------------+--------------+
                |
                v
 +-----------------------------+
 | agent.rs                    |   the loop: ask, run tools, repeat
 +-------+----------------+----+
         |                |
         v                v
 +---------------+   +------------------------+
 | client.rs     |   | tools/                 |
 | timeout,      |   |   Tool trait, Registry |
 | retry, one    |   |   calculator           |
 | streamed turn |   |   read_file (sandbox)  |
 |   sse.rs      |   |   run_command (list)   |
 |   provider.rs |   +------------------------+
 +-------+-------+
         |
         v
   model server: the mock, or a real provider
```

### One turn, step by step

1. `agent.rs` builds a request: the messages so far, the tool definitions, and
   `stream: true`.
2. `provider.rs` turns it into JSON and chooses the URL.
3. `client.rs` posts it under a timeout. A 429 or a 5xx answer is retried with
   backoff, and a `Retry-After` header is honored up to a cap.
4. `sse.rs` reads the bytes as they arrive. A network chunk can stop in the
   middle of a line, and the parser waits for the rest.
5. `provider.rs` decodes each event. Text is printed as it arrives.
6. If the model asked for tools, `agent.rs` runs them, with at most `--parallel`
   at once, and sends the results back as `tool_result` blocks with the same ids.
7. The loop stops when the model says `end_turn`, or when it reaches `--max-turns`.

## The protocol

The protocol is ours. It is defined in `src/protocol.rs` and it has the common
shape of current model APIs:

- a conversation is a list of messages, and each message has content blocks;
- tools are described with a JSON Schema for their input;
- when the model wants a tool, it sends a `tool_use` block, and we answer with a
  `tool_result` block that has the same id;
- text arrives as small pieces, called deltas, over server-sent events.

A request looks like this, abridged:

```json
{
  "messages": [{"role": "user", "content": [{"type": "text", "text": "What is 6 times 7?"}]}],
  "tools": [{"name": "calculator", "description": "Adds, subtracts, multiplies or divides two numbers.", "input_schema": {"type": "object"}}],
  "stream": true
}
```

The stream for a tool request, from the demo mock, is two events:

```text
data: {"type":"tool_use","id":"call_1","name":"calculator","input":{"a":6,"b":7,"op":"mul"}}

data: {"type":"done","stop_reason":"tool_use"}
```

Real providers use the same shape with their own field names, their own URLs and
their own event names. This course does not claim any provider's exact names,
and we have not checked them offline. The one module that maps our names onto a
provider's names is `src/provider.rs`.

## Safety rules

Each rule is enforced in code, and a test checks it.

| Rule | Where | Test |
|---|---|---|
| The model can only call the tools in the registry. Any other name is an error result. | `agent.rs` | `an_unknown_tool_name_is_an_error_result` |
| A model that keeps asking for tools stops at `--max-turns`. | `agent.rs` | `max_turns_stops_a_runaway_model` |
| At most `--parallel` tool calls run at once. | `agent.rs` | `the_parallel_limit_is_honored` |
| A refused tool call goes back to the model as an error. The run goes on. | `agent.rs` | `a_refused_tool_call_goes_back_to_the_model_as_an_error` |
| Retries cover only 429 and 5xx, and only before a stream starts. A stream is never sent twice. | `client.rs` | `retry_after_503_then_success`, `a_400_is_not_retried` |
| A `Retry-After` longer than our cap is an error, not a long sleep. | `client.rs` | `a_retry_after_longer_than_our_cap_is_not_waited_for` |
| Each turn has a timeout that covers the whole turn, stream included. | `client.rs` | `the_per_request_timeout_fires` |
| Redirects are not followed, so the API key is never sent to another host. | `client.rs` | none |
| The key comes from the environment. Logs never show it. | `main.rs`, `client.rs` | none |
| `read_file` takes relative paths only, refuses `..`, follows symbolic links and checks where they lead, and reads at most 64 KiB. | `tools/read_file.rs` | `read_file_rejects_*`, `read_file_refuses_files_over_the_cap` |
| `run_command` runs only exact program names from the allowlist. | `tools/run_command.rs` | `run_command_refuses_a_program_that_is_not_on_the_list`, `run_command_matches_the_exact_name_not_a_path` |
| `run_command` uses no shell, so `;`, `$VARIABLES` and pipes are plain text. | `tools/run_command.rs` | `run_command_does_not_use_a_shell` |
| `run_command` clears the environment and sets a short PATH. | `tools/run_command.rs` | `run_command_clears_the_environment` |
| `run_command` runs in the sandbox folder. Its arguments may not be absolute, contain `..`, or be a link that leads out. | `tools/run_command.rs` | `run_command_refuses_arguments_that_point_outside`, `run_command_refuses_a_symlink_that_points_outside` |
| `run_command` kills a program that runs too long, and stops one that prints more than 16 KiB per stream. | `tools/run_command.rs` | `run_command_stops_a_program_that_runs_too_long`, `run_command_caps_the_output_and_stops_a_noisy_program` |
| Ctrl+C cancels the run. The loop stops at its next wait, and the exit code is 130. | `main.rs`, `agent.rs` | `cancellation_stops_the_loop` |
| Logs name the turn and the tool. They never show tool inputs, tool outputs or the key. | `agent.rs`, `client.rs` | none |

Read these limits before you point the harness at real files:

- **`run_command` is the riskiest tool.** The argument check looks at each
  argument as a whole. An option that carries a path, such as
  `--option=/some/absolute/path`, gets past it, and an allowed program can then
  read that path. Keep the allowlist short. Run the harness as a user who has no
  secrets it should not read.
- **The file checks run once, and then the file is read.** A program that swaps
  a link between the check and the read could get past them. A real sandbox
  needs operating system features, such as a container or a separate user.
- **`run_command` runs on Unix only.** Its PATH and program names assume Unix.

## Point it at a real provider

1. Read the provider's current API reference. Find the URL, the auth header, the
   request fields and the stream events.
2. Edit `src/provider.rs`. Change `TURN_PATH` or `turn_url`, change
   `encode_request` to rename or drop fields, and change `decode_event` to read
   the provider's events. If the provider names its events in the `event:` line
   and not in the JSON, `decode_event` also needs that name. `sse.rs` already
   keeps it in `SseEvent::event`.
3. Set `--base-url`, and set `TOOL_RUNNER_API_KEY` in the environment.
4. If the provider streams a tool's input in pieces, collect the pieces in
   `client.rs` before the tool runs. The parser in `sse.rs` does not change.
5. Add a test that pins the provider's request shape, the way
   `request_has_the_course_shape` pins ours in `src/protocol.rs`.

The mock tests describe our protocol. They do not prove that a provider accepts
it.

## Files and their Laravel counterparts

| File | What it does | Laravel counterpart |
|---|---|---|
| `Cargo.toml`, `Cargo.lock` | Dependencies, with exact versions locked | `composer.json`, `composer.lock` |
| `src/main.rs` | The CLI: flags, logs, Ctrl+C | An artisan command. The `Cli` struct plays the part of `$signature`. |
| `src/lib.rs` | The module list, and the reading order | The autoload section of `composer.json` |
| `src/protocol.rs` | The JSON we send, and the events we read | The arrays your API resources return. Tagged enums replace the `type` checks you would write by hand. |
| `src/sse.rs` | Reads the stream one chunk at a time | No direct counterpart. It is the reader behind a `StreamedResponse`. |
| `src/client.rs` | Sends one turn, with a timeout and retries | `Http::withToken(...)->timeout(...)->retry(...)` |
| `src/provider.rs` | The only place that knows a provider's names | A mail transport chosen in `config/mail.php`. The rest of the app never sees the vendor's API. |
| `src/agent.rs` | The loop: ask, run tools, repeat | A queued job with a `Tries` limit. The turn limit is the guard against a job that retries forever. |
| `src/tools/mod.rs` | The `Tool` trait and the registry | Invokable action classes, each registered under a name in the container |
| `src/tools/calculator.rs` | Adds, subtracts, multiplies and divides | A small action class with one `handle()` method |
| `src/tools/read_file.rs` | Reads text files inside one folder | A filesystem disk, such as `Storage::disk('local')`, which is also rooted in one folder |
| `src/tools/run_command.rs` | Runs allowlisted programs | `Process::run(['php', 'artisan', 'migrate'])`, which takes an array of arguments, not one command string |
| `tests/common/mod.rs` | The mock model server | `Http::fake()`, which answers requests with canned responses |
| `tests/*.rs` | Agent, client and sandbox tests | Feature tests that run against fakes |
| `examples/mock_server.rs` | Runs the mock by hand | No direct counterpart. It is a fake API you can run while you try things out. |

## Known gaps

- Nothing is saved. Each run starts with an empty conversation, and there is no
  system prompt.
- A tool's input arrives whole in one event. Real APIs often stream it in pieces.
- Tool results are text only. There are no images and no structured results.
- Retries cover HTTP status only. A connection that fails before any response
  is not retried.
- The timeout covers the whole turn, so it must be longer than the longest answer.
- There is no token counting and no context limit. A long conversation can grow
  past a real model's context window. The mock never does.
- Tool calls share one task and run concurrently, not in parallel threads. A tool
  that does heavy computation without an `await` would block the others.

## Exercises: extend it

1. Add a `list_dir` tool. It must use the same checks as `read_file`. Write a
   test that proves `..` is refused before you write the code.
2. Make `calculator` read expressions such as `6 * 7`. Keep the grammar small, and
   refuse anything you do not recognize. Write the bad-input tests first.
3. Stream a tool's input in pieces, as real APIs often do. Give each piece an id,
   and join the pieces in `client.rs` before the tool runs. Keep `sse.rs` as it is.
4. Save the conversation to a file after each turn, and add `--resume <file>`.
   Decide what must never be written there, such as the API key.
5. Make the `run_command` argument check stronger. First write a test that shows
   the gap, an option that carries an absolute path. Then close it, or explain
   in the code why you cannot.
