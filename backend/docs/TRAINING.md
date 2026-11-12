# 流程培训课程

同步 GitHub main `3ba885b2efd41b33f944aa2b4bd8f951a20684c6` 四步学习工作台与四页签配置，保留前序目录、密码和制度模板修复。

## 使用
协同工作 → 流程培训 → 设置必修/选修与课程 → 新增课程。选择已发布流程，在“课程内容”编写章节正文、目标、岗位动作、输入输出、交接、控制点与正反样例。在“练习与考核”配置题目、解析、及格线和可选实操任务/复核人。

学员读完全部章节后交卷，后台判分；有实操任务时提交完成说明，再由指定复核人或管理员复核。任何人不能复核自己的实操。无考题/实操的课程读完全部章节即可达标。

## 数据与权限
- 课程与学情存于 dictBundle.trainingCourses、dictBundle.trainingRecords，复用 PostgreSQL JSONB 设置、事务、审计及写锁，无需迁移。
- admin/editor 管理课程；普通用户学习适用课程。部门、岗位、流程角色任一匹配即适用，全空表示全员。指定实操复核人可查看其课程学情。
- 身份来自会话，成绩、复核签名由后台生成。客户端不能冒充其他学员或直接写成绩、完成状态。
- 配置保存生成新 revision，新版本重新学习，旧学情保留。旧页面写入和并发编辑冲突返回409。
- 绑定的已发布流程快照冻结；改绑其他流程读取新快照。同一流程保持绑定时版本，其 drawio 原文可下载；现行资产入口可能显示后续版本。
- 删除采用归档标记，保留课程与学情。
- 练习和考核复用题目，练习提供解析，不宣称为隔离答案的保密考试。

## 接口
- GET/POST /api/training/courses
- PUT/DELETE /api/training/courses/:id
- POST /api/training/courses/:id/sections/:sectionId/complete
- POST /api/training/courses/:id/exam
- POST /api/training/courses/:id/practical
- POST /api/training/courses/:id/records/:userId/confirm

学习写入带 revision；交卷带 answers（题目编号→选项序号），实操带 evidence。

正文为支持换行的纯文本。附件/视频上传、短信催学、自动关联待办和期限自动催办尚未实现；完成天数作为配置保存。已移除原型的假下载提示及虚构学员、部门、审批信息。
