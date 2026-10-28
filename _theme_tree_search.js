/* 指标主题：恢复四级层级树（指标主题→一级分类→二级分类→三级分类）+ 模糊搜索下拉多选
   基线：指标查询.html.bak（树形版，含供数部门模糊搜索）；在其上叠加树弹层搜索框 */
const fs = require('fs');
let s = fs.readFileSync('指标查询.html.bak', 'utf8').replace(/\r\n/g, '\n');
let n = 0;
const rep = (from, to) => {
  if (!s.includes(from)) { console.error('MISS >>> ' + from.slice(0, 70)); process.exit(1); }
  s = s.replace(from, to); n++;
};

/* 0. 基线 .bak 中主题按钮 HTML 曾被改为扁平下拉，恢复为树形控件标记（JS 侧基线即树形版） */
rep(`<div class="std-form-item"><label class="std-form-label" for="stdMsBtn-theme">指标主题：</label>
                  <div class="std-multiselect" id="stdMs-theme">
                    <button type="button" class="std-ctrl std-ms-btn" data-action="std-ms-toggle" data-ms="theme" id="stdMsBtn-theme" title="支持模糊搜索；一级/二级/三级/四级任一层级匹配即命中，可多选">
                      <span class="std-ms-sel placeholder" id="stdMsSel-theme">请选择</span><span class="std-tree-chev">▾</span>
                    </button>
                    <div class="std-ms-pop" id="stdMsPop-theme"></div>
                  </div>
                </div>`,
`<div class="std-form-item"><label class="std-form-label" for="stdThemeTreeBtn">指标主题：</label>
                  <div class="std-treeselect" id="stdThemeTree">
                    <button type="button" class="std-ctrl std-tree-btn" data-action="std-tree-toggle" id="stdThemeTreeBtn" title="按主题自动带出 一级/二级/三级 分类，支持多选">
                      <span class="std-tree-sel" id="stdThemeTreeSel">请选择</span><span class="std-tree-chev">▾</span>
                    </button>
                    <div class="std-tree-pop" id="stdThemeTreePop"></div>
                  </div>
                </div>`);

/* 1. 按钮 title 说明四级层级 + 模糊搜索 */
rep(`data-action="std-tree-toggle" id="stdThemeTreeBtn" title="按主题自动带出 一级/二级/三级 分类，支持多选"`,
    `data-action="std-tree-toggle" id="stdThemeTreeBtn" title="四级层级：指标主题 → 一级分类 → 二级分类 → 三级分类；支持模糊搜索、级联多选"`);

/* 2. 搜索草稿变量（紧跟树状态声明） */
rep(`let stdTreeOpen = new Set();    // 已展开节点 id`,
    `let stdTreeOpen = new Set();    // 已展开节点 id
let stdThemeSearch = '';            // 树弹层模糊搜索关键字草稿（2026-10-28 需求）`);

/* 3. 树渲染：搜索过滤（任一层级 label 命中即保留该节点及其祖先路径；命中词高亮；搜索时强制展开） */
rep(`function stdTreePopHtml(){
  const walk = (n, depth)=>{
    const st = stdNodeState(n);
    const kids = n.children.length;
    const open = stdTreeOpen.has(n.id);
    let h = '<div class="std-tree-row" style="padding-left:' + (10 + depth*22) + 'px">'
      + '<input type="checkbox" class="std-tree-cb" data-action="std-tree-check" data-node="' + escHtml(n.id) + '"' + (st.checked?' checked':'') + '>'
      + '<span class="std-tree-exp' + (kids?'':' none') + '" data-action="std-tree-open" data-node="' + escHtml(n.id) + '">' + (kids ? (open?'▼':'▶') : '') + '</span>'
      + '<span class="std-tree-lb" data-action="std-tree-flip" data-node="' + escHtml(n.id) + '" title="' + escHtml(n.label) + '">' + escHtml(n.label) + '</span>'
      + '</div>';
    if(kids && open) h += n.children.map(c=>walk(c, depth+1)).join('');
    return h;
  };
  return stdTreeRoots.map(n=>walk(n,0)).join('') || '<div class="std-tree-row">暂无分类数据</div>';
}`,
`/* 节点或任一后代命中关键字 → 保留（一级/二级/三级/四级任一层级模糊匹配即命中） */
function stdTreeMatch(n, kw){
  if(!kw) return true;
  if(n.label.toLowerCase().indexOf(kw) >= 0) return true;
  return n.children.some(c=>stdTreeMatch(c, kw));
}
/* 命中词黄色高亮（与关键字列表高亮同款 <mark>） */
function stdTreeHl(label, kw){
  const e = escHtml(label);
  if(!kw) return e;
  const i = label.toLowerCase().indexOf(kw);
  if(i < 0) return e;
  return escHtml(label.slice(0, i)) + '<mark>' + escHtml(label.slice(i, i + kw.length)) + '</mark>' + escHtml(label.slice(i + kw.length));
}
function stdTreePopHtml(){
  const kw = stdThemeSearch.trim().toLowerCase();
  const walk = (n, depth)=>{
    if(kw && !stdTreeMatch(n, kw)) return '';
    const st = stdNodeState(n);
    const kids = n.children.length;
    const open = kw ? true : stdTreeOpen.has(n.id);   /* 搜索中强制展开，直接呈现命中路径 */
    let h = '<div class="std-tree-row" style="padding-left:' + (10 + depth*22) + 'px">'
      + '<input type="checkbox" class="std-tree-cb" data-action="std-tree-check" data-node="' + escHtml(n.id) + '"' + (st.checked?' checked':'') + '>'
      + '<span class="std-tree-exp' + (kids?'':' none') + '" data-action="std-tree-open" data-node="' + escHtml(n.id) + '">' + (kids ? (open?'▼':'▶') : '') + '</span>'
      + '<span class="std-tree-lb" data-action="std-tree-flip" data-node="' + escHtml(n.id) + '" title="' + escHtml(n.id) + '">' + stdTreeHl(n.label, kw) + '</span>'
      + '</div>';
    if(kids && open) h += n.children.map(c=>walk(c, depth+1)).join('');
    return h;
  };
  return stdTreeRoots.map(n=>walk(n,0)).join('') || '<div class="std-tree-row">未找到匹配分类</div>';
}`);

