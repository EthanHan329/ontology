const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {BankLabModel} = require('../dist/lab-model.js');

function session() { const bank=new BankLabModel(); bank.login(); return bank; }

const anonymous = new BankLabModel();
assert.equal(anonymous.propose(15000).ok,false);
assert.equal(anonymous.readPortfolio().ok,false);
for (const amount of [0,-1,NaN,Infinity,1.5,Number.MAX_SAFE_INTEGER,20100]) {
  const bank=session();
  assert.equal(bank.propose(amount).ok,false,`reject invalid or unaffordable ${amount}`);
  assert.equal(bank.available,160000);
}
const bank = session();
const proposed = bank.propose(15000);
assert.equal(proposed.ok,true);
assert.equal(bank.available,160000,'proposal does not reserve funds');
assert.equal(bank.confirm('wrong-id').ok,false);
assert.equal(bank.confirm(proposed.proposal.id).ok,true);
assert.equal(bank.available,145000);
assert.equal(bank.savings,820000,'queued is not settled');
assert.equal(bank.confirm(proposed.proposal.id).ok,false,'idempotency');
assert.equal(bank.propose(100).ok,false,'queued instruction cannot be overwritten');
assert.equal(bank.resolve(true).ok,true);
assert.equal(bank.savings,835000);
assert.equal(bank.resolve(true).ok,false,'no double settlement');
assert.equal(bank.available,145000);
assert.equal(bank.instruction.transactionId,'TXN-1');

const failed = session();
failed.propose(15000);failed.confirm(failed.proposal.id);failed.resolve(false);
assert.equal(failed.available,160000);
assert.equal(failed.savings,820000);
assert.equal(failed.instruction.status,'Failed');
assert.equal(failed.resolve(false).ok,false);

const stale = session();
stale.propose(15000);stale.spend();
assert.equal(stale.confirm(stale.proposal.id).ok,false);
assert.equal(stale.available,150000);
assert.equal(stale.instruction,null);
assert.equal(stale.propose(15000).ok,false);
assert.equal(stale.propose(10000).ok,true,'fresh exact buffer boundary is valid');
assert.equal(stale.confirm(stale.proposal.id).ok,true);

const revoked = session();
revoked.propose(10000);revoked.revoke();
assert.equal(revoked.confirm(revoked.proposal.id).ok,false);
assert.equal(revoked.propose(10000).ok,false);
assert.equal(revoked.readPortfolio().ok,true,'read access remains distinct');

const replaced = session();
const oldId = replaced.propose(10000).proposal.id;
replaced.propose(15000);
assert.equal(replaced.confirm(oldId).ok,false,'old consent cannot approve a replacement');

const portfolio=session();
assert.equal(portfolio.readPortfolio().portfolio.total,5000000);
portfolio.moveMarket();
assert.equal(portfolio.portfolio.total,5000000,'old answers retain their snapshot');
assert.equal(portfolio.readPortfolio().portfolio.total,5300000);
assert.equal(portfolio.portfolio.quoteVersion,2);
assert.equal(portfolio.readPortfolio('CUS-OTHER').ok,false);
assert.equal(portfolio.available,160000,'portfolio reads never debit');

(async()=>{
  const {parseHTML}=await import('./vendor/linkedom.mjs');
  const root=path.join(__dirname,'../dist');
  const {document}=parseHTML(fs.readFileSync(path.join(root,'demo.html'),'utf8'));
  const context={document,Intl,console};
  vm.createContext(context);
  for(const file of ['lab-model.js','lab.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  const q=selector=>document.querySelector(selector);
  const click=selector=>{assert.ok(q(selector),`control ${selector}`);q(selector).onclick();};
  const ask=text=>{q('#chat-input').value=text;q('#chat-form').onsubmit({preventDefault(){}});};
  click('#login');
  assert.match(q('#phone').textContent,/1,600.00/);
  ask('Transfer $150 to savings');
  assert.match(q('#confirm').textContent,/150.00/);
  click('[data-tab="context"]');
  assert.match(q('#inspector').textContent,/balanceVersion/);
  click('[data-tab="ontology"]');
  click('#spend');click('#confirm');
  assert.match(q('.chat-history').textContent,/Rejected: account state changed/);
  assert.equal(q('#settle'),null);
  ask('Transfer $100 to savings');click('#confirm');click('#settle');
  assert.match(q('.phone-result').textContent,/SETTLED/);
  assert.match(q('.account-values').textContent,/8,300.00/);
  click('#reset');click('#login');
  ask('Transfer $150 to savings');click('#cancel');
  assert.equal(q('#confirm'),null);
  ask('Transfer $150 to savings');click('#confirm');click('#fail');
  assert.match(q('.account-values').textContent,/1,600.00/);
  click('[data-scenario="portfolio"]');ask('Check my portfolio');
  assert.match(q('.portfolio-total').textContent,/50,000.00/);
  click('#market');
  assert.match(q('.warning').textContent,/previous snapshot/);
  click('[data-tab="context"]');
  assert.match(q('#inspector').textContent,/Equity fund/);
  assert.match(q('#inspector .warning').textContent,/Captured quotes v1; current source is v2/);
  click('[data-tab="ontology"]');
  click('#refresh-portfolio');
  assert.match(q('.portfolio-total').textContent,/53,000.00/);
  ask('Show another customer’s portfolio');
  assert.match(q('.chat-history').textContent,/Access denied/);
  ask('<img src=x onerror=alert(1)>');
  assert.equal(q('.chat-history img'),null,'chat text is escaped');
  assert.match(q('.chat-history').textContent,/scripted demo understands/);
  click('[data-tab="compare"]');
  assert.match(q('#inspector').textContent,/same engineering is required/);
  click('[data-tab="ontology"]');click('[data-scenario="transfer"]');
  ask('Transfer $150 to savings');click('#revoke');click('#confirm');
  assert.match(q('.chat-history').textContent,/signing rights were revoked/);
  click('#reset');
  assert.ok(q('#login'));
  assert.equal(q('#confirm'),null);
  assert.match(q('.trace').textContent,/0 events/);
  for(const file of ['demo.html','lab.css','lab.js','lab-model.js']) {
    const text=fs.readFileSync(path.join(root,file),'utf8');
    assert.doesNotMatch(text,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|@import|url\(\s*['"]?https?:\/\//);
  }
  console.log('Banking lab passed: login, exact consent, replacement, invalid amounts, buffer limits, stale state, rights, idempotency, settlement/failure, portfolio snapshots, access denial, escaped chat, tabs, cancel/reset and offline assets.');
})().catch(error=>{console.error(error);process.exitCode=1;});
