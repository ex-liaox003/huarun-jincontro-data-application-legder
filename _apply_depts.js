/* 一次性数据更新：将业务确认的 33 个华润资产部门按指标序号轮巡写入 INDICATOR_STANDARD.items[].supplyDept
   运行：node _apply_depts.js  （更新 指标查询.html 内嵌数据行） */
const fs = require('fs');
const F = '指标查询.html';
let s = fs.readFileSync(F, 'utf8');

const DEPTS = [
  '华润资产财务部','华润资产法律合规部','华润资产资金财务部','华润资产风险管理部',
  '华润资产产业四部','华润资产综合管理部','华润资产产业二部','华润资产特殊资产管理二部',
  '华润资产产业三部','华润资产审计部','华润资产特殊资产管理一部','华润资产运营科技部',
  '华润资产党群工作部','华润资产上海业务部','华润资产人力资源部','华润资产资金管理部',
  '华润资产总部','华润资产战略发展部','华润资产广州业务部','华润资产北京业务部',
  '华润资产管理团队','华润资产投资发展部','华润资产管理四部','华润资产产业二部（原架构）',
  '华润资产办公室','华润资产','华润资产风险管理与智能科技部','华润资产纪检部',
  '华润资产环境健康和安全部','华润资产管理二部','华润资产法律合规部合规组','华润资产业务审查部',
  '华润资产管理一部'
];

const marker = 'const INDICATOR_STANDARD = ';
const start = s.indexOf(marker);
if (start < 0) { console.error('未找到数据行'); process.exit(1); }
const jsonStart = start + marker.length;
/* 该行到 </script> 前为单行 JSON，以最后一个 } 收尾 */
const lineEnd = s.indexOf('\n</script>', jsonStart);
const jsonEnd = s.lastIndexOf('}', lineEnd);
const std = JSON.parse(s.slice(jsonStart, jsonEnd + 1));

std.items.forEach((it, i) => { it.supplyDept = DEPTS[i % DEPTS.length]; });

s = s.slice(0, jsonStart) + JSON.stringify(std) + s.slice(jsonEnd + 1);
fs.writeFileSync(F, s, 'utf8');
console.log('OK 已更新', std.items.length, '条指标的 supplyDept；部门数', DEPTS.length);
/* 校验：33 部门全部出现 */
const used = new Set(std.items.map(it => it.supplyDept));
console.log('去重后部门数:', used.size, '| 覆盖完整:', used.size === DEPTS.length);
