export const meta = {
  name: 'agent-team-scratch',
  description: 'Agent Team 循环工作',
  phases: ['PM检查', 'Worker1开发', 'Worker2测试', '迭代决策'],
};

phase('PM检查');
const pmResult = await agent('PM检查 scratch.5aqima.com 复刻进度。目录 e:/k/meee/code/project01。后端3000端口，前端8080端口。检查：1)backend/src模块 2)frontend-vite/src/pages页面 3)后端API状态 4)admin/admin登录。输出 backendModules, frontendPages, missingFeatures, worker1Tasks, backendStatus, loginWorking, recommendation', {label: 'PM检查', phase: 'PM检查'});

phase('Worker1开发');
var worker1Result = null;
if (pmResult.worker1Tasks && pmResult.worker1Tasks.length > 0) {
  var tasks = pmResult.worker1Tasks.join(', ');
  worker1Result = await agent('Worker1开发：' + tasks + '。目录 e:/k/meee/code/project01。确保 admin/admin 可正常登录。', {label: 'Worker1开发', phase: 'Worker1开发'});
} else {
  log('PM未分配任务，Worker1跳过');
}

phase('Worker2测试');
var worker2Result = await agent('Worker2测试：目录 e:/k/meee/code/project01，后端 http://localhost:3000，前端 http://localhost:8080。测试：1)admin/admin登录 2)API端点 3)前端状态。输出 loginTest, apiTests, frontendStatus, issues, passed', {label: 'Worker2测试', phase: 'Worker2测试'});

phase('迭代决策');
var needsIteration = worker2Result && worker2Result.issues && worker2Result.issues.length > 0;
log('PM:' + pmResult.backendStatus + ' Worker1:' + (worker1Result ? '完成' : '无') + ' Worker2:' + (worker2Result.passed ? '通过' : '问题') + ' 继续:' + needsIteration);
return {pmResult: pmResult, worker1Result: worker1Result, worker2Result: worker2Result, needsIteration: needsIteration};
