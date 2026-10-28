/* 指标查询模块需求文档 DOCX 生成器（模板复用版）
   样式与《华润银行-数据应用需求文档.docx》完全一致：
   以参考 docx 包（styles/numbering/header/footer/theme/settings）为模板，
   正文由 指标查询模块-需求文档.html 解析生成，输出同名 docx。
   运行：node gen-query-docx-from-ref.js  */
const fs = require('fs');
const path = require('path');
const JSZip = require('D:/Users/ex-liaox003/AppData/Local/Temp/docxgen/node_modules/jszip');

const ROOT = __dirname;
const REF_DIR = path.join(ROOT, '_refdocx');           // 参考文档解包目录
const html = fs.readFileSync(path.join(ROOT, '指标查询模块-需求文档.html'), 'utf8');

/* ---------- XML 工具 ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');

/* 行内片段 → runs（宋体 24 半磅=12pt 正文样式；支持 <b>、<a>）
   links: 外部链接注册表（数组，push {url} 返回序号） */
function runs(text, links, extra) {
  extra = extra || {};
  const font = '<w:rFonts w:ascii="宋体" w:hAnsi="宋体" w:eastAsia="宋体" w:cs="宋体"/>';
  const rpr = inner => `<w:rPr>${font}${extra.bold ? '<w:b/><w:bCs/>' : ''}${inner || ''}<w:sz w:val="${extra.sz || 24}"/><w:szCs w:val="${extra.sz || 24}"/></w:rPr>`;
  let xml = '', last = 0, m;
  const re = /<b>([\s\S]*?)<\/b>|<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const push = t => { if (t) xml += `<w:r>${rpr()}<w:t xml:space="preserve">${esc(t)}</w:t></w:r>`; };
  while ((m = re.exec(text))) {
    push(unesc(text.slice(last, m.index)));
    if (m[1] != null) xml += `<w:r>${rpr()}<w:t xml:space="preserve">${esc(unesc(m[1]))}</w:t></w:r>`;
    else {
      const id = links.push(m[2]) + 29;   /* rId 从 rId30 起 */
      xml += `<w:hyperlink r:id="rId${id}" w:history="1"><w:r><w:rPr><w:rStyle w:val="18"/>${font}<w:sz w:val="${extra.sz || 24}"/></w:rPr><w:t xml:space="preserve">${esc(unesc(m[3]))}</w:t></w:r></w:hyperlink>`;
    }
    last = m.index + m[0].length;
  }
  push(unesc(text.slice(last)));
  return xml || `<w:r>${rpr()}<w:t/></w:r>`;
}

