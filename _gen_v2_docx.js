/* 预算填报V2模块需求文档 DOCX 生成器：内容与 预算填报V2模块-需求文档.html 一致，样式参考 指标查询模块-需求文档.docx */
const fs = require('fs');
const path = require('path');
(async()=>{const DOCX = await import('file:///C:/Users/lwqfo/AppData/Local/Temp/docxgen2/node_modules/docx/build/index.mjs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, ShadingType } = DOCX;

const ROOT = 'D:/LIAOXIA/work-2026/AI-test/huarun-data-application-legder';

/* ---------- 文档内容（与 HTML 版逐节对齐） ---------- */
const doc = [
  { t: 'h1', x: '一、引言' },
  { t: 'h2', x: '1　需求背景' },
  { t: 'p', x: '业务单元（华润银行、华润资产、华润信托、华润保险、华润租赁）的年度预算指标，目前分散在线下 Excel 中填报，口径不统一、汇总慢、难以追溯。需要在数据应用平台中提供一张线上预算值填报表：指标清单由系统从指标标准库自动加载，支持业务人员在线填写、暂存草稿、提交上报，并提供标准化的模板导入/导出能力，实现"指标统一、填报便捷、数据可查"。' },

  { t: 'h2', x: '2　术语与定义' },
  { t: 'table', cols: ['术语', '说明'], widths: [24, 76], rows: [
    ['预算指标', '指标标准库中【是否有全年预算】= 是的指标；只有这类指标需要填报全年预算值。'],
    ['预算年度', '本次填报的目标年度，如 2027 年。下拉可选项为 2025 年 ～ 当前自然年+1，倒序展示（最新年度在最前）。'],
    ['全年预算值', '该指标在所选预算年度的全年计划数，单位跟随指标本身（亿元、%、户等）。'],
    ['最新实际值', '系统自动带出的该指标最近一期实际数。'],
    ['指标标准编号', '指标的唯一编号。'],
  ] },

  { t: 'h2', x: '3　需求范围' },
  { t: 'p', x: '本期范围：预算填报V2页面的填报表展示、编辑/暂存/提交、模板下载、导入校验（表头一致性 + 指标存在性 + 数值格式 + 必填）、错误附件下载、导出。指标本身的维护（含「是否有全年预算」字段变更）由「指标查询/指标管理」模块承载；V1 版本的填报记录列表为独立功能，本文档不涉及。' },

  { t: 'h1', x: '二、功能需求' },
  { t: 'h2', x: '1　系统原型示意' },
  { t: 'p', x: '入口：顶部菜单「预算填报 → 预算填报V2版本」（打开预算填报页面默认即显示 V2 版本）。原型地址：https://ex-liaox003.github.io/huarun-jincontro-data-application-legder/预算填报.html' },

  { t: 'h2', x: '2　页面布局' },
  { t: 'table', cols: ['区域（自上而下）', '内容'], widths: [22, 78], rows: [
    ['① 面板头', '标题「指标预算值填报表 · {业务单元}」；右侧操作按钮组：编辑（或编辑态的 取消/暂存）、提交（主按钮）、导入、导出'],
    ['② 查询工具条', '业务单元、指标主题、预算年度（编辑态置灰锁定）；右侧模式提示「编辑中（可填写全年预算值）」'],
    ['③ 填报列表', '7 列表格，最后一列为必填填报列（表头红色 * 标识）'],
    ['④ 填报说明', '淡橙底说明卡：填报职责、必填列说明、指标缺失处理指引'],
    ['⑤ 导入弹框（浮层）', '两步式：下载本页模板 → 上传填写好的模板 + 校验结果横幅'],
  ] },

  { t: 'h2', x: '3　查询条件' },
  { t: 'table', cols: ['查询条件', '字典值', '取值说明'], widths: [16, 26, 58], rows: [
    ['业务单元', '华润银行、华润资产、华润信托、华润保险、华润租赁', '默认选中当前业务人员有权限的业务单元：\n华润银行：蔡舒婧；华润资产：杨洁飞；\n华润租赁：邓紫峰；华润信托：郑展翔；华润保险：滕琨玉；\n所有权限：林万里、方宏玲（默认选中「华润银行」）。'],
    ['指标主题', '战略、风险', '下拉选择，默认「战略」；当前为查询条件项，暂不参与列表过滤。'],
    ['预算年度', '2025 年 ～ 当前自然年+1', '枚举区间内全部年度，倒序展示（最新年度在最前）；如当前为 2026 年，则选项为 2027、2026、2025；默认选中最新年度。'],
  ] },

  { t: 'h2', x: '4　列表清单自动加载' },
  { t: 'p', x: '选择「业务单元」后，系统从该单元的指标标准库中自动加载全部预算指标，无需人工维护清单。表格共 7 列：' },
  { t: 'table', cols: ['列名', '必填', '来源与规则'], widths: [22, 12, 66], rows: [
    ['指标标准编号', '自动', '单元前缀 + 顺序号，如 STR_CRB_00000001。只读。'],
    ['指标名称', '自动', '指标标准库名称；'],
    ['指标单位', '自动', '取指标标准库单位列。只读。'],
    ['{X-1} 年预算值', '自动', '上一年预算值。当前指标标准库无历史预算数据时显示 -- 占位。'],
    ['最新实际值', '自动', '系统加载该指标最近一期实际数；无数据显示 --。'],
    ['最新实际值日期', '自动', '固定为上一自然月月末，格式 YYYY-MM-DD。'],
    ['*{X} 年预算值', '必填', '唯一人工填写列。输入框，仅允许数值（数字 + 单个小数点），粘贴非数值字符自动过滤。'],
  ] },
  { t: 'p', x: '清单为空时（该单元暂无预算指标），表格区提示：「未查询到匹配的数据，请先在指标标准库中去维护"是否有全年预算"值」。' },

  { t: 'h2', x: '5　编辑与暂存' },
  { t: 'ul', items: [
    '默认仅查看：预算值输入框只读，点「编辑」后方可填写；',
    '编辑态按钮切换为「取消 / 暂存」：暂存保留已填内容并退出编辑，可再次编辑续填；取消则丢弃本次未保存修改，恢复进入编辑前的内容；',
    '输入过滤：预算值仅允许数字与一个小数点，非法字符即时剔除；',
    '已填写输入框呈绿色描边以示区分。',
  ] },

  { t: 'h2', x: '6　提交校验' },
  { t: 'ul', items: [
    '点「提交」校验全部指标行的「*X年预算值」必填：存在缺项时提交失败，toast 提示缺项数，自动进入编辑态并红框标出全部未填单元格（输入即消红）；',
    '全部填写后提交成功，toast 提示已上报（原型为前端会话演示，实际环境对接提交接口）。',
  ] },

  { t: 'h2', x: '7　导入模板' },
  { t: 'p', x: '点「导入」弹出两步式弹框（标题带当前「业务单元 · 年度」）：' },
  { t: 'table', cols: ['步骤', '说明'], widths: [20, 80], rows: [
    ['① 下载本页模板', '一键生成与当前页面 7 列表头完全一致的 xlsx，并预填全部指标行（编号/名称/单位/最新实际值/日期），用户仅需填写最后一列「*X年预算值」；模板样式与页面一致：橙色表头（最后一列表头星号为红色）、数据行统一白底、数值列右对齐'],
    ['② 上传并校验', '支持点击选择或拖拽（.xlsx / .xls / .csv），点「导入并校验」执行校验，通过后填充草稿并进入编辑态供核对'],
  ] },
  { t: 'p', x: '校验规则（任一不通过则整体不导入）：' },
  { t: 'table', cols: ['校验项', '规则', '提示语与案例'], widths: [14, 34, 52], rows: [
    ['表头一致性', '与当前「业务单元 · 年度」页面表头逐列严格比对：列数须相同、每列同名（忽略 * 与空格差异）；末尾空白列与「错误说明」回执列不计入比对；文件中完全定位不到表头行时，视为表头不一致，给出同一提示', '导入失败　导入模板表头与当前「{业务单元} · {X} 年」页面表头不一致，应依次为「指标标准编号」「指标名称」「指标单位」「{X-1}年预算值」「最新实际值」「最新实际值日期」「*{X}年预算值」。请下载最新模板填写后重新上传\n案例：页面为华润银行 · 2027 年，上传了含「业务单元」列的旧 8 列模板 → 红色横幅提示：「导入模板表头与当前『华润银行 · 2027 年』页面表头不一致，应依次为『指标标准编号』…『*2027年预算值』。请下载最新模板填写后重新上传」'],
    ['指标存在性', '「指标标准编号 + 指标名称」一组须同时存在于当前页面指标清单（按行逐条校验）', '错误附件「错误说明」列记入：指标编号与名称组合（{编号} / {名称}）在当前页面不存在\n案例：模板中填写「STR_FAKE_00000099 / 不良贷款率」，但该组合不在华润银行清单 → 错误附件该行说明：「指标编号与名称组合（STR_FAKE_00000099 / 不良贷款率）在当前页面不存在」'],
    ['数值格式', '「*X年预算值」非空时仅允许数值（支持千分位逗号）', '错误附件「错误说明」列记入：预算值须为数值，当前填写「{填写内容}」\n案例：最后一列填了「abc」或「12.3.4」→ 说明：「预算值须为数值，当前填写『abc』」'],
    ['必填', '指标匹配成功但「*X年预算值」为空', '错误附件「错误说明」列记入：*{X}年预算值为必填\n案例：某指标行编号名称正确但最后一列未填 → 说明：「*2027年预算值为必填」'],
    ['空文件', '表头以下未解析到任何有效数据行（全空行）', '导入失败　未解析到有效数据行，请重新下载模板后再上传\n案例：下载模板后未填任何一行直接上传 → 提示：「未解析到有效数据行，请重新下载模板后再上传」'],
  ] },
  { t: 'p', x: '失败汇总提示：存在任一未通过行时整体不导入，弹框内提示：「导入失败　{N} 行未通过校验，请点『下载错误附件』，按最后一列说明修正后重新上传」；同一行命中多个错误时，「错误说明」列内换行逐条显示。' },
  { t: 'p', x: '错误附件：文件为原模板内容 + 最后一列「错误说明」；按说明修正后可直接重新上传（错误说明列不参与表头比对）。' },
  { t: 'p', x: '导入成功：全部行通过校验后，弹框自动关闭，模板中已填写的「*X年预算值」按「指标标准编号 + 指标名称」匹配填充到当前页面表格（仅覆盖模板中非空的填报值，未填写的行保持页面原值），并自动进入编辑态供逐行核对；页面顶部 toast 提示成功文案：' },
  { t: 'ul', items: [
    '提示语：「导入成功：已填充 {N} 项 {X}年预算值（草稿），请核对后「提交」」，其中 {N} 为模板中实际填有预算值的匹配行数；案例：华润银行 2027 年模板 14 行中填写了 10 行预算值，全部通过校验 → 页面 10 行填入对应值并显示绿色描边，toast：「导入成功：已填充 10 项 2027年预算值（草稿），请核对后「提交」」',
    '导入填充的结果为草稿状态：数据留在页面输入框中，可继续编辑修改，须再点「提交」并通过必填校验后才算正式上报；点「暂存」可保留导入结果并退出编辑。',
  ] },

  { t: 'h2', x: '8　导出' },
  { t: 'ul', items: [
    '点「导出」先收拢页面已填内容，真实生成 Excel：文件名「指标预算值填报表_{业务单元}_{X}年.xlsx」；',
    '文件与本页列表/下载模板同构（7 列 + 已填值），所见即所得；导出文件修改后可直接用于导入。',
  ] },

  { t: 'h1', x: '三、权限说明' },
  { t: 'h2', x: '1　菜单权限' },
  { t: 'p', x: '华润金融全体人员默认拥有本页面菜单查看权限。' },
  { t: 'h2', x: '2　数据权限' },
  { t: 'p', x: '华润金融全体人员默认可查看各业务单元填报表；预算值编辑与提交建议在实际环境中按「业务单元负责人」角色授权控制。' },
];

/* ---------- DOCX 渲染（样式与 指标查询模块-需求文档.docx 一致） ---------- */
const FONT = { ascii: 'Microsoft YaHei', hAnsi: 'Microsoft YaHei', eastAsia: 'Microsoft YaHei' };
const SZ = { h1: 30, h2: 24, body: 21, cell: 18 };
function run(text, o = {}) {
  return new TextRun(Object.assign({ text, font: FONT, size: o.size || SZ.body, bold: !!o.bold, color: '000000' }, o.extra || {}));
}
function para(text, o = {}) {
  return new Paragraph({
    children: [run(text, o)],
    spacing: { before: o.before != null ? o.before : 60, after: o.after != null ? o.after : 60, line: 300 },
  });
}
/* 单元格：支持 \n 换行拆多段落 */
function cell(text, o = {}) {
  const parts = String(text).split('\n');
  return new TableCell({
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: parts.map(p => new Paragraph({
      children: [run(p, { size: SZ.cell, bold: o.bold, color: o.color })],
      spacing: { line: 260, before: 0, after: 0 },
    })),
  });
}
function tbl(block) {
  const rows = [new TableRow({ tableHeader: true, children: block.cols.map(c => cell(c, { fill: 'FAF1DE', bold: true, color: '000000' })) })]
    .concat(block.rows.map((r, i) => new TableRow({ children: r.map(c => cell(c, { fill: i % 2 ? 'FDFCF8' : 'FFFFFF' })) })));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows,
    columnWidths: block.widths.map(w => Math.round(w * 100)) });
}
const children = [];
/* 封面 */
children.push(new Paragraph({ children: [run('预算填报V2模块 · 需求文档', { size: 44, bold: true, color: '000000' })], alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 200 } }));
children.push(new Paragraph({ children: [run('通用报送管理系统 — 指标预算值填报表（V2 版本）', { size: 22, color: '000000' })], alignment: AlignmentType.CENTER, spacing: { after: 700 } }));
[['文档版本', 'V1.0（预算填报V2初始版本）'], ['发布日期', '2026-11-05'], ['数据来源', '指标标准库（是否有全年预算=是 的指标）'], ['实现载体', '预算填报.html · 预算填报V2版本（单文件前端，无后端依赖）'], ['编写', '华润金控数据应用组']].forEach(([k, v]) =>
  children.push(new Paragraph({ children: [run(k + '：', { bold: true, size: 21, color: '000000' }), run(v, { size: 21, color: '000000' })], alignment: AlignmentType.CENTER, spacing: { before: 50, after: 50 } })));
