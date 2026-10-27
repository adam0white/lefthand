# The Left Hand

Three winter nights. Carry help to a family. Decide what to say when someone sees you.

Godot 4.7.2 draws a deterministic TypeScript host running Human Framework 3.2.0.

Node 26.12.0, pnpm 12.14.0. Run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm build`, `pnpm e2e`. Godot and matching templates download to `.godot-tools` on first build.

See [design](docs/design.md). Code is MIT.

Third-party copyright and license texts are retained in [public/third-party-notices.txt](public/third-party-notices.txt), also linked from Licenses in the game menu.

Deploy with `npm run deploy` from clean, pushed main after exact green CI. The command builds, uploads and verifies the live commit and `dirty:false` at `/release.json`. Run exports and replay verification are under Menu → Debug.
