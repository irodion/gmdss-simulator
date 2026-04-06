# GMDSS VHF Radio Simulator

Open-source Progressive Web App for maritime radio training (ROC preparation).

## Prerequisites

- [Vite+](https://viteplus.dev) — `curl -fsSL https://vite.plus | bash`
- [Semgrep](https://semgrep.dev) — `brew install semgrep` or `pip install semgrep`
- [vet](https://github.com/safedep/vet) — `brew install safedep/tap/vet`

## Development

```bash
# Install dependencies
vp install

# Quality check (lint + format + type-check)
vp check

# Run tests
vp run -r test

# E2E tests
./node_modules/.bin/playwright test

# Development server
vp run frontend#dev

# Build
vp run -r build
```

## License

AGPLv3 (code) / CC BY-SA 4.0 (content)
