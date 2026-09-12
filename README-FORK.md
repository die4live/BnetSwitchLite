# BnetSwitchLite（个人自用 fork）

Fork 自 <https://github.com/kabxx/BnetSwitchLite>，原项目 **MIT** 协议，版权归原作者 kabxx。
本仓库仅用于个人自用，不对外分发。

## 相对上游的改动

改动全部是**新增文件**，未修改任何上游源码：

| 文件 | 用途 |
|---|---|
| `.github/workflows/build-windows.yml` | 自动构建 Windows 免安装单文件 exe |
| `.github/dependabot.yml` | 依赖漏洞提醒（cargo / npm / github-actions） |
| `.github/workflows/codeql.yml` | 静态安全扫描（TypeScript + Rust） |
| `.githooks/pre-commit` | 防止本地凭据与构建产物误入库 |

## 为什么需要自构建

上游发布的 Windows 产物未做 Authenticode 签名，双击会被 SmartScreen 拦截。
自用场景下自己构建、自己运行，不存在"要不要信任分发方"的问题，因此不需要购买代码签名证书。

## 本地开发

```bash
git config core.hooksPath .githooks   # 启用凭据拦截 hook（必须，否则凭据可能入库）
npm ci
npm run tauri -- build --no-bundle --ci
npm run package:windows -- -Architecture x64
```

产物在 `release/BnetSwitchLite-<version>-windows-x64.exe`，**单文件、免安装、不提权**。

## 数据存放位置

应用数据与 exe 同目录（`BnetSwitchLiteData/`），整个文件夹复制即备份、删除即卸载，不留注册表。

⚠️ 因此**不要把 exe 放在桌面或文档目录** —— Windows 默认会把这两个位置纳入 OneDrive 同步，
登录状态快照会跟着上云。建议放 `C:\Tools\BnetSwitchLite\` 这类普通目录。

## 跟进上游

```bash
git fetch upstream
git merge upstream/main
```
