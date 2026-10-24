const $=s=>document.querySelector(s);const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sources=[
['Ontology overview','ontology/overview','The operational layer: semantics, kinetics, and applications.'],['Core concepts','ontology/core-concepts','Separate type definitions from individual instances.'],['Object types','object-link-types/object-types-overview','Model entities and events with identity and properties.'],['Link types','object-link-types/link-types-overview','Bidirectional relationships and their backing data.'],['Action types','action-types/overview','Reusable definitions for governed business changes.'],['Submission criteria','action-types/submission-criteria','Control when an action can be submitted.'],['Action rules','action-types/rules','Translate action parameters into edits and effects.'],['Functions on objects','functions/functions-on-objects','Code that operates on objects and object sets.'],['Object sets (TSv1 reference)','functions/api-object-sets','Filtering, traversal, and aggregation; version-specific API.'],['Interfaces','interfaces/interface-overview','Abstract contracts; support differs by application and language.'],['How edits are applied','object-edits/how-edits-applied','How source data and user edits contribute to object state.'],['Consistency and isolation','action-types/consistency-guarantees','Atomic object edits, write modes, and concurrency.'],['External-system action patterns','action-types/explore-action-types','Webhook versus writeback-webhook behavior.'],['Object & property security','object-permissioning/object-security-policies','Read access at object and property granularity.'],['Access-control propagation','security/access-control-propagation','Mandatory controls versus read-time filtering.'],['Developer toolchain / OSDK','dev-toolchain','Generated SDKs and application access to Ontology capabilities.'],['AIP Logic','logic','LLM-powered functions, testing, and operational workflows.'],['Models','model-integration/models','Prediction and optimization artifacts operationalized in Foundry.'],['Indexing restrictions','object-indexing/data-restrictions','Primary-key uniqueness and type coherence in OSv2.'],['Action test runs','action-types/test-run','External calls may still execute during platform test runs.'],['Ontology system architecture','architecture-center/ontology-system','The larger architecture around the Ontology.']];
const cite=i=>`<a class="source-link" href="https://www.palantir.com/docs/foundry/${sources[i][1]}" target="_blank" rel="noreferrer">↗ ${sources[i][0]}</a>`;