children.push(new Paragraph({ text: '', pageBreakBefore: true }));
/* 正文 */
doc.forEach(b => {
  if (b.t === 'h1') children.push(new Paragraph({ children: [run(b.x, { size: SZ.h1, bold: true, color: '000000' })], heading: HeadingLevel.HEADING_1, spacing: { before: 340, after: 140 } }));
  else if (b.t === 'h2') children.push(new Paragraph({ children: [run(b.x, { size: SZ.h2, bold: true, color: '000000' })], heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 } }));
  else if (b.t === 'p') children.push(para(b.x, { after: 100 }));
  else if (b.t === 'ul') b.items.forEach(x => children.push(new Paragraph({ children: [run('•　', { color: '000000' }), run(x)], indent: { left: 360 }, spacing: { before: 30, after: 30, line: 300 } })));
  else if (b.t === 'table') { children.push(tbl(b)); children.push(new Paragraph({ children: [run('')], spacing: { before: 0, after: 60 } })); }
});

const document = new Document({
  creator: '华润金控数据应用组',
  title: '预算填报V2模块需求文档 V1.0',
  styles: { default: { document: { run: { font: FONT, size: SZ.body }, paragraph: { spacing: { line: 300 } } } } },
  sections: [{
    properties: { page: { margin: { top: 1100, bottom: 1100, left: 1150, right: 1150 } } },
    children,
  }],
});
Packer.toBuffer(document).then(buf => {
  const out = path.join(ROOT, '预算填报V2模块-需求文档.docx');
  fs.writeFileSync(out, buf);
  console.log('DOCX written:', out, buf.length, 'bytes');
}).catch(e => { console.error('FAIL', e); process.exit(1); });
})();