/* ---------- 块级构造（均对齐参考文档实际 XML 形态） ---------- */
/* 封面标题行：pStyle 13 + 黑体加粗居中 */
function coverPara(text, sz) {
  return `<w:p><w:pPr><w:pStyle w:val="13"/><w:spacing w:before="0" w:after="0" w:line="23" w:lineRule="atLeast"/><w:ind w:left="0" w:right="0"/><w:jc w:val="center"/><w:rPr><w:rFonts w:hint="eastAsia" w:ascii="黑体" w:hAnsi="宋体" w:eastAsia="黑体" w:cs="黑体"/><w:b/><w:bCs/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:hint="eastAsia" w:ascii="黑体" w:hAnsi="宋体" w:eastAsia="黑体" w:cs="黑体"/><w:b/><w:bCs/><w:color w:val="000000"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/><w:shd w:val="clear" w:fill="FFFFFF"/></w:rPr><w:t>${esc(text)}</w:t></w:r></w:p>`;
}
/* 章标题 一、二、三 → pStyle 3（heading 2 黑体 28）；节标题 1、2、3 → pStyle 4（heading 3 黑体 26） */
function heading(text, level) {
  return `<w:p><w:pPr><w:pStyle w:val="${level}"/><w:spacing w:before="0" w:after="0" w:line="23" w:lineRule="atLeast"/><w:ind w:left="0" w:right="0"/></w:pPr><w:r><w:t>${esc(text)}</w:t></w:r></w:p>`;
}
/* 正文段：宋体 24，首行缩进 420（参考正文段同款） */
function para(innerHtml, links) {
  return `<w:p><w:pPr><w:widowControl/><w:ind w:left="0" w:firstLine="420"/><w:jc w:val="left"/></w:pPr>${runs(innerHtml, links)}</w:p>`;
}
/* 列表项：参考同款 numPr numId=1（项目符号），宋体 24 */
function bullet(innerHtml, links) {
  return `<w:p><w:pPr><w:widowControl/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:before="45" w:after="45" w:line="23" w:lineRule="atLeast"/><w:jc w:val="left"/></w:pPr>${runs(innerHtml, links)}</w:p>`;
}
/* 表格：固定布局 + 全边框 auto sz4 + 表头 E8ECF1 灰底加粗（参考同款），单元文字 宋体 20 */
function table(t, links) {
  const cols = (t.match(/<col style="width:(\d+)%"/g) || []).map(s => parseInt(s.match(/(\d+)%/)[1], 10));
  const usable = 9026;                                        /* 参考页宽 - 边距 */
  const grid = (cols.length ? cols : [100]).map(p => `<w:gridCol w:w="${Math.round(p / cols.reduce((a, b) => a + b, 0) * usable)}"/>`).join('');
  const bd = c => `<w:${c} w:val="single" w:color="auto" w:sz="4" w:space="0"/>`;
  const bdrs = `<w:tblBorders>${bd('top')}${bd('left')}${bd('bottom')}${bd('right')}${bd('insideH')}${bd('insideV')}</w:tblBorders>`;
  const trs = (t.match(/<tr>[\s\S]*?<\/tr>/g) || []).map(trHtml => {
    const isHead = /<th/.test(trHtml);
    const tcs = (trHtml.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/g) || []).map((td, ci) => {
      const segs = unesc(td.replace(/^<t[hd][^>]*>/, '').replace(/<\/t[hd]>$/, '')).split(/<br\s*\/?>/);
      const paras = segs.map(seg => `<w:p><w:pPr><w:spacing w:before="20" w:after="20" w:line="23" w:lineRule="atLeast"/><w:jc w:val="left"/></w:pPr>${runs(seg, links, { bold: isHead, sz: 20 })}</w:p>`).join('');
      const w = cols.length ? ` w:w="${Math.round(cols[ci] / cols.reduce((a, b) => a + b, 0) * usable)}" w:type="dxa"` : '';
      return `<w:tc${w}><w:tcPr><w:tcW${w || ' w:w="0" w:type="auto"'}/>${isHead ? '<w:shd w:val="clear" w:color="auto" w:fill="E8ECF1"/>' : ''}<w:vAlign w:val="center"/></w:tcPr>${paras}</w:tc>`;
    }).join('');
    return `<w:tr>${isHead ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${tcs}</w:tr>`;
  }).join('');
  return `<w:tbl><w:tblPr><w:tblStyle w:val="14"/><w:tblW w:w="5000" w:type="pct"/><w:tblInd w:w="0" w:type="dxa"/>${bdrs}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="30" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${trs}</w:tbl><w:p><w:pPr><w:spacing w:after="60"/></w:pPr></w:p>`;
}

/* ---------- 解析 HTML 正文 ---------- */
const article = html.match(/<article>([\s\S]*?)<\/article>/)[1];
const links = [];                                              /* 收集外部链接（顺序→rId30+） */
const body = [];

/* 封面：主/副标题 + 修订历史记录表（参考同款 5 列） */
body.push(coverPara('指标查询模块', 52));
body.push(coverPara('数据应用需求文档（指标查询）', 32));
body.push('<w:p/>'.repeat(2));
body.push(`<w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:hint="eastAsia" w:ascii="宋体" w:hAnsi="宋体" w:eastAsia="宋体"/><w:sz w:val="24"/></w:rPr><w:t>修订历史记录</w:t></w:r></w:p>`);
body.push(table('<table><tr><th>版本号</th><th>修订日期</th><th>修订人</th><th>修订内容</th><th>审核人</th></tr><tr><td>V1.0</td><td>2026-10-23</td><td>华润金控数据组</td><td>指标查询初始版本</td><td></td></tr></table>', links));
body.push('<w:p><w:pPr><w:rPr><w:sz w:val="24"/></w:rPr></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>');

