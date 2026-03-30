import { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import {
  Plane, Ship, FileText, Download, RefreshCw, Clock,
  Package, User, Users, AlertTriangle, DollarSign, Bell, Plus, X
} from 'lucide-react';
import '../styles/freight-docs.css';

// ── Helpers ────────────────────────────────────────────────────────────────
const todayStr   = () => new Date().toISOString().split('T')[0];
const genAWBNum  = () => { const s = String(Math.floor(Math.random()*99999999)).padStart(8,'0'); return `176-${s}-${String(parseInt(s,10)%7)}`; };
const genBLNum   = () => `LWBL-${new Date().getFullYear()}-${String(Math.floor(Math.random()*99999)+1).padStart(5,'0')}`;

// ── AWB PDF ────────────────────────────────────────────────────────────────
const generateAWBPdf = (fd, servicio) => {
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'letter' });
  const W=215.9, H=279.4, M=12, CW=W-2*M;
  const NAVY=[27,58,92], BLUE=[46,117,182], WHITE=[255,255,255], DARK=[51,51,51], GRAY=[102,102,102], LGRAY=[232,232,232];
  const fill = (x,y,w,h,c) => { doc.setFillColor(...c); doc.rect(x,y,w,h,'F'); };
  const cell = (x,y,w,h,label,value,opts={}) => {
    doc.setDrawColor(...LGRAY); doc.setLineWidth(0.2); doc.rect(x,y,w,h);
    if (label) { doc.setFontSize(5.5); doc.setTextColor(...GRAY); doc.setFont('helvetica','normal'); doc.text(label,x+2,y+4); }
    if (value) {
      doc.setFontSize(opts.valueSize||8); doc.setTextColor(...DARK); doc.setFont('helvetica',opts.bold?'bold':'normal');
      doc.splitTextToSize(String(value),w-4).slice(0,3).forEach((l,i)=>doc.text(l,x+2,(label?y+9:y+h/2+1)+i*4));
    }
  };
  const sHdr = (x,y,w,h,t) => { fill(x,y,w,h,BLUE); doc.setFontSize(6.5); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.text(t,x+3,y+h/2+1.5); };

  fill(0,0,W,3,NAVY); fill(0,3,W,1.5,BLUE);
  let y=8;
  fill(M,y,CW,16,NAVY);
  doc.setFontSize(14); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.text('LOGISTICS WORLD',M+5,y+8);
  doc.setFontSize(6); doc.setFont('helvetica','normal'); doc.text('Servicios Logisticos Integrales',M+5,y+13);
  doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.text('AIR WAYBILL',M+CW-5,y+8,{align:'right'});
  doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.text('IATA Standard Form',M+CW-5,y+13,{align:'right'});
  y+=18; fill(M,y,CW,8,BLUE);
  doc.setFontSize(8); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.text('AWB No.',M+4,y+5.5);
  doc.setFontSize(11); doc.text(fd.awbNumber||'',M+25,y+5.5);
  doc.setFontSize(6); doc.setFont('helvetica','normal'); doc.text(`${fd.awbType||'HAWB'} | Fecha: ${fd.issueDate||''}`,M+CW-5,y+5.5,{align:'right'});
  y+=10;
  const shipperName = servicio.usuario?.empresa||`${servicio.usuario?.nombre} ${servicio.usuario?.apellido}`;
  const hW=CW/2,cH=24;
  cell(M,y,hW,cH,'Shipper / Remitente',`${shipperName}\n${fd.shipperAddress||servicio.cotizacion?.origen||''}\nCuenta: ${fd.shipperAccount||'N/A'}`);
  cell(M+hW,y,hW,cH,'Issuing Carrier Agent','LOGISTICS WORLD S.A.S.\nAv. El Dorado #103-08, Bogota\nIATA Code: 57-2 0001');
  y+=cH+1;
  cell(M,y,hW,cH,'Consignee / Destinatario',`${fd.consignee||''}\n${fd.consigneeAddress||servicio.cotizacion?.destino||''}\nCuenta: ${fd.consigneeAccount||'N/A'} | Tel: ${fd.consigneePhone||'N/A'}`);
  cell(M+hW,y,hW,cH,'Accounting Info',`Valor Dec.: COP ${Number(fd.declaredValue||0).toLocaleString()}\nNotify: ${fd.notifyParty||'Same as Consignee'}\nRef MAWB: ${fd.mawbNumber||'N/A'}`);
  y+=cH+1;
  sHdr(M,y,CW,6,'ROUTING AND FLIGHT INFORMATION'); y+=7;
  let cx=M;
  [['Aeropuerto Origen',fd.departure||'',CW*0.28],['Vuelo',fd.flightNumber||'',CW*0.14],['Carrier',fd.carrier||'',CW*0.14],['Fecha',fd.flightDate||'',CW*0.16],['Aeropuerto Destino',fd.destination||'',CW*0.28]]
    .forEach(([l,v,w])=>{ cell(cx,y,w,14,l,v,{bold:true,valueSize:8}); cx+=w; });
  y+=16;
  cell(M,y,CW,10,'Handling Information',(fd.specialInstructions||'N/A').toUpperCase(),{bold:true,valueSize:9});
  y+=12; sHdr(M,y,CW,6,'NATURE AND QUANTITY OF GOODS'); y+=7;
  const cCols=[['Pieces',CW*0.09],['Gross Wt (kg)',CW*0.11],['Rate',CW*0.08],['Code',CW*0.11],['Chg Wt',CW*0.11],['Rate/Charge',CW*0.12],['Total',CW*0.13],['Description',CW*0.25]];
  cx=M; cCols.forEach(([h,w])=>{ fill(cx,y,w,10,[26,46,74]); doc.setFontSize(5); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); h.split('\n').forEach((l,i)=>doc.text(l,cx+2,y+4+i*3.5)); cx+=w; });
  y+=11; cx=M;
  const chgW2=Math.max(parseFloat(fd.weight||0),(parseFloat(fd.volume||0)*166.67)).toFixed(1);
  [fd.pieces||'0',`${servicio.cotizacion?.peso||fd.weight||''} kg`,fd.rateClass||'Q',fd.commodityCode||'---',`${chgW2} kg`,fd.rateCharge||'---',fd.totalCharge||'---',servicio.cotizacion?.descripcion||fd.commodity||'---']
    .forEach((v,i)=>{ cell(cx,y,cCols[i][1],14,'',v,{valueSize:7.5}); cx+=cCols[i][1]; });
  y+=15; fill(M,y,CW,8,[232,240,248]); doc.setDrawColor(...BLUE); doc.setLineWidth(0.3); doc.rect(M,y,CW,8);
  doc.setFontSize(7); doc.setTextColor(...NAVY); doc.setFont('helvetica','bold');
  doc.text(`TOTAL: ${fd.pieces||'0'} Bultos | ${fd.weight||'0'} kg | Vol: ${fd.volume||'0'} m3`,M+4,y+5.5);
  doc.text(`COP ${Number(fd.totalCharges||fd.totalCharge||0).toLocaleString()}`,M+CW-5,y+5.5,{align:'right'});
  y+=10; sHdr(M,y,CW,6,'CHARGES / CARGOS'); y+=7; cx=M;
  [['Freight',fd.freightCharge||'---'],['Rate',fd.rateCharge||'---'],['Due Carrier',fd.dueCarrier||'---'],['Due Agent',fd.dueAgent||'---']].forEach(([l,v])=>{ cell(cx,y,CW/4,12,l,v,{bold:true}); cx+=CW/4; });
  y+=14; fill(M,y,CW,10,NAVY);
  doc.setFontSize(8); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.text('TOTAL GENERAL',M+5,y+7);
  doc.setFontSize(12); doc.text(`COP ${Number(fd.totalCharges||fd.totalCharge||0).toLocaleString()}`,M+CW-5,y+7,{align:'right'});
  y+=13;
  [['Firma Remitente',shipperName],['Carrier','LOGISTICS WORLD S.A.S.'],['Destinatario','(Entrega)']].forEach(([l,n],i)=>{
    const sx=M+i*(CW/3); cell(sx,y,CW/3,20,l,'');
    doc.setFontSize(7.5); doc.setTextColor(...DARK); doc.setFont('helvetica','bold'); doc.text(n,sx+3,y+12);
    doc.setDrawColor(...LGRAY); doc.line(sx+3,y+14,sx+CW/3-5,y+14);
    doc.setFontSize(5.5); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY); doc.text(fd.issueDate||'',sx+3,y+18);
  });
  y+=24; fill(M,y,CW,14,[240,244,248]); doc.setDrawColor(...BLUE); doc.line(M,y,M+CW,y);
  doc.setFontSize(5); doc.setTextColor(...GRAY); doc.setFont('helvetica','normal');
  doc.text('This Air Waybill is issued subject to the conditions of contract on the reverse hereof and the Warsaw/Montreal Convention.',M+3,y+4);
  doc.text('Este conocimiento aereo se emite sujeto a las condiciones del contrato.',M+3,y+8);
  fill(0,H-5,W,3,NAVY); fill(0,H-2,W,2,BLUE);
  doc.setFontSize(4.5); doc.setTextColor(...GRAY);
  doc.text(`Logistics World | AWB: ${fd.awbNumber||''} | ${new Date().toLocaleDateString()}`,M,H-7);
  doc.text('Page 1 of 1',M+CW,H-7,{align:'right'});
  return doc;
};

