(function(root) {
  const baseline = Object.freeze({available:160000,bill:11500,commitments:90000,buffer:50000,currency:'USD'});
  function parseAmount(value) {
    if(typeof value!=='string'||!/^\d+(?:\.\d{1,2})?$/.test(value))return NaN;
    const [whole,fraction='']=value.split('.');
    const result=Number(whole)*100+Number(fraction.padEnd(2,'0'));
    return Number.isSafeInteger(result)?result:NaN;
  }
  function evaluate(available, amount=baseline.bill) {
    const remaining=available-amount-baseline.commitments;
    return {available,amount,remaining,headroom:remaining-baseline.buffer,permitted:remaining>=baseline.buffer};
  }
  function validate({role,amount,available,bill='Unpaid'}) {
    if(role!=='customer')return 'Denied: this assistant has read-only authority. A proposal cannot grant payment rights.';
    if(!Number.isSafeInteger(amount)||amount!==baseline.bill)return 'Rejected: this action pays the exact USD 115.00 bill. Changing the amount needs a different proposal.';
    if(bill==='Paid')return 'Rejected: this bill is already paid.';
    if(!Number.isSafeInteger(available)||available<0)return 'Rejected: a valid current available balance is required.';
    if(!evaluate(available,amount).permitted)return 'Rejected: after the $900 commitment, this payment would breach the $500 buffer.';
    return '';
  }
  const api={baseline,parseAmount,evaluate,validate};
  if(typeof module!=='undefined')module.exports=api;
  root.OntologyModel=api;
})(typeof window!=='undefined'?window:globalThis);
