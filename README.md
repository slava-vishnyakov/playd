# playd

[![Test](https://github.com/slava-vishnyakov/playd/actions/workflows/test.yml/badge.svg)](https://github.com/slava-vishnyakov/playd/actions/workflows/test.yml) [![Homepage](https://img.shields.io/badge/Homepage-visit-blue?style=flat&logo=github)](https://slava-vishnyakov.github.io/playd/)

Ever wanted to run a browser from CLI (command-line) and then command it from CLI? Or from LLM?  

Here's the Chrome automation tool using the Chrome DevTools Protocol (CDP) for CLI and LLMs to use. Kind of like "Browser Use" without MCP or extensions or puppeteer/playwright./clear

## Quickstart

```bash
npm install -g playd

playd session create my-run --headed

playd goto https://example.com

playd llm "Does this page have an input for search and what's its ID?" 
# uses gpt-5-nano and requires OPENAI_API_KEY

playd screenshot --path example.png

playd eval "body.html"

playd shutdown
```

## Install

```bash
npm install -g playd
```

## Claude Code

Press `#` in Claude Code (or similar) and paste this line to store playd usage instructions:

```
Information about `playd` command: it controls Chrome via CDP; create session: `playd session create browser1 --headed` (other commands use last session by default); navigate: `playd goto URL`; interact: `playd click ".selector"`, `playd type "text"` or `playd type "text" --selector ".input"`, `playd type "text" --clear` (clears first), `playd fill ".selector" "text"`, `playd press "Enter"`; wait: `playd wait-for ".selector"`; extract: `playd text`, `playd dom`, `playd attr ".selector" "href"` (html attr, not current value!); AI questions: `playd llm "question"` (analyzes title+text) or `playd llm "question" --on-html` (analyzes full HTML); run JS: `playd eval "code"`; capture: `playd screenshot`; cookies: `playd cookie-get <name>`, `playd cookie-set <name> <value> [--domain <domain>] [--path <path>]`; storage: `playd storage [--export file.json] [--import file.json]`; `playd session close browser1`; `playd wait-for "textarea[name='q']"`; `playd help`; `playd shutdown` (closes all sessions) `npm install -g playd` if not installed
```

Store it to global memory and now you can have your browser automation.

## CLI Overview

### Sessions

```bash
playd session create <id> [--headed] [--browser chromium]
playd session ls
playd session info <id>
playd session close <id>
```

Create and manage isolated browser sessions.

### Navigation

Navigate and capture the page.

```bash
playd goto <url>
playd screenshot [--path file.png]
playd pdf [--path file.pdf]
```

`playd screenshot` works surprisingly well with Claude Code - it automatically "sees" the page.

### Page Interaction

```bash
playd click <selector>
playd type <selector> <text> [--clear]
playd fill <selector> <text>
playd press <key> [--selector <sel>]
playd wait-for <selector> [--state visible]
```

Automate user actions and waits.

### Content Extraction

```bash
playd html [--pretty]
playd text [--selector <sel>]
playd attr <selector> <name>
playd eval <javascript>
playd eval-file <file.js>
playd llm <question>
```

Pull content, run JS, or ask an LLM about the current page (requires OPENAI_API_KEY env var).

### Data Management

```bash
playd cookies [--set file.json]
playd cookie-get <name>
playd cookie-set <name> <value> [--domain <domain>] [--path <path>]
playd storage [--export file.json]
playd storage [--import file.json]
```

Move cookies and Web Storage data in and out. Individual cookie commands make it easy to get/set specific cookies without dealing with JSON files.

### Server Control

```bash
playd status
playd shutdown
```

Check status or stop the background server.

## Global Flags

* `--session <id>` – Use a specific session (auto-uses most recent if omitted)
* `--json` – JSON output
* `--timeout <ms>` – Command timeout
  These are available across commands.

## Environment

* `PLAYD_SESSION` – Default session ID
* `OPENAI_API_KEY` – Required for the `llm` command
  Configure these in your shell profile as needed.

## Why playd?

* Single binary CLI (`playd`) for scripting and CI.
* CDP-based automation that’s great for scraping, testing, and quick page ops. 

## License

**MIT**