/* 4. 弹层渲染：顶部搜索框 + 输入后焦点/光标保持 */
rep(`function stdRenderTreePop(){
  const pop = document.getElementById('stdThemeTreePop');
  if(!pop) return;
  pop.innerHTML = stdTreePopHtml();
  // 半选态（部分子叶子勾选）
  pop.querySelectorAll('input.std-tree-cb').forEach(cb=>{
    const n = stdTreeMap[cb.dataset.node];
    cb.indeterminate = n ? stdNodeState(n).indet : false;
  });
}`,
`function stdRenderTreePop(){
  const pop = document.getElementById('stdThemeTreePop');
  if(!pop) return;
  const focused = document.activeElement && document.activeElement.id === 'stdThemeSearch';
  /* 模糊搜索框（2026-10-28 需求）：一级/二级/三级/四级任一层级名匹配即保留路径 */
  pop.innerHTML = '<div class="std-ms-search"><input type="text" id="stdThemeSearch" placeholder="输入关键字模糊搜索分类" autocomplete="off" value="' + escHtml(stdThemeSearch) + '"></div>' + stdTreePopHtml();
  // 半选态（部分子叶子勾选）
  pop.querySelectorAll('input.std-tree-cb').forEach(cb=>{
    const n = stdTreeMap[cb.dataset.node];
    cb.indeterminate = n ? stdNodeState(n).indet : false;
  });
  if(focused){
    const el = document.getElementById('stdThemeSearch');
    if(el){ el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }
}`);

/* 5. 打开弹层时清空上次搜索 */
rep(`  else if(action === 'std-tree-toggle'){
    const wrap = document.getElementById('stdThemeTree');
    if(wrap){ if(!wrap.classList.contains('show')) stdRenderTreePop(); wrap.classList.toggle('show'); }
  }`,
`  else if(action === 'std-tree-toggle'){
    const wrap = document.getElementById('stdThemeTree');
    if(wrap){ if(!wrap.classList.contains('show')){ stdThemeSearch = ''; stdRenderTreePop(); } wrap.classList.toggle('show'); }
  }`);

/* 6. 搜索框 input 委托（树搜索；点击弹层内部不关闭由既有"外部点击收起"逻辑保证） */
rep(`document.addEventListener('input', (e)=>{
  const t = e.target;
  if(t && t.id === 'stdMsSearch-supplyDept'){
    stdMsSearch.supplyDept = t.value;
    stdRenderMsPop('supplyDept');
  }
});`,
`document.addEventListener('input', (e)=>{
  const t = e.target;
  if(t && t.id === 'stdMsSearch-supplyDept'){
    stdMsSearch.supplyDept = t.value;
    stdRenderMsPop('supplyDept');
  }
  else if(t && t.id === 'stdThemeSearch'){
    stdThemeSearch = t.value;
    stdRenderTreePop();
  }
});`);

/* 7. 重置按钮同步清空树搜索草稿（resetStdFilters 中 stdLeafChecked.clear() 后重建） */
rep(`  stdLeafChecked.clear();
  stdSelNosCache = null;
  stdRenderTreePop();`,
`  stdLeafChecked.clear();
  stdSelNosCache = null;
  stdThemeSearch = '';
  stdRenderTreePop();`);

fs.writeFileSync('指标查询.html', s.split('\n').join('\r\n'), 'utf8');
console.log('OK 恢复树形+模糊搜索，共', n, '处改造');
