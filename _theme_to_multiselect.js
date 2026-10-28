/* 一次性改造：指标主题 = 树形多选 → 扁平模糊搜索多选下拉
   1) 删除「指标主题树形多选」整块，改为 stdThemeOptions() 层级值汇总
   2) STD_MS_KEYS 增加 theme；stdMsOptions/stdRenderMsPop 支持 theme 模糊搜索
   3) 过滤逻辑 theme 命中：一级/二级/三级/四级任一 = 所选值（OR）
   4) 角标、重置、弹层外部点击收起、搜索框 input 委托同步改造 */
const fs = require('fs');
const F = '指标查询.html';
let s = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');   /* CRLF→LF 统一处理，写回前恢复 */
let n = 0;
const rep = (from, to) => {
  if (!s.includes(from)) { console.error('MISS >>> ' + from.slice(0, 70)); process.exit(1); }
  s = s.replace(from, to); n++;
};

/* 1. 删除旧「指标主题树形多选」整块（状态声明 + 建树/渲染/勾选/重置函数群），
      替换为扁平层级值选项汇总函数 */
{
  const startMark = `/* ===== 指标主题树形多选`;
  const endMark = `function stdResetTree(){
  stdLeafChecked.clear();
  stdTreeApplySel();
}
`;
  const i = s.indexOf(startMark);
  const j = s.indexOf(endMark);
  if (i < 0 || j < 0 || j < i) { console.error('tree block locate fail'); process.exit(1); }
  s = s.slice(0, i) +
`/* ===== 指标主题：模糊搜索下拉多选（2026-10-28 需求：原树形多选改版）
   选项 = 主题/一级/二级/三级（四级）各层级值去重汇总；勾选后指标四字段任一等于所选项即命中 ===== */
let STD_THEME_OPTIONS = [];
function stdBuildThemeOptions(){
  STD_THEME_OPTIONS = [];
  if(!STD_DATA || !STD_DATA.items) return;
  STD_DATA.items.forEach(it=>{
    [it.theme, it.cat1, it.cat2, it.cat3].forEach(v=>{
      const t = String(v==null?'':v).trim();
      if(t && !stdIsEmpty(t) && STD_THEME_OPTIONS.indexOf(t)<0) STD_THEME_OPTIONS.push(t);
    });
  });
}
` + s.slice(j + endMark.length);
  n++;
}

/* 2. 多选下拉 keys 增加 theme */
rep(`const STD_MS_KEYS = ['caliber','freq','timeDim','assess','supplyDept','fullYearBudget'];`,
    `const STD_MS_KEYS = ['caliber','freq','timeDim','assess','supplyDept','fullYearBudget','theme'];`);

/* 3. stdMsOptions 支持 theme */
rep(`  if(key==='supplyDept'){`,
`  if(key==='theme') return STD_THEME_OPTIONS;
  if(key==='supplyDept'){`);

/* 4. 弹层渲染：模糊搜索框同时支持 supplyDept 与 theme */
rep(`  if(key === 'supplyDept'){
    /* 模糊搜索（2026-10-28 需求）：弹层顶部输入框，输入即过滤部门选项（不区分大小写子串匹配） */
    const kw = (stdMsSearch.supplyDept || '').trim().toLowerCase();
    if(kw) opts = opts.filter(v=>String(v).toLowerCase().indexOf(kw) >= 0);
    searchHtml = '<div class="std-ms-search"><input type="text" id="stdMsSearch-' + key + '" placeholder="输入关键字模糊搜索" autocomplete="off" value="' + escHtml(stdMsSearch.supplyDept || '') + '"></div>';
  }`,
`  if(key === 'supplyDept' || key === 'theme'){
    /* 模糊搜索（2026-10-28 需求）：弹层顶部输入框，输入即过滤选项（不区分大小写子串匹配；主题按层级值匹配） */
    const kw = (stdMsSearch[key] || '').trim().toLowerCase();
    if(kw) opts = opts.filter(v=>String(v).toLowerCase().indexOf(kw) >= 0);
    searchHtml = '<div class="std-ms-search"><input type="text" id="stdMsSearch-' + key + '" placeholder="输入关键字模糊搜索" autocomplete="off" value="' + escHtml(stdMsSearch[key] || '') + '"></div>';
  }`);
rep(`  if(key === 'supplyDept' && focused){`, `  if((key === 'supplyDept' || key === 'theme') && focused){`);
rep(`  }).join('') || '<div class="std-ms-empty">' + (key==='supplyDept' && (stdMsSearch.supplyDept||'').trim() ? '未找到匹配部门' : '暂无可选项') + '</div>');`,
    `  }).join('') || '<div class="std-ms-empty">' + ((key==='supplyDept'||key==='theme') && (stdMsSearch[key]||'').trim() ? '未找到匹配项' : '暂无可选项') + '</div>');`);

