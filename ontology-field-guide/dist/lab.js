'use strict';

(() => {
  const q = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dollars = cents => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:2}).format(cents / 100);
  let bank = new BankLabModel();
  let scenario = 'transfer';
  let tab = 'ontology';
  let selected = 'customer';
  let messages = [];
  let experiment = '';
  let observation = null;
  let lastAmount = 15000;
  let lastRequest = '';

  function say(text, role = 'agent') {
    messages.push({text, role});
    if (role === 'agent') q('#announcement').textContent = text;
  }

  function phoneResult() {
    if (scenario === 'portfolio' && bank.portfolio) {
      const p = bank.portfolio;
      return `<section class="phone-result" aria-label="Portfolio result"><span class="receipt-tag">PORT-001 / QUOTE SNAPSHOT v${p.quoteVersion}</span><h3>Your portfolio</h3><div class="portfolio-total">${dollars(p.total)}</div>${p.holdings.map(h=>`<div class="portfolio-row"><span>${h.name}<small>${h.units} units × ${dollars(h.price)}</small></span><strong>${Math.round(h.value / p.total * 100)}%</strong></div>`).join('')}<p class="fine">Fictional USD quotes, not live prices. Rounded allocations. No trade is placed.</p>${p.quoteVersion !== bank.quoteVersion ? '<p class="warning">New quote available. This answer still uses the previous snapshot.</p>' : ''}<button type="button" id="refresh-portfolio" class="button full">Refresh portfolio</button></section>`;
    }
    if (scenario !== 'transfer') return '';
    const i = bank.instruction;
    if (i) {
      return `<section class="phone-result" aria-label="Transfer result"><span class="receipt-tag">${i.id} / ${i.status.toUpperCase()}</span><h3>${dollars(i.amount)} to savings</h3><p>${i.status === 'Queued' ? 'Reserved in checking. Awaiting a simulated bank outcome.' : i.status === 'Settled' ? `Credited to savings. Transaction ${i.transactionId}.` : 'Definitive failure. Reservation released.'}</p>${i.status === 'Queued' ? '<button type="button" id="settle" class="button primary full">Simulate settlement</button><button type="button" id="fail" class="button full">Simulate definitive failure</button>' : ''}</section>`;
    }
    const p = bank.proposal;
    if (p?.status === 'Proposed') {
      return `<section class="phone-result" aria-label="Transfer proposal"><span class="receipt-tag">${p.id} / YOUR APPROVAL REQUIRED</span><h3>${dollars(p.amount)} to your savings</h3><p>From Checking · ACC-101<br>To Savings · ACC-102<br>Currency USD · Fee $0.00<br>Balance evidence v${p.version}</p><button type="button" id="confirm" class="button primary full">Confirm ${dollars(p.amount)} transfer</button><button type="button" id="cancel" class="button full">Cancel proposal</button></section>`;
    }
    return '';
  }

  function renderPhone() {
    q('#phone').innerHTML = `<div class="phone-top"><strong>◈ Grove Bank</strong><span>DEMO APP</span></div>${!bank.signedIn ? `<div class="login-screen"><div class="login-symbol" aria-hidden="true">a.</div><span class="eyebrow">YOUR EVERYDAY BANKING</span><h3>A familiar face.<br>A smarter conversation.</h3><p>Step into Alex’s mobile banking app and meet the assistant.</p><div class="login-identity"><strong>Alex Morgan</strong><span>Demo customer</span></div><button type="button" id="login" class="button primary full">Sign in as Alex <span aria-hidden="true">→</span></button><p class="fine">No credentials needed. This button simulates a trusted session; typing a name in chat does not.</p></div>` : `<div class="account-strip"><p>Hello, Alex. Here’s where you stand.</p><div class="account-values"><div><span>CHECKING / AVAILABLE</span><strong>${dollars(bank.available)}</strong></div><div><span>SAVINGS / POSTED</span><strong>${dollars(bank.savings)}</strong></div></div></div><div class="agent-label">Your banking assistant <span>Scripted demo</span></div><div class="chat-history" role="region" aria-label="Conversation history" tabindex="0">${messages.map(m=>`<div class="message ${m.role === 'user' ? 'user' : ''}"><small>${m.role === 'user' ? 'YOU' : 'GROVE ASSISTANT'}</small>${escape(m.text)}</div>`).join('')}</div>${phoneResult()}<div class="suggestions" aria-label="Suggested requests">${scenario === 'transfer' ? '<button type="button" data-prompt="Transfer $150 to savings">Transfer $150 to savings ↗</button><button type="button" data-prompt="What can I safely transfer?">What can I safely transfer?</button>' : '<button type="button" data-prompt="Check my portfolio">Check my portfolio ↗</button><button type="button" data-prompt="Show another customer’s portfolio">Try another customer’s portfolio</button>'}</div><form class="chat-form" id="chat-form"><label for="chat-input">${scenario === 'transfer' ? 'Try: Transfer $100 to savings' : 'Try: Check my portfolio'}</label><div class="composer"><input id="chat-input" type="text" maxlength="240" autocomplete="off" placeholder="Ask your assistant…" required><button type="submit" class="button primary" aria-label="Send message">Send</button></div></form>`}`;
    const history = q('.chat-history');
    if (history) history.scrollTop = history.scrollHeight;
  }

  function objectData() {
    const common = [
      {id:'customer', type:'Customer', name:'Alex Morgan', fields:{'Primary key':'CUS-001', 'Session':bank.signedIn ? 'Authenticated (simulated)' : 'Not signed in', 'Source':'Customer master'}, why:'A stable business identity. The session resolves the customer; the agent cannot choose a different identity by writing a name.'},
      {id:'rights', type:'AccountOwnership', name:'Owner & signer', fields:{'Primary key':'OWN-001', 'Customer':'CUS-001', 'Account':'ACC-101', 'Can read':'Yes', 'Can transfer':bank.canTransfer ? 'Yes' : 'No'}, why:'The relationship is an object because it has properties of its own: rights, role and effective dates. Reading an account is separate from moving its money.'}
    ];
    if (scenario === 'transfer') return [...common,
      {id:'checking', type:'Account', name:'Everyday checking', fields:{'Primary key':'ACC-101', 'Available':dollars(bank.available), 'Currency':'USD', 'Balance version':bank.version}, why:'The account has an identity independent of a sentence in chat. Available funds change when the source records a spend or reserves a transfer.'},
      {id:'savings', type:'Account', name:'Your savings', fields:{'Primary key':'ACC-102', 'Posted balance':dollars(bank.savings), 'Owned by':'CUS-001', 'Currency':'USD'}, why:'“Savings” resolves to Alex’s specific account, ACC-102. This demo supports this destination only; it never guesses an external recipient.'},
      {id:'commitments', type:'Commitment + Goal', name:'Rent & cash buffer', fields:{'Rent / COM-501':dollars(bank.rent), 'Buffer / GOAL-601':dollars(bank.buffer), 'Maximum transfer':dollars(Math.max(0,bank.available - bank.rent - bank.buffer))}, why:'Named business concepts feed a deterministic policy. The agent does not reduce your buffer to make a request pass.'},
      {id:'action', type:bank.instruction ? 'PaymentInstruction' : 'ActionProposal', name:bank.instruction?.status || bank.proposal?.status || 'Awaiting a request', fields:{'Proposal':bank.proposal?.id || 'None', 'Instruction':bank.instruction?.id || 'None', 'Status':bank.instruction?.status || bank.proposal?.status || 'Not created', 'Amount':bank.proposal ? dollars(bank.proposal.amount) : 'Not specified'}, why:'A proposal, consent, queued instruction and settled transaction are different facts. A linked object does not itself transfer money.'}
    ];
    return [...common,
      {id:'portfolio', type:'Portfolio', name:'Alex’s investments', fields:{'Primary key':'PORT-001', 'Owner':'CUS-001', 'Total':bank.portfolio ? dollars(bank.portfolio.total) : 'Not queried', 'Response snapshot':bank.portfolio ? 'v'+bank.portfolio.quoteVersion : 'None'}, why:'Access follows the authenticated customer-to-portfolio relationship. This is a read operation; it does not create trading authority.'},
      {id:'holding', type:'Holding', name:'Three positions', fields:{'HLD-001':'120 equity fund units', 'HLD-002':'150 bond fund units', 'HLD-003':'50 cash fund units'}, why:'A holding joins a portfolio to an instrument and carries quantity. The same instrument can be held by many portfolios.'},
      {id:'quote', type:'Instrument → Quote', name:'Versioned USD prices', fields:{'Equity fund':dollars(bank.holdings[0].price), 'Bond fund':dollars(bank.holdings[1].price), 'Cash fund':dollars(bank.holdings[2].price), 'Current snapshot':'v'+bank.quoteVersion}, why:'Prices have provenance and a snapshot version. A past answer does not magically update when a new price arrives.'},
      {id:'valuation', type:'Function', name:'Value the portfolio', fields:{'Calculation':'Σ(units × price)', 'Output':'USD total + allocation', 'Side effects':'None'}, why:'A function calculates on resolved objects. The scripted agent explains the result; it does not invent the arithmetic.'}
    ];
  }

  function renderOntology() {
    const objects = objectData();
    const object = objects.find(o=>o.id === selected) || objects[0];
    const checks = bank.checks(lastAmount);
    return `<section class="panel graph-panel"><div class="panel-head"><h3>A shared business model</h3><span class="tag">${bank.signedIn ? 'SESSION: CUS-001' : 'FIXTURE PREVIEW'}</span></div><p>Click an object to inspect its identity, properties, and meaning.</p><div class="object-grid">${objects.map(o=>`<button type="button" class="object-node" data-object="${o.id}" aria-pressed="${o.id === object.id}"><span>${o.type}</span><strong>${o.name}</strong></button>`).join('')}</div><p class="graph-path">${scenario === 'transfer' ? 'Customer → AccountOwnership → Checking → Transfer → Savings<br>Checking → RecurringCommitment + SavingsGoal → Action policy' : 'Customer → owns → Portfolio → contains → Holding<br>Holding → references → Instrument → priced by → Quote'}</p><div class="object-detail"><dl class="properties">${Object.entries(object.fields).map(([key,value])=>`<dt>${escape(key)}</dt><dd>${escape(value)}</dd>`).join('')}</dl><p>${object.why}</p></div></section>
    <section class="panel"><div class="panel-head"><h3>${scenario === 'transfer' ? 'The action contract' : 'The read contract'}</h3><span class="tag">${scenario === 'transfer' ? 'TRANSFER' : 'VALUATION'}</span></div>${scenario === 'transfer' ? `<ul class="policy-list">${checks.map(c=>`<li><span class="policy-state ${!bank.signedIn ? 'wait' : !c.ok ? 'fail' : ''}">${!bank.signedIn ? 'WAIT' : c.ok ? 'PASS' : 'BLOCK'}</span><div>${c.label}<small>${c.detail}</small></div></li>`).join('')}<li><span class="policy-state ${bank.instruction ? '' : 'wait'}">${bank.instruction ? 'BOUND' : 'WAIT'}</span><div>Approval of exact parameters<small>Customer, source, destination, amount, currency and proposal ID.</small></div></li></ul><p class="fine">Current checks for ${dollars(lastAmount)}. The execution gate also rejects a changed evidence version. These are implemented application policies, not automatic properties of a graph.</p>` : '<ul class="policy-list"><li><span class="policy-state">SCOPE</span><div>Only the signed-in customer’s portfolio<small>The object query enforces ownership before returning holdings.</small></div></li><li><span class="policy-state">READ</span><div>No trading action is authorized<small>A portfolio answer does not give the agent permission to rebalance.</small></div></li><li><span class="policy-state">AS OF</span><div>Value is tied to a quote snapshot<small>Quantity × price for each holding; all quotes use USD.</small></div></li></ul>'}</section>${renderExperiments()}`;
  }

  function renderExperiments() {
    return `<section class="panel experiments"><span class="eyebrow">CHANGE THE WORLD, THEN TRY AGAIN</span><h3>${scenario === 'transfer' ? 'Will the old proposal still work?' : 'Will the old answer update itself?'}</h3><p>${scenario === 'transfer' ? 'Propose $150, introduce a $100 spend, then confirm. The old calculation leaves $550 after rent; the new one leaves $450 and breaches the $500 buffer.' : 'Ask for your portfolio, change the equity quote, then refresh. Compare the quoted snapshot and the source version.'}</p><div class="button-row">${scenario === 'transfer' ? `<button type="button" class="button" id="spend" ${!bank.signedIn || bank.available < 10000 ? 'disabled' : ''}>Simulate $100 card spend</button><button type="button" class="button" id="revoke" ${!bank.signedIn || !bank.canTransfer ? 'disabled' : ''}>Revoke transfer rights</button>` : `<button type="button" class="button" id="market" ${!bank.signedIn ? 'disabled' : ''}>Simulate equity price +10%</button>`}</div>${experiment ? `<p class="experiment-status" role="status">${escape(experiment)}</p>` : ''}</section>`;
  }

  function renderContext() {
    const staleContext = observation && (scenario === 'portfolio' && observation.quoteVersion
      ? observation.quoteVersion !== bank.quoteVersion
        ? `Captured quotes v${observation.quoteVersion}; current source is v${bank.quoteVersion}. Refresh the portfolio to update this context.` : ''
      : observation.balanceVersion !== bank.version
        ? `Captured balance v${observation.balanceVersion}; current source is v${bank.version}. Prompt text alone is not current state.` : '');
    return `<section class="panel"><span class="eyebrow">SAME REQUEST / CONVENTIONAL IMPLEMENTATION</span><h3>An agent can work with context and APIs.</h3><p>This view explains how the same task could be implemented without an ontology. It does not execute a second agent or a second transfer.</p><div class="context-step"><h3>1. Context: what the agent is told</h3><pre>${escape(JSON.stringify(observation || {status:'Sign in and ask a question to capture context.'},null,2))}</pre><p>A prompt can contain customer IDs, balances, rules and tool schemas. This snapshot changes only when the app refreshes it.</p></div><div class="context-step"><h3>2. Agent: interpret and select a capability</h3><p>${escape(lastRequest ? 'Request: “'+lastRequest+'”' : 'No request yet. Try a suggestion in the mobile app.')} A model can interpret language and choose a tool. This offline demo uses a small deterministic intent parser.</p></div><div class="context-step"><h3>3. Tools: call a defined interface</h3><pre>${scenario === 'transfer' ? 'getBalance("ACC-101")\ngetAccountRights("CUS-001", "ACC-101")\ntransfer(source, destination, amount, consent)' : 'getHoldings("PORT-001")\ngetQuotes(instrumentIds)\nsum(quantity × price)'}</pre><p>Tool schemas describe arguments and results. The service must still enforce permissions, consent, current funds and duplicate handling.</p></div><div class="warning">${staleContext || 'A well-designed conventional application can enforce the same rules. Context + tools is not inherently unsafe.'}</div></section><section class="panel"><h3>Where does the business meaning live?</h3><p>Without an ontology, identity mappings, account relationships, valuation logic and action policies can live in services, schemas and application code. The work is still necessary; it is organized differently.</p><p>With an ontology, those concepts form an explicit, reusable model that multiple tools and applications can share.</p></section>`;
  }

  function renderCompare() {
    const rows = [
      ['Identity','A prompt or API response includes an account ID.','An Account object has a stable key, typed properties and source mapping.'],
      ['Relationships','Code joins customer, account and rights records.','AccountOwnership is a shared relationship with signing rights and role.'],
      ['Business rules','Service logic validates funds, consent and account rights.','Governed actions reuse named object types and explicit preconditions. Services still enforce them.'],
      ['Tool calls','The agent selects an API and supplies arguments.','The agent still calls tools; those tools query objects or invoke actions against shared contracts.'],
      ['Freshness & execution','Fetch fresh data; reserve funds atomically; reconcile outcomes.','The same engineering is required. An ontology is not a ledger or an automatic freshness guarantee.'],
      ['Reuse','Teams coordinate schemas and repeat mappings where needed.','Teams share the modeled meaning across chat, operations, analytics and other apps.']
    ];
    return `<section class="panel"><span class="eyebrow">DIFFERENT LAYERS, NOT COMPETING AGENTS</span><h3>The ontology is the shared business contract.</h3><p>Context is the information supplied for this turn. The agent interprets the request. Tools expose capabilities. The ontology describes the business entities, their relationships, and the actions allowed on them.</p><div class="comparison-row comparison-heading"><span>CONTEXT + AGENT + TOOLS</span><span>WITH AN ONTOLOGY</span></div>${rows.map(([title,a,b])=>`<div class="comparison-row"><div><h3>${title}</h3><p>${a}</p></div><p>${b}</p></div>`).join('')}</section><section class="panel experiments"><h3>When is it useful?</h3><p>When many workflows need the same definition of “customer,” “available funds,” or “approved transfer.” For a small, isolated feature, ordinary typed APIs and service logic may be sufficient.</p><p>The useful distinction is shared, explicit meaning and governance—not whether an agent can call a function.</p></section>`;
  }

  function renderTrace() {
    return `<details class="trace" ${bank.trace.length ? 'open' : ''}><summary>Execution trace · ${bank.trace.length} ${bank.trace.length === 1 ? 'event' : 'events'}</summary><p class="fine">Observed simulator calls and results, not hidden model reasoning. Tool names and schema are illustrative.</p><ol>${bank.trace.length ? bank.trace.map(t=>`<li><details><summary class="trace-title">${String(t.step).padStart(2,'0')} / ${escape(t.tool)}<span>${escape(t.layer)}</span></summary><pre>${escape(JSON.stringify({input:t.input,output:t.output},null,2))}</pre></details></li>`).join('') : '<li class="fine">Sign in, then ask the agent to create a trace.</li>'}</ol></details>`;
  }

  function render(focusId) {
    const active = document.activeElement;
    const priorId = active?.id;
    const priorObject = active?.dataset?.object;
    const draft = q('#chat-input')?.value || '';
    renderPhone();
    q('#inspector').innerHTML = (tab === 'ontology' ? renderOntology() : tab === 'context' ? renderContext() : renderCompare()) + renderTrace();
    document.querySelectorAll('[data-scenario]').forEach(button=>button.setAttribute('aria-pressed', String(button.dataset.scenario === scenario)));
    document.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-pressed', String(button.dataset.tab === tab)));
    bind();
    if (q('#chat-input')) q('#chat-input').value = draft;
    const target = focusId ? q('#'+focusId) : priorId ? q('#'+priorId) : priorObject ? q(`[data-object="${priorObject}"]`) : null;
    if (target && !target.disabled) target.focus({preventScroll:true});
  }

  function ask(text) {
    if (!bank.signedIn || !text.trim()) return;
    text = text.trim().slice(0,240);
    lastRequest = text;
    say(text,'user');
    observation = {customerId:'CUS-001', checkingAvailable:dollars(bank.available), balanceVersion:bank.version, rent:dollars(bank.rent), minimumBuffer:dollars(bank.buffer), request:text};
    if (/portfolio|investments|holdings/i.test(text)) {
      scenario = 'portfolio'; selected = 'portfolio';
      const result = bank.readPortfolio(/another|other|someone|jamie|jordan/i.test(text) ? 'CUS-OTHER' : 'CUS-001');
      if (result.ok) observation = {...observation, portfolioId:result.portfolio.id, quoteVersion:result.portfolio.quoteVersion, holdings:result.portfolio.holdings.map(h=>({instrument:h.name,units:h.units,unitPrice:dollars(h.price)})), total:dollars(result.portfolio.total)};
      say(result.ok ? `Your portfolio is ${dollars(result.portfolio.total)} across three holdings, using fictional USD quotes v${result.portfolio.quoteVersion}. I calculated each position as units × price. This is a read-only check; no trades were placed.` : result.message);
    } else if (/^what can i (safely )?transfer\??$/i.test(text)) {
      scenario = 'transfer'; selected = 'commitments';
      say(bank.canTransfer ? `After reserving $900 for rent and a $500 buffer, the current maximum is ${dollars(Math.max(0,bank.available - bank.rent - bank.buffer))}. Ask “Transfer $150 to savings” to review an exact proposal.` : 'You can read this account, but transfer rights are revoked. No transfer can be authorized.');
      bank.record('calculateSurplus', {accountId:'ACC-101', version:bank.version}, {maximumCents:Math.max(0,bank.available - bank.rent - bank.buffer),canTransfer:bank.canTransfer}, 'Function');
    } else {
      const match = text.match(/^(?:transfer|move)\s+\$?(\d+(?:\.\d{1,2})?)\s+(?:usd\s+)?to\s+(?:my\s+)?savings[.!]?$/i);
      if (match) {
        scenario = 'transfer'; selected = 'action';
        lastAmount = Math.round(Number(match[1])*100);
        const result = bank.propose(lastAmount);
        say(result.ok ? `I can move ${dollars(lastAmount)} from your checking to your savings. That leaves ${dollars(bank.available-lastAmount-bank.rent)} after rent, above or equal to your $500 buffer. Review the exact details and confirm below.` : result.message);
      } else {
        say('This scripted demo understands “Transfer $150 to savings,” “What can I safely transfer?” and “Check my portfolio.” Use an exact USD amount and your savings account. Other requests do not execute anything.');
      }
    }
    if (q('#chat-input')) q('#chat-input').value = '';
    render('chat-input');
  }

  function bind() {
    if (q('#login')) q('#login').onclick = () => {
      bank.login();
      say('Hi Alex. I can help you move money to savings or check your portfolio. You approve every transfer. Choose a suggestion below.');
      render('chat-input');
    };
    document.querySelectorAll('[data-prompt]').forEach(button=>button.onclick=()=>ask(button.dataset.prompt));
    document.querySelectorAll('[data-object]').forEach(button=>button.onclick=()=>{selected=button.dataset.object;render();});
    if (q('#chat-form')) q('#chat-form').onsubmit = event => {event.preventDefault();ask(q('#chat-input').value);};
    if (q('#confirm')) q('#confirm').onclick = () => {const result=bank.confirm(bank.proposal.id);say(result.message);render(result.ok ? 'settle' : 'chat-input');};
    if (q('#cancel')) q('#cancel').onclick = () => {bank.proposal.status='Cancelled';say('Proposal cancelled. No money moved. Ask again to create a new proposal.');render('chat-input');};
    for (const [id,success] of [['settle',true],['fail',false]]) if (q('#'+id)) q('#'+id).onclick=()=>{say(bank.resolve(success).message);render('chat-input');};
    if (q('#spend')) q('#spend').onclick=()=>{bank.spend();experiment=`Source updated to v${bank.version}: checking now has ${dollars(bank.available)} available. Any old proposal keeps its old evidence version.`;render();q('#announcement').textContent=experiment;};
    if (q('#revoke')) q('#revoke').onclick=()=>{bank.revoke();experiment='OWN-001 now permits reads only. A pending proposal cannot authorize a transfer. Reset the demo to restore rights.';render('chat-input');q('#announcement').textContent=experiment;};
    if (q('#market')) q('#market').onclick=()=>{bank.moveMarket();experiment=`Equity price is now ${dollars(bank.holdings[0].price)}, source v${bank.quoteVersion}. Refresh the portfolio to calculate a new answer.`;render();q('#announcement').textContent=experiment;};
    if (q('#refresh-portfolio')) q('#refresh-portfolio').onclick=()=>ask('Check my portfolio');
  }

  document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{tab=button.dataset.tab;render();});
  document.querySelectorAll('[data-scenario]').forEach(button=>button.onclick=()=>{
    scenario=button.dataset.scenario;selected='customer';experiment='';
    if (bank.proposal?.status === 'Proposed') {bank.proposal.status='Cancelled';say('The unsubmitted proposal was cancelled when you changed journeys. Ask again to review a fresh proposal.');}
    render();
  });
  q('#reset').onclick=()=>{bank=new BankLabModel();messages=[];observation=null;lastRequest='';lastAmount=15000;experiment='';selected='customer';render('login');q('#announcement').textContent='Demo reset. All balances and permissions restored.';};
  render();
})();