/* 顺序解析 h1/h2/p/ul/table */
const re = /<h1[^>]*>([\s\S]*?)<\/h1>|<h2[^>]*>([\s\S]*?)<\/h2>|<p>([\s\S]*?)<\/p>|<ul>([\s\S]*?)<\/ul>|<table>[\s\S]*?<\/table>/g;
let m;
while ((m = re.exec(article))) {
  if (m[1] != null) body.push(heading(unesc(m[1]).trim(), 3));
  else if (m[2] != null) body.push(heading(unesc(m[2]).trim(), 4));
  else if (m[3] != null) body.push(para(m[3], links));
  else if (m[4] != null) (m[4].match(/<li>[\s\S]*?<\/li>/g) || []).forEach(li => body.push(bullet(li.replace(/^<li>/, '').replace(/<\/li>$/, ''), links)));
  else body.push(table(m[0], links));
}

/* 尾注（参考页脚样式小灰字，正文尾部呈现） */
body.push(`<w:p><w:pPr><w:spacing w:before="200"/></w:pPr><w:r><w:rPr><w:rFonts w:hint="eastAsia" w:ascii="宋体" w:hAnsi="宋体" w:eastAsia="宋体"/><w:color w:val="9CA3AF"/><w:sz w:val="18"/></w:rPr><w:t>${esc('本文档与 指标查询.html 实际行为一致；如与代码冲突以代码为准并请同步更新本文档。')}</w:t></w:r></w:p>`);

/* ---------- 组装 document.xml（沿用参考命名空间与 sectPr） ---------- */
const refDoc = fs.readFileSync(path.join(REF_DIR, 'word/document.xml'), 'utf8');
const rootOpen = refDoc.slice(0, refDoc.indexOf('<w:body>'));
const sectPr = refDoc.match(/<w:sectPr>[\s\S]*?<\/w:sectPr>/)[0];
const documentXml = rootOpen + '<w:body>' + body.join('') + sectPr + '</w:body></w:document>';

/* ---------- 打包：模板文件复制，剔除旧正文图片/关系，改写正文与页眉 ---------- */
(async () => {
  const zip = new JSZip();
  const addDir = (dir, base) => fs.readdirSync(dir, { withFileTypes: true }).forEach(de => {
    const p = path.join(dir, de.name), rel = base ? base + '/' + de.name : de.name;
    if (de.isDirectory()) { if (rel !== 'media') addDir(p, rel); }
    else zip.file(rel, fs.readFileSync(p));
  });
  addDir(REF_DIR, '');

  zip.file('word/document.xml', documentXml);
  /* 页眉文案替换 */
  let hdr = fs.readFileSync(path.join(REF_DIR, 'word/header1.xml'), 'utf8');
  hdr = hdr.replace('华润银行模块 · 数据应用需求文档', '指标查询模块 · 需求文档');
  zip.file('word/header1.xml', hdr);
  /* rels：去掉图片关系，追加外部超链接关系 */
  let rels = fs.readFileSync(path.join(REF_DIR, 'word/_rels/document.xml.rels'), 'utf8');
  rels = rels.replace(/<Relationship [^>]*relationships\/image"[^>]*\/>/g, '');
  const linkRels = links.map((u, i) => `<Relationship Id="rId${i + 30}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(u)}" TargetMode="External"/>`).join('');
  rels = rels.replace('</Relationships>', linkRels + '</Relationships>');
  zip.file('word/_rels/document.xml.rels', rels);
  /* docProps 标题 */
  let core = fs.readFileSync(path.join(REF_DIR, 'docProps/core.xml'), 'utf8');
  core = core.replace(/<dc:title>[\s\S]*?<\/dc:title>/, '<dc:title>指标查询模块 需求文档</dc:title>');
  if (core === fs.readFileSync(path.join(REF_DIR, 'docProps/core.xml'), 'utf8') && !core.includes('<dc:title>'))
    core = core.replace(/<\/cp:coreProperties>/, '<dc:title>指标查询模块 需求文档</dc:title></cp:coreProperties>');
  zip.file('docProps/core.xml', core);
  zip.remove('word/media');

  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const out = path.join(ROOT, '指标查询模块-需求文档.docx');
  fs.writeFileSync(out, buf);
  console.log('OK', out, buf.length, 'bytes,', links.length, 'hyperlinks');
})();