// ── BL PDF ─────────────────────────────────────────────────────────────────
const generateBLPdf = (fd, containers, servicio) => {
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'letter' });
  const W=215.9, H=279.4, M=11, CW=W-2*M;
  const NAVY=[20,50,80], TEAL=[14,116,130], WHITE=[255,255,255], DARK=[45,45,45], GRAY=[100,100,100], LGRAY=[220,220,220], VLIGHT=[242,247,252];
  const fill = (x,y,w,h,c) => { doc.setFillColor(...c); doc.rect(x,y,w,h,'F'); };
  const cell = (x,y,w,h,label,value,opts={}) => {
    doc.setDrawColor(...LGRAY); doc.setLineWidth(0.2); doc.rect(x,y,w,h);
    if(label){ doc.setFontSize(5.2); doc.setTextColor(...GRAY); doc.setFont('helvetica','normal'); doc.text(label,x+2,y+3.8); }
    if(value){ doc.setFontSize(opts.vs||7.5); doc.setTextColor(...DARK); doc.setFont('helvetica',opts.bold?'bold':'normal');
      const sy=label?y+8:y+h/2+1;
      doc.splitTextToSize(String(value),w-4).forEach((l,i)=>{ if(sy+i*3.5<y+h) doc.text(l,x+2,sy+i*3.5); }); }
  };
  const sHdr = (x,y,w,h,t) => { fill(x,y,w,h,TEAL); doc.setFontSize(6); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.text(t,x+3,y+h/2+1.5); };

  fill(0,0,W,3,NAVY); fill(0,3,W,1.5,TEAL);
  let y=8;
  fill(M,y,CW,18,NAVY);
  doc.setFontSize(13); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.text('LOGISTICS WORLD',M+5,y+8);
  doc.setFontSize(6); doc.setFont('helvetica','normal'); doc.text('Freight Forwarding & Logistics Services',M+5,y+13);
  doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.text('BILL OF LADING',M+CW-5,y+8,{align:'right'});
  doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.text('Conocimiento de Embarque Maritimo',M+CW-5,y+13,{align:'right'});
  y+=20; fill(M,y,CW,8,TEAL);
  doc.setFontSize(7.5); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.text('B/L No.',M+4,y+5.5);
  doc.setFontSize(11); doc.text(fd.blNumber||'',M+22,y+5.5);
  doc.setFontSize(6); doc.setFont('helvetica','normal');
  doc.text(`${fd.blType||'OBL'} | ${fd.originalsIssued||'3'} Originales | Booking: ${fd.bookingNumber||'N/A'} | Fecha: ${fd.issueDate||''}`,M+CW-5,y+5.5,{align:'right'});
  y+=10;
  const hW=CW/2, pH=22;
  cell(M,y,hW,pH,'Shipper / Embarcador',`${fd.shipperName||''}\n${fd.shipperAddress||''}\nNIT: ${fd.shipperTax||'N/A'} | Tel: ${fd.shipperPhone||'N/A'}`);
  cell(M+hW,y,hW,pH,'Consignee / Destinatario',`${fd.consignee||''}\n${fd.consigneeAddress||''}\nTax: ${fd.consigneeTax||'N/A'} | Tel: ${fd.consigneePhone||'N/A'}`);
  y+=pH+1;
  cell(M,y,CW,12,'Notify Party',`${fd.notifyName||'Same as Consignee'} | ${fd.notifyAddress||''}`);

  y+=14; sHdr(M,y,CW,6,'VESSEL & ROUTING / BUQUE Y RUTA'); y+=7;
  let cx=M;
  [['Vessel',fd.vesselName||'',CW*0.22],['Voyage',fd.voyageNumber||'',CW*0.10],['Carrier',fd.carrier||'',CW*0.16],['Port of Loading',fd.portLoading||'',CW*0.26],['Port of Discharge',fd.portDischarge||'',CW*0.26]]
    .forEach(([l,v,w])=>{ cell(cx,y,w,13,l,v,{bold:true,vs:7.5}); cx+=w; });
  y+=14; cx=M;
  [['Place of Receipt',fd.placeReceipt||'',CW*0.26],['Place of Delivery',fd.placeDelivery||'',CW*0.26],['ETD',fd.etd||'',CW*0.16],['ETA',fd.eta||'',CW*0.16],['Incoterm',fd.incoterm||'',CW*0.16]]
    .forEach(([l,v,w])=>{ cell(cx,y,w,13,l,v,{bold:true,vs:7.5}); cx+=w; });

  y+=15; sHdr(M,y,CW,6,'CONTAINERS / CONTENEDORES'); y+=7;
  const cCols=[['Container No.',CW*0.25],['Type/Size',CW*0.15],['Seal No.',CW*0.20],['Weight (kg)',CW*0.15],['Packages',CW*0.25]];
  cx=M; cCols.forEach(([h,w])=>{ fill(cx,y,w,7,[25,55,85]); doc.setFontSize(5.5); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.text(h,cx+2,y+5); cx+=w; });
  y+=8;
  containers.forEach((c,idx)=>{
    const vals=[c.no,c.type,c.seal,c.weight,`${fd.pieces||''} ${fd.packageType||'CTNS'}`];
    if(idx%2===0){ cx=M; cCols.forEach(([_,w])=>{ fill(cx,y,w,8,VLIGHT); cx+=w; }); }
    cx=M; cCols.forEach(([_,w],i)=>{ doc.setDrawColor(...LGRAY); doc.setLineWidth(0.15); doc.rect(cx,y,w,8); doc.setFontSize(7); doc.setTextColor(...DARK); doc.setFont('helvetica','normal'); doc.text(vals[i]||'',cx+2,y+5.5); cx+=w; }); y+=8;
  });

  y+=2; sHdr(M,y,CW,6,'GOODS DESCRIPTION / DESCRIPCION DE MERCANCIA'); y+=7;
  cx=M;
  [['Pieces',`${fd.pieces||'0'} ${fd.packageType||'CTNS'}`,CW*0.12],['Gross Weight',`${Number(fd.grossWeight||0).toLocaleString()} kg`,CW*0.14],['Volume',`${fd.volume||'0'} m3`,CW*0.12],['HS Code',fd.hsCode||'---',CW*0.14],['Description',fd.goodsDescription||servicio.cotizacion?.descripcion||'---',CW*0.48]]
    .forEach(([l,v,w])=>{ cell(cx,y,w,24,l,v,{vs:w===CW*0.48?6.5:7.5}); cx+=w; });

  y+=26; sHdr(M,y,CW,6,'FREIGHT & CHARGES'); y+=7; cx=M;
  [['Freight Terms',fd.freightTerms||'PREPAID',CW*0.18],['Currency',fd.currency||'USD',CW*0.10],['Ocean Freight',fd.oceanFreight||'---',CW*0.18],['Surcharges',fd.surcharges||'---',CW*0.18],['Declared Value',fd.declaredValue||'NVD',CW*0.18],['Insurance',fd.insurance||'N/A',CW*0.18]]
    .forEach(([l,v,w])=>{ cell(cx,y,w,12,l,v,{bold:true}); cx+=w; });
  y+=14; fill(M,y,CW,10,NAVY);
  doc.setFontSize(8); doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.text('TOTAL FREIGHT',M+5,y+7);
  doc.setFontSize(12); doc.text(`${fd.currency||'USD'} ${Number(fd.totalFreight||0).toLocaleString()}`,M+CW-5,y+7,{align:'right'});

  y+=12; cell(M,y,CW,16,'Special Instructions',(fd.specialInstructions||'N/A'),{vs:6.5});
  y+=18;
  [['Shipper',fd.shipperName||''],['Carrier','LOGISTICS WORLD S.A.S.'],['Consignee','(Upon delivery)']].forEach(([l,n],i)=>{
    const sx=M+i*(CW/3); cell(sx,y,CW/3,18,l,'');
    doc.setFontSize(7); doc.setTextColor(...DARK); doc.setFont('helvetica','bold'); doc.text(n,sx+3,y+11);
    doc.setDrawColor(...LGRAY); doc.line(sx+3,y+13,sx+CW/3-5,y+13);
    doc.setFontSize(5); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY); doc.text(fd.issueDate||'',sx+3,y+16.5);
  });
  y+=21; fill(M,y,CW,12,[240,244,248]); doc.setDrawColor(...TEAL); doc.setLineWidth(0.3); doc.line(M,y,M+CW,y);
  doc.setFontSize(4.8); doc.setTextColor(...GRAY); doc.setFont('helvetica','normal');
  doc.text('SHIPPED on board in apparent good order and condition for carriage to the Port of Discharge.',M+3,y+4);
  doc.text('RECEIVED by the Carrier the Goods as specified above in apparent good order and condition.',M+3,y+8);
  doc.text('IN WITNESS WHEREOF the number of original Bills of Lading stated above have been signed.',M+3,y+12);
  fill(0,H-5,W,3,NAVY); fill(0,H-2,W,2,TEAL);
  doc.setFontSize(4.5); doc.setTextColor(...GRAY);
  doc.text(`Logistics World Platform | B/L: ${fd.blNumber||''} | ${new Date().toLocaleDateString()}`,M,H-7);
  doc.text('Page 1 of 1 | Confidential',M+CW,H-7,{align:'right'});
  return doc;
};

