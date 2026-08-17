現在のJS自体は Node.js CLIなので、npm から Yarn に変更する場合、基本的には package.json の scripts や bin はそのまま利用できます。

以前の aero-coord-convert-cli をグローバルインストールする用途なら、Yarn 1.x（Classic）とYarn 4.xでは方法が異なります。

Yarn 1.x の場合

package.json が例えば、

```json
{
  "name": "aero-coord-convert-cli",
  "version": "1.0.0",
  "main": "bin/aero-coord-convert.js",
  "bin": {
    "aero-coord-convert": "./bin/aero-coord-convert.js"
  }
}
```

なら、

```bash
yarn global add .
```

で現在のディレクトリにあるCLIをグローバルインストールできます。

インストール後、

```bash
aero-coord-convert
```

で実行できます。

⸻

Yarn 4.x の場合

以前お使いだった Yarn 4.17.0 なら、ここが少し違います。

Yarn 4では`yarn global add`は基本的に使いません。

ローカルで開発するなら、

```bash
yarn install
```

として、

```bash
yarn aero-coord-convert
```

で実行できます。

ただし、CLIをシステム全体から aero-coord-convert として直接実行したいのであれば、Yarn 4のPnP/プロジェクト管理とグローバルCLI管理を分けて考えた方がよいです。

⸻

私なら今回のCLIではこうします

aero-coord-convert は依存パッケージを必要としない単純なNode.js CLIなので、プロジェクトを

aero-coord-convert-cli/
├── package.json
├── README.md
└── bin/
    └── aero-coord-convert.js

として、

```json
{
  "name": "aero-coord-convert-cli",
  "version": "1.0.0",
  "description": "Aviation coordinate converter CLI",
  "main": "bin/aero-coord-convert.js",
  "bin": {
    "aero-coord-convert": "./bin/aero-coord-convert.js"
  },
  "license": "MIT"
}
```

にします。

そして開発時は、

```bash
yarn install
yarn aero-coord-convert
```

とします。

もし目的が、以前の

```bash
npm install -g aero-coord-convert-cli
```

とまったく同じように、YarnでインストールしてMacのどこからでも aero-coord-convert と実行したいということなら、Yarn 4では別の方法を取る必要があります。

その場合は、現在の package.json を見せてもらえれば、Yarn 4.17.0を前提に、公開npmパッケージではなくローカルのCLIをグローバル相当で使える構成に変更できます。

はい。その順序で問題ありません。現在 Yarn 1.22.22 なら、npmからYarnへの移行はかなり単純です。

ただし、package-lock.json を削除する前に、現在の package.json を確認しておくのが安全です。

手順

プロジェクトディレクトリで、

rm package-lock.json

次に、

yarn install

を実行します。

するとYarnが

yarn.lock

を生成します。

以後は、このプロジェクトでは依存関係の管理を

package.json
yarn.lock

に統一します。

その後

CLIとしてローカルで動作確認するなら、

yarn run aero-coord-convert

または bin が設定されていれば、

yarn aero-coord-convert

で実行できます。

グローバルインストールまで行うなら、Yarn 1.22.22なので、

yarn global add .

が使えます。

ただし、現在のプロジェクトがすでにnpmで管理されていて、node_modules が存在する場合は、私は一度 node_modules も削除してからYarnに切り替えることを勧めます。

rm -rf node_modules
rm package-lock.json
yarn install

これで、

package.json
    ↓
yarn install
    ↓
yarn.lock
    ↓
node_modules

という、Yarn管理のクリーンな状態になります。

なお、package-lock.json を削除して yarn install するだけでも動きますが、npmで作られた node_modules を残したままにするより、CLIをYarnへ完全移行するなら node_modules も作り直した方が確実です。