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

The locked dependencies need Rust 1.88 or newer. `rust-version` in `Cargo.toml`
says so, and Cargo refuses an older compiler. Edition 2024 alone needs 1.85. We
built and tested with Rust 1.97 only, so 1.88 to 1.96 are unchecked.

```sh
cargo run --example mock_server     # terminal 1: the mock model on http://127.0.0.1:8080
cargo run -- "What is 6 times 7?"   # terminal 2: the harness
cargo test                          # 68 tests, all offline
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
answers. Ignore the prompt. The mock keeps its place in the script, so a second
run against the same mock gets only the final answer. Restart the mock to see the
tool call again. The integration tests in `tests/` script other conversations,
including refusals, timeouts and retries.

### Options

| Flag | Default | What it does |
|---|---|---|
| `--base-url` | `http://127.0.0.1:8080` | The model server |
| `--root` | `.` | The folder that `read_file` and `run_command` are sandboxed to. The whole folder is readable, so see the limits below. |
| `--allow` | `echo date` | A program `run_command` may start. Repeat the flag for more. Giving it replaces the default list. See the default programs below. |
| `--max-turns` | `8` | Model turns before the run stops |
| `--parallel` | `4` | Tool calls that may run at once. Must be 1 or more. |
| `--timeout` | `60` | Seconds allowed for one model turn: every try, the waits between tries, and the stream |

`TOOL_RUNNER_API_KEY` sets a bearer token. It comes from the environment and
not from a flag, so it stays out of shell history and out of `ps`. `RUST_LOG`
overrides the default log filter.

The production client follows the system proxy settings, such as `HTTPS_PROXY`.
If the model server is on this machine and a proxy is set, add
`NO_PROXY=127.0.0.1`. The tests do not need that: they build their own client
without a proxy, so `cargo test` passes behind one.

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
| Each turn has one deadline that covers every try, the waits between tries, and the stream. The per-request timeout is only a cap inside it. | `client.rs` | `one_deadline_covers_the_retries_and_their_waits`, `the_per_request_timeout_fires` |
| The key is sent as a bearer token on each request. | `client.rs` | `the_key_is_sent_as_a_bearer_token` |
| The agent can run on a spawned task, so its future is `Send`. A parallel limit of 0 is treated as 1. | `agent.rs` | `the_agent_can_run_in_a_spawned_task`, `a_zero_parallel_limit_still_runs_the_tools` |
| Redirects are not followed, so the API key is never sent to another host. | `client.rs` | `a_redirect_is_not_followed_so_the_key_stays_home` |
| The key comes from the environment. Logs never show it. | `main.rs`, `client.rs` | none |
| `read_file` takes relative paths only, refuses `..`, follows symbolic links and checks where they lead, reads only regular files, and reads at most 64 KiB. | `tools/read_file.rs` | `read_file_rejects_*`, `read_file_refuses_files_over_the_cap`, `read_file_refuses_a_named_pipe`, `read_file_refuses_a_folder` |
| `run_command` runs only exact program names from the allowlist. | `tools/run_command.rs` | `run_command_refuses_a_program_that_is_not_on_the_list`, `run_command_matches_the_exact_name_not_a_path` |
| `run_command` uses no shell, so `;`, `$VARIABLES` and pipes are plain text. | `tools/run_command.rs` | `run_command_does_not_use_a_shell` |
| `run_command` clears the environment and sets a short PATH. | `tools/run_command.rs` | `run_command_clears_the_environment` |
| `run_command` runs in the sandbox folder. No argument may be absolute or contain `..`. The check covers the whole argument, the text after each `=`, and the text after a short flag such as `-f`. A name that exists must not be a link that leads out. | `tools/run_command.rs` | `run_command_refuses_arguments_that_point_outside`, `run_command_refuses_a_path_hidden_inside_an_option`, `run_command_refuses_a_link_named_inside_an_option`, `run_command_refuses_a_symlink_that_points_outside` |
| `run_command` kills a program that runs too long, and stops one that prints more than 16 KiB per stream. A timeout or a cancel stops the program's whole process group, and a clean exit does not wait for a background child. | `tools/run_command.rs`, `agent.rs` | `run_command_stops_a_program_that_runs_too_long`, `run_command_caps_the_output_and_stops_a_noisy_program`, `a_timeout_stops_the_programs_the_program_started`, `a_background_child_does_not_turn_a_clean_exit_into_a_timeout`, `cancelling_stops_the_program_a_tool_started` |
| The SSE reader does not carry an `event:` name into the next event. | `sse.rs` | `a_name_does_not_outlive_its_event` |
| Ctrl+C cancels the run. The loop stops at its next wait, and the exit code is 130. | `main.rs`, `agent.rs` | `cancellation_stops_the_loop` |
| Logs name the turn and the tool. They never show tool inputs, tool outputs or the key. | `agent.rs`, `client.rs` | none |

