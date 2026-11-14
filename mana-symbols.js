/* Mana renderer adapted from TheYogi1999/MagicEditor js/app.js.
 * Same Mana font glyphs, palette, split geometry and glyph sizing.
 * Only the Fabric image adapter is replaced by a canvas return.
 * See assets/mana/SOURCES.md for upstream and font license. */
  const MANA_COLORS = {
    W:{bg:'#f8f6d8',fg:'#111111'}, U:{bg:'#c1d7e9',fg:'#111111'}, B:{bg:'#aaa49d',fg:'#111111'},
    R:{bg:'#e49977',fg:'#111111'}, G:{bg:'#a3c095',fg:'#111111'}, C:{bg:'#d5d9d8',fg:'#111111'},
    S:{bg:'#d9e8ef',fg:'#111111'}, N:{bg:'#d8d3c7',fg:'#111111'}
  };
  const MANA_GLYPHS = {
    W:'\ue600', U:'\ue601', B:'\ue602', R:'\ue603', G:'\ue604',
    '0':'\ue605','1':'\ue606','2':'\ue607','3':'\ue608','4':'\ue609','5':'\ue60a','6':'\ue60b','7':'\ue60c','8':'\ue60d','9':'\ue60e',
    '10':'\ue60f','11':'\ue610','12':'\ue611','13':'\ue612','14':'\ue613','15':'\ue614','16':'\ue62a','17':'\ue62b','18':'\ue62c','19':'\ue62d','20':'\ue62e',
    X:'\ue615',Y:'\ue616',Z:'\ue617',P:'\ue618',H:'\ue618',S:'\ue619',T:'\ue61a',Q:'\ue61b',CHAOS:'\ue61d',C:'\ue904',E:'\ue907','1/2':'\ue902','∞':'\ue903'
  };
  function manaGlyph(code){ return MANA_GLYPHS[String(code||'').toUpperCase()] || ''; }
  function renderManaSymbol72(token){
    const raw=String(token||'').replace(/[{}]/g,'').trim().toUpperCase();
    const neutral='#beb9b2';
    const c=document.createElement('canvas');
    c.width=100; c.height=100;
    const ctx=c.getContext('2d');
    const R=46, CX=50, CY=50;

    // Farben an Mana Font angelehnt.
    const color=(code)=>({
      W:'#f0f2c0', U:'#b5cde3', B:'#aca29a', R:'#db8664', G:'#93b483',
      C:'#d0c6bb', S:'#d9e8ef', N:neutral
    }[code]||neutral);

    const circlePath=()=>{
      ctx.beginPath();
      ctx.arc(CX,CY,R,0,Math.PI*2);
    };
    const fillCircle=(fill)=>{
      circlePath(); ctx.fillStyle=fill; ctx.fill();
    };
    const drawGlyph=(code,x=50,y=50,fs=58,fill='#111')=>{
      const glyph=manaGlyph(code);
      if(!glyph) return false;
      ctx.save();
      ctx.fillStyle=fill;
      ctx.font=`${fs}px Mana`;
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      // Mana-Font hat bei einigen Glyphen optisch etwas Luft nach unten.
      ctx.fillText(glyph,x,y+1);
      ctx.restore();
      return true;
    };
    const fallback=(txt,x=50,y=50,fs=32,fill='#111')=>{
      ctx.save();
      ctx.fillStyle=fill;
      ctx.font=`700 ${fs}px Arial`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(String(txt),x,y);
      ctx.restore();
    };

    // Exakter runder Split. Hintergrund gegenüber FIX14 um 90° gegen den Uhrzeigersinn gedreht.
    // Die Glyphen bleiben an ihren Positionen; nur die beiden Farbflächen werden gedreht.
    // firstFill liegt oben/links, secondFill unten/rechts.
    const drawDiagonalSplit=(firstFill,secondFill)=>{
      fillCircle(secondFill);
      ctx.save();
      circlePath(); ctx.clip();
      ctx.fillStyle=firstFill;
      ctx.beginPath();
      ctx.moveTo(0,100);
      ctx.lineTo(0,0);
      ctx.lineTo(100,0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    const drawHalfLeft=(fill)=>{
      fillCircle(neutral);
      ctx.save(); circlePath(); ctx.clip();
      ctx.fillStyle=fill; ctx.fillRect(0,0,50,100);
      ctx.restore();
    };

    if(MANA_COLORS[raw]){
      fillCircle(color(raw));
      // Einzelne Mana-Glyphen (z. B. {W}, {U}, {B}, {R}, {G}, {C})
      // bewusst etwas größer zeichnen. Split-/Hybrid-Mana wie {R/U}
      // wird weiter unten separat gerendert und bleibt unverändert.
      if(!drawGlyph(raw,50,50,78)) fallback(raw,50,50,42);
    } else if(/^\d+$/.test(raw) || ['X','Y','Z','E','CHAOS','∞'].includes(raw)){
      fillCircle(neutral);
      if(!drawGlyph(raw,50,50,raw==='E'?78:60)) fallback(raw,50,50,raw==='E'?42:(raw.length>2?27:40));
    } else if(raw==='P'){
      fillCircle(neutral);
      // Einzelnes {P}: exakt dieselben P-Glyph-Parameter wie bei {U/P}, {R/P} usw.
      if(!drawGlyph('P',50,50,78)) fallback('Φ',50,50,52);
    } else if(raw==='T' || raw==='Q'){
      fillCircle(raw==='Q' ? '#111111' : neutral);
      const fg=raw==='Q' ? '#fff' : '#111';
      if(!drawGlyph(raw,50,50,64,fg)) fallback(raw,50,50,38,fg);
    } else if(raw==='S'){
      fillCircle(neutral);
      if(!drawGlyph('S',50,50,60)) fallback('S');
    } else if(/^H[WUBRG]$/.test(raw)){
      const cc=raw[1];
      drawHalfLeft(color(cc));
      if(!drawGlyph(cc,50,50,56)) fallback(cc);
    } else {
      const ps=raw.split('/').filter(Boolean);
      const first=ps[0]||'', second=ps[1]||'', third=ps[2]||'';

      if(ps.length>=2 && second==='P'){
        // {U/P}: volle U-Farbe, großes Phyrexian-Zeichen.
        fillCircle(MANA_COLORS[first]?color(first):neutral);
        if(!drawGlyph('P',50,50,78)) fallback('Φ',50,50,52);
      } else if(ps.length>=2 && third==='P'){
        // {W/U/P}: echter Zwei-Farb-Split plus großes Phyrexian-Zeichen.
        drawDiagonalSplit(MANA_COLORS[first]?color(first):neutral,
                          MANA_COLORS[second]?color(second):neutral);
        if(!drawGlyph('P',50,50,78)) fallback('Φ',50,50,52);
      } else if(ps.length>=2){
        // {R/B}, {W/U}, {2/G}, {C/U} usw.
        const firstFill=MANA_COLORS[first]?color(first):neutral;
        const secondFill=MANA_COLORS[second]?color(second):neutral;
        drawDiagonalSplit(firstFill,secondFill);

        // Beide Glyphen symmetrisch um die Mitte. Keine Fabric-Polygon-Normalisierung mehr,
        // daher bleiben sie exakt an ihrer Position.
        if(!drawGlyph(first,34,34,38)) fallback(first,34,34,25);
        if(!drawGlyph(second,66,66,38)) fallback(second,66,66,25);
      } else {
        fillCircle(neutral);
        if(!drawGlyph(raw,50,50,56)) fallback(raw,50,50,raw.length>3?20:32);
      }
    }

    return c;
  }
function manaSymbol72(key){
 const names={W:'White',U:'Blue',B:'Black',R:'Red',G:'Green'};
 return names[key] ? `<img class="mana-symbol72" src="assets/mana/${key}.png" width="100" height="100" alt="${names[key]}" title="${names[key]} mana" draggable="false">` : '';
}

