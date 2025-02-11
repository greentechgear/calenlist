# Contributing to Calenlist

First off, thank you for considering contributing to Calenlist! It's people like you that make Calenlist such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code
- refactor: A code change that neither fixes a bug nor adds a feature
- test: Adding missing tests or correcting existing tests
- chore: Changes to the build process or auxiliary tools

### Branch Naming Convention

- Feature branches: `feature/description`
- Bug fix branches: `fix/description`
- Documentation branches: `docs/description`
- Release branches: `release/version`

### Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation with details of any new features
3. The PR must pass all CI checks
4. The PR must be reviewed by at least one maintainer

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Questions?

Feel free to contact us at support@calenlist.com if you have any questions.