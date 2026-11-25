# Bill 的 DeepSeek 对话接口

前端已完成，当前 `assistant-config.js` 的 endpoint 为空，网站运行**内容导览模式**，不调用 DeepSeek。此目录为待部署后端，未上线。GitHub Pages 默认不发布以下划线开头的目录。

## 账号创建后接通

1. 在 https://dash.cloudflare.com/sign-up 创建 Cloudflare 账号并验证邮箱，无需购买域名。
2. 在本目录使用 Node.js 22+ 和 Wrangler 4.36+，执行 `npx wrangler@4 login`，在官方浏览器完成登录。
3. 执行 `npx wrangler@4 secret put DEEPSEEK_API_KEY`，只在本机隐藏输入提示中粘贴你的 DeepSeek API Key。不要发到聊天、提交到 GitHub、填进网页配置或作为命令参数。
4. 执行 `npx wrangler@4 deploy`。它会部署 `worker.mjs`，并按配置创建两个限流绑定。若 namespace_id 与账号现有项目冲突，请更换两个独立正整数。
5. 得到 `https://bill-website-assistant.<你的子域>.workers.dev` 后，把其 **公开地址**发给网站维护者即可；网站配置只需要 `<公开地址>/chat`。没有 Key 或没有两个限流绑定时，接口保持关闭。
6. 更新 `assistant-config.js` 的 endpoint 并发布后，打开分身面板；健康检查通过才显示 AI 模式。进行一次真实问答，检查工作数据、来源入口与 DeepSeek 用量后完成验收。

也可以在 Cloudflare 控制台设置 Secret；限流绑定必须与 `wrangler.jsonc` 一致，不能只粘贴单个代码文件而遗漏绑定。

## 运行方式与资料更新

- `GET /health`（需携带网站 Origin）返回 ready；`POST /chat` 接收 `{question,history}`。
- Origin 限定 `https://lalala0705.github.io`；Origin 不是身份认证，不能替代限流。
- Key 只用于 Worker 向 `https://api.deepseek.com/chat/completions` 发起服务器请求，不会返回浏览器。
- 模型为 `deepseek-chat`；单问400字，历史最多6条，输出最多650 token，15秒上游超时。
- 资料只取固定的本网站 `data/assistant-knowledge.json`，不接受浏览器提交的知识库、system prompt 或模型地址。
- 不执行工具、第三方链接或模型输出代码。浏览器把回复当纯文本显示，内容入口使用固定白名单。
- 不写入对话存储或日志。AI 模式会把问题、最近对话与公开网站资料发给 DeepSeek；前端在输入框下说明。
- 默认每个来源 IP 每分钟约8次、每个边缘位置站点约30次。共享网络可能共用额度；Cloudflare Rate Limiting 为**按边缘位置近似计数**，不是严格全球配额或费用封顶。请在 DeepSeek 账户监控余额，用量异常时清空前端 endpoint 或停用 Worker。接口地址是公开的，不能将 CORS 当作防盗刷保证。
- 资料每次请求从固定地址读取，边缘最多缓存300秒。生成脚本、内容变更自动同步工作流见主仓库。修改资料后不用重新部署 Worker。
- 关闭 AI：清空 `assistant-config.js` 的 endpoint；访客继续使用导览模式。

本地不需要 API Key 的验证：`node --test tests/assistant-worker.test.mjs tests/assistant-guide.test.mjs`（在仓库根目录）。真实 DeepSeek 调用需待账号与 Secret 配置后验证，目前不声称已接通。