let explorerMode='instances', quizAnswers={};
function intro(num,title,lede) {
  return `<div class="eyebrow">CHAPTER ${num} / THE ONTOLOGY FIELD GUIDE</div><h1>${title}</h1><p class="lede">${lede}</p>`;
}
const studyPath=[
  ['Vocabulary','Explain Customer, Account, Bill and PaymentInstruction. Distinguish a type, an instance, a function and an action.'],
  ['Modeling','Define identity, grain and cardinalities for AccountOwnership, BalanceSnapshot, Consent and PaymentInstruction.'],
  ['Data & queries','Map customer records, account rights, balance observations and bills. Trace an authorized customer to their unpaid obligations.'],
  ['Actions & logic','Specify ProposeBillPayment, ApproveProposal and SubmitPayment. Calculate USD 585 remaining against the USD 500 buffer.'],
  ['Security & reliability','Test changed balances, missing payment rights, duplicate submissions, definitive failure and unknown payment outcomes.'],
  ['AI & applications','Design scoped query, calculation and action tools. Bind approval to an exact proposal; separate the model from execution authority.'],
  ['Teach & defend','Present the banking demo, answer the quiz, and defend source ownership, freshness, consent and settlement boundaries.']
];
const questions=[
  {tag:'IDENTITY',q:'What is ACC-101 in this banking model?',options:['An object type defining every account','An Account instance with a stable identity','An action that authorizes a payment'],answer:1,why:'Account is the type. ACC-101 is one specific account, with its own identity, currency and lifecycle.'},
  {tag:'RELATIONSHIPS',q:'Why might AccountOwnership deserve its own object?',options:['Because every link must have an object','Because rights, roles and effective dates describe the ownership relationship','Because a customer can own only one account'],answer:1,why:'A relationship object can carry signing rights and effective dates. Customers and accounts can have a many-to-many relationship.'},
  {tag:'CALCULATION',q:'USD 1,600 is available, the bill is USD 115 and rent is USD 900. What remains?',options:['USD 585, exceeding the USD 500 buffer by USD 85','USD 1,485 after all commitments','USD 485, so the initial proposal must fail'],answer:0,why:'1,600 − 115 − 900 = 585. Rent is a planning constraint here; it is not a second existing ledger hold.'},
  {tag:'CONSENT',q:'The customer approves a proposal, then its amount changes. What should happen?',options:['Approval applies to every payment in the same conversation','The agent can infer renewed approval','Invalidate the proposal and require fresh approval of exact parameters'],answer:2,why:'Consent is bound to a specific proposal. The demo invalidates it when the amount or authority changes.'},
  {tag:'FRESHNESS',q:'A competing USD 100 spend arrives after approval. What should submission do?',options:['Use the old balance because approval already happened','Recheck current funds and reject a USD 485 remainder against the USD 500 buffer','Take money from savings without asking'],answer:1,why:'A proposal is not a funds reservation. Current data and constraints must be rechecked at execution.'},
  {tag:'RELIABILITY',q:'The PaymentInstruction is Queued. Is the electricity bill paid?',options:['Yes, all connected systems share one transaction','Only after a confirmed settlement outcome; queued is still unpaid here','Yes, because a Bill-to-Payee link moves money'],answer:1,why:'An instruction records intent. A confirmed external outcome creates the posted transaction and changes the bill to Paid in this simulation.'},
  {tag:'GOVERNANCE',q:'The assistant can read an account balance. What follows?',options:['It can submit payments from that account','It can change the customer’s buffer to make a payment pass','Read visibility can exist without payment authority'],answer:2,why:'Data access, task scope, account rights and permission to execute an action are separate controls.'},
  {tag:'AI & ABSTRACTION',q:'What does an Ontology give an agentic banking workflow?',options:['Governed business objects and callable capabilities; exact interface and SDK support must be checked','A guarantee that every generated answer is correct','A built-in universal banking ledger and automatic consent'],answer:0,why:'The banking schema and tools are application design. Ontology concepts provide shared contracts; they do not replace authentication, a ledger, or model evaluation.'}
];
const pages={
  banking:()=>`<div class="actions" style="margin:0 0 28px"><a class="btn primary" href="demo.html">Open the interactive banking lab →</a><span class="bodycopy">Sign in, chat, transfer, and inspect what the ontology adds.</span></div>${BankingDemo.view()}`,
  overview() {
    return `<div class="hero-row"><div>${intro('02','A banking world model.<br>Built to <em>take action.</em>','An agent can understand “pay my bill” only when customer identity, account rights, funds, obligations and permitted actions have shared meaning. The Ontology connects that context to governed operations.')}<div class="actions"><a class="btn primary" href="#explorer">Explore the banking objects →</a><a class="btn" href="#decisions">Run the payment workflow →</a></div></div><div class="stamp">ONE RUNNING EXAMPLE<br>16 candidate object types<br>4 everyday customer journeys<br>1 shared payment lifecycle</div></div>
    ${BankingDemo.world()}
    <div class="section-heading"><h2>Three ideas. One banking decision.</h2><span>THE MENTAL MODEL</span></div>
    <div class="three"><article class="concept"><span class="num">01 / SEMANTICS</span><h3>What exists?</h3><p>Customer CUS-001 has rights to Account ACC-101. Bill BILL-301 is owed to Payee PAY-201. A balance observation grounds the calculation.</p><a href="#explorer">Inspect types and instances →</a></article><article class="concept"><span class="num">02 / KINETICS</span><h3>What can change?</h3><p>A function calculates the remaining buffer. Actions create an exact proposal, record approval and submit a payment instruction.</p><a href="#decisions">Follow the governed changes →</a></article><article class="concept"><span class="num">03 / GOVERNANCE</span><h3>Who may see and do?</h3><p>The assistant’s read access, the customer’s account rights and authority to execute a payment must be checked separately.</p><a href="#architecture">Trace the enforcement boundaries →</a></article></div>
    <div class="callout">“Pay my electricity bill, keep enough for rent, and leave a USD 500 buffer.”<p>One customer request spans business meaning, calculation, authorization and confirmed execution. This guide uses fictional data and deterministic rules throughout; it has no live bank or AI connection.</p></div><p>${cite(0)}</p>`;
  },
  explorer() {
    return `${intro('03','From banking records<br>to <em>business meaning.</em>','Switch between reusable type definitions and concrete instances. Search all 16 candidate types, then inspect identity, property types, source mapping and relationships.')}
    <div class="toolbar"><div class="segmented" aria-label="Graph mode"><button data-mode="instances" class="${explorerMode==='instances'?'active':''}" aria-pressed="${explorerMode==='instances'}">Object instances</button><button data-mode="schema" class="${explorerMode==='schema'?'active':''}" aria-pressed="${explorerMode==='schema'}">Type definitions</button></div><span class="mono">SAME BANKING MODEL / TWO LEVELS</span></div>
    ${BankingDemo.world(explorerMode)}
    <div class="section-heading"><h2>Everyday banking object catalog</h2><label>Filter objects <input type="search" id="search" placeholder="Account, consent, BILL-301…" aria-label="Filter banking objects"></label></div>
    <div class="table-wrap"><table><thead><tr><th>Object type</th><th>${explorerMode==='schema'?'Primary key field':'Identity / primary key'}</th><th>${explorerMode==='schema'?'Property fields':'Fictional instance'}</th><th>Inspect</th></tr></thead><tbody id="objects">${BankingDemo.rows()}</tbody></table></div>
    <div class="three"><article class="concept"><span class="num">IDENTITY</span><h3>Type ≠ instance</h3><p>Account is the reusable contract. ACC-101 is one account. BalanceSnapshot BAL-101 records an observation rather than promising future availability.</p>${cite(1)}</article><article class="concept"><span class="num">RELATIONSHIPS</span><h3>Rights have their own grain</h3><p>AccountOwnership connects Customer to Account and carries rights and effective dates. The graph’s direct ownership edge is shorthand for that relationship object.</p>${cite(3)}</article><article class="concept"><span class="num">ABSTRACTION</span><h3>Shared contracts</h3><p>An illustrative CustomerRequest interface could be implemented by PaymentRequest and CardServiceRequest in an extended model. These types are not instantiated here. Check platform support before implementing an interface.</p>${cite(9)}</article></div>
    <div class="callout">The six-node graph is a view of the full model.<p>Use the catalog to inspect Consent, ActionProposal, Transaction and the other types. Schema fields are illustrative design; the browser does not implement Foundry indexing. Snapshot labels describe initial observations; live Account, Bill and PaymentInstruction fields reflect the shared simulation.</p></div>`;
  },
  decisions:BankingDemo.decisionView,
  architecture() {
    const stages=[
      ['Reconcile business identity','Customer master, account-rights records, balance observations, bill records and processor events map into stable keys. AccountOwnership has a relationship grain; BalanceSnapshot has an observation grain.',18],
      ['Query authorized banking context','Traverse Customer → AccountOwnership → Account; find unpaid bills and their verified payees. Return evidence versions and source freshness with the query result.',15],
      ['Calculate and propose','A deterministic function computes 1,600 − 115 − 900 = USD 585. The task permits this bill and account; savings remain outside its scope. An LLM may interpret intent, but cannot create payment authority.',7],
      ['Validate, submit and reconcile','An authorized action rechecks current rights, exact consent, bill state and funds. Track the payment instruction and external acknowledgments separately from Ontology object edits.',12]
    ];
    const details=[
      ['Which system owns the money?','In this design, trusted banking services own authoritative balances, reservation and ledger posting. Ontology objects expose modeled context and intent. A browser field or an Ontology edit must not be treated as an authoritative ledger debit. '+cite(10)],
      ['Does an action make the payment atomic across systems?','Ontology object edits have a documented atomicity boundary. External calls and payment-service effects do not share that guarantee. Use explicit acknowledgment and reconciliation. '+cite(11)],
      ['What if two payments compete for the same funds?','Recheck and atomically reserve in the authoritative service. Choose and verify action isolation separately; snapshot isolation is not general serializability for all cross-object financial invariants. '+cite(11)],
      ['Does read access imply payment authority?','No. Schema access, object access, sensitive-property visibility, task scope, account signing rights and action execution are distinct questions. The local role selector only illustrates this distinction. '+cite(13)],
      ['Do read policies protect every downstream output?','Mandatory controls propagate through derivation. Object and property read filters do not automatically protect derived exports. Review summaries, logs and model context accordingly. '+cite(14)],
      ['Can the agent approve its own proposal?','This example requires customer approval of exact parameters. Autonomous scopes require deliberate application policy and evaluation; model confidence is not permission. '+cite(16)],
      ['Is a timeout a failed payment?','No. An unknown outcome needs reconciliation against the existing instruction. Do not blindly release funds or create a second attempt. The demo’s failure control means definitive failure, not timeout.'],
      ['Do interfaces and SDKs work identically everywhere?','No. Interface capabilities, generated SDK APIs and action behaviors vary by version and configuration. These banking types and tool names are illustrative application design. '+cite(9)]
    ];
    return `${intro('05','A banking model.<br><em>Clear system boundaries.</em>','Follow the same customer request across data integration, modeled objects, scoped agent tools and trusted payment services. This is a conceptual architecture, not a bank reference implementation.')}
    <div class="architecture-map"><div class="arch-block"><strong>01 / Observe</strong><span>Customer · rights · balances<br>Bills · processor events</span></div><div class="arch-block"><strong>02 / Model</strong><span>Keys · properties · links<br>Permissioned banking objects</span></div><div class="arch-block"><strong>03 / Decide</strong><span>AgentTask · proposal · consent<br>Governed action contract</span></div><div class="arch-block"><strong>04 / Reconcile</strong><span>Payment service · ledger<br>Instruction → transaction</span></div></div>
    <div class="split"><section>${stages.map(([title,body,source],i)=>`<div class="stage"><span class="stage-num">0${i+1}</span><div><h3>${title}</h3><p>${body}</p>${cite(source)}</div></div>`).join('')}</section><section><h2>The boundaries that matter</h2>${details.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section></div>
    <div class="callout">Proposed → Approved → Queued → Settled or definitively Failed.<p>Only confirmed settlement marks the bill paid in this simulation. Production designs also need pending/unknown, rejection, reversal, expiry and reconciliation paths. They do not appear automatically because the objects are linked.</p></div>`;
  },
  study() {
    return `${intro('06','Learn banking objects.<br><em>Defend the decisions.</em>','Test the same model you explored: stable account identity, ownership rights, exact consent, fresh balances and the difference between a queued instruction and a settled transaction.')}
    <div class="toolbar"><span id="score" class="mono">0 / ${questions.length} answered correctly</span><button class="btn" id="restart-quiz">Restart questions</button></div>
    ${questions.map((q,i)=>`<section class="quiz"><div class="eyebrow">CHECK ${String(i+1).padStart(2,'0')} / ${q.tag}</div><h3>${q.q}</h3>${q.options.map((o,j)=>`<button data-question="${i}" data-answer="${j}" aria-pressed="false">${String.fromCharCode(65+j)}. ${o}</button>`).join('')}<div class="feedback" id="feedback-${i}" role="status"></div></section>`).join('')}
    <div class="section-heading"><h2>Your seven-session banking study path</h2><span>45–60 MINUTES EACH</span></div>${studyPath.map(([title,body],i)=>`<div class="stage"><span class="stage-num">0${i+1}</span><div><h3>${title}</h3><p>${body}</p></div></div>`).join('')}
    <div class="callout">Capstone: extend the same banking model.<p>Choose joint-account signing, a savings transfer, or a lost-card service request. Specify object grain, permitted reads, exact action parameters, consent scope, source ownership and uncertain external outcomes.</p></div>
    <div class="actions"><a class="btn primary" href="docs/STUDY_GUIDE.md">Full study guide (.md) ↗</a><a class="btn" href="docs/AGENTIC_BANKING.md">Banking walkthrough (.md) ↗</a><a class="btn" href="docs/DEMO_SCRIPT.md">Presentation script (.md) ↗</a><a class="btn" href="docs/IMPLEMENTATION.md">Implementation notes (.md) ↗</a></div>`;
  },
  sources() {
    return `${intro('07','Banking examples.<br><em>Documented foundations.</em>','The banking schema, amounts, policy and lifecycle are original teaching examples. The reading library supports the Palantir Ontology concepts used throughout every chapter.')}
    <div class="callout">Evidence scope: Foundry Ontology and its application / AIP ecosystem.<p>Research reviewed 21 October 2026. The 21 references establish platform concepts; they do not establish a universal banking schema, regulatory compliance or production payment guarantees. Availability depends on backend, SDK version and configuration. Links are optional; this guide works offline.</p></div>
    <div class="section-heading"><h2>Primary-source reading library</h2><span>${sources.length} REFERENCES</span></div><div class="source-list">${sources.map(([title,path,note],i)=>`<article class="source-item"><small>REF ${String(i+1).padStart(2,'0')} / PALANTIR DOCS</small><a href="https://www.palantir.com/docs/foundry/${path}" target="_blank" rel="noreferrer">${title} ↗</a><p>${note}</p></article>`).join('')}</div>
    <div class="actions"><a class="btn primary" href="docs/RESEARCH.md">Research & banking evidence map (.md) ↗</a><a class="btn" href="docs/STUDY_GUIDE.md">Study guide (.md) ↗</a></div>`;
  }
};
function restoreQuiz() {
  let count=0;
  Object.entries(quizAnswers).forEach(([i,j])=>{
    const q=questions[i];
    document.querySelectorAll(`[data-question="${i}"]`).forEach(button=>{
      const answer=Number(button.dataset.answer);
      button.classList.toggle('correct',answer===q.answer);
      button.classList.toggle('wrong',answer===j&&j!==q.answer);
      button.setAttribute('aria-pressed',String(answer===j));
    });
    $('#feedback-'+i).textContent=(j===q.answer?'Correct. ':'Revisit this idea. ')+q.why;
    if(j===q.answer)count++;
  });
  $('#score').textContent=`${count} / ${questions.length} answered correctly`;
}
function render() {
  const requested=location.hash.slice(1)||'banking', page=Object.hasOwn(pages,requested)?requested:'banking';
  $('#page').innerHTML=pages[page]();
  document.querySelectorAll('nav a').forEach(a=>{
    a.classList.toggle('active',a.dataset.page===page);
    if(a.dataset.page===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  if(page==='banking'||page==='decisions')BankingDemo.bind();
  else if($('#bank-graph'))BankingDemo.bindGraph();
  if(page==='explorer') {
    document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{explorerMode=button.dataset.mode;render();});
    $('#search').oninput=e=>{$('#objects').innerHTML=BankingDemo.rows(e.target.value);BankingDemo.bindGraph();};
  }
  if(page==='study') {
    document.querySelectorAll('[data-question]').forEach(button=>button.onclick=()=>{quizAnswers[button.dataset.question]=Number(button.dataset.answer);restoreQuiz();});
    $('#restart-quiz').onclick=()=>{quizAnswers={};render();};
    restoreQuiz();
  }
  const titles={banking:'Everyday banking',overview:'The banking mental model',explorer:'Explore banking objects',decisions:'The payment lifecycle',architecture:'Banking architecture',study:'Test the banking model',sources:'Research & evidence'};
  document.title=titles[page]+' — Ontology Field Guide';
}
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
render();