// ── Reusable field components ───────────────────────────────────────────────
const F = ({ label, name, value, onChange, placeholder, type='text', required, mono, span, disabled }) => (
  <div className={`fd-group${span?` fd-span-${span}`:''}`}>
    <label className="fd-label">{label}{required && <span className="fd-req"> *</span>}</label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
      required={required} disabled={disabled} className={`fd-input${mono?' fd-input-mono':''}`} />
  </div>
);

const Sel = ({ label, name, value, onChange, children, span }) => (
  <div className={`fd-group${span?` fd-span-${span}`:''}`}>
    <label className="fd-label">{label}</label>
    <select name={name} value={value} onChange={onChange} className="fd-select">{children}</select>
  </div>
);

const Txt = ({ label, name, value, onChange, placeholder, span }) => (
  <div className={`fd-group${span?` fd-span-${span}`:''}`}>
    <label className="fd-label">{label}</label>
    <textarea name={name} value={value} onChange={onChange} placeholder={placeholder}
      className="fd-input" style={{ resize:'vertical', minHeight:'70px', lineHeight:1.5 }} />
  </div>
);

const SecHdr = ({ icon: Icon, iconClass='blue', title, hint }) => (
  <div className="fd-section-header">
    <div className={`fd-section-icon ${iconClass}`}><Icon size={15} /></div>
    <h3 className="fd-section-title">{title}</h3>
    {hint && <span className="fd-section-hint">{hint}</span>}
  </div>
);

