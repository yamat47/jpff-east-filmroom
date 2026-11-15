# jpff-east-filmroom

The source of JPFF East Film Room, an unofficial fan site that arranges the game videos of the
[J.P.F.F East](https://youtube.com/@jpffeast) YouTube channel by season, team and game type. The
videos are embedded from YouTube; the site hosts none of them and is not affiliated with JPFF.

What the site does, how its data is modelled and the order it is built in are in
[docs/requirements.md](docs/requirements.md).

## Data

The site is built from the files under [`data/`](data/): the teams, the games of each season with
their videos, and the videos left out because they are not games. `make validate` checks them
against the schema in [`src/lib/schema.ts`](src/lib/schema.ts) and against each other.

## Development

Everything runs in Docker; only Docker and `make` are needed on the host.

```sh
make setup   # build the image and install the dependencies
make up      # dev server at http://localhost:4321 (make down stops it)
make check   # typecheck, lint, test, validate the data, and build
make help    # list the targets
```

## Agent skills

The skills under `.claude/skills/` are not written here. They are installed from
[yamat47/github-toolkit](https://github.com/yamat47/github-toolkit) and committed, so do not edit
them in place: change them upstream and wait for the release.

```sh
gh skill install yamat47/github-toolkit <skill-name> --agent claude-code --scope project
```

| Skill | Used for |
| --- | --- |
| `create-pr` | from uncommitted changes to a draft pull request |
| `review-pr` | local review of a diff before it is pushed |
| `writing-conventions` | house style for comments, commits, pull requests and docs |
| `github-actions-workflows` | rules for editing `.github/workflows/` |
| `review-dependency-bump` | reviewing Dependabot's dependency bumps |
| `review-skill-update` | reviewing the pull requests `update-skills` opens |
| `typescript-idioms` | language-level TypeScript rules |
| `react-patterns` | React rules for the interactive parts of the pages |

`update-skills.yml` runs `gh skill update --all` monthly and opens a pull request with
`github.token`, which the `jpff-east-filmroom` entry in yamat47/infra-github allows
(`actions_can_create_pull_requests`).
