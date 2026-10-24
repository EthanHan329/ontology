'use strict';

class BankLabModel {
  constructor() {
    this.signedIn = false;
    this.available = 160000;
    this.savings = 820000;
    this.version = 7;
    this.rent = 90000;
    this.buffer = 50000;
    this.canTransfer = true;
    this.proposal = null;
    this.instruction = null;
    this.sequence = 0;
    this.quoteVersion = 1;
    this.holdings = [
      {id:'HLD-001', name:'Equity fund', units:120, price:25000, category:'Equities'},
      {id:'HLD-002', name:'Bond fund', units:150, price:10000, category:'Bonds'},
      {id:'HLD-003', name:'Cash fund', units:50, price:10000, category:'Cash'}
    ];
    this.portfolio = null;
    this.trace = [];
  }

  record(tool, input, output, layer) {
    this.trace.push({step:this.trace.length + 1, tool, input, output, layer});
  }

  login() {
    this.signedIn = true;
    this.record('resolveSession', {fixture:'alex-demo'}, {customerId:'CUS-001', name:'Alex Morgan'}, 'Identity');
  }

  checks(amount) {
    return [
      {label:'Authenticated session', ok:this.signedIn, detail:'Demo session maps to CUS-001; a name in chat is not identity.'},
      {label:'Source account signing rights', ok:this.canTransfer, detail:'OWN-001 connects Alex to ACC-101 with transfer rights.'},
      {label:'Exact amount in USD', ok:Number.isSafeInteger(amount) && amount > 0 && amount <= 100000000, detail:'Positive integer cents; no currency conversion.'},
      {label:'Rent and buffer protected', ok:Number.isSafeInteger(amount) && this.available - amount - this.rent >= this.buffer, detail:'Available funds − transfer − $900 rent must leave at least $500.'}
    ];
  }

  propose(amount) {
    if (this.instruction?.status === 'Queued') return {ok:false, message:'Resolve the queued transfer before creating another.'};
    if (!this.signedIn) return {ok:false, message:'Sign in to the demo first.'};
    this.proposal = null;
    this.instruction = null;
    this.record('queryObjects', {customerId:'CUS-001', path:'AccountOwnership → Account; RecurringCommitment; SavingsGoal'}, {source:'ACC-101', destination:'ACC-102', availableCents:this.available, version:this.version, rentCents:this.rent, bufferCents:this.buffer}, 'Objects & links');
    const checks = this.checks(amount);
    this.record('validateTransfer', {amountCents:amount, currency:'USD'}, {checks:checks.map(c=>({rule:c.label, pass:c.ok}))}, 'Action policy');
    if (checks.some(c=>!c.ok)) return {ok:false, message:!this.canTransfer ? 'Blocked: this account is read-only. Viewing a balance does not grant transfer rights.' : 'Blocked: the amount must be valid and leave $900 for rent plus a $500 buffer.', checks};
    this.proposal = {id:'PROP-'+(++this.sequence), source:'ACC-101', destination:'ACC-102', amount, currency:'USD', version:this.version, status:'Proposed'};
    this.record('proposeTransfer', {source:'ACC-101', destination:'ACC-102', amountCents:amount}, {...this.proposal}, 'Action');
    return {ok:true, proposal:this.proposal, checks};
  }

  confirm(proposalId) {
    if (this.instruction?.proposalId === proposalId) return {ok:false, message:'Duplicate prevented: this proposal already has an instruction.'};
    const p = this.proposal;
    if (!p || p.id !== proposalId || p.status !== 'Proposed') return {ok:false, message:'No matching active proposal. Ask for a new transfer.'};
    const checks = this.checks(p.amount);
    const current = p.version === this.version;
    this.record('submitTransfer', {proposalId:p.id, consent:{actor:'CUS-001', source:p.source, destination:p.destination, amountCents:p.amount, currency:p.currency}, idempotencyKey:p.id}, {currentVersion:this.version, evidenceVersion:p.version, checks:checks.map(c=>({rule:c.label, pass:c.ok})), accepted:current && checks.every(c=>c.ok)}, 'Execution gate');
    if (!current || checks.some(c=>!c.ok)) {
      p.status = 'Rejected';
      return {ok:false, message:!this.canTransfer ? 'Rejected: signing rights were revoked. No transfer was submitted.' : 'Rejected: account state changed after the proposal. No transfer was submitted. Ask again for a fresh calculation.'};
    }
    p.status = 'Approved';
    this.available -= p.amount;
    this.version++;
    this.instruction = {id:'PI-'+this.sequence, proposalId:p.id, amount:p.amount, status:'Queued', transactionId:null};
    this.record('reserveAndQueue', {proposalId:p.id}, {...this.instruction, availableCents:this.available}, 'Simulated bank service');
    return {ok:true, message:'Transfer queued. Funds are reserved; savings will update only after settlement.'};
  }

  resolve(success) {
    if (this.instruction?.status !== 'Queued') return {ok:false, message:'No queued transfer to resolve.'};
    const i = this.instruction;
    if (success) {
      this.savings += i.amount;
      i.status = 'Settled';
      i.transactionId = 'TXN-'+this.sequence;
    } else {
      this.available += i.amount;
      this.version++;
      i.status = 'Failed';
    }
    this.record('reconcileTransfer', {instructionId:i.id, confirmedOutcome:i.status}, {...i, availableCents:this.available, savingsCents:this.savings}, 'Simulated bank service');
    return {ok:true, message:success ? 'Transfer settled. Savings is credited and a transaction is recorded.' : 'Transfer definitively failed. Reserved funds are released; savings is unchanged.'};
  }

  spend() {
    if (!this.signedIn || this.available < 10000) return false;
    this.available -= 10000;
    this.version++;
    this.record('externalCardSpend', {amountCents:10000}, {availableCents:this.available, version:this.version}, 'Simulated source event');
    return true;
  }

  revoke() {
    this.canTransfer = false;
    this.version++;
    this.record('updateAccountRights', {ownershipId:'OWN-001'}, {canRead:true, canTransfer:false, version:this.version}, 'Simulated source event');
  }

  readPortfolio(customerId = 'CUS-001') {
    if (!this.signedIn || customerId !== 'CUS-001') {
      this.record('queryPortfolio', {customerId}, {denied:true, reason:'Customer outside authenticated scope'}, 'Object access policy');
      return {ok:false, message:'Access denied. This session can read Alex’s portfolio only. Mentioning another customer in chat does not grant access.'};
    }
    const holdings = this.holdings.map(h=>({...h, value:h.units*h.price}));
    const total = holdings.reduce((sum,h)=>sum+h.value,0);
    this.portfolio = {id:'PORT-001', quoteVersion:this.quoteVersion, total, holdings};
    this.record('queryPortfolio', {customerId, path:'Customer → Portfolio → Holding → Instrument → Quote'}, {portfolioId:'PORT-001', quoteVersion:this.quoteVersion, holdings}, 'Objects & links');
    this.record('valuePortfolio', {portfolioId:'PORT-001', quoteVersion:this.quoteVersion, formula:'sum(units × price)'}, {totalCents:total, currency:'USD'}, 'Function');
    return {ok:true, portfolio:this.portfolio};
  }

  moveMarket() {
    this.holdings[0].price = Math.round(this.holdings[0].price * 1.1);
    this.quoteVersion++;
    this.record('updateQuote', {instrument:'Equity fund', change:'+10%'}, {priceCents:this.holdings[0].price, quoteVersion:this.quoteVersion}, 'Simulated source event');
  }
}

if (typeof module !== 'undefined') module.exports = {BankLabModel};
