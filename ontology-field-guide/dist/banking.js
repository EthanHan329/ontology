const BankingDemo = (() => {
  const catalog = [
    ['Customer', 'CUS-001 · Alex Morgan', 'Identity, preferences; never a substitute for an authenticated session.', 'Owns accounts through AccountOwnership; requests AgentTasks.'],
    ['Account', 'ACC-101 · Everyday checking', 'Currency USD; ledger $1,700; existing holds $100; available $1,600.', 'Has BalanceSnapshots, Transactions and PaymentInstructions.'],
    ['AccountOwnership', 'OWN-001 · Alex → ACC-101', 'Relationship object: owner, signer permissions, effective dates.', 'Connects Customer and Account; joint ownership needs explicit rights.'],
    ['BalanceSnapshot', 'BAL-101 · version 7', 'Available $1,600 at observation time; availability can change.', 'Describes an Account at a point in time; not spend authorization.'],
    ['Transaction', 'TXN-900 · salary +$2,800', 'Posted movement with amount, currency, posting date and reference.', 'Belongs to Account; payment settlement can create one.'],
    ['Card', 'CARD-401 · ending 4821', 'Active; daily limit; masked identifier. Keep raw card secrets out of agent context.', 'Issued against Account; may have Merchant transactions.'],
    ['Merchant', 'MER-008 · Corner Market', 'Canonical merchant identity and spending category.', 'Linked to card Transactions; distinct from a payment Payee.'],
    ['Payee', 'PAY-201 · City Energy', 'Verified existing destination; masked account ending 7712.', 'Receives PaymentInstructions; issues Bills.'],
    ['Bill', 'BILL-301 · electricity $115', 'Amount, currency, due date and unpaid status; not evidence of settlement.', 'Issued by Payee; linked to the instruction paying it.'],
    ['RecurringCommitment', 'COM-501 · rent $900', 'Confirmed upcoming rent, excluded from spendable surplus.', 'Belongs to Customer and a funding Account.'],
    ['SavingsGoal', 'GOAL-601 · emergency buffer $500', 'A customer preference constraining the proposal.', 'May refer to an Account; not an automatic debit mandate.'],
    ['AgentTask', 'TASK-701 · pay electricity', 'Customer request, allowed scope, lifecycle and execution identity.', 'Uses observations and creates ActionProposals.'],
    ['ActionProposal', 'PROP-001 · pay $115', 'Exact source, destination, bill, amount, currency and rationale.', 'References evidence; must be approved before submission here.'],
    ['Consent', 'CONS-001 · proposal approval', 'Customer approval bound to exact parameters and proposal version.', 'Authorizes a specific proposal; not every future agent action.'],
    ['PaymentInstruction', 'PI-001 · awaiting settlement', 'Accepted command with idempotency key and external status.', 'Connects source Account, Payee, Bill and eventual Transaction.'],
    ['AuditEvent', 'EVT-001 · proposal created', 'Actor, action, timestamp, outcome and correlation references.', 'Explains the chain from request through confirmed outcome.']
  ];
  const journeys = {
    balances: ['“What can I spend today?”', 'Customer → AccountOwnership → Account → BalanceSnapshot → RecurringCommitment', 'Read available funds and known commitments; show freshness and distinguish estimates. No money movement.', 'ReadBalances, SummarizeCashFlow', 'A snapshot is an observation, not a promise that money stays available.'],
    bills: ['“Pay my electricity bill and keep a $500 buffer.”', 'AgentTask → Bill → Payee; Customer → Account → PaymentInstruction → Transaction', 'Read context, propose an exact payment, request approval, submit once, then reconcile the result.', 'ProposeBillPayment, ApproveProposal, SubmitPayment, RecordSettlement', 'An accepted instruction is not yet a settled transaction.'],
    saving: ['“Move my spare cash into savings.”', 'Customer → AccountOwnership → Account; RecurringCommitment + SavingsGoal → ActionProposal', 'Calculate surplus from confirmed balances and commitments. Propose a transfer with source, target, amount and currency.', 'CalculateSurplus, ProposeTransfer, SubmitTransfer', 'Do not silently sweep a second account or change a goal to make a proposal pass.'],
    cards: ['“I cannot find my card.”', 'Customer → AccountOwnership → Account → Card; AgentTask → ActionProposal → AuditEvent', 'Identify the masked card and propose a reversible freeze. Confirm the selected card, then track the processor response.', 'ReadCardStatus, ProposeCardFreeze, FreezeCard', 'A card freeze does not imply account closure or cancellation of every recurring payment.']
  };
  const schemas = {
    Customer:{key:'customerId',fields:{name:'string',preferences:'object'},source:'customer_master'},
    Account:{key:'accountId',fields:{currency:'string',ledgerCents:'integer',status:'enum'},source:'core_account_records'},
    AccountOwnership:{key:'ownershipId',fields:{role:'enum',signingRights:'string[]',effectiveFrom:'timestamp'},source:'account_rights'},
    BalanceSnapshot:{key:'snapshotId',fields:{accountId:'string / ID',availableCents:'integer',observedAt:'timestamp',version:'integer'},source:'balance_observations'},
    Transaction:{key:'transactionId',fields:{amountCents:'integer',currency:'string',postedAt:'timestamp',reference:'string'},source:'posted_ledger_entries'},
    Card:{key:'cardId',fields:{maskedNumber:'string',status:'enum',limitCents:'integer'},source:'card_processor_records'},
    Merchant:{key:'merchantId',fields:{name:'string',category:'string'},source:'merchant_directory'},
    Payee:{key:'payeeId',fields:{name:'string',maskedDestination:'string',verified:'boolean'},source:'verified_payees'},
    Bill:{key:'billId',fields:{amountCents:'integer',currency:'string',dueDate:'date',status:'enum'},source:'bill_obligations'},
    RecurringCommitment:{key:'commitmentId',fields:{amountCents:'integer',nextDue:'date',confidence:'enum'},source:'customer_commitments'},
    SavingsGoal:{key:'goalId',fields:{targetCents:'integer',scope:'string'},source:'customer_preferences'},
    AgentTask:{key:'taskId',fields:{request:'string',scope:'string[]',executionIdentity:'string',status:'enum'},source:'application_tasks'},
    ActionProposal:{key:'proposalId',fields:{amountCents:'integer',currency:'string',evidenceVersion:'integer',rationale:'string'},source:'application_proposals'},
    Consent:{key:'consentId',fields:{proposalId:'string / ID',actorId:'string / ID',approvedAt:'timestamp',expiresAt:'timestamp'},source:'authorization_records'},
    PaymentInstruction:{key:'instructionId',fields:{amountCents:'integer',idempotencyKey:'string',status:'enum'},source:'payment_service_acknowledgments'},
    AuditEvent:{key:'eventId',fields:{actorId:'string / ID',occurredAt:'timestamp',outcome:'enum',correlationId:'string'},source:'application_audit_events'}
  };
  const graphNodes = [
    {type:'Customer', label:'Alex Morgan', x:10,y:45},
    {type:'Account', label:'Everyday checking', x:250,y:45},
    {type:'AgentTask', label:'Pay electricity', x:10,y:220},
    {type:'Bill', label:'Electricity · $115', x:250,y:220},
    {type:'Payee', label:'City Energy', x:490,y:220},
    {type:'PaymentInstruction', label:'Payment lifecycle', x:490,y:45}
  ];
  const graphEdges = [[0,1,'authorized owner'],[0,2,'requests'],[2,3,'targets'],[3,4,'issued by'],[1,5,'funds'],[5,4,'pays']];
  let selected = 'Account', journey = 'bills', sequence = 0, mode = 'instances';
  let state;
  const initial = () => ({amount:'115.00',role:'customer',available:160000,reserved:0,posted:0,externalSpend:0,proposal:null,consent:false,instruction:null,bill:'Unpaid',events:[],message:'Start by proposing a payment. All people, balances and rules are fictional.',error:false});
  state = initial();
  const dollars = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
  const cents = OntologyModel.parseAmount;
  const available = () => state.available-state.reserved-state.posted;
  const event = detail => state.events.unshift({at:new Date().toISOString(),detail});
  const say = (message,error=false) => {state.message=message;state.error=error;};
  function policy() {
    return OntologyModel.validate({role:state.role,amount:cents(state.amount),available:available(),bill:state.bill});
  }
  function graph() {
    return `<svg viewBox="0 0 700 305" role="img" aria-label="Banking objects and relationships. Each object has a keyboard-accessible inspect button."><title>Everyday banking ontology</title>${graphEdges.map(([a,b,label])=>{const n=graphNodes[a],m=graphNodes[b];return `<line x1="${n.x+90}" y1="${n.y+32}" x2="${m.x+90}" y2="${m.y+32}"/><text class="edge-label" text-anchor="middle" x="${(n.x+m.x)/2+90}" y="${(n.y+m.y)/2+20}">${label}</text>`;}).join('')}${graphNodes.map(n=>`<g class="node ${selected===n.type?'selected':''}" role="button" tabindex="0" aria-label="Inspect ${n.type}" data-bank-node="${n.type}" transform="translate(${n.x},${n.y})"><rect width="180" height="63" rx="4"/><text class="type" x="12" y="23">${mode==='schema'?'OBJECT TYPE':n.type}</text><text x="12" y="43">${mode==='schema'?n.type:n.label}</text></g>`).join('')}</svg>`;
  }
  function inspector() {
    const row=catalog.find(r=>r[0]===selected);
    const schema=schemas[selected];
    if(mode==='schema')return `<div class="tag">SCHEMA DEFINITION / ${esc(selected)}</div><h3>${esc(selected)}</h3><p>One ${selected==='AccountOwnership'?'customer-account rights relationship':selected==='BalanceSnapshot'?'account observation at a point in time':selected+' identity'} per primary key.</p>${Object.entries({[schema.key]:'string / primary key',...schema.fields}).map(([k,v])=>`<div class="kv"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}<p>BACKING DATA<br><code>${schema.source}</code></p><p>${esc(row[3])}</p>`;
    let live='';
    if(selected==='Account')live=`<div class="kv"><span>Available now</span><span>${dollars(available())}</span></div><div class="kv"><span>Demo reservation</span><span>${dollars(state.reserved)}</span></div>`;
    if(selected==='Bill')live=`<div class="kv"><span>Status</span><span>${state.bill}</span></div>`;
    if(selected==='PaymentInstruction')live=`<div class="kv"><span>Status</span><span>${state.instruction?.status||'Not created'}</span></div><div class="kv"><span>Transaction</span><span>${state.bill==='Paid'?'TXN-901':'Not posted'}</span></div>`;
    return `<div class="tag">OBJECT INSTANCE / ${esc(row[0])}</div><h3>${esc(row[1])}</h3><p>${esc(row[2])}</p><p>${esc(row[3])}</p>${live}<p>BACKING DATA<br><code>${schema.source}</code></p><p>Illustrative application schema, not a prebuilt Palantir or universal bank schema. Snapshot values describe the initial observation; live fields show the current simulation.</p>`;
  }
  function world(graphMode='instances') {
    mode=graphMode;
    return `<div class="world"><div class="world-head"><span>ONE CUSTOMER / CONNECTED BUSINESS CONTEXT</span><span>FICTIONAL BANK · OFFLINE SIMULATION</span></div><div class="world-body"><div class="graph" id="bank-graph">${graph()}</div><aside class="inspector" id="bank-inspector">${inspector()}</aside></div><div class="world-foot"><span>Objects: business entities and events</span><span>Links: business relationships</span><span>Select an object to inspect</span></div></div>`;
  }
  function rows(query='') {
    const matches=catalog.filter(row=>(row.join(' ')+' '+JSON.stringify(schemas[row[0]])).toLowerCase().includes(query.toLowerCase()));
    return matches.length?matches.map(row=>`<tr><td>${esc(row[0])}</td><td class="mono">${mode==='schema'?esc(schemas[row[0]].key):esc(row[1].split(' · ')[0])}</td><td>${esc(mode==='schema'?Object.keys(schemas[row[0]].fields).join(', '):row[1])}</td><td><button data-bank-inspect="${row[0]}">Inspect →</button></td></tr>`).join(''):'<tr><td colspan="4" class="empty">No matching banking objects. Try “Bill”, “Account”, or “BILL-301”.</td></tr>';
  }
  function journeyView() {
    const [request,path,explanation,actions,boundary]=journeys[journey];
    return `<h3>${request}</h3><p class="mono">${path}</p><p>${explanation}</p><p><strong>Candidate action types:</strong> ${actions}</p><p><strong>Boundary:</strong> ${boundary}</p>`;
  }
  function workbench() {
    return `      <div class="section-heading" id="bank-workbench"><h2>“Pay the electricity bill.”</h2><span>PROPOSE → APPROVE → SUBMIT → RECONCILE</span></div>
      <div class="split"><section class="panel"><div class="eyebrow">01 / CONTEXT & PROPOSAL</div><h2>Protect the customer’s intent</h2><p class="bodycopy">Available checking balance $1,600 = ledger $1,700 − existing holds $100. Reserve $900 for rent and keep a $500 buffer. Savings of $4,200 are outside this task’s spending scope.</p>
      <label class="field">Execution authority<select id="bank-role"><option value="customer">Customer with payment authority</option><option value="reader">Read-only assistant</option></select></label>
      <label class="field">Payment amount (USD)<input id="bank-amount" type="number" min="0.01" step="0.01" value="${esc(state.amount)}"></label>
      <button class="btn primary" id="bank-propose">Create proposal</button><div id="bank-proposal"></div><button class="btn" id="bank-debit">Simulate another $100 card spend</button><p class="bodycopy">Use after approval to test stale evidence: submission must recheck the current balance.</p></section>
      <section class="panel"><div class="eyebrow">02 / AUTHORIZATION & OUTCOME</div><h2>Approval has an exact scope</h2><p class="bodycopy">This demo requires approval of the specific proposal. Changing the amount or authority invalidates both proposal and approval. Submission reserves funds locally; settlement is a separate simulated acknowledgment.</p>
      <label><input type="checkbox" id="bank-consent"> I approve this exact payment proposal.</label><div class="actions"><button class="btn primary" id="bank-submit">Submit approved payment</button><button class="btn" id="bank-settle">Simulate settlement</button><button class="btn" id="bank-fail">Simulate failure</button><button class="btn" id="bank-reset">Reset banking demo</button></div>
      <div id="bank-status" role="status" aria-live="polite"></div><div id="bank-state"></div></section></div>
      <div class="section-heading"><h2>Explain every step</h2><span>LOCAL EVENT TRAIL</span></div><ul class="log" id="bank-log"></ul>
`;
  }
  function view() {
    return `${intro('01','Everyday banking.<br><em>Objects before agents.</em>','A customer says: “Pay my electricity bill, keep enough for rent, and leave a $500 buffer.” Every chapter follows this same banking model from intent to evidence, authorization and confirmed outcome.')}
      <div class="actions"><button class="btn primary" id="bank-start">Try the bill-payment demo ↓</button><a class="btn" href="docs/AGENTIC_BANKING.md">Banking walkthrough (.md) ↗</a><a class="btn" href="#overview">Learn the mental model →</a></div>
      ${world()}
      <div class="section-heading"><h2>A day in the customer’s life</h2><span>FOUR INTENTS / ONE SHARED MODEL</span></div>
      <label class="field">Customer request<select id="bank-journey">${Object.entries(journeys).map(([key,v])=>`<option value="${key}" ${journey===key?'selected':''}>${v[0]}</option>`).join('')}</select></label><section class="panel" id="bank-journey-detail">${journeyView()}</section>
      <div class="section-heading"><h2>The object vocabulary</h2><span>TYPE ≠ INSTANCE ≠ ACTION</span></div><p class="bodycopy">“SubmitPayment” is an action type. “PaymentInstruction PI-001” is an object instance tracking the command. These 16 types are an illustrative application schema; a generated SDK exposes the configured schema rather than supplying a universal banking model.</p>
      <div class="table-wrap"><table><thead><tr><th>Object type</th><th>Fictional instance</th><th>Properties & meaning</th><th>Relationships</th></tr></thead><tbody>${catalog.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      ${workbench()}
      <div class="callout">A deterministic, offline teaching simulation.<p>No live AI, authentication, payment network or money movement. The browser role and approval controls illustrate policy; trusted services must enforce it in production. Refresh resets the simulation.</p></div><p>${cite(2)} · ${cite(4)} · ${cite(11)} · ${cite(16)}</p>`;
  }
  function decisionView() {
    return `${intro('04','From customer intent<br>to <em>confirmed outcome.</em>','Read the linked bill, account and payee. Calculate the remaining buffer, approve an exact proposal, submit once, then reconcile settlement or definitive failure. This is the same shared simulation used in Everyday banking.')}
      ${world()}${workbench()}<div class="callout">Accepted instruction ≠ settled payment.<p>Local object changes, funds reservation, a payment-service request and a ledger acknowledgment have different ownership and failure boundaries. These controls simulate that lifecycle without contacting any system.</p></div><p>${cite(4)} · ${cite(5)} · ${cite(11)} · ${cite(12)}</p>`;
  }
  function refresh() {
    const p=state.proposal, instruction=state.instruction;
    $('#bank-proposal').innerHTML=p?`<h3>${p.id} / exact proposal</h3><p>Pay ${dollars(p.amount)} from ACC-101 to PAY-201 (••7712), for BILL-301, in USD.</p><p>Remaining after payment and rent: <strong>${dollars(p.afterCommitments)}</strong>. Required buffer: $500.00.</p><p class="bodycopy">Evidence: balance version 7, verified payee, unpaid bill, authorized owner. Submission rechecks the current local state.</p>`:'<p class="bodycopy">No active proposal. Read context before authorizing a change.</p>';
    $('#bank-status').className='status'+(state.error?' error':'');
    $('#bank-status').textContent=state.message;
    $('#bank-consent').checked=state.consent;
    $('#bank-consent').disabled=!p||Boolean(instruction);
    $('#bank-submit').disabled=!p||!state.consent||Boolean(instruction);
    $('#bank-propose').disabled=instruction?.status==='Queued'||state.bill==='Paid';
    $('#bank-debit').disabled=Boolean(state.externalSpend)||instruction?.status==='Queued'||state.bill==='Paid';
    $('#bank-settle').disabled=instruction?.status!=='Queued';
    $('#bank-fail').disabled=instruction?.status!=='Queued';
    const locked=instruction?.status==='Queued'||state.bill==='Paid';
    $('#bank-amount').disabled=locked;
    $('#bank-role').disabled=locked;
    $('#bank-state').innerHTML=`<div class="kv"><span>Available funds</span><strong>${dollars(available())}</strong></div><div class="kv"><span>New reservation</span><strong>${dollars(state.reserved)}</strong></div><div class="kv"><span>Instruction</span><strong>${instruction?.status||'Not submitted'}</strong></div><div class="kv"><span>Bill</span><strong>${state.bill}</strong></div><div class="kv"><span>Posted transaction</span><strong>${state.bill==='Paid'?'TXN-901 · −$115.00':'None for this bill'}</strong></div>`;
    $('#bank-log').innerHTML=state.events.length?state.events.map(e=>`<li><span>${esc(e.at)}</span><br>${esc(e.detail)}</li>`).join(''):'<li>No actions yet. The agent has no automatic payment authority.</li>';
    $('#bank-inspector').innerHTML=inspector();
  }
  function bindGraph() {
    document.querySelectorAll('[data-bank-node]').forEach(button=>{
      const activate=()=>{selected=button.dataset.bankNode;$('#bank-graph').innerHTML=graph();$('#bank-inspector').innerHTML=inspector();bindGraph();};
      button.onclick=activate;
      button.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}};
    });
    document.querySelectorAll('[data-bank-inspect]').forEach(button=>button.onclick=()=>{
      selected=button.dataset.bankInspect;
      $('#bank-graph').innerHTML=graph();
      $('#bank-inspector').innerHTML=inspector();
      bindGraph();
    });
  }
  function bind() {
    bindGraph();
    if($('#bank-start'))$('#bank-start').onclick=()=>$('#bank-workbench').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    $('#bank-role').value=state.role;
    if($('#bank-journey'))$('#bank-journey').onchange=e=>{journey=e.target.value;$('#bank-journey-detail').innerHTML=journeyView();};
    const invalidate=()=>{state.amount=$('#bank-amount').value;state.role=$('#bank-role').value;state.proposal=null;state.consent=false;if(state.instruction?.status==='Failed')state.instruction=null;say('Parameters changed. Create and approve a new proposal.');refresh();};
    $('#bank-amount').oninput=invalidate;
    $('#bank-role').onchange=invalidate;
    $('#bank-debit').onclick=()=>{
      if(state.externalSpend||state.instruction?.status==='Queued'||state.bill==='Paid')return;
      state.available-=10000;state.externalSpend=10000;
      event('Observed a simulated $100 card spend. Current available funds are now $1,500. Earlier proposal evidence is stale.');
      say('Balance changed after observation. Submission will recheck the $500 buffer against current funds.');refresh();
    };
    $('#bank-propose').onclick=()=>{
      if(state.instruction?.status==='Queued'||state.bill==='Paid')return;
      const error=policy();
      if(error){state.proposal=null;state.consent=false;say(error,true);event(error);refresh();return;}
      state.instruction=null;state.consent=false;
      state.proposal={id:'PROP-'+String(++sequence).padStart(3,'0'),amount:cents(state.amount),afterCommitments:OntologyModel.evaluate(available(),cents(state.amount)).remaining};
      event(`${state.proposal.id}: proposed USD 115.00 to verified PAY-201 for BILL-301; no funds moved.`);
      say('Proposal ready. Review the exact source, payee, amount and remaining buffer.');refresh();
    };
    $('#bank-consent').onchange=e=>{if(!state.proposal||state.instruction)return;state.consent=e.target.checked;event(`${state.proposal.id}: customer ${state.consent?'approved':'revoked approval of'} the exact proposal.`);say(state.consent?'Approval recorded locally. Submission will recheck policy.':'Approval revoked.');refresh();};
    $('#bank-submit').onclick=()=>{
      if(state.instruction){say('Duplicate submission blocked. This proposal already has an instruction.',true);refresh();return;}
      if(!state.proposal||!state.consent){say('Approval required for a current, exact proposal.',true);refresh();return;}
      const error=policy();if(error){say(error,true);event(error);refresh();return;}
      state.reserved=state.proposal.amount;
      state.instruction={id:'PI-'+state.proposal.id.slice(5),key:'payment:'+state.proposal.id,status:'Queued'};
      event(`${state.instruction.id}: queued once with key ${state.instruction.key}; $115.00 reserved locally. Bill still unpaid.`);
      say('Instruction queued; settlement is pending. No network request was made.');refresh();
    };
    $('#bank-settle').onclick=()=>{
      if(state.instruction?.status!=='Queued')return;
      state.instruction.status='Settled';state.posted+=state.reserved;state.reserved=0;state.bill='Paid';
      event(`${state.instruction.id}: simulated settlement confirmed; reservation released into TXN-901; BILL-301 marked paid. Funds deducted only once.`);
      say('Simulated settlement confirmed. Bill paid; one transaction posted.');refresh();
    };
    $('#bank-fail').onclick=()=>{
      if(state.instruction?.status!=='Queued')return;
      state.instruction.status='Failed';state.reserved=0;state.proposal=null;state.consent=false;
      event(`${state.instruction.id}: definitive simulated failure; reservation released, bill unpaid. A retry requires a new proposal and approval.`);
      say('Simulated failure confirmed. Funds released; bill remains unpaid. Review before retrying.',true);refresh();
    };
    $('#bank-reset').onclick=()=>{state=initial();render();};
    refresh();
  }
  return {view,decisionView,world,rows,bind,bindGraph};
})();