/* 5. 过滤逻辑：tree → theme 四层级任一命中 */
rep(`  const leaves = stdApplied ? stdApplied.leaves : stdLeafChecked;
  let selNos = null;
  if(leaves.size){
    selNos = new Set();
    leaves.forEach(l=>{ const n = stdTreeMap[l]; if(n) n.items.forEach(no=>selNos.add(no)); });
  }
  return STD_DATA.items.filter(it=>{
    if(selNos && !selNos.has(it.no)) return false;`,
`  const themes = a.theme || [];
  return STD_DATA.items.filter(it=>{
    /* 指标主题：一级/二级/三级/四级（主题/分类字段）任一模糊匹配所选项即命中（多选间 OR） */
    if(themes.length){
      const vals = [it.theme, it.cat1, it.cat2, it.cat3].map(v=>String(v==null?'':v).trim());
      if(!themes.some(t=>vals.indexOf(t) >= 0)) return false;
    }`);

/* 6. 角标统计：theme 归入多选 keys */
rep(`  if(stdState.bizUnit) n++;
  if(stdLeafChecked.size) n++;
  ['caliber','freq','timeDim','assess','supplyDept','fullYearBudget'].forEach(k=>{ if(stdState[k].length) n++; });`,
`  if(stdState.bizUnit) n++;
  ['caliber','freq','timeDim','assess','supplyDept','fullYearBudget','theme'].forEach(k=>{ if(stdState[k].length) n++; });`);

/* 7. 重置逻辑：删树形重置，stdResetMs 已覆盖 theme（keys 含 theme） */
rep(`  stdLeafChecked.clear();
  stdSelNosCache = null;
  stdRenderTreePop();
  STD_MS_KEYS.forEach(stdResetMs);
  const sel = document.getElementById('stdThemeTreeSel');
  if(sel){ sel.textContent = '请选择'; sel.className = 'std-tree-sel placeholder'; }
  stdUpdateCaliberCombo();`,
`  STD_MS_KEYS.forEach(stdResetMs);
  stdUpdateCaliberCombo();`);

/* 8. 初始化：建树改建树选项 */
rep(`  stdBuildThemeTree();
  stdRenderTreePop();`, `  stdBuildThemeOptions();`);

/* 9. 树形相关事件分支删除 + theme 搜索框清空 */
rep(`  else if(action === 'std-tree-toggle'){
    const wrap = document.getElementById('stdThemeTree');
    if(wrap){ if(!wrap.classList.contains('show')) stdRenderTreePop(); wrap.classList.toggle('show'); }
  }`, ``);
{
  const openBlk = `  else if(action === 'std-tree-open'){
    const tid = btn.dataset.node;
    if(stdTreeOpen.has(tid)) stdTreeOpen.delete(tid); else stdTreeOpen.add(tid);
    stdRenderTreePop();
  }`;
  if (s.includes(openBlk)) { s = s.replace(openBlk, ''); n++; } else { console.error('MISS tree-open'); process.exit(1); }
  const chkBlok = `  else if(action === 'std-tree-check'){
    stdSetNodeChecked(btn.dataset.node, !!btn.checked);
  }`;
  if (s.includes(chkBlok)) { s = s.replace(chkBlok, ''); n++; }
  const flipBlk = `  else if(action === 'std-tree-flip'){
    const tn = stdTreeMap[btn.dataset.node];
    if(tn) stdSetNodeChecked(tn.id, !stdNodeState(tn).checked);
  }`;
  if (s.includes(flipBlk)) { s = s.replace(flipBlk, ''); n++; }
}
/* theme 打开时清搜索草稿 */
rep(`if(!mw.classList.contains('show')){ if(btn.dataset.ms==='supplyDept') stdMsSearch.supplyDept=''; stdRenderMsPop(btn.dataset.ms); }`,
    `if(!mw.classList.contains('show')){ if(btn.dataset.ms==='supplyDept'||btn.dataset.ms==='theme') stdMsSearch[btn.dataset.ms]=''; stdRenderMsPop(btn.dataset.ms); }`);

/* 10. 点击外部收起：删树形弹层收起分支（多选 keys 循环已含 theme） */
rep(`  /* 指标主题树下拉：点击其外部时收起 */
  const treeWrap0 = document.getElementById('stdThemeTree');
  if(treeWrap0 && treeWrap0.classList.contains('show') && !e.target.closest('.std-treeselect')) treeWrap0.classList.remove('show');
`, ``);

/* 11. 搜索框 input 委托：theme 同样支持 */
rep(`  if(t && t.id === 'stdMsSearch-supplyDept'){
    stdMsSearch.supplyDept = t.value;
    stdRenderMsPop('supplyDept');
  }`,
`  if(t && (t.id === 'stdMsSearch-supplyDept' || t.id === 'stdMsSearch-theme')){
    const k = t.id === 'stdMsSearch-theme' ? 'theme' : 'supplyDept';
    stdMsSearch[k] = t.value;
    stdRenderMsPop(k);
  }`);

fs.writeFileSync(F, s.split('\n').join('\r\n'), 'utf8');
console.log('OK 完成', n, '处改造');
