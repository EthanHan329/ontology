const {test}=require('node:test');
const assert=require('node:assert/strict');
const {baseline,parseAmount,evaluate,validate}=require('../dist/model.js');
const valid={role:'customer',amount:11500,available:160000,bill:'Unpaid'};
test('decimal amounts convert exactly into integer cents',()=>{
  assert.equal(parseAmount('115.00'),11500);
  assert.equal(parseAmount('0.29'),29);
  assert.equal(parseAmount('1.2'),120);
});
test('ambiguous, excessive precision and unsafe amounts are rejected',()=>{
  for(const value of ['-1','1.001','1e2','Infinity','NaN','',' 115','900719925474099999',null,115])assert.ok(Number.isNaN(parseAmount(value)));
});
test('baseline payment preserves USD 585 after rent and USD 85 buffer headroom',()=>{
  assert.deepEqual(evaluate(baseline.available),{available:160000,amount:11500,remaining:58500,headroom:8500,permitted:true});
});
test('exact buffer equality is allowed and a one-cent breach is rejected',()=>{
  assert.equal(validate({...valid,available:151500}),'');
  assert.match(validate({...valid,available:151499}),/breach/);
});
test('current funds reject an approved plan after competing USD 100 spend',()=>{
  assert.equal(validate(valid),'');
  assert.match(validate({...valid,available:150000}),/breach/);
});
test('read-only authority cannot create a payment proposal',()=>assert.match(validate({...valid,role:'reader'}),/Denied/));
test('the exact full bill amount is required',()=>{
  for(const amount of [0,11499,11501,11500.5,NaN])assert.match(validate({...valid,amount}),/exact/);
});
test('already paid bills cannot be paid again',()=>assert.match(validate({...valid,bill:'Paid'}),/already paid/));
test('missing and noninteger balance observations fail closed',()=>{
  for(const available of [undefined,NaN,-1,160000.5])assert.match(validate({...valid,available}),/valid current/);
});
