# 给 Claude 的仓库约定

## 仓库结构
- 这是一个放很多小项目的仓库，每个项目一个独立文件夹，例如 `book-of-answers/`。

## 隐私规则（最高优先级）
这是公开仓库。任何能识别仓库主人身份的信息都绝对不能出现在仓库里，包括文件内容、commit 说明、分支名、PR 和 Issue 的标题与正文、评论。
- 不能出现：真实姓名、邮箱（学校、工作、个人）、手机号、住址、学校或公司名称、所在城市或时区、社交账号、照片、身份证件号，以及任何 API Key、密码、token。
- commit 的作者和提交者只能用 `Claude <noreply@anthropic.com>`，或者 GitHub 的 noreply 邮箱（`…@users.noreply.github.com`）。commit 前用 `git config user.email` 确认。
- 每次 commit 前，检查暂存的改动和 commit 说明里有没有上面这些信息。发现了就停下来告诉我，不要提交。
- 页面里的示例内容只用虚构的数据，不要用我的真实信息。
- 我在对话里提到的个人信息只用于当前任务，不要写进任何文件。

## Commit、Push、PR 和 Merge 规则
- 一项改动做完（我提的需求完成、检查通过）之后，自动做三步：合成一条 commit、push 到当前分支、开 Pull Request。PR 已经开着就继续推到同一个 PR，不用另开。做的过程中改一点不用 commit。
- 做完后告诉我改了什么，并给我 PR 链接，让我先看。
- merge 必须等我明确说「merge」或「合并」才做。不能根据上下文推断，也不能自己决定合并。
- merge 就是上线：合进 `main` 后 GitHub Pages 会自动发布。合并后给我分享网址，格式是 `https://<用户名>.github.io/play_claude_cloud/<项目文件夹>/`。
- 不要直接 push 到 `main`，改动都通过分支和 PR 合并。
- 分支上的 PR 合并后，再有新改动时，从最新的 `main` 重新开始这个分支，然后开新的 PR。