Read these limits before you point the harness at real files:

- **The sandbox is the whole folder.** With the default `--root .`, the model can
  read `.env`, `.git/config` and every other file under the folder you run it
  from. Point `--root` at an empty or dedicated folder.
- **`run_command` is a trust decision, not a sandbox.** Its argument check is a
  guard rail, and the next two sections say what it cannot see. Keep the
  allowlist short. Run the harness as a user who has no secrets it should not
  read.
- **The file checks run once, and then the file is read.** A program that swaps a
  link between the check and the read could get past them. A real sandbox needs
  operating system features, such as a container or a separate user.
- **`run_command` runs on Unix only.** Its PATH, its process groups and its `kill`
  command assume Unix.

### Why an allowlist is not enough

An allowlist says which programs may run. It cannot say what they do. Programs
read files through their own options, and an option can name a path in several
forms: `--files0-from=FILE`, `-f FILE`, `-fFILE`. The argument check looks for an
absolute path or a `..` in every place a path can start, so the common forms are
refused. It cannot see what a program does with a file it opens. A file inside
the sandbox can name other files, and a program that reads such a list opens
them. An allowed program is only as safe as its options. So either check the
arguments of each program in its own way, or allow only programs whose every
option is safe.

A program that starts other programs is the same as allowing everything. `env`,
`find` with `-exec`, `xargs`, `git`, a shell and any interpreter all do that. Do
not put them on the list.

### The default programs

- `echo` prints its arguments. It reads no files and starts nothing.
- `date` prints the date. Its `-f FILE` option reads one date per line from
  `FILE`. The check requires `FILE` to be inside the sandbox. A line that is not a
  date is printed back in the error.

### Why `wc` is not a default

`wc` counts the lines, words and bytes of the files it is given, which sounds
harmless. But its `--files0-from=FILE` option reads a list of names from `FILE`
and opens each name. A list inside the sandbox can name a file outside it, and
the argument check cannot see those names, because they are not arguments. So
`wc` stays off the default list. You can still allow it with `--allow wc` when
you trust what is in the sandbox. Every program you add needs the same question:
what can it open or start that its arguments do not show?

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
| `src/sse.rs` | Reads the stream one chunk at a time | The client side of the stream that `response()->eventStream()` sends. Laravel's docs show the server side only. |
| `src/client.rs` | Sends one turn, with a timeout and retries | `Http::withToken(...)->timeout(...)->retry(...)` |
| `src/provider.rs` | The only place that knows a provider's names | A mail transport chosen in `config/mail.php`. The rest of the app never sees the vendor's API. |
| `src/agent.rs` | The loop: ask, run tools, repeat | A queued job with a `Tries` limit. The turn limit is the guard against a job that retries forever. |
| `src/tools/mod.rs` | The `Tool` trait and the registry | Invokable action classes, each registered under a name in the container |
| `src/tools/calculator.rs` | Adds, subtracts, multiplies and divides | A small action class with one `handle()` method |
| `src/tools/read_file.rs` | Reads text files inside one folder | A filesystem disk, such as `Storage::disk('local')`, which is also rooted in one folder |
| `src/tools/run_command.rs` | Runs allowlisted programs | `Process::run(['php', 'artisan', 'migrate'])`. Laravel's examples mostly pass one command string, such as `Process::run('ls -la')`. The array form keeps the arguments apart. |
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
- The backoff has no jitter, so clients that fail together also retry together.
- The SSE reader keeps a whole line in memory before it reads it, with no size
  limit. It does not remove a byte-order mark at the start of a stream.
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
5. The argument check now looks inside options such as `--files0-from=` and
   `-f`. Find a program that reads a file the check cannot see, such as the list
   `wc` opens. Write a test that shows the gap, then close it, or explain in the
   code why you cannot.
