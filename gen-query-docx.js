/* 指标查询模块需求文档：HTML → DOCX 转换生成器
   以 指标查询模块-需求文档.html 为唯一内容源，解析 article 正文生成同名 docx。
   运行：node gen-query-docx.js  */
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        WidthType, HeadingLevel, AlignmentType, ShadingType, BorderStyle,
        ExternalHyperlink, VerticalAlign, LevelFormat } =
  require('D:/Users/ex-liaox003/AppData/Local/Temp/docxgen/node_modules/docx');

const ROOT = __dirname;
const html = fs.readFileSync(path.join(ROOT, '指标查询模块-需求文档.html'), 'utf8');

/* ---------- 极小 HTML 解析（本文档结构已知且规整） ---------- */
function unesc(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
}
/* 行内片段 → TextRun[]（支持 <b> <a> 与纯文本；<br> 在表格单元另行处理） */
function runs(text, base) {
  base = base || {};
  const out = [];
  const re = /<b>([\s\S]*?)<\/b>|<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun(Object.assign({ text: unesc(text.slice(last, m.index)) }, base)));
    if (m[1] != null) out.push(new TextRun(Object.assign({ text: unesc(m[1]), bold: true }, base)));
    else out.push(new ExternalHyperlink({
      link: m[2],
      children: [new TextRun(Object.assign({ text: unesc(m[3]), style: 'Hyperlink', color: '0563C1', underline: {} }, base))]
    }));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(new TextRun(Object.assign({ text: unesc(text.slice(last)) }, base)));
  return out.length ? out : [new TextRun(Object.assign({ text: '' }, base))];
}
const ORG = 'D48A10', ORG_LIGHT = 'FAF1DE', LINE = 'E3D9C6';
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: LINE },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
  left: { style: BorderStyle.SINGLE, size: 4, color: LINE },
  right: { style: BorderStyle.SINGLE, size: 4, color: LINE }
};
function cell(text, opts) {
  opts = opts || {};
  const paras = unesc(text).split(/<br\s*\/?>/).map(seg => new Paragraph({
    children: runs(seg, { bold: opts.bold, size: opts.size }),
    spacing: { before: 20, after: 20 }
  }));
  return new TableCell({
    children: paras,
    shading: opts.head ? { type: ShadingType.CLEAR, fill: ORG_LIGHT } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 }
  });
}
function mkTable(t) {
  const colSpecs = (t.match(/<col style="width:(\d+)%"/g) || [])
    .map(s => parseInt(s.match(/(\d+)%/)[1], 10));
  const total = colSpecs.reduce((a, b) => a + b, 0) || 100;
  const rows = (t.match(/<tr>[\s\S]*?<\/tr>/g) || []).map(trHtml => {
    const isHead = /<th/.test(trHtml);
    const cells = (trHtml.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/g) || []).map(td =>
      cell(td.replace(/^<t[hd][^>]*>/, '').replace(/<\/t[hd]>$/, ''), { head: isHead, bold: isHead }));
    return new TableRow({ children: cells, tableHeader: isHead });
  });
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: colSpecs.map(p => Math.round(p / total * 9360)),
    borders: {
      top: cellBorders.top, bottom: cellBorders.bottom,
      left: cellBorders.left, right: cellBorders.right,
      insideHorizontal: cellBorders.top, insideVertical: cellBorders.left
    }
  });
}

/* ---------- 解析 article 主体 ---------- */
const article = html.match(/<article>([\s\S]*?)<\/article>/)[1];
const children = [];

/* 封面标题块 */
children.push(new Paragraph({
  children: [new TextRun({ text: '指标查询模块 · 需求文档', bold: true, size: 52, color: ORG })],
  spacing: { before: 200, after: 120 }
}));
children.push(new Paragraph({
  children: [new TextRun({ text: '通用报送管理系统 — 指标标准库查询', size: 24, color: '6B7280' })],
  spacing: { after: 60 }
}));
children.push(new Paragraph({
  children: [new TextRun({ text: '文档版本 V1.0　|　发布日期 2026-10-23　|　编写 华润金控数据应用组　|　实现载体 指标查询.html', size: 20, color: '9AA3AF' })],
  spacing: { after: 80 }
}));
children.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ORG } }, spacing: { after: 200 }, children: [] }));

/* 顺序解析 h1/h2/p/ul/table（保持原文顺序） */
const blockRe = /<h1[^>]*>([\s\S]*?)<\/h1>|<h2[^>]*>([\s\S]*?)<\/h2>|<p>([\s\S]*?)<\/p>|<ul>([\s\S]*?)<\/ul>|<table>[\s\S]*?<\/table>/g;
let m, firstH1 = true;
while ((m = blockRe.exec(article))) {
  if (m[1] != null) {                      /* 章标题：一、二、三 */
    if (!firstH1) children.push(new Paragraph({ text: '', pageBreakBefore: true, spacing: { after: 0 } }));
    firstH1 = false;
    children.push(new Paragraph({
      children: runs(m[1], { bold: true, size: 32, color: 'FFFFFF' }),
      shading: { type: ShadingType.CLEAR, fill: ORG },
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 120, after: 160 },
    }));
  } else if (m[2] != null) {               /* 节标题：1 2 3 … */
    children.push(new Paragraph({
      children: runs(m[2], { bold: true, size: 26, color: '7A5207' }),
      shading: { type: ShadingType.CLEAR, fill: 'FDF6E8' },
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 220, after: 100 },
      border: { left: { style: BorderStyle.SINGLE, size: 20, color: ORG } },
    }));
  } else if (m[3] != null) {               /* 段落 */
    children.push(new Paragraph({
      children: runs(m[3]),
      spacing: { before: 40, after: 80, line: 320 },
      alignment: AlignmentType.JUSTIFIED
    }));
  } else if (m[4] != null) {               /* 无序列表 */
    (m[4].match(/<li>[\s\S]*?<\/li>/g) || []).forEach(li => {
      children.push(new Paragraph({
        children: runs(li.replace(/^<li>/, '').replace(/<\/li>$/, '')),
        bullet: { level: 0 },
        spacing: { before: 20, after: 40, line: 300 }
      }));
    });
  } else {                                  /* 表格 */
    children.push(mkTable(m[0]));
    children.push(new Paragraph({ text: '', spacing: { after: 60 } }));
  }
}

/* 尾注 */
children.push(new Paragraph({
  children: [new TextRun({ text: '本文档与 指标查询.html 实际行为一致；如与代码冲突以代码为准并请同步更新本文档。', size: 18, color: '9AA3AF', italics: true })],
  spacing: { before: 300 }
}));

const doc = new Document({
  numbering: { config: [{ reference: 'default-bullet', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•' }] }] },
  styles: { default: { document: { run: { font: '微软雅黑', size: 21 } } } },
  sections: [{ children }]
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(ROOT, '指标查询模块-需求文档.docx');
  fs.writeFileSync(out, buf);
  console.log('OK', out, buf.length, 'bytes');
});