// ── Container row (B/L) ─────────────────────────────────────────────────────
const ContainerRow = ({ c, idx, onChange, onRemove }) => (
  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:'0.55rem', alignItems:'end', padding:'0.55rem 0', borderBottom:'1px solid rgba(21,32,62,0.5)' }}>
    <div className="fd-group"><label className="fd-label">No. Contenedor</label>
      <input className="fd-input" value={c.no} onChange={e=>onChange(idx,'no',e.target.value)} placeholder="MSKU 123456-7" /></div>
    <div className="fd-group"><label className="fd-label">Tipo / Tamaño</label>
      <select className="fd-select" value={c.type} onChange={e=>onChange(idx,'type',e.target.value)}>
        <option value="20GP">20' GP (Dry)</option><option value="40GP">40' GP (Dry)</option>
        <option value="40HC">40' HC (High Cube)</option><option value="20RF">20' RF (Reefer)</option>
        <option value="40RF">40' RF (Reefer)</option><option value="20OT">20' OT (Open Top)</option>
        <option value="20FR">20' FR (Flat Rack)</option>
      </select></div>
    <div className="fd-group"><label className="fd-label">Sello (Seal)</label>
      <input className="fd-input" value={c.seal} onChange={e=>onChange(idx,'seal',e.target.value)} placeholder="SL-00001" /></div>
    <div className="fd-group"><label className="fd-label">Peso (kg)</label>
      <input className="fd-input" value={c.weight} onChange={e=>onChange(idx,'weight',e.target.value)} placeholder="18000" /></div>
    <button type="button" onClick={()=>onRemove(idx)} title="Eliminar" style={{ width:34, height:34, borderRadius:8, border:'1px solid rgba(239,68,68,0.25)', background:'rgba(239,68,68,0.07)', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:2, flexShrink:0 }}>
      <X size={14} />
    </button>
  </div>
);

