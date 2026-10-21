const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

(async () => {
  const {parseHTML} = await import('./vendor/linkedom.mjs');
  const root = path.join(__dirname, '../dist');
  const {document} = parseHTML(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  const handlers = {};
  const ctx = {document, location:{hash:''}, Intl, console, setTimeout:()=>0,
    matchMedia:()=>({matches:true}), scrollTo:()=>{}, addEventListener:(name,fn)=>{handlers[name]=fn;}};
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const file of ['model.js','banking.js','app.js']) {
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
  }
  const q = selector => document.querySelector(selector);
  const click = selector => q(selector).onclick();
  const go = hash => {ctx.location.hash='#'+hash;handlers.hashchange();};
  const approve = () => {q('#bank-consent').checked=true;q('#bank-consent').onchange({target:q('#bank-consent')});};
  const role = value => {Object.defineProperty(q('#bank-role'),'value',{configurable:true,value});q('#bank-role').onchange();};
  const amount = value => {q('#bank-amount').value=value;q('#bank-amount').oninput();};
  const reset = () => click('#bank-reset');

  assert.match(q('h1').textContent,/Everyday banking/);
  assert.equal(document.querySelectorAll('tbody tr').length,16);
  click('[data-bank-node="Bill"]');
  assert.match(q('#bank-inspector').textContent,/Unpaid/);
  for (const journey of ['balances','bills','saving','cards']) {
    q('#bank-journey').onchange({target:{value:journey}});
    assert.match(q('#bank-journey-detail').textContent,/Candidate action types/);
  }
  click('#bank-submit');
  assert.match(q('#bank-status').textContent,/Approval required/);
  role('reader');click('#bank-propose');
  assert.match(q('#bank-status').textContent,/Denied/);
  role('customer');amount('0');click('#bank-propose');
  assert.match(q('#bank-status').textContent,/exact USD 115/);
  amount('115');click('#bank-propose');approve();
  amount('114');
  assert.equal(q('#bank-consent').checked,false);
  assert.equal(q('#bank-submit').disabled,true);
  assert.match(q('#bank-proposal').textContent,/No active proposal/);
  amount('115');click('#bank-propose');approve();
  role('reader');
  assert.equal(q('#bank-consent').checked,false);
  assert.equal(q('#bank-submit').disabled,true);

  reset();click('#bank-propose');approve();click('#bank-debit');click('#bank-submit');
  assert.match(q('#bank-status').textContent,/breach the \$500 buffer/);
  assert.match(q('#bank-state').textContent,/\$1,500\.00/);
  assert.match(q('#bank-state').textContent,/Not submitted/);

  reset();click('#bank-propose');approve();click('#bank-submit');
  assert.match(q('#bank-state').textContent,/Queued/);
  assert.match(q('#bank-state').textContent,/Unpaid/);
  assert.match(q('#bank-state').textContent,/\$1,485\.00/);
  click('#bank-submit');
  assert.match(q('#bank-status').textContent,/Duplicate/);
  go('overview');go('banking');
  assert.match(q('#bank-state').textContent,/Queued/);
  click('#bank-settle');
  assert.match(q('#bank-state').textContent,/Settled/);
  assert.match(q('#bank-state').textContent,/TXN-901/);
  assert.match(q('#bank-state').textContent,/\$1,485\.00/);
  const settled=q('#bank-state').textContent;
  click('#bank-settle');click('#bank-fail');
  assert.equal(q('#bank-state').textContent,settled);
  click('[data-bank-node="Bill"]');
  assert.match(q('#bank-inspector').textContent,/Paid/);

  reset();click('#bank-propose');approve();click('#bank-submit');click('#bank-fail');
  assert.match(q('#bank-state').textContent,/Failed/);
  assert.match(q('#bank-state').textContent,/\$1,600\.00/);
  assert.match(q('#bank-state').textContent,/Unpaid/);
  assert.equal(q('#bank-consent').checked,false);
  assert.equal(q('#bank-submit').disabled,true);
  click('#bank-propose');approve();click('#bank-submit');click('#bank-settle');
  assert.match(q('#bank-state').textContent,/\$1,485\.00/);
  assert.match(q('#bank-log').textContent,/retry requires a new proposal/);
  reset();
  assert.match(q('#bank-log').textContent,/No actions yet/);
  console.log('Banking checks passed: 16 objects, four journeys, inspection, exact consent, role denial, stale-balance rejection, single reservation, duplicate protection, navigation persistence, settlement, failure, retry, reset.');
})().catch(error=>{console.error(error);process.exitCode=1;});
