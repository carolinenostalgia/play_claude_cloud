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

## Commit 规则
- 不要每改一点就 commit。改完先告诉我改了什么，等我说「commit」再提交。
- 我说「commit」时，把这段时间的改动合成一条 commit，写一条清楚的说明。
- 会话要结束、或者容器可能被回收时，如果还有没提交的改动，先提醒我，不要自己提交。
- push 比 commit 更严格：只有我明确、直接地说「push」时才 push，不能根据上下文自己推断。
- 不要直接 push 到 `main`。改动通过分支和 Pull Request 合并。
