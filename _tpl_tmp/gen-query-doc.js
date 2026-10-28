/* 指标查询模块需求文档生成器：从 指标查询.html 提取数据，输出 HTML + DOCX 双格式 */
const fs = require('fs');
const path = require('path');
const DOCX = require('D:/Users/ex-liaox003/AppData/Local/Temp/docxgen/node_modules/docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ShadingType } = DOCX;

const ROOT = 'D:/work-2026/AI-test/华润金控-数据应用-台账';
const html = fs.readFileSync(path.join(ROOT, '指标查询.html'), 'utf8');
const dataLine = html.split('\n').find(l => l.startsWith('const INDICATOR_STANDARD'));
const DATA = JSON.parse(dataLine.replace(/^const INDICATOR_STANDARD\s*=\s*/, '').replace(/;\s*$/, ''));
const ITEMS = DATA.items, META = DATA.meta;
const N = ITEMS.length;

/* ---------- 数据画像（示例值 / 枚举分布自动统计） ---------- */
const PLACEHOLDER = /^(待.{0,8}补充|不涉及|暂无|无|-|—)$/;
function distinctReal(key) {
  const c = {};
  ITEMS.forEach(it => { const v = String(it[key] == null ? '' : it[key]).trim(); if (v && !PLACEHOLDER.test(v)) c[v] = (c[v] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}
function demo(key, max = 3, trunc = 22) {
  const d = distinctReal(key);
  if (!d.length) {
    const has = ITEMS.some(it => String(it[key] == null ? '' : it[key]).trim());
    return has ? '待补充（占位）' : '（空）';
  }
  const s = d.slice(0, max).map(([v]) => (v.length > trunc ? v.slice(0, trunc) + '…' : v)).join('、');
  return s + (d.length > max ? `（共 ${d.length} 种）` : '');
}
function dist(key) { return distinctReal(key).map(([v, n]) => `${v} ${n} 条`).join('，'); }

/* ---------- 字段字典备注 ---------- */
const REMARKS = {
  code: '指标唯一编号；详情字段名后带 ? 注释「指标的唯一编号」',
  groupCode: '与标准编号一同参与关键字/高级搜索匹配',
  theme: '主题树根节点；顶部统计卡按主题计数',
  cat1: '主题树第 2 层', cat2: '主题树第 3 层', cat3: '主题树第 4 层（叶子）；主题树按 主题→一级→二级→三级 构建',
  name: '关键字模糊匹配字段；列表中命中关键字高亮',
  definition: '指标业务含义；关键字模糊匹配字段；详情 ? 注释',
  type: '基础/原子/派生指标；列表为无背景黑体纯文本（2026-10-12 起）',
  caliber: '统计口径；详情 ? 注释「指标的统计口径」；筛选选项随业务单元联动',
  formula: '派生指标的计算公式',
  unit: '展示单位（亿元/万元/户/% 等）；数据库存储单位另见 storeUnit',
  bizUnit: '业务单元单选筛选；高级搜索条件之一',
  dataRange: '统计范围、剔除规则与维度边界；详情 ? 注释',
  assess: '列表/详情彩色胶囊标签：考核指标蓝 / 高质量指标绿，两者都是=双标签',
  isRegulatory: '「是」时详情头部显示红色「监管指标」徽标',
  regulator: '监管报送对象；非监管指标为占位值',
  freq: '更新频次；高级搜索多选条件',
  timeDim: '时间维度；高级搜索多选条件',
  srcSystem: '来源业务单元系统；多个系统用英文逗号分隔（如「IMP系统,润报」）',
  supplyDept: '供数责任部门',
  bizContact: '指标责任人；多人用英文逗号分隔（如「余甜,唐颖」）',
  itContact: '业务单元侧 IT 对接人',
  inDataLake: '是否已入数据湖',
  storeUnit: '数据库存储最小计量单位',
  lakeDb: '唯一性识别规则之湖库名',
  lakeTable: '唯一性识别规则之湖表名',
  pushTable: '下游推送目标表',
  companyCode: '唯一性识别规则之公司 code',
  reportCodeField: '唯一性识别规则之报表 code 字段',
  timeDimField: '唯一性识别规则之时间维度字段',
  statTimeField: '唯一性识别规则之统计时间字段',
  timeType: '时点/期间/期间日均类',
  fetchMethod: '取数方式（FTP 文件传输/接口等）',
  owner: '指标需求人',
  mgmtDept: '指标归口管理部门',
  status: '枚举：未发布/已发布/已下线；圆点标识（橙/绿/灰）；当前全部已发布（2026-10-10 起）',
  isShared: '是否共享',
  creator: '指标创建人',
  createDate: '创建日期（YYYY-MM-DD）',
  updater: '最近更新人',
  updateDate: '最近更新日期',
  publishDate: '状态变为已发布的日期',
  disableDate: '停用日期；已发布状态留空（显示 --）',
  disableReason: '停用原因；已发布状态留空（显示 --）',
  version: '指标标准版本号',
  securityLevel: 'L1-一般其他数据/L2-一般敏感数据/L3-重要数据/L4-核心数据；列表与详情彩色胶囊（青/绿/橙/红）',
};
const GROUPS = [
  { key: 'business', label: '业务属性' },
  { key: 'technical', label: '技术属性' },
  { key: 'management', label: '管理属性' },
];
const FIELD_TABLE = { cols: ['字段名称', '字段 Key', '当前数据示例 / 枚举', '说明'], widths: [16, 14, 30, 40] };
const fieldRows = g => META.fields.filter(f => f.group === g)
  .map(f => [f.label, f.key, demo(f.key), REMARKS[f.key] || '—']);

/* ---------- 文档内容模型（HTML 与 DOCX 共用同一数据源） ---------- */
const CALIBER_MAP = {
  '华润金融': '合并报表口径', '华润银行': '单体考核口径、单体报表口径、合并报表口径',
  '华润信托': '财务考核口径、混合口径、信托单体口径、信托计划口径', '华润租赁': '（暂无关联口径）',
  '华润保险': '考核口径',
  '华润资产': '财务考核口径、渝康单体口径、资产单体口径、资产本部及渝康合并口径、资产本部口径、资产香港(含深圳)口径',
  '华润深国投': '深国投单体口径',
};
const doc = [
  { t: 'h1', x: '1　文档说明' },
  { t: 'h2', x: '1.1　文档目的与读者' },
  { t: 'p', x: '本文档描述「通用报送管理系统 — 指标查询」模块的产品需求，覆盖页面布局、搜索与筛选、指标列表、指标详情、字段字典、枚举联动与视觉交互规范，作为业务方确认功能口径、开发方实现与测试方编写用例的共同依据。' },
  { t: 'p', x: '当前实现载体为单文件页面 指标查询.html（纯前端、数据内嵌），本文档以该页面的实际行为为准编写。' },
  { t: 'h2', x: '1.2　读者对象' },
  { t: 'ul', items: ['业务人员（战略部、各业务单元数据岗）：了解页面能查什么、怎么查、字段含义；', '产品/项目管理人员：确认功能范围与验收口径；', '前端/后端开发与测试人员：作为实现、接口改造与用例设计依据。'] },
  { t: 'h2', x: '1.3　修订记录' },
  { t: 'table', cols: ['版本', '日期', '修订内容', '修订人'], widths: [10, 14, 62, 14], rows: [
    ['V1.0', '2026-09-16', '指标标准库查询页初版：统计卡、快速/高级搜索、21 列列表、详情抽屉、分页；数据源切换为华润资产指标清单（166 条）', '华润金控数据组'],
    ['V1.1', '2026-10-10', '详情字段顺序调整（指标属性标签前置、业务单元前置于指标口径）；全部指标状态置为「已发布」；两值字段（责任人、来源系统）改英文逗号分隔；详情 ? 注释气泡增加', '华润金控数据组'],
    ['V1.2', '2026-10-12', '安全级别胶囊化且详情值同步着色；指标属性标签胶囊化；? 注释浮层防遮挡改造；指标类型列改黑体无背景；管理属性字段补齐赋值（停用日期/原因除外）', '华润金控数据组'],
  ] },
  { t: 'h2', x: '1.4　术语' },
  { t: 'table', cols: ['术语', '含义'], widths: [24, 76], rows: [
    ['指标标准库', '全集团统一的指标定义集合，一条记录 = 一个指标标准（本模块共 ' + N + ' 条）'],
    ['业务单元', '指标归属的业务主体（华润金融/银行/信托/租赁/保险/资产/深国投）'],
    ['指标口径', '指标统计口径，与业务单元存在一对多联动关系'],
    ['指标属性标签', '考核指标 / 高质量指标 两类治理标签，可同时具备'],
    ['主题树', '指标主题→一级→二级→三级分类构成的四级分类树'],
    ['详情抽屉', '列表右侧滑出的指标全字段详情面板'],
    ['占位值', '「待××补充 / 不涉及 / 暂无 / 无 / -」等无效值，界面统一按空处理'],
  ] },

  { t: 'h1', x: '2　模块概述' },
  { t: 'h2', x: '2.1　背景与目标' },
  { t: 'p', x: '集团各业务单元指标定义、口径、责任主体分散在 Excel 台账中，业务与IT查数前需反复确认口径。指标查询模块将指标标准库线上化，提供统一检索入口：快速定位指标、看清口径与定义、找到责任人，支撑「先查标准、再取数」的数据治理流程。' },
  { t: 'h2', x: '2.2　用户角色与使用场景' },
  { t: 'table', cols: ['角色', '典型场景'], widths: [26, 74], rows: [
    ['业务分析/报表岗', '报送或取数前查指标口径、计算公式、更新频次、数据范围'],
    ['数据治理/管理岗（如战略部）', '检查指标标准完备性（技术属性是否已落湖、安全级别定级）'],
    ['IT 开发/数据工程师', '查指标来源系统、推送表名、唯一性识别规则、取数方式'],
    ['指标责任人/需求人', '核对自己名下指标的定义与状态'],
  ] },
  { t: 'h2', x: '2.3　数据来源与规模' },
  { t: 'table', cols: ['项', '内容'], widths: [24, 76], rows: [
    ['数据源文件', META.sourceFile + '（工作表：' + META.sheetName + '）'],
    ['数据版本', META.version + '，生成时间 ' + META.generatedAt],
    ['数据说明', META.note],
    ['当前规模', N + ' 条指标；主题分布：' + dist('theme') + '；业务单元分布：' + dist('bizUnit')],
    ['装载方式', '当前为内嵌 JSON 常量 INDICATOR_STANDARD（meta 字段字典 + items 记录），页面打开即用，无服务端依赖'],
  ] },
  { t: 'h2', x: '2.4　页面位置与导航' },
  { t: 'p', x: '顶部导航「指标查询」为当前模块；导航还包含首页（通用报送管理系统-导航.html）、预算填报、指标管理、报送管理、任务管理、模版管理、消息管理、系统管理。页面右上角显示当前登录角色（示例：金控管理岗）。' },

  { t: 'h1', x: '3　页面布局与主流程' },
  { t: 'h2', x: '3.1　布局分区（自上而下）' },
  { t: 'table', cols: ['区域', '内容'], widths: [22, 78], rows: [
    ['① 统计概览卡', '指标标准总数 / 战略类指标 / 风险类指标 三张卡片'],
    ['② 搜索工具条', '关键字输入框、清空按钮、「高级搜索」开关（带条件数角标）、「搜索」按钮、结果计数「共 X 条指标」'],
    ['③ 高级搜索面板', '默认收起，点②中「高级搜索」平滑展开；7 组条件 + 重置/高级搜索按钮'],
    ['④ 指标列表', '21 列宽表格，横向滚动，前 4 列与操作列冻结'],
    ['⑤ 分页条', '共 X 条、每页条数（10/20/50/100）、页码与上/下一页'],
    ['⑥ 详情抽屉（浮层）', '点列表「详情 →」从右侧滑出，覆盖遮罩'],
  ] },
  { t: 'h2', x: '3.2　主流程' },
  { t: 'p', x: '进入页面（默认展示全量第 1 页）→ 输入关键字或展开高级筛选 → 点「搜索」（回车同效）→ 列表过滤并回到第 1 页、计数联动 → 点行末「详情 →」查看全字段 → 「✕ / 点遮罩 / Esc」关闭抽屉。条件均为「点搜索才生效」，输入与勾选过程不实时改变列表。' },

  { t: 'h1', x: '4　功能需求' },
  { t: 'h2', x: '4.1　统计概览卡' },
  { t: 'ul', items: [
    '三张卡片：指标标准总数、战略类指标、风险类指标，按主题字段统计；',
    '口径：始终基于全量数据统计，初始化渲染一次，不随搜索/筛选联动（与列表计数解耦）；',
    '当前数据实际值：总数 ' + N + '、战略类 ' + ITEMS.filter(i => i.theme === '战略').length + '、风险类 ' + ITEMS.filter(i => i.theme === '风险').length + '（风险类随数据接入后自动变化）。',
  ] },
  { t: 'h2', x: '4.2　快速搜索（关键字）' },
  { t: 'table', cols: ['项', '需求'], widths: [22, 78], rows: [
    ['匹配字段', '指标名称、指标标准编号、指标分组编号、指标定义，任一包含关键字即命中（OR 语义）'],
    ['匹配方式', '不区分大小写的子串匹配；命中处在列表的名称/编号/定义列以黄色高亮 <mark> 展示'],
    ['触发时机', '输入仅暂存条件，列表不变；按回车或点「搜索」才应用'],
    ['清空', '输入框非空时显示 ✕ 清空按钮，点击清空并复位输入框焦点'],
    ['与高级文本条件互斥', '顶部关键字 与 面板「指标名称/编号」「指标定义」不叠加：以最后操作的入口为准，另一侧自动清空，避免 AND 查空'],
  ] },
  { t: 'h2', x: '4.3　高级搜索' },
  { t: 'p', x: '面板默认收起；按钮上角标实时显示已设置的生效条件数（>0 时高亮）。条件设置后点面板内「高级搜索」或顶部「搜索」生效；「重置」清空全部条件（含关键字、主题树勾选、各下拉）并恢复全量列表。' },
  { t: 'table', cols: ['条件', '控件', '枚举/取值', '组合与联动规则'], widths: [14, 12, 38, 36], rows: [
    ['指标名称/指标编号', '文本', '模糊搜索', '匹配 名称、标准编号、分组编号 任一；与顶部关键字互斥'],
    ['指标定义', '文本', '模糊搜索', '与顶部关键字互斥'],
    ['指标主题', '树形多选', '主题→一级→二级→三级 四级树（由数据动态构建）', '复选级联（父勾全选后代、部分勾选显示半选态）；默认展开主题层；按选中叶子覆盖的指标集合过滤'],
    ['业务单元', '单选下拉', '华润金融、华润银行、华润信托、华润租赁、华润保险、华润资产、华润深国投', '选定后精确匹配；变更时清空已选指标口径并重建口径选项'],
    ['指标口径', '多选下拉', '随业务单元联动（见 6.3 映射表）', '未选业务单元时禁用（提示「请先选择业务单元」）；多选 OR'],
    ['更新频次', '多选下拉', '日度、月度、季度、半年度、年度', '多选 OR'],
    ['时间维度', '多选下拉', '本日数、本日末、本月数、本月末、本季数、本季末、本年度、本年累计数', '多选 OR'],
    ['指标属性标签', '多选下拉', '考核指标、高质量指标', '按映射命中：选「考核指标」→ 数据值为 仅考核指标/两者都是；选「高质量指标」→ 仅高质量指标/两者都是'],
  ] },
  { t: 'p', x: '组合逻辑：主题树（叶子集合）、业务单元、口径、频次、时间维度、属性标签、两组文本条件之间为 AND；同一多选条件内部为 OR。' },
  { t: 'h2', x: '4.4　指标列表' },
  { t: 'h3', x: '4.4.1　列定义（自左至右 21 列）' },
  { t: 'table', cols: ['列', '宽度(px)', '展示规则'], widths: [22, 10, 68], rows: [
    ['序号', '44', '行号（冻结）'],
    ['指标标准编号', '140', '等宽字体；关键字高亮（冻结）'],
    ['业务单元', '110', '居中（冻结）'],
    ['指标名称', '180', '左对齐；关键字高亮（冻结）'],
    ['指标主题', '110', '文本'],
    ['一级分类', '120', '文本'],
    ['二级分类', '120', '文本'],
    ['指标定义', '240', '左对齐；关键字高亮；超长换行、title 悬浮全文'],
    ['更新频次', '84', '文本'],
    ['时间维度', '96', '文本'],
    ['指标类型', '92', '无背景、黑体纯文本（基础指标/原子指标/派生指标）'],
    ['指标口径', '118', '文本'],
    ['指标单位', '70', '文本'],
    ['业务单元供数部门', '150', '文本'],
    ['指标属性标签', '92', '胶囊标签：考核指标（淡蓝底蓝字）/ 高质量指标（淡绿底绿字）；两者都是=双标签并排；两者都不是=—'],
    ['指标责任人', '130', '多人英文逗号分隔（如 余甜,唐颖）'],
    ['指标需求人', '100', '文本'],
    ['指标管理部门', '130', '文本'],
    ['版本号', '84', '文本'],
    ['安全级别', '160', '胶囊标签实色底白字：L1 青 / L2 绿 / L3 橙 / L4 红；title 悬浮全文'],
    ['操作（右冻结）', '84', '「详情 →」链接按钮'],
  ] },
  { t: 'h3', x: '4.4.2　通用规则' },
  { t: 'ul', items: [
    '冻结列：前 4 列与操作列在横向滚动时保持可见；',
    '空值/占位值（待××补充、不涉及、暂无、无、-、—、空串）统一显示灰色「—」占位符；',
    '结果计数「共 X 条指标」与分页条「共 X 条」随筛选实时联动；',
    '表格无匹配时显示空态：「🔍 未查询到匹配的指标标准，请调整关键字或筛选条件」。',
  ] },
  { t: 'h2', x: '4.5　分页' },
  { t: 'ul', items: [
    '每页条数 10 / 20 / 50 / 100，默认 10；切换后回到第一页并刷新；',
    '页码条：上一页 / 页码（首页、尾页、当前页 ±2，其余折叠为 …）/ 下一页；首页禁用上一页，尾页禁用下一页；',
    '任何一次「搜索」应用后页码重置为第 1 页。',
  ] },
  { t: 'h2', x: '4.6　指标详情抽屉' },
  { t: 'h3', x: '4.6.1　头部信息条（橙色渐变底）' },
  { t: 'ul', items: [
    '第一行：指标名称 + 状态胶囊（白色底内嵌圆点状态：已发布绿点）；',
    '第二行：指标标准编号 · 一级/二级/三级分类路径（等宽字体）；',
    '第三行徽标（顺序固定，2026-10-10 起）：指标主题 → 业务单元 → 指标口径 → 更新频次 →（当「是否监管指标=是」时）红色「监管指标」徽标；',
    '关闭：右上 ✕、点击遮罩、按 Esc，任一方式收起抽屉并恢复页面滚动。',
  ] },
  { t: 'h3', x: '4.6.2　正文：三页签全字段表' },
  { t: 'ul', items: [
    '页签：业务属性（26 字段）/ 技术属性（18 字段）/ 管理属性（14 字段），默认业务属性；左列字段名、右列字段值；',
    '指标属性标签：与列表同款彩色胶囊标签（考核指标蓝 / 高质量指标绿 / 双标签），无值显示「--」；',
    '安全级别：与列表同款等级色胶囊（L1 青 / L2 绿 / L3 橙 / L4 红）；',
    '其余字段为纯文本，空/占位值显示「—」并灰化。',
  ] },
  { t: 'h3', x: '4.6.3　字段 ? 注释（悬浮气泡）' },
  { t: 'table', cols: ['字段', '注释文案'], widths: [22, 78], rows: [
    ['指标标准编号', '指标的唯一编号'],
    ['指标口径', '指标的统计口径'],
    ['数据范围', '指标的统计范围、剔除规则与维度边界等说明；清晰说明统计包含项、排除项；'],
  ] },
  { t: 'ul', items: [
    '样式：字段名右侧橙色（主题色）圆形 ? 图标，白字，常驻显示，悬停加深；',
    '交互：鼠标移入/键盘聚焦显示深灰半透明气泡，暗色小三角对准图标；',
    '防遮挡（2026-10-12）：气泡为挂 body 的 fixed 浮层，不受抽屉滚动容器裁剪；优先向上弹出，空间不足自动向下翻转；超宽自动贴边平移，长文案完整可读；抽屉滚动时自动收起。',
  ] },

  { t: 'h1', x: '5　字段字典（指标标准库全 58 字段）' },
  { t: 'p', x: '以下按详情抽屉三页签分组；「当前数据示例 / 枚举」由 ' + N + ' 条现网数据自动统计，反映实际取值分布。所有字段均为展示与检索用文本字段。' },
  { t: 'h2', x: '5.1　业务属性（26 字段）' },
  { t: 'table', cols: FIELD_TABLE.cols, widths: FIELD_TABLE.widths, rows: fieldRows('business') },
  { t: 'h2', x: '5.2　技术属性（18 字段）' },
  { t: 'table', cols: FIELD_TABLE.cols, widths: FIELD_TABLE.widths, rows: fieldRows('technical') },
  { t: 'h2', x: '5.3　管理属性（14 字段）' },
  { t: 'table', cols: FIELD_TABLE.cols, widths: FIELD_TABLE.widths, rows: fieldRows('management') },

  { t: 'h1', x: '6　枚举与联动数据字典' },
  { t: 'h2', x: '6.1　查询枚举总表' },
  { t: 'table', cols: ['枚举', '取值', '当前数据分布'], widths: [16, 44, 40], rows: [
    ['业务单元', '华润金融 / 华润银行 / 华润信托 / 华润租赁 / 华润保险 / 华润资产 / 华润深国投', dist('bizUnit')],
    ['更新频次', '日度 / 月度 / 季度 / 半年度 / 年度', dist('freq')],
    ['时间维度', '本日数 / 本日末 / 本月数 / 本月末 / 本季数 / 本季末 / 本年度 / 本年累计数', dist('timeDim')],
    ['指标状态', '未发布 / 已发布 / 已下线', dist('status')],
    ['指标属性标签', '考核指标 / 高质量指标（查询枚举）', dist('assess') + '（数据侧原始枚举）'],
    ['安全级别', 'L1-一般其他数据 / L2-一般敏感数据 / L3-重要数据 / L4-核心数据', dist('securityLevel')],
    ['是否类', '是 / 否', '是否监管指标：' + dist('isRegulatory') + '；是否共享：' + dist('isShared')],
  ] },
  { t: 'h2', x: '6.2　指标属性标签映射（查询枚举 ⇄ 数据枚举）' },
  { t: 'table', cols: ['查询选项', '命中数据值', '列表/详情显示'], widths: [22, 38, 40], rows: [
    ['考核指标', '仅考核指标、两者都是', '考核指标（蓝胶囊）；「两者都是」再并排一枚绿胶囊'],
    ['高质量指标', '仅高质量指标、两者都是', '高质量指标（绿胶囊）'],
    ['（不筛选）', '两者都不是 / 空', '—（列表）/ --（详情）'],
  ] },
  { t: 'h2', x: '6.3　业务单元 → 指标口径联动映射' },
  { t: 'table', cols: ['业务单元', '可选口径'], widths: [20, 80], rows: Object.entries(CALIBER_MAP).map(([k, v]) => [k, v]) },
  { t: 'p', x: '交互约束：未选业务单元时口径下拉禁用；业务单元变更时已选口径清空并按上表重建选项。' },

  { t: 'h1', x: '7　视觉与交互规范' },
  { t: 'h2', x: '7.1　主题色板' },
  { t: 'table', cols: ['用途', '色值'], widths: [50, 50], rows: [
    ['主题主色（按钮/选中态/问号图标/抽屉头部渐变起点）', '#f5a623（深金 #d48a10 / 浅金 #f7b84e 渐变搭配）'],
    ['强调金棕（悬停、派生徽标）', '#c8962e / #b57207'],
    ['指标状态点色', '未发布 #f5a623 橙；已发布 #52c41a 绿；已下线 #b8c1cc 灰'],
    ['安全级别胶囊', 'L1 #7dd8d8 青；L2 #8ee600 绿；L3 #f5a623 橙；L4 #f07070 红（白字）'],
    ['属性标签胶囊', '考核指标 底 #dce8f8 字 #2a5298；高质量指标 底 #eaf7f0 字 #0d8a68'],
    ['监管指标徽标', '底 #fdecec 字 #ef4444 描边 #fbcaca'],
  ] },
  { t: 'h2', x: '7.2　组件规范' },
  { t: 'ul', items: [
    '胶囊标签：内边距 2px 10px，圆角 11px（全圆角胶囊），字号 11–12px，白空格不换行；指标属性标签与安全级别自 2026-10-12 起统一为胶囊型（与徽标一致），背景色不变；',
    '指标类型列：无背景、黑体（SimHei/Heiti SC/微软雅黑）纯文本，与彩色胶囊类字段形成区分；',
    '双标签并存（考核+高质量）时相邻胶囊左间距 4px；',
    '空值占位：列表「—」灰色；详情表格「—」灰化或「--」加宽字距；',
    '抽屉宽 560px（最大 94vw），右侧滑入动画 0.28s，遮罩 rgba(0,0,0,0.35)；',
    '表格冻结列投影区分层级，横向滚动时表头与冻结列同步。',
  ] },
  { t: 'h2', x: '7.3　反馈与边界' },
  { t: 'ul', items: [
    '搜索无结果：整行空态提示（见 4.4.2），不弹错误框；',
    '数据加载失败（数据常量缺失）：显示「⚠ 指标标准库数据加载失败」兜底文案；',
    '单元格超长：自动换行并以 title 属性悬浮显示全文；',
    'Esc 键同时收起详情抽屉与高级搜索面板。',
  ] },

  { t: 'h1', x: '8　技术与实现说明（面向开发）' },
  { t: 'h2', x: '8.1　架构形态' },
  { t: 'ul', items: [
    '当前为单文件纯前端页面：指标查询.html，样式/数据/脚本内联，浏览器直接打开即可运行，无构建与后端依赖；',
    '数据：常量 INDICATOR_STANDARD（meta.fields 定义 58 字段的 key/label/group，驱动详情三页签渲染；items 为 ' + N + ' 条指标记录）；',
    '详情字段增删与排序仅需改 meta.fields，列表列需在 renderStdResult 中同步调整。',
  ] },
  { t: 'h2', x: '8.2　关键逻辑入口' },
  { t: 'table', cols: ['逻辑', '函数/常量', '说明'], widths: [26, 26, 48], rows: [
    ['条件草稿与应用快照', 'stdState / stdApplied / stdSnapshot()', '输入过程只改草稿，点搜索生成快照后列表才过滤'],
    ['过滤主函数', 'stdFiltered()', 'AND 组合各条件；多选内部 OR；主题树换算为指标 no 集合'],
    ['列表渲染', 'renderStdResult() + renderStdPager()', '分页切片、冻结列、胶囊/高亮/占位渲染'],
    ['详情渲染', 'openStdDetail(no)', '按 meta.fields 分组生成三页签；assess/securityLevel 特判；th-help 注入 ? 注释'],
    ['? 注释浮层', 'showThTip() / hideThTip()', 'fixed 挂 body，上/下自动翻转 + 左右贴边避让，滚动隐藏'],
    ['枚举与映射', 'STD_ENUM / STD_ASSESS_MAP / STD_BIZ_CALIBER', '查询枚举、属性标签映射、口径联动（见第 6 章）'],
    ['空值判定', 'stdIsEmpty()', '统一处理 空串/-/—/暂无/无/不涉及/待××补充'],
    ['状态渲染', 'stdStatusHtml() / stdSecHtml()', '状态圆点 / 安全级别色块，列表与详情共用'],
  ] },
  { t: 'h2', x: '8.3　演进方向（建议）' },
  { t: 'ul', items: [
    '数据接口化：INDICATOR_STANDARD 切换为服务端接口（建议 GET /api/indicator/standard 分页 + 筛选下推），字段字典 meta 同步接口下发；',
    '权限：按业务单元与角色控制可见指标、隐藏责任人联系方式类字段；',
    '数据补全：技术属性大量「待金控补充/待信托补充」占位，需数据治理侧回填后自动转正式值；',
    '导出：列表按当前筛选条件导出 Excel（与指标管理模块的导出能力对齐）。',
  ] },

  { t: 'h1', x: '9　非功能需求' },
  { t: 'table', cols: ['类别', '要求'], widths: [22, 78], rows: [
    ['性能', N + ' 条数据下打开 < 1s；搜索/翻页本地完成，响应 < 100ms；接口化后列表查询 P95 < 1s'],
    ['兼容', 'Chrome / Edge 近两年版本；1366px 宽度下表格横向滚动可用；Windows 为主'],
    ['易用性', '所有下拉支持外部点击收起；冻结列保证编号与名称始终可见；关键字高亮辅助定位'],
    ['数据一致性', '占位值一律按空处理，不得出现在有效枚举中；列表与详情的标签/状态/安全级别渲染共用同一函数保证样式一致'],
    ['可维护性', '字段字典（meta.fields）与显示文案集中管理；枚举映射表化，新增枚举不改渲染代码'],
  ] },

  { t: 'h1', x: '10　验收标准（测试要点）' },
  { t: 'ol', items: [
    '首屏：三统计卡数值=全量统计（' + N + '/战略/风险）；列表默认第 1 页 10 条、计数「共 ' + N + ' 条指标」；',
    '关键字输入 "aum" 与 "AUM" 命中集合一致，且名称/编号/定义命中处黄色高亮；输入过程列表不变，回车/点搜索后生效；',
    '互斥：先输关键字再在面板输名称，应用后关键字框自动清空，结果按面板条件过滤；',
    '联动：未选业务单元时口径禁用；选「华润信托」后口径选项=映射表四选项；改选业务单元后已选口径被清空；',
    '属性标签筛选：勾「考核指标」命中「仅考核指标+两者都是」共 ' + ITEMS.filter(i => i.assess === '仅考核指标' || i.assess === '两者都是').length + ' 条；同时勾「高质量指标」命中并集；',
    '主题树：勾选任一主题根节点 → 其全部后代指标入选；父节点显示半选态；',
    '组合：业务单元+频次+关键字 三条件同时应用，结果=三条件交集；结果 0 条时空态文案正确；',
    '列表样式：指标类型无背景黑体；属性标签/安全级别为胶囊且颜色映射正确；责任人显示「余甜,唐颖」逗号分隔；状态列全部绿色「已发布」；',
    '冻结：横向滚动时前 4 列与操作列不动；',
    '分页：切 100 条/页后共 ' + Math.ceil(N / 100) + ' 页；重新搜索后回到第 1 页；',
    '详情：头部徽标顺序= 主题→业务单元→口径→更新频次；业务属性页签中「指标属性标签」位于「是否监管指标」之前；安全级别带彩色胶囊；',
    '? 注释：编号/口径/数据范围三处橙色问号；悬停显示完整气泡——「数据范围」长文案在抽屉任意位置（含首行、底部）不被裁剪，上下自动翻转；滚抽屉气泡消失；',
    '关闭：✕ / 遮罩 / Esc 三方式均可关闭且页面恢复滚动；',
    '空值：任一「待金控补充/不涉及/暂无」字段在列表与详情均显示「—」（属性标签在详情显示「--」）。',
  ] },

  { t: 'h1', x: '附录 A　近期变更记录（2026-10 实施明细）' },
  { t: 'table', cols: ['#', '变更项', '实施结果'], widths: [6, 34, 60], rows: [
    ['1', '详情字段顺序', '「指标属性标签」移至「是否监管指标」之前（meta.fields 顺序调整）'],
    ['2', '详情头部徽标顺序', '业务单元移至指标口径之前'],
    ['3', '指标状态', '166 条全部置「已发布」（列表圆点与详情状态同步变绿）'],
    ['4', '两值字段分隔符', '指标责任人「余甜/唐颖」→「余甜,唐颖」；来源系统「IMP系统/润报」→「IMP系统,润报」等（公式、三级分类等语义斜杠保留）'],
    ['5', '详情 ? 注释', '指标标准编号/指标口径/数据范围 三字段加橙色问号 + 悬浮气泡；后升级为 fixed 浮层防裁剪'],
    ['6', '胶囊化', '指标属性标签、安全级别统一 11px 胶囊（列表+详情），色不变'],
    ['7', '详情安全级别', '由纯文本升级为与列表一致的等级色胶囊（抽出 stdSecHtml 共用）'],
    ['8', '指标类型列', '取消彩色胶囊底，改黑体纯文本'],
    ['9', '管理属性赋值', '是否共享=是；创建人/更新人=杨洁飞；创建日期=2026-09-01；更新/发布日期=2026-09-16；停用日期、停用原因保留占位「--」'],
  ] },
];

/* ==================== 渲染 1：HTML ==================== */
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
let h2n = 0, h1n = 0;
const toc = [];
let bodyHtml = '';
doc.forEach((b, i) => {
  if (b.t === 'h1') {
    h1n++; h2n = 0;
    const id = 'sec' + h1n;
    toc.push({ id, x: b.x, lvl: 1 });
    bodyHtml += `<h1 id="${id}">${esc(b.x)}</h1>`;
  } else if (b.t === 'h2') {
    h2n++;
    const id = 'sec' + h1n + '-' + h2n;
    toc.push({ id, x: b.x, lvl: 2 });
    bodyHtml += `<h2 id="${id}">${esc(b.x)}</h2>`;
  } else if (b.t === 'h3') {
    bodyHtml += `<h3>${esc(b.x)}</h3>`;
  } else if (b.t === 'p') {
    bodyHtml += `<p>${esc(b.x)}</p>`;
  } else if (b.t === 'ul') {
    bodyHtml += '<ul>' + b.items.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>';
  } else if (b.t === 'ol') {
    bodyHtml += '<ol>' + b.items.map(x => `<li>${esc(x)}</li>`).join('') + '</ol>';
  } else if (b.t === 'table') {
    const colg = b.widths.map(w => `<col style="width:${w}%">`).join('');
    bodyHtml += `<table><colgroup>${colg}</colgroup><thead><tr>${b.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>` +
      b.rows.map(r => '<tr>' + r.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
  }
});
const htmlDoc = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>指标查询模块 需求文档 V1.2</title>
<style>
:root{--org:#f5a623;--deep:#b57207;--ink:#2b3440;--line:#e3d9c6;}
*{box-sizing:border-box;}
body{margin:0;font-family:"Microsoft YaHei","PingFang SC",sans-serif;color:var(--ink);background:#f6f4ef;font-size:14px;line-height:1.85;}
.page{max-width:1080px;margin:24px auto 60px;background:#fff;box-shadow:0 2px 18px rgba(90,70,20,.10);border-radius:10px;overflow:hidden;}
.cover{background:linear-gradient(135deg,#d48a10,#f5a623 60%,#f7b84e);color:#fff;padding:44px 56px 36px;}
.cover h1{margin:0;font-size:30px;letter-spacing:2px;}
.cover .sub{margin-top:10px;font-size:15px;opacity:.92;}
.cover .meta{margin-top:22px;display:flex;gap:34px;flex-wrap:wrap;font-size:13px;opacity:.95;}
.cover .meta b{display:block;font-size:12px;opacity:.75;font-weight:400;margin-bottom:2px;}
.main{display:flex;align-items:flex-start;}
nav{width:250px;flex-shrink:0;position:sticky;top:0;max-height:100vh;overflow:auto;padding:26px 8px 40px 26px;font-size:12.5px;}
nav a{display:block;color:#6b7280;text-decoration:none;padding:3px 8px;border-radius:5px;border-left:2px solid transparent;}
nav a.l2{padding-left:22px;color:#8a919c;}
nav a:hover{background:#fdf3e0;color:var(--deep);}
article{flex:1;min-width:0;padding:30px 52px 60px;}
h1{font-size:21px;margin:44px 0 14px;padding:8px 14px;background:#fdf6e8;border-left:5px solid var(--org);border-radius:0 6px 6px 0;color:#7a5207;}
h1:first-child{margin-top:4px;}
h2{font-size:16.5px;margin:28px 0 10px;color:#333;padding-bottom:6px;border-bottom:1px dashed var(--org);}
h3{font-size:14.5px;margin:18px 0 8px;color:#555;}
p{margin:8px 0;}
ul,ol{margin:8px 0;padding-left:26px;}
li{margin:4px 0;}
table{border-collapse:collapse;width:100%;margin:12px 0 18px;font-size:12.8px;}
th,td{border:1px solid var(--line);padding:6px 10px;vertical-align:top;text-align:left;}
th{background:#faf1de;color:#7a5207;font-weight:600;white-space:nowrap;}
tbody tr:nth-child(even) td{background:#fdfcf8;}
td:first-child{color:#5d4a1f;}
code{background:#f3efe6;border-radius:3px;padding:1px 5px;font-family:Consolas,monospace;font-size:12px;color:#a05a00;}
footer{padding:16px 52px 30px;color:#9aa3af;font-size:12px;border-top:1px solid #eee;margin-top:20px;}
@media(max-width:900px){nav{display:none;}article{padding:20px 22px;}}
@media print{nav{display:none;}body{background:#fff;}.page{box-shadow:none;margin:0;}}
</style>
</head>
<body>
<div class="page">
  <div class="cover">
    <h1>指标查询模块 · 需求文档</h1>
    <div class="sub">通用报送管理系统 — 指标标准库查询（业务 / 开发通用版）</div>
    <div class="meta">
      <span><b>文档版本</b>V1.2</span>
      <span><b>发布日期</b>2026-10-12</span>
      <span><b>数据来源</b>${esc(META.sourceFile)}（${N} 条）</span>
      <span><b>实现载体</b>指标查询.html（单文件前端）</span>
      <span><b>编写</b>华润金控数据应用组</span>
    </div>
  </div>
  <div class="main">
    <nav>${toc.map(x => `<a class="l${x.lvl}" href="#${x.id}">${esc(x.x)}</a>`).join('')}</nav>
    <article>${bodyHtml}</article>
  </div>
  <footer>本文档由页面实现反向整理生成，与 指标查询.html V1.2（2026-10-12）实际行为一致；如与代码冲突以代码为准并请同步更新本文档。</footer>
</div>
</body>
</html>`;
fs.writeFileSync(path.join(ROOT, '指标查询模块-需求文档.html'), htmlDoc, 'utf8');

/* ==================== 渲染 2：DOCX ==================== */
const FONT = { ascii: 'Microsoft YaHei', hAnsi: 'Microsoft YaHei', eastAsia: 'Microsoft YaHei' };
const SZ = { h1: 30, h2: 24, h3: 21, body: 21, cell: 18 };
function run(text, o = {}) {
  return new TextRun(Object.assign({ text, font: FONT, size: o.size || SZ.body, bold: !!o.bold, color: o.color || '333333' }, o.extra || {}));
}
function para(text, o = {}) {
  return new Paragraph({
    children: [run(text, o)],
    spacing: { before: o.before != null ? o.before : 60, after: o.after != null ? o.after : 60, line: 300 },
    indent: o.indent, numbering: o.numbering,
  });
}
function cell(text, o = {}) {
  return new TableCell({
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [run(String(text), { size: SZ.cell, bold: o.bold, color: o.color })], spacing: { line: 260, before: 0, after: 0 } })],
  });
}
function tbl(block) {
  const rows = [new TableRow({ tableHeader: true, children: block.cols.map(c => cell(c, { fill: 'FAF1DE', bold: true, color: '7A5207' })) })]
    .concat(block.rows.map((r, i) => new TableRow({ children: r.map(c => cell(c, { fill: i % 2 ? 'FDFCF8' : 'FFFFFF' })) })));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows,
    columnWidths: block.widths.map(w => Math.round(w * 100)), });
}
const children = [];
/* 封面 */
children.push(new Paragraph({ children: [run('指标查询模块 · 需求文档', { size: 44, bold: true, color: '7A5207' })], alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 200 } }));
children.push(new Paragraph({ children: [run('通用报送管理系统 — 指标标准库查询（业务 / 开发通用版）', { size: 22, color: '8a6b2f' })], alignment: AlignmentType.CENTER, spacing: { after: 700 } }));
[['文档版本', 'V1.2'], ['发布日期', '2026-10-12'], ['数据来源', META.sourceFile + '（' + N + ' 条指标）'], ['实现载体', '指标查询.html（单文件前端，无后端依赖）'], ['编写', '华润金控数据应用组']].forEach(([k, v]) =>
  children.push(new Paragraph({ children: [run(k + '：', { bold: true, size: 21, color: '7A5207' }), run(v, { size: 21, color: '555555' })], alignment: AlignmentType.CENTER, spacing: { before: 50, after: 50 } })));
children.push(new Paragraph({ children: [], pageBreakBefore: false, spacing: { after: 200 } }));
const brk = new Paragraph({ children: [run('')], pageBreakBefore: false });
children.push(new Paragraph({ text: '', pageBreakBefore: true }));
/* 正文 */
doc.forEach(b => {
  if (b.t === 'h1') children.push(new Paragraph({ children: [run(b.x, { size: SZ.h1, bold: true, color: '7A5207' })], heading: HeadingLevel.HEADING_1, spacing: { before: 340, after: 140 } }));
  else if (b.t === 'h2') children.push(new Paragraph({ children: [run(b.x, { size: SZ.h2, bold: true, color: 'B57207' })], heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 } }));
  else if (b.t === 'h3') children.push(new Paragraph({ children: [run(b.x, { size: SZ.h3, bold: true, color: '555555' })], heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 80 } }));
  else if (b.t === 'p') children.push(para(b.x, { after: 100 }));
  else if (b.t === 'ul') b.items.forEach(x => children.push(new Paragraph({ children: [run('•　', { color: 'B57207' }), run(x)], indent: { left: 360 }, spacing: { before: 30, after: 30, line: 300 } })));
  else if (b.t === 'ol') b.items.forEach((x, i) => children.push(new Paragraph({ children: [run((i + 1) + '．　', { color: 'B57207', bold: true }), run(x)], indent: { left: 360 }, spacing: { before: 30, after: 30, line: 300 } })));
  else if (b.t === 'table') { children.push(tbl(b)); children.push(new Paragraph({ children: [run('')], spacing: { before: 0, after: 60 } })); }
});

const document = new Document({
  creator: '华润金控数据应用组',
  title: '指标查询模块需求文档 V1.2',
  styles: { default: { document: { run: { font: FONT, size: SZ.body }, paragraph: { spacing: { line: 300 } } } } },
  sections: [{
    properties: { page: { margin: { top: 1100, bottom: 1100, left: 1150, right: 1150 } } },
    children,
  }],
});
Packer.toBuffer(document).then(buf => {
  const out = path.join(ROOT, '指标查询模块-需求文档.docx');
  fs.writeFileSync(out, buf);
  console.log('DOCX written:', out, buf.length, 'bytes');
});
console.log('HTML written: 指标查询模块-需求文档.html', htmlDoc.length, 'chars');
