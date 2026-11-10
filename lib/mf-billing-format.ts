export function billingMoney(cents: number): string { return (cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
export function billingCents(value: string): number {
  const raw=value.trim().replace(/^R\$\s*/,'');
  if (!/^\d{1,7}(?:[,.]\d{1,2})?$/.test(raw)) throw new Error('Informe o valor sem separador de milhar, por exemplo 250,00.');
  const [whole,fraction='']=raw.replace(',','.').split('.');
  const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if (!Number.isSafeInteger(cents) || cents<1 || cents>100000000) throw new Error('Valor fora do limite permitido.');
  return cents;
}
export function billingDateBR(iso: string | null): string { if(!iso) return '—'; const [y,m,d]=iso.slice(0,10).split('-'); return `${d}/${m}/${y}`; }
export function billingDateISO(br: string): string {
  const m=br.trim().match(/^(\d{2})\/(\d{2})\/(20\d{2})$/); if(!m) throw new Error('Use a data no formato DD/MM/AAAA.');
  const d=new Date(Date.UTC(Number(m[3]),Number(m[2])-1,Number(m[1])));
  if(d.getUTCFullYear()!==Number(m[3]) || d.getUTCMonth()+1!==Number(m[2]) || d.getUTCDate()!==Number(m[1])) throw new Error('Data inválida.');
  return `${m[3]}-${m[2]}-${m[1]}`;
}
export function billingMonthLocal(): string {
  const parts=new Intl.DateTimeFormat('en',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).formatToParts(new Date());
  return `${parts.find(p=>p.type==='year')?.value}-${parts.find(p=>p.type==='month')?.value}`;
}
export function billingMonthLabel(month: string): string { return `${month.slice(5,7)}/${month.slice(0,4)}`; }
export function billingShiftMonth(month: string, delta: number): string {
  const [y,m]=month.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+delta,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
}
// Chave de idempotência, não credencial. Usa fonte criptográfica quando disponível.
export function billingRequestId(): string {
  if(typeof globalThis.crypto!=='undefined' && typeof globalThis.crypto.randomUUID==='function') return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const n=Math.floor(Math.random()*16);return(c==='x'?n:(n&3)|8).toString(16);});
}