// ── Main component ──────────────────────────────────────────────────────────
const FreightDocs = ({ servicio }) => {
  const [tab, setTab]   = useState('awb');
  const [genAWB, setGenAWB] = useState(false);
  const [doneAWB, setDoneAWB] = useState(false);
  const [genBL,  setGenBL]  = useState(false);
  const [doneBL,  setDoneBL]  = useState(false);

  const shipperName = servicio.usuario?.empresa||`${servicio.usuario?.nombre} ${servicio.usuario?.apellido}`;

  // ── AWB state ──
  const [awb, setAwb] = useState({
    awbNumber:genAWBNum(), awbType:'HAWB', mawbNumber:'', issueDate:todayStr(),
    shipperAccount:'', shipperAddress:servicio.cotizacion?.origen||'',
    consignee:'', consigneeAccount:'', consigneeAddress:servicio.cotizacion?.destino||'',
    consigneePhone:'', notifyParty:'',
    departure:servicio.cotizacion?.origen||'', destination:servicio.cotizacion?.destino||'',
    flightNumber:'', flightDate:todayStr(), carrier:'',
    pieces:'', weight:String(servicio.cotizacion?.peso||''), volume:String(servicio.cotizacion?.volumen||''),
    rateClass:'Q', commodityCode:'', rateCharge:'', totalCharge:'',
    commodity:servicio.cotizacion?.descripcion||'',
    specialInstructions:'', declaredValue:'',
    freightCharge:'', dueCarrier:'', dueAgent:'', totalCharges:'',
  });
  const onA = e => setAwb(p=>({...p,[e.target.name]:e.target.value}));

  // ── BL state ──
  const [bl, setBl] = useState({
    blNumber:genBLNum(), blType:'OBL', bookingNumber:'', issueDate:todayStr(), originalsIssued:'3', mblRef:'',
    shipperName:shipperName, shipperAddress:servicio.cotizacion?.origen||'', shipperTax:'', shipperPhone:servicio.usuario?.telefono||'',
    consignee:'', consigneeAddress:servicio.cotizacion?.destino||'', consigneeTax:'', consigneePhone:'',
    notifyName:'', notifyAddress:'',
    carrier:'', vesselName:'', voyageNumber:'',
    portLoading:servicio.cotizacion?.origen||'', portDischarge:servicio.cotizacion?.destino||'',
    placeDelivery:'', placeReceipt:servicio.cotizacion?.origen||'', etd:'', eta:'',
    pieces:'', packageType:'CTNS',
    grossWeight:String(servicio.cotizacion?.peso||''), volume:String(servicio.cotizacion?.volumen||''),
    goodsDescription:servicio.cotizacion?.descripcion||'', hsCode:'',
    freightTerms:'PREPAID', incoterm:'CIF', currency:'USD',
    oceanFreight:'', surcharges:'', totalFreight:'',
    declaredValue:'', insurance:'INCLUDED',
    specialInstructions:'',
  });
  const onB = e => setBl(p=>({...p,[e.target.name]:e.target.value}));

  // ── Container rows ──
  const [containers, setContainers] = useState([{ no:'', type:'40GP', seal:'', weight:'' }]);
  const updateContainer = (idx, field, val) => setContainers(p=>p.map((c,i)=>i===idx?{...c,[field]:val}:c));
  const addContainer    = () => setContainers(p=>[...p,{ no:'', type:'40HC', seal:'', weight:'' }]);
  const removeContainer = idx => setContainers(p=>p.filter((_,i)=>i!==idx));

  // preview codes
  const depCode = (awb.departure||'').split(/[\s-]/)[0];
  const dstCode = (awb.destination||'').split(/[\s-]/)[0];
  const polCode = (bl.portLoading||'').split(/[\s-]/)[0];
  const podCode = (bl.portDischarge||'').split(/[\s-]/)[0];

  const handleAWB = useCallback(async e => {
    e.preventDefault(); setGenAWB(true);
    await new Promise(r=>setTimeout(r,300));
    try { generateAWBPdf(awb,servicio).save(`AWB_${(awb.awbNumber||'AWB').replace(/\s/g,'')}.pdf`); setDoneAWB(true); setTimeout(()=>setDoneAWB(false),2500); }
    finally { setGenAWB(false); }
  },[awb,servicio]);

  const handleBL = useCallback(async e => {
    e.preventDefault(); setGenBL(true);
    await new Promise(r=>setTimeout(r,300));
    try { generateBLPdf(bl,containers,servicio).save(`BL_${(bl.blNumber||'BL').replace(/\s/g,'')}.pdf`); setDoneBL(true); setTimeout(()=>setDoneBL(false),2500); }
    finally { setGenBL(false); }
  },[bl,containers,servicio]);

  return (
    <>
      <div className="fd-card">
        <div className="fd-accent-strip" />
        <div className="fd-card-body">

          {/* Tabs */}
          <div className="fd-tabs">
            <button type="button" className={`fd-tab ${tab==='awb'?'fd-active':''}`} onClick={()=>setTab('awb')}><Plane size={17}/> Air Waybill (AWB)</button>
            <button type="button" className={`fd-tab ${tab==='bl'?'fd-active':''}`}  onClick={()=>setTab('bl')}><Ship size={17}/> Bill of Lading (B/L)</button>
          </div>

          {/* ════ AWB FORM ════ */}
          {tab==='awb' && (
            <form onSubmit={handleAWB}>
              <SecHdr icon={FileText} title="Datos Generales del AWB" hint="Campos * obligatorios" />
              <div className="fd-grid">
                <Sel label="Tipo de AWB" name="awbType" value={awb.awbType} onChange={onA}>
                  <option value="HAWB">HAWB — House (Agente)</option><option value="MAWB">MAWB — Master (Aerolínea)</option>
                </Sel>
                <F label="Número AWB (IATA)" name="awbNumber" value={awb.awbNumber} onChange={onA} required mono />
                {awb.awbType==='HAWB' && <F label="Ref. MAWB" name="mawbNumber" value={awb.mawbNumber} onChange={onA} placeholder="176-12345678-3" />}
                <F label="Fecha de Emisión" name="issueDate" value={awb.issueDate} onChange={onA} type="date" required />
              </div>
              <SecHdr icon={User} iconClass="green" title="Remitente (Shipper)" hint="Pre-llenado del servicio" />
              <div className="fd-grid">
                <F label="Nombre del Remitente" name="shipperName" value={shipperName} onChange={()=>{}} disabled />
                <F label="No. de Cuenta" name="shipperAccount" value={awb.shipperAccount} onChange={onA} placeholder="LW-000123" />
                <F label="Dirección / Origen" name="shipperAddress" value={awb.shipperAddress} onChange={onA} span={2} />
              </div>
              <SecHdr icon={Users} iconClass="green" title="Consignatario / Destinatario" />
              <div className="fd-grid">
                <F label="Nombre" name="consignee" value={awb.consignee} onChange={onA} required placeholder="Empresa ABC S.A." />
                <F label="No. de Cuenta" name="consigneeAccount" value={awb.consigneeAccount} onChange={onA} placeholder="FWD-999" />
                <F label="Dirección" name="consigneeAddress" value={awb.consigneeAddress} onChange={onA} />
                <F label="Teléfono" name="consigneePhone" value={awb.consigneePhone} onChange={onA} placeholder="+1 212 555 0100" />
                <F label="Notify Party" name="notifyParty" value={awb.notifyParty} onChange={onA} placeholder="Same as Consignee" span={2} />
              </div>
              <SecHdr icon={Plane} iconClass="blue" title="Información de Vuelo" />
              <div className="fd-grid">
                <F label="Aeropuerto Origen (IATA)" name="departure" value={awb.departure} onChange={onA} placeholder="BOG - El Dorado" required />
                <F label="Aeropuerto Destino (IATA)" name="destination" value={awb.destination} onChange={onA} placeholder="MIA - Miami Intl." required />
                <F label="Número de Vuelo" name="flightNumber" value={awb.flightNumber} onChange={onA} placeholder="AV0341" required mono />
                <F label="Fecha de Vuelo" name="flightDate" value={awb.flightDate} onChange={onA} type="date" required />
                <F label="Aerolínea / Carrier" name="carrier" value={awb.carrier} onChange={onA} placeholder="Avianca" />
              </div>
              <SecHdr icon={Package} iconClass="amber" title="Detalle de Carga" />
              <div className="fd-grid">
                <F label="Bultos" name="pieces" value={awb.pieces} onChange={onA} placeholder="12" />
                <F label="Peso Bruto (kg)" name="weight" value={awb.weight} onChange={onA} placeholder="350" />
                <F label="Volumen (m³)" name="volume" value={awb.volume} onChange={onA} placeholder="1.8" />
                <Sel label="Clase de Tarifa" name="rateClass" value={awb.rateClass} onChange={onA}>
                  <option value="Q">Q — General Cargo</option><option value="C">C — Specific</option>
                  <option value="U">U — ULD Rate</option><option value="M">M — Minimum</option>
                </Sel>
                <F label="Código Commodity (SHC)" name="commodityCode" value={awb.commodityCode} onChange={onA} placeholder="ELC / PER / DGR" />
                <F label="Descripción de Mercancía" name="commodity" value={awb.commodity} onChange={onA} placeholder="Electrónica..." />
              </div>
              <SecHdr icon={AlertTriangle} iconClass="amber" title="Instrucciones y Valor Declarado" />
              <div className="fd-grid">
                <F label="Instrucciones Especiales" name="specialInstructions" value={awb.specialInstructions} onChange={onA} placeholder="FRAGILE / KEEP COOL" span={2} />
                <F label="Valor Declarado Aduana (COP)" name="declaredValue" value={awb.declaredValue} onChange={onA} placeholder="5000000" />
              </div>
              <SecHdr icon={DollarSign} iconClass="blue" title="Cargos y Fletes (COP)" />
              <div className="fd-grid">
                <F label="Flete" name="freightCharge" value={awb.freightCharge} onChange={onA} placeholder="850000" />
                <F label="Tarifa (Rate)" name="rateCharge" value={awb.rateCharge} onChange={onA} placeholder="2430/kg" />
                <F label="Due Carrier" name="dueCarrier" value={awb.dueCarrier} onChange={onA} placeholder="600000" />
                <F label="Due Agent" name="dueAgent" value={awb.dueAgent} onChange={onA} placeholder="250000" />
                <F label="Total Cargos" name="totalCharge" value={awb.totalCharge} onChange={onA} placeholder="1100000" />
                <F label="Total General" name="totalCharges" value={awb.totalCharges} onChange={onA} placeholder="1100000" mono />
              </div>
              <div className="fd-footer">
                <div className="fd-footer-info"><Clock size={13}/> PDF en formato IATA estándar</div>
                <div className="fd-btn-group">
                  <button type="button" className="fd-btn fd-btn-ghost" onClick={()=>setAwb(p=>({...p,consignee:'',flightNumber:'',specialInstructions:'',declaredValue:'',freightCharge:'',totalCharges:''}))}>
                    <RefreshCw size={15}/> Limpiar
                  </button>
                  <button type="submit" className="fd-btn fd-btn-primary" disabled={genAWB}>
                    {genAWB ? <><RefreshCw size={15} style={{animation:'spin 0.7s linear infinite'}}/> Generando...</>
                      : doneAWB ? <><Download size={15}/> ¡PDF Listo!</>
                      : <><Download size={15}/> Generar AWB (PDF)</>}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ════ BL FORM ════ */}
          {tab==='bl' && (
            <form onSubmit={handleBL}>

              <SecHdr icon={FileText} title="Datos Generales del B/L" hint="Campos * obligatorios" />
              <div className="fd-grid">
                <Sel label="Tipo de B/L" name="blType" value={bl.blType} onChange={onB}>
                  <option value="OBL">OBL — Original (Negociable)</option>
                  <option value="SWB">SWB — Sea Waybill (No negociable)</option>
                  <option value="HBL">HBL — House B/L (Freight Forwarder)</option>
                  <option value="MBL">MBL — Master B/L (Naviera)</option>
                </Sel>
                <F label="Número de B/L" name="blNumber" value={bl.blNumber} onChange={onB} required mono />
                <F label="Booking / Reserva No." name="bookingNumber" value={bl.bookingNumber} onChange={onB} placeholder="BK-2026-0045" />
                <F label="Fecha de Emisión" name="issueDate" value={bl.issueDate} onChange={onB} type="date" required />
                <Sel label="No. de Originales" name="originalsIssued" value={bl.originalsIssued} onChange={onB}>
                  <option value="3">3 (Estándar)</option><option value="2">2</option><option value="1">1</option>
                </Sel>
                <F label="Ref. Master B/L" name="mblRef" value={bl.mblRef} onChange={onB} placeholder="MAEU-123456789" />
              </div>

              <SecHdr icon={User} iconClass="green" title="Shipper / Embarcador" hint="Pre-llenado del servicio" />
              <div className="fd-grid">
                <F label="Nombre" name="shipperName" value={bl.shipperName} onChange={onB} required />
                <F label="Dirección Completa" name="shipperAddress" value={bl.shipperAddress} onChange={onB} span={2} />
                <F label="NIT / Tax ID" name="shipperTax" value={bl.shipperTax} onChange={onB} placeholder="900.000.000-0" />
                <F label="Teléfono" name="shipperPhone" value={bl.shipperPhone} onChange={onB} placeholder="+57 601 234 5678" />
              </div>

              <SecHdr icon={Users} iconClass="green" title="Consignee / Destinatario" />
              <div className="fd-grid">
                <F label="Nombre" name="consignee" value={bl.consignee} onChange={onB} required placeholder="Importaciones Europa GmbH" />
                <F label="Dirección Completa" name="consigneeAddress" value={bl.consigneeAddress} onChange={onB} span={2} />
                <F label="Tax ID / VAT" name="consigneeTax" value={bl.consigneeTax} onChange={onB} placeholder="DE123456789" />
                <F label="Teléfono" name="consigneePhone" value={bl.consigneePhone} onChange={onB} placeholder="+49 69 123 4567" />
              </div>

              <SecHdr icon={Bell} iconClass="green" title="Notify Party" />
              <div className="fd-grid">
                <F label="Nombre" name="notifyName" value={bl.notifyName} onChange={onB} placeholder="Same as Consignee" />
                <F label="Dirección / Contacto" name="notifyAddress" value={bl.notifyAddress} onChange={onB} span={2} />
              </div>

              <SecHdr icon={Ship} iconClass="blue" title="Información de Transporte Marítimo" />
              <div className="fd-grid">
                <F label="Naviera / Carrier" name="carrier" value={bl.carrier} onChange={onB} required placeholder="MAERSK LINE" />
                <F label="Nombre del Buque (Vessel)" name="vesselName" value={bl.vesselName} onChange={onB} required placeholder="MSC GULSUN" />
                <F label="Número de Viaje (Voyage)" name="voyageNumber" value={bl.voyageNumber} onChange={onB} placeholder="V.001E" />
                <F label="Puerto de Carga" name="portLoading" value={bl.portLoading} onChange={onB} required placeholder="COBUN - Buenaventura" />
                <F label="Puerto de Descarga" name="portDischarge" value={bl.portDischarge} onChange={onB} required placeholder="DEHAM - Hamburg" />
                <F label="Lugar de Entrega" name="placeDelivery" value={bl.placeDelivery} onChange={onB} placeholder="Frankfurt am Main" />
                <F label="Lugar de Recepción" name="placeReceipt" value={bl.placeReceipt} onChange={onB} />
                <F label="ETD (Salida)" name="etd" value={bl.etd} onChange={onB} type="date" />
                <F label="ETA (Arribo)" name="eta" value={bl.eta} onChange={onB} type="date" />
              </div>

              <SecHdr icon={Package} iconClass="amber" title="Contenedores y Carga" />
              {containers.map((c,i)=>(
                <ContainerRow key={i} c={c} idx={i} onChange={updateContainer} onRemove={removeContainer} />
              ))}
              <button type="button" onClick={addContainer}
                style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', padding:'0.5rem 1rem', border:'1.5px dashed var(--fd-border-soft)', borderRadius:8, background:'transparent', color:'var(--fd-text-muted)', fontFamily:'DM Sans,sans-serif', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', marginTop:'0.5rem', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.target.style.borderColor='var(--fd-accent)';e.target.style.color='var(--fd-accent)';}}
                onMouseLeave={e=>{e.target.style.borderColor='var(--fd-border-soft)';e.target.style.color='var(--fd-text-muted)';}}>
                <Plus size={14}/> Agregar contenedor
              </button>

              <SecHdr icon={Package} iconClass="amber" title="Descripción de Mercancía" />
              <div className="fd-grid">
                <F label="Número de Bultos" name="pieces" value={bl.pieces} onChange={onB} placeholder="450" />
                <Sel label="Tipo de Empaque" name="packageType" value={bl.packageType} onChange={onB}>
                  <option value="CTNS">Cajas / Cartons</option><option value="PLTS">Pallets</option>
                  <option value="BAGS">Sacos / Bags</option><option value="DRMS">Tambores / Drums</option>
                  <option value="BNDL">Fardos / Bundles</option><option value="BULK">A granel / Bulk</option>
                </Sel>
                <F label="Peso Bruto Total (kg)" name="grossWeight" value={bl.grossWeight} onChange={onB} placeholder="25000" />
                <F label="Volumen Total (m³)" name="volume" value={bl.volume} onChange={onB} placeholder="33.2" />
                <Txt label="Descripción de Mercancía" name="goodsDescription" value={bl.goodsDescription} onChange={onB} placeholder="Descripción detallada, códigos HS, marcas..." span={2} />
                <F label="Código HS" name="hsCode" value={bl.hsCode} onChange={onB} placeholder="8471.30" />
              </div>

              <SecHdr icon={DollarSign} iconClass="blue" title="Flete y Condiciones de Pago" />
              <div className="fd-grid">
                <Sel label="Término de Flete" name="freightTerms" value={bl.freightTerms} onChange={onB}>
                  <option value="PREPAID">Prepaid / Prepagado</option><option value="COLLECT">Collect / Por Cobrar</option>
                </Sel>
                <Sel label="Incoterm" name="incoterm" value={bl.incoterm} onChange={onB}>
                  <option value="FOB">FOB</option><option value="CIF">CIF</option><option value="CFR">CFR</option>
                  <option value="EXW">EXW</option><option value="FCA">FCA</option><option value="DAP">DAP</option><option value="DDP">DDP</option>
                </Sel>
                <Sel label="Moneda" name="currency" value={bl.currency} onChange={onB}>
                  <option value="USD">USD - Dólar</option><option value="EUR">EUR - Euro</option><option value="COP">COP - Peso</option>
                </Sel>
                <F label="Flete Oceánico" name="oceanFreight" value={bl.oceanFreight} onChange={onB} placeholder="2500.00" />
                <F label="Recargos (BAF, CAF...)" name="surcharges" value={bl.surcharges} onChange={onB} placeholder="350.00" />
                <F label="Total Flete" name="totalFreight" value={bl.totalFreight} onChange={onB} placeholder="2850.00" mono />
              </div>

              <SecHdr icon={AlertTriangle} iconClass="amber" title="Instrucciones Especiales" />
              <div className="fd-grid">
                <Txt label="Instrucciones de Manejo / Marcas" name="specialInstructions" value={bl.specialInstructions} onChange={onB} placeholder="FRAGILE / KEEP DRY / THIS SIDE UP" span={3} />
                <F label="Valor Declarado" name="declaredValue" value={bl.declaredValue} onChange={onB} placeholder="125000.00" />
                <Sel label="Seguro" name="insurance" value={bl.insurance} onChange={onB}>
                  <option value="INCLUDED">Incluido en CIF</option><option value="SEPARATE">Por separado</option><option value="NONE">No aplica</option>
                </Sel>
              </div>

              <div className="fd-footer">
                <div className="fd-footer-info"><Clock size={13}/> PDF con formato estándar de conocimiento de embarque</div>
                <div className="fd-btn-group">
                  <button type="button" className="fd-btn fd-btn-ghost" onClick={()=>setBl(p=>({...p,consignee:'',vesselName:'',specialInstructions:'',declaredValue:'',oceanFreight:'',totalFreight:''}))}>
                    <RefreshCw size={15}/> Limpiar
                  </button>
                  <button type="submit" className="fd-btn fd-btn-primary" disabled={genBL}>
                    {genBL ? <><RefreshCw size={15} style={{animation:'spin 0.7s linear infinite'}}/> Generando...</>
                      : doneBL ? <><Download size={15}/> ¡PDF Listo!</>
                      : <><Download size={15}/> Generar B/L (PDF)</>}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* ── Live Preview Bar ── */}
      {tab==='awb' && (
        <div className="fd-preview-bar">
          <div className="fd-preview-item"><span className="fd-preview-lbl">AWB</span><span className="fd-preview-val">{awb.awbNumber||'—'}</span></div>
          <div className="fd-preview-sep"/>
          <div className="fd-preview-item"><span className="fd-preview-lbl">Ruta</span><span className="fd-preview-val">{depCode||'???'} → {dstCode||'???'}</span></div>
          <div className="fd-preview-sep"/>
          <div className="fd-preview-item"><span className="fd-preview-lbl">Vuelo</span><span className="fd-preview-val">{awb.flightNumber||'—'}</span></div>
          <div className="fd-preview-sep"/>
          <div className="fd-preview-item"><span className="fd-preview-lbl">Peso</span><span className="fd-preview-val">{awb.weight||'0'} kg</span></div>
          <div className="fd-preview-sep"/>
          <div className="fd-preview-item"><span className="fd-preview-lbl">Carrier</span><span className="fd-preview-val">{awb.carrier||'—'}</span></div>
          <div className="fd-preview-sep"/>
          <div className="fd-preview-item"><span className="fd-preview-lbl">Tipo</span><span className="fd-preview-val">{awb.awbType}</span></div>
        </div>
      )}
      {tab==='bl' && (
        <div className="fd-preview-bar">
          <div className="fd-preview-item"><span className="fd-preview-lbl">B/L</span><span className="fd-preview-val">{bl.blNumber||'—'}</span></div>
          <div className="fd-preview-sep"/>
          <div className="fd-preview-item"><span className="fd-preview-lbl">Ruta</span><span className="fd-preview-val">{polCode||'???'} → {podCode||'???'}</span></div>
          <div className="fd-preview-sep"/>
          <div className="fd-preview-item"><span className="fd-preview-lbl">Buque</span><span className="fd-preview-val">{bl.vesselName||'—'}</span></div>
          <div className="fd-preview-sep"/>
          <div className="fd-preview-item"><span className="fd-preview-lbl">Peso</span><span className="fd-preview-val">{Number(bl.grossWeight||0).toLocaleString()} kg</span></div>
          <div className="fd-preview-sep"/>
          <div className="fd-preview-item"><span className="fd-preview-lbl">Flete</span><span className="fd-preview-val">{bl.currency||'USD'} {Number(bl.totalFreight||0).toLocaleString()}</span></div>
        </div>
      )}
    </>
  );
};

export default FreightDocs;
