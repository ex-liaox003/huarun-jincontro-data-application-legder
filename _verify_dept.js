/* 验证：供数部门 33 部门数据 + 弹层模糊搜索多选（2026-10-28 需求） */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const base = __dirname;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const srcHtml = fs.readFileSync(path.join(base, '指标查询.html'), 'utf8');

const probe = `<script>
(function(){
  window.__errs=[]; window.onerror=function(m){ __errs.push(m); };
  setTimeout(function(){
    try{
      var step='init';
      var info='';
      /* 1. 数据：去重部门数 */
      var depts={};
      INDICATOR_STANDARD.items.forEach(function(it){ depts[it.supplyDept]=1; });
      info+='DEPTS='+Object.keys(depts).length;
      info+=' SAMPLE='+INDICATOR_STANDARD.items[0].supplyDept;
      /* 2. 高级搜索面板打开 */
      step='advToggle'; var at=document.getElementById('advToggle'); if(at) at.click();
      /* 3. 选业务单元=华润资产 */
      step='bizUnit'; var bu=document.getElementById('stdBizUnit');
      bu.value='华润资产'; bu.dispatchEvent(new Event('change',{bubbles:true}));
      /* 4. 打开供数部门下拉 */
      step='msOpen'; var mb=document.getElementById('stdMsBtn-supplyDept'); if(!mb) throw new Error('no msbtn');
      mb.click();
      var pop=document.getElementById('stdMsPop-supplyDept');
      var opts=pop.querySelectorAll('.std-ms-row').length;
      var hasSearch=!!pop.querySelector('#stdMsSearch-supplyDept');
      info+=' POPOPTS='+opts+' SEARCHBOX='+(hasSearch?1:0);
      /* 5. 输入模糊关键字 */
      var inp=document.getElementById('stdMsSearch-supplyDept');
      inp.value='风险'; inp.dispatchEvent(new Event('input',{bubbles:true}));
      var pop2=document.getElementById('stdMsPop-supplyDept');
      var opts2=[].map.call(pop2.querySelectorAll('.std-tree-lb'),function(x){return x.textContent;});
      info+=' FILTERED='+opts2.length+' ['+opts2.join(',')+']';
      /* 6. 勾选过滤结果第 1 项 + 清空关键字再勾第 2 个不重复部门 */
      pop2.querySelector('.std-tree-cb').click();
      var inp2=document.getElementById('stdMsSearch-supplyDept');
      inp2.value='审计'; inp2.dispatchEvent(new Event('input',{bubbles:true}));
      var pop3=document.getElementById('stdMsPop-supplyDept');
      pop3.querySelector('.std-tree-cb').click();
      info+=' STATE='+JSON.stringify(stdState.supplyDept);
      info+=' BADGE='+document.querySelector('#stdMsSel-supplyDept').textContent;
      /* 7. 已勾选项在重新过滤后的列表中保持 checked */
      var checkedBack=[].filter.call(document.getElementById('stdMsPop-supplyDept').querySelectorAll('.std-tree-cb'),function(c){return c.checked;}).map(function(c){return c.getAttribute('data-val');});
      info+=' CHECKBACK='+JSON.stringify(checkedBack);
      /* 8. 应用搜索：结果计数 */
      document.querySelector('[data-action="std-adv-search"]').click();
      setTimeout(function(){
        try{
          info+=' TOTAL='+document.getElementById('qsCount').textContent;
          var shown={};
          document.querySelectorAll('#stdMain tbody .dept-cell, #stdMain tbody td').forEach(function(){});
          document.title='VERIFY='+info.replace(/\\s+/g,' ')+'|ERRS='+__errs.join(';');
        }catch(e2){ document.title='VERIFY-FAIL2='+e2.message; }
      },300);
    }catch(e){ document.title='VERIFY-FAIL@'+step+' '+e.message+'|ERRS='+__errs.join(';'); }
  },800);
})();
</script></body>`;
const file = path.join(base, '_shot_dept_verify.html');
fs.writeFileSync(file, srcHtml.replace('</body>', probe), 'utf8');
const url = 'file:///' + file.split('\\').join('/');
try {
  const out = execFileSync(CHROME, ['--headless=new','--disable-gpu','--no-sandbox','--hide-scrollbars',
    '--window-size=1500,1000','--virtual-time-budget=8000','--dump-dom', url],
    { maxBuffer: 64*1024*1024 }).toString('utf8');
  const m = out.match(/<title>(VERIFY[^<]*)<\/title>/);
  console.log(m ? m[1] : 'NO TITLE FOUND');
} catch (e) { console.log('fail', String(e.message).slice(0, 200)); }
