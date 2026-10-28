/* 验证2（同步）：主题树四级层级 + 模糊搜索 + 勾选过滤（全同步无时序依赖） */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const srcHtml = fs.readFileSync(path.join(base, '指标查询.html'), 'utf8');

const probe = `
<script>
(function(){
  window.__errs=[]; window.onerror=function(m){ __errs.push(String(m).slice(0,120)); };
  setTimeout(function(){
    try{
      var r=[];
      /* 层级结构：根=主题(战略)→一级→二级→三级 四层 */
      var root=stdTreeRoots[0];
      var depth=function(n,d){ return n.children.reduce(function(m,c){return Math.max(m,depth(c,d+1));},d); };
      r.push('层级深度='+(depth(root,1)+'层'));
      r.push('根='+root.id+' 一级节点='+root.children.map(function(c){return c.label;}).join(','));
      /* 打开面板与弹层 */
      document.getElementById('advToggle').click();
      document.getElementById('stdThemeTreeBtn').click();
      var pop=document.getElementById('stdThemeTreePop');
      r.push('搜索框='+(pop.querySelector('#stdThemeSearch')?'有':'无'));
      r.push('初始行数='+pop.querySelectorAll('.std-tree-row').length);
      /* 模糊搜索：一级名「收入结构」 */
      stdThemeSearch='收入结构'; stdRenderTreePop();
      pop=document.getElementById('stdThemeTreePop');
      r.push('搜[收入结构]行='+pop.querySelectorAll('.std-tree-row').length+' mark='+pop.querySelectorAll('mark').length);
      /* 模糊搜索：二级名「经营损益」 */
      stdThemeSearch='经营损益'; stdRenderTreePop();
      pop=document.getElementById('stdThemeTreePop');
      r.push('搜[经营损益]行='+pop.querySelectorAll('.std-tree-row').length);
      /* 模糊搜索：三级名「收入指标」 */
      stdThemeSearch='收入指标'; stdRenderTreePop();
      pop=document.getElementById('stdThemeTreePop');
      r.push('搜[收入指标]行='+pop.querySelectorAll('.std-tree-row').length);
      /* 清空搜索，勾选根节点 → 级联全选 → 过滤全量 166 */
      stdThemeSearch=''; stdRenderTreePop();
      stdSetNodeChecked('战略', true);
      r.push('勾根后已选='+stdLeafChecked.size+'项 标签='+document.getElementById('stdThemeTreeSel').textContent);
      stdSnapshot(); applyStd();
      r.push('过滤结果='+document.getElementById('qsCount').textContent+'条');
      /* 只勾「收入结构/经营损益指标」节点 → 命中数应为其 items 数 */
      stdResetTree();
      var node=stdTreeMap['战略/收入结构/经营损益指标'];
      stdSetNodeChecked('战略/收入结构/经营损益指标', true);
      stdSnapshot(); applyStd();
      r.push('勾经营损益指标节点 items='+node.items.length+' 过滤结果='+document.getElementById('qsCount').textContent+'条');
      /* 重置恢复全量 */
      resetStdFilters();
      r.push('重置后='+document.getElementById('qsCount').textContent+'条 标签='+document.getElementById('stdThemeTreeSel').textContent);
      document.title='V2='+r.join(' | ')+'|ERRS='+__errs.join(';');
    }catch(e){ document.title='V2-ERR '+e.message+' @'+String((e.stack||'').split(String.fromCharCode(10))[1]||'').trim(); }
  },900);
})();
</scr`+`ipt></body>`;

const file = path.join(base, '_shot_theme_verify.html');
fs.writeFileSync(file, srcHtml.replace('</body>', probe), 'utf8');
const url = 'file:///' + file.split('\\').join('/');
try {
  const out = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--window-size=1500,900','--virtual-time-budget=9000','--dump-dom', url],
    { maxBuffer: 64*1024*1024 }).toString('utf8');
  const m = out.match(/<title>(V2[^<]*)<\/title>/);
  console.log(m ? m[1] : 'NO TITLE');
} catch (e) { console.log('fail', String(e.message).slice(0, 150)); }
