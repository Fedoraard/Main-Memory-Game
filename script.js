(function(){
'use strict';

var stage=document.getElementById('stage');
var scoreEl=document.getElementById('score');
var slotEls=document.querySelectorAll('.slot');
var outage=document.getElementById('outage');
var otxt=document.getElementById('otxt');
var state={name:'',s:{r1:0,r2:0,r3:0},t0:0,timers:[],keyfn:null,sessionId:null,lastRank:null,totalPlayers:null};

function $(sel,root){return (root||stage).querySelector(sel)}
function $$(sel,root){return Array.prototype.slice.call((root||stage).querySelectorAll(sel))}
function later(fn,ms){var t=setTimeout(fn,ms);state.timers.push(t);return t}
function every(fn,ms){var t=setInterval(fn,ms);state.timers.push(t);return t}
function setKeys(fn){
  if(state.keyfn){document.removeEventListener('keydown',state.keyfn)}
  state.keyfn=fn;
  if(fn){document.addEventListener('keydown',fn)}
}
function clearAll(){
  state.timers.forEach(function(t){clearTimeout(t);clearInterval(t)});
  state.timers=[];
  setKeys(null);
}
function total(){return state.s.r1+state.s.r2+state.s.r3}
function paintHud(round){
  scoreEl.textContent=total();
  slotEls.forEach(function(el,i){
    var n=i+1;
    el.classList.toggle('done',n<round);
    el.classList.toggle('cur',n===round);
  });
}
function show(html,round){
  stage.innerHTML=html;
  paintHud(round);
  try{window.scrollTo(0,0)}catch(e){}
}
function shuffle(a){
  a=a.slice();
  for(var i=a.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1));
    var t=a[i];a[i]=a[j];a[j]=t;
  }
  return a;
}

/* ---------- Intro ---------- */
function intro(){
  clearAll();
  document.body.classList.remove('blackout');
  outage.hidden=true;
  state.s={r1:0,r2:0,r3:0};
  var saved='';
  try{saved=localStorage.getItem('blackout-nick')||''}catch(e){}
  show(
    '<section class="panel">'+
    '<p class="eyebrow">Informatika &middot; Main Memory</p>'+
    '<h1>Selamatkan data sebelum <span class="hl">listrik padam.</span></h1>'+
    '<p class="lead">Kamu jadi teknisi memori. Tiga ronde cepat, sekitar 8 menit, skor penuh 100. Tanpa daftar akun.</p>'+
    '<label for="nick">Nama panggilan (boleh dikosongkan)</label>'+
    '<input type="text" id="nick" maxlength="20" autocomplete="off" placeholder="mis. Raka">'+
    '<button class="btn primary big" id="go" type="button">Mulai misi</button>'+
    '<button class="btn big" id="intro-lb" type="button" style="margin-top:8px">🏆 Lihat Papan Skor (Leaderboard)</button>'+
    '<ol class="roundlist">'+
      '<li><span class="rn">R1</span><b>Pita atau RAM?</b><span>Adu cepat akses berurutan lawan akses acak.</span></li>'+
      '<li><span class="rn">R2</span><b>Blackout!</b><span>Taruh data di RAM, ROM, atau CMOS, lalu lihat siapa yang selamat.</span></li>'+
      '<li><span class="rn">R3</span><b>Kuis kilat</b><span>Lima pertanyaan dari modul, 15 detik tiap soal.</span></li>'+
    '</ol>'+
    '<details class="teacher"><summary>Catatan Guru & Panduan Pembelajaran</summary>'+
    '<div class="teacher-sec">'+
      '<h4>1. Latar Belakang & Tujuan Pembelajaran</h4>'+
      '<p>Konsep <i>Main Memory</i> dan sifat <i>Volatile vs Non-Volatile</i> sering kali abstrak jika hanya dijelaskan secara ceramah. Game ini dirancang sebagai media simulasi interaktif agar siswa:</p>'+
      '<ul>'+
        '<li><b>Memahami alasan RAM disebut "Random Access":</b> Merasakan langsung lambatnya akses berurutan (pita) dibanding kecepatan melompat langsung ke alamat manapun (RAM).</li>'+
        '<li><b>Melihat dampak nyata mati listrik (Blackout):</b> Menyaksikan data aktif di RAM musnah seketika (volatile), sedangkan firmware di ROM dan jam di CMOS tetap aman (non-volatile).</li>'+
        '<li><b>Membangun pemahaman sebelum teori formal:</b> Memberi pengalaman konkret sebelum masuk ke pertanyaan pemantik dan pembahasan modul ajar.</li>'+
      '</ul>'+
    '</div>'+
    '<div class="teacher-sec">'+
      '<h4>2. Cara Memainkan Game</h4>'+
      '<ol>'+
        '<li><b>Bagikan Tautan:</b> Berikan tautan halaman ini ke siswa. Siswa dapat bermain mandiri di HP atau laptop tanpa registrasi/login.</li>'+
        '<li><b>Isi Nama & Mulai:</b> Siswa memasukkan nama panggilan lalu klik <i>Mulai misi</i>. Durasi permainan sekitar 7&ndash;10 menit.</li>'+
        '<li><b>Waktu Penerapan:</b> Sangat ideal dimainkan di tahap <i>Pendahuluan/Apersepsi</i>, sebelum masuk ke pertanyaan pemantik nomor 2.</li>'+
        '<li><b>Refleksi Layar Hasil:</b> Minta siswa memperlihatkan layar hasil akhir, lalu diskusikan: <i>Mengapa data RAM hilang? Mengapa jam CMOS tetap jalan? Mengapa akses RAM jauh lebih cepat daripada pita?</i></li>'+
      '</ol>'+
    '</div>'+
    '<div class="teacher-sec">'+
      '<h4>3. Bagian-Bagian Game</h4>'+
      '<ul>'+
        '<li><b>Ronde 1 &ndash; Pita atau RAM? (Akses Berurutan vs Acak):</b> Siswa membandingkan Mode Pita (harus bergeser satu demi satu) melawan Mode RAM (bebas klik alamat mana saja), diakhiri grafik perbandingan kecepatan.</li>'+
        '<li><b>Ronde 2 &ndash; Blackout! (Klasifikasi RAM, ROM, CMOS):</b> Siswa menaruh 8 jenis data ke memori yang tepat. Simulasi mati listrik mendadak memperlihatkan data mana yang musnah dan mana yang selamat.</li>'+
        '<li><b>Ronde 3 &ndash; Kuis Kilat (Penguatan Pemahaman):</b> 5 pertanyaan pilihan ganda dari modul ajar dengan batas 15 detik per soal.</li>'+
        '<li><b>Layar Hasil & Gelar:</b> Rekapitulasi total skor (maksimal 100 poin), skor per ronde, dan gelar teknisi siswa.</li>'+
      '</ul>'+
    '</div>'+
    '<div class="teacher-note">'+
      '<b>Catatan Materi Tambahan:</b> Pada perangkat modern, firmware BIOS/UEFI disimpan di memori flash (jenis ROM yang bisa ditulis ulang tetapi tetap non-volatile). CMOS disuplai baterai kancing (CR2032) untuk menjaga Real-Time Clock (RTC).'+
    '</div>'+
    '</details>'+
    '</section>',0);
  var nick=$('#nick');
  nick.value=saved;
  $('#intro-lb').onclick=function(){
    showLeaderboard(intro);
  };
  $('#go').onclick=function(){
    state.name=nick.value.trim().slice(0,20);
    try{localStorage.setItem('blackout-nick',state.name)}catch(e){}
    state.t0=Date.now();
    startSession(state.name, function(){
      r1Brief('seq');
    });
  };
  nick.onkeydown=function(e){if(e.key==='Enter'){$('#go').click()}};
}

/* ---------- Ronde 1: akses berurutan vs acak ---------- */
var N=12;
var WORDS=['BOOT','SYS','TAB','DOC','GAME','IMG','MP3','KEY','NET','LOG','APP','CFG'];
var res={seq:0,ran:0};
function hex(i){return '0x'+(i<16?'0':'')+i.toString(16).toUpperCase()}
function pickTarget(prev,head,seq){
  var c=[],i;
  for(i=0;i<N;i++){
    if(i===prev){continue}
    if(seq&&Math.abs(i-head)<3){continue}
    c.push(i);
  }
  return c[Math.floor(Math.random()*c.length)];
}

function r1Brief(mode){
  var seq=mode==='seq';
  show(
    '<section class="panel">'+
    '<p class="eyebrow">Ronde 1 dari 3 &middot; mode '+(seq?'1':'2')+' dari 2</p>'+
    '<h2>'+(seq?'Mode Pita: geser satu per satu':'Mode RAM: lompat langsung')+'</h2>'+
    '<p>'+(seq
      ?'Memori ini punya 12 alamat. Di mode pita, kepala baca hanya bisa maju atau mundur satu alamat. Geser ke alamat yang diminta, lalu tekan BACA. Ambil sebanyak mungkin dalam 20 detik.'
      :'Alamat dan tugasnya sama. Bedanya, sekarang kamu boleh langsung menyentuh alamat mana pun. Ambil sebanyak mungkin dalam 20 detik.')+'</p>'+
    (seq?'<p class="keys">Di laptop: panah kiri dan kanan untuk geser, tombol B untuk baca.</p>':'')+
    '<button class="btn primary big" id="start" type="button">Mulai 20 detik</button>'+
    '</section>',1);
  $('#start').onclick=function(){countdown(mode)};
}

function countdown(mode){
  show('<section class="panel"><p class="eyebrow">Bersiap</p><p class="cd" id="cd">3</p></section>',1);
  var n=3;
  every(function(){
    n--;
    if(n<=0){clearAll();play(mode)}
    else{$('#cd').textContent=n}
  },700);
}

function play(mode){
  var seq=mode==='seq';
  var head=0,got=0,prev=-1,over=false,t0=Date.now(),DUR=20000;
  var target=pickTarget(prev,head,seq);
  show(
    '<section class="panel">'+
    '<div class="atop"><span class="mode">'+(seq?'MODE PITA':'MODE RAM')+'</span><span>Diambil <b id="got">0</b></span><span><b id="tl">20</b> dtk</span></div>'+
    '<div class="bar"><i id="bar"></i></div>'+
    '<p class="target">Ambil data di alamat <b id="tgt"></b></p>'+
    '<div class="grid" id="grid"></div>'+
    (seq
      ?'<div class="ctrl"><button class="btn" id="prev" type="button">&#9664; Mundur</button><button class="btn primary" id="read" type="button">BACA</button><button class="btn" id="next" type="button">Maju &#9654;</button></div>'
      :'')+
    '<p class="hint" id="hint" aria-live="polite">'+(seq?'Kepala baca hanya bisa geser satu alamat.':'Sentuh alamat yang diminta.')+'</p>'+
    '</section>',1);
  var grid=$('#grid');
  grid.innerHTML=WORDS.map(function(w,i){
    return '<button type="button" class="cell" data-i="'+i+'"><span class="addr">'+hex(i)+'</span><span class="word">'+w+'</span></button>';
  }).join('');
  var cells=$$('.cell',grid);
  var hint=$('#hint');

  function paint(){
    $('#tgt').textContent=hex(target);
    cells.forEach(function(c,i){c.classList.toggle('head',seq&&i===head)});
  }
  function flash(i,cls){
    var c=cells[i];
    c.classList.remove('ok','bad');
    void c.offsetWidth;
    c.classList.add(cls);
    later(function(){c.classList.remove(cls)},320);
  }
  function hit(i){
    if(over){return}
    if(i===target){
      got++;
      $('#got').textContent=got;
      flash(i,'ok');
      hint.textContent='Tepat, '+hex(i)+' berisi '+WORDS[i]+'. Berikutnya!';
      prev=target;
      target=pickTarget(prev,head,seq);
    }else{
      flash(i,'bad');
      hint.textContent='Itu '+hex(i)+', bukan '+hex(target)+'.';
    }
    paint();
  }
  paint();

  if(seq){
    var mv=function(d){
      if(over){return}
      head=Math.max(0,Math.min(N-1,head+d));
      paint();
    };
    $('#prev').onclick=function(){mv(-1)};
    $('#next').onclick=function(){mv(1)};
    $('#read').onclick=function(){hit(head)};
    grid.onclick=function(e){
      if(e.target.closest('.cell')){hint.textContent='Mode pita tidak bisa melompat. Pakai tombol geser.'}
    };
    setKeys(function(e){
      var k=e.key;
      if(k==='ArrowLeft'){e.preventDefault();mv(-1)}
      else if(k==='ArrowRight'){e.preventDefault();mv(1)}
      else if(k==='b'||k==='B'){hit(head)}
    });
  }else{
    grid.onclick=function(e){
      var c=e.target.closest('.cell');
      if(c){hit(parseInt(c.getAttribute('data-i'),10))}
    };
  }

  every(function(){
    var left=Math.max(0,DUR-(Date.now()-t0));
    $('#tl').textContent=Math.ceil(left/1000);
    $('#bar').style.width=(left/DUR*100)+'%';
    if(left<=0){
      over=true;
      clearAll();
      res[mode]=got;
      endMode(mode,got);
    }
  },100);
}

function endMode(mode,got){
  var seq=mode==='seq';
  show(
    '<section class="panel">'+
    '<p class="eyebrow">Waktu habis</p>'+
    '<h2>'+(seq?'Mode pita':'Mode RAM')+': '+got+' data</h2>'+
    '<p>'+(seq?'Sekarang cara kedua. Alamatnya sama, tapi kamu boleh langsung melompat.':'Saatnya melihat perbandingannya.')+'</p>'+
    '<button class="btn primary big" id="nx" type="button">'+(seq?'Lanjut ke mode RAM':'Lihat perbandingan')+'</button>'+
    '</section>',1);
  $('#nx').onclick=function(){if(seq){r1Brief('ran')}else{r1Result()}};
}

function r1Result(){
  var a=res.seq,b=res.ran,max=Math.max(a,b,1);
  var pts=Math.min(30,2*(a+b));
  state.s.r1=pts;
  var verdict;
  if(b>a&&a>0){
    var x=(b/a).toFixed(1).replace('.0','');
    verdict='Mode RAM mengambil '+x+' kali lebih banyak dari mode pita.';
  }else if(b>a){
    verdict='Mode pita tidak sempat mengambil satu data pun, mode RAM mengambil '+b+'.';
  }else{
    verdict='Hasilnya mirip kali ini. Biasanya akses acak jauh unggul, jadi coba lagi lebih cepat nanti.';
  }
  show(
    '<section class="panel">'+
    '<p class="eyebrow">Hasil ronde 1</p>'+
    '<h2>Kenapa RAM disebut Random Access?</h2>'+
    '<div class="cmp">'+
      '<div class="r"><span>Pita</span><span class="track"><span class="fill" style="width:'+(a/max*100)+'%"></span></span><span class="n">'+a+'</span></div>'+
      '<div class="r"><span>RAM</span><span class="track"><span class="fill ram" style="width:'+(b/max*100)+'%"></span></span><span class="n">'+b+'</span></div>'+
    '</div>'+
    '<p><b>'+verdict+'</b> Kamu dapat <b>+'+pts+' poin</b>.</p>'+
    '<div class="explain"><p>Di RAM, setiap alamat bisa dijangkau langsung dalam waktu yang relatif sama. Di akses berurutan, data di alamat 0x0A harus melewati semua alamat sebelumnya dulu.</p></div>'+
    '<button class="btn primary big" id="nx" type="button">Lanjut ke ronde 2</button>'+
    '</section>',1);
  $('#nx').onclick=r2Brief;
}

/* ---------- Ronde 2: Blackout ---------- */
var ITEMS=[
  {t:'Tab browser yang sedang terbuka',k:'ram'},
  {t:'Dokumen Word yang belum disimpan',k:'ram'},
  {t:'Game yang sedang kamu mainkan',k:'ram'},
  {t:'Program booting (firmware BIOS)',k:'rom'},
  {t:'Kode beep untuk diagnosis POST',k:'rom'},
  {t:'Jam dan tanggal komputer',k:'cmos'},
  {t:'Urutan prioritas boot di BIOS',k:'cmos'},
  {t:'Konfigurasi hardware yang dikenali BIOS',k:'cmos'}
];
var NAMES={ram:'RAM',rom:'ROM',cmos:'CMOS'};

function r2Brief(){
  show(
    '<section class="panel">'+
    '<p class="eyebrow">Ronde 2 dari 3</p>'+
    '<h2>Blackout!</h2>'+
    '<p>Ada 8 data yang sedang dipakai komputer. Taruh tiap data di tempat yang benar: <b>RAM</b>, <b>ROM</b>, atau <b>CMOS</b>. Setelah itu listrik dicabut. Data mana yang selamat?</p>'+
    '<button class="btn primary big" id="start" type="button">Mulai</button>'+
    '</section>',2);
  $('#start').onclick=r2Place;
}

function r2Place(){
  var order=shuffle(ITEMS),idx=0,picks=[];
  show(
    '<section class="panel">'+
    '<p class="eyebrow" id="eb">Ronde 2 &middot; data <span id="n">1</span> dari 8</p>'+
    '<div id="ask">'+
      '<div class="datacard" id="card"></div>'+
      '<p class="ask">Disimpan di mana?</p>'+
      '<div class="choices3">'+
        '<button class="pick" data-k="ram" type="button"><b>RAM</b><small>Memori kerja saat komputer menyala</small></button>'+
        '<button class="pick" data-k="rom" type="button"><b>ROM</b><small>Program tetap, hanya dibaca</small></button>'+
        '<button class="pick" data-k="cmos" type="button"><b>CMOS</b><small>Pengaturan, dijaga baterai kecil</small></button>'+
      '</div>'+
    '</div>'+
    '<div class="board3">'+
      '<div class="col"><h4>RAM</h4><div id="col-ram"></div></div>'+
      '<div class="col"><h4>ROM</h4><div id="col-rom"></div></div>'+
      '<div class="col"><h4>CMOS</h4><div id="col-cmos"></div></div>'+
    '</div>'+
    '</section>',2);

  function showItem(){
    var c=$('#card');
    c.textContent=order[idx].t;
    $('#n').textContent=idx+1;
    c.style.animation='none';
    void c.offsetWidth;
    c.style.animation='';
  }
  function ready(){
    $('#eb').textContent='Ronde 2 · semua data sudah ditaruh';
    $('#ask').innerHTML=
      '<p class="lead">Semua data sudah di tempatnya. Saatnya mencabut listrik.</p>'+
      '<button class="btn danger big" id="cut" type="button">Cabut listrik!</button>';
    $('#cut').onclick=function(){blackout(function(){r2Reveal(picks)})};
    $('#cut').focus();
  }
  showItem();
  $$('.pick').forEach(function(b){
    b.onclick=function(){
      var k=b.getAttribute('data-k'),it=order[idx];
      picks.push({t:it.t,k:it.k,g:k});
      var tag=document.createElement('span');
      tag.className='tag';
      tag.textContent=it.t;
      $('#col-'+k).appendChild(tag);
      idx++;
      if(idx<order.length){showItem()}else{ready()}
    };
  });
}

function blackout(next){
  document.body.classList.add('blackout');
  otxt.textContent='Listrik padam';
  outage.hidden=false;
  later(function(){otxt.textContent='Listrik menyala'},1200);
  later(function(){
    document.body.classList.remove('blackout');
    outage.hidden=true;
    next();
  },2200);
}

function r2Reveal(picks){
  var batt=true,hits=0;
  picks.forEach(function(p){if(p.g===p.k){hits++}});
  state.s.r2=hits*5;

  function rowsHTML(first){
    return picks.map(function(p,i){
      var lost=p.k==='ram'||(p.k==='cmos'&&!batt);
      var fate=p.k==='ram'?'HILANG':(p.k==='rom'?'BERTAHAN':(batt?'BERTAHAN':'DEFAULT'));
      var where=p.k==='ram'?'Ada di RAM (volatile)':(p.k==='rom'?'Ada di ROM (non-volatile)':(batt?'Ada di CMOS, dijaga baterai':'Ada di CMOS, baterai dilepas'));
      var guess=p.g===p.k
        ?'<span class="good">Tebakanmu '+NAMES[p.g]+': tepat</span>'
        :'<span class="miss">Tebakanmu '+NAMES[p.g]+': kurang tepat</span>';
      return '<li class="row '+(lost?'lost':'kept')+(first?'':' still')+'" style="--d:'+(i*0.12).toFixed(2)+'s">'+
        '<span class="item">'+p.t+'</span><span class="fate">'+fate+'</span>'+
        '<span class="meta">'+where+' &middot; '+guess+'</span></li>';
    }).join('');
  }

  show(
    '<section class="panel">'+
    '<p class="eyebrow">Listrik menyala lagi</p>'+
    '<h2>Ini yang selamat</h2>'+
    '<p>Tebakanmu tepat <b>'+hits+' dari 8</b>. Kamu dapat <b>+'+(hits*5)+' poin</b>.</p>'+
    '<ul class="rows" id="rows">'+rowsHTML(true)+'</ul>'+
    '<div class="explain"><p>RAM kosong karena <b>volatile</b>: butuh listrik untuk menyimpan data. ROM tetap utuh karena <b>non-volatile</b>. CMOS ikut bertahan hanya selama baterainya ada.</p></div>'+
    '<p class="hint" id="bnote" aria-live="polite"></p>'+
    '<div class="actions"><button class="btn" id="bat" type="button">Lepas baterai CMOS</button><button class="btn primary" id="nx" type="button">Lanjut ke ronde 3</button></div>'+
    '</section>',2);

  $('#bat').onclick=function(){
    batt=!batt;
    $('#rows').innerHTML=rowsHTML(false);
    $('#bat').textContent=batt?'Lepas baterai CMOS':'Pasang baterai lagi';
    $('#bnote').textContent=batt?'':'Baterai CMOS dilepas. Jam dan pengaturan BIOS kembali ke default, jadi perlu diatur ulang.';
  };
  $('#nx').onclick=r3;
}

/* ---------- Ronde 3: kuis kilat ---------- */
var QS=[
  {q:'Komputer di warnet jadi lag setiap pengguna membuka banyak tab. Penyebab paling mungkin?',
   o:['Kapasitas RAM hampir penuh','ROM-nya rusak','Baterai CMOS habis','Kabel LAN longgar'],a:0,
   w:'RAM yang kecil cepat penuh saat multitasking. Sistem lalu memindahkan data ke disk (memori virtual) yang jauh lebih lambat.'},
  {q:'Mengapa dokumen yang belum disimpan hilang saat listrik mati mendadak?',
   o:['RAM bersifat volatile','ROM menghapus datanya sendiri','Hard disk selalu rusak','CMOS tidak punya baterai'],a:0,
   w:'RAM butuh aliran listrik untuk mempertahankan data. Data baru aman setelah dipindahkan ke penyimpanan permanen.'},
  {q:'Jenis RAM yang menyimpan bit di kapasitor dan harus di-refresh berkala adalah...',
   o:['DRAM','SRAM','PROM','EEPROM'],a:0,
   w:'DRAM memakai kapasitor yang bocor, jadi perlu di-refresh. SRAM memakai flip-flop yang stabil tanpa refresh.'},
  {q:'Apa tugas ROM/BIOS saat komputer baru dinyalakan?',
   o:['Menjalankan program awal dan memeriksa hardware','Menyimpan file tugas siswa','Menambah kapasitas RAM','Mengatur kecepatan internet'],a:0,
   w:'ROM/BIOS menyimpan program awal yang menjalankan POST dan memulai proses booting.'},
  {q:'PC menyala, layar tetap gelap, terdengar beep panjang berulang. Langkah awal teknisi?',
   o:['Periksa dan pasang ulang modul RAM','Instal ulang sistem operasi','Ganti keyboard','Tambah hard disk'],a:0,
   w:'Kode beep adalah sinyal POST. Pola beep berbeda tiap vendor BIOS, tetapi gangguan RAM sering jadi penyebabnya. Cek manual motherboard, lalu pasang ulang atau bersihkan kontak RAM.'}
];

function r3(){
  var qs=shuffle(QS),i=0,pts=0,DUR=15000;
  state.s.r3=0;

  function ask(){
    var q=qs[i],locked=false,t0=Date.now();
    var opts=shuffle(q.o.map(function(t,j){return {t:t,c:j===q.a}}));
    show(
      '<section class="panel">'+
      '<p class="eyebrow">Ronde 3 &middot; kuis kilat '+(i+1)+' dari '+qs.length+'</p>'+
      '<div class="bar"><i id="bar"></i></div>'+
      '<h2 class="qh">'+q.q+'</h2>'+
      '<div class="opts" id="opts"></div>'+
      '<div id="fb" aria-live="polite"></div>'+
      '</section>',3);
    var box=$('#opts');
    opts.forEach(function(o,j){
      var b=document.createElement('button');
      b.type='button';
      b.className='opt';
      b.textContent=o.t;
      b.onclick=function(){answer(j)};
      box.appendChild(b);
    });

    function answer(j){
      if(locked){return}
      locked=true;
      clearAll();
      var ok=j>-1&&opts[j].c;
      if(ok){pts+=6;state.s.r3=pts;paintHud(3)}
      $$('.opt').forEach(function(b,k){
        b.disabled=true;
        if(opts[k].c){b.classList.add('right')}
        else if(k===j){b.classList.add('wrong')}
      });
      $('#fb').innerHTML=
        '<div class="why"><b>'+(j<0?'Waktu habis. ':(ok?'Tepat, +6 poin. ':'Belum tepat. '))+'</b>'+q.w+'</div>'+
        '<button class="btn primary big" id="nq" type="button">'+(i<qs.length-1?'Pertanyaan berikutnya':'Lihat hasil')+'</button>';
      $('#nq').onclick=function(){i++;if(i<qs.length){ask()}else{finish()}};
      $('#nq').focus();
    }

    every(function(){
      var left=Math.max(0,DUR-(Date.now()-t0));
      $('#bar').style.width=(left/DUR*100)+'%';
      if(left<=0){answer(-1)}
    },100);
  }
  ask();
}

/* ---------- Hasil akhir ---------- */
function finish(){
  clearAll();
  var tot=total();
  var secs=Math.round((Date.now()-state.t0)/1000);
  var mm=Math.floor(secs/60),ss=secs%60;
  var title=tot>=90?'Arsitek Memori':(tot>=70?'Teknisi Senior':(tot>=50?'Teknisi Magang':'Calon Teknisi'));
  var line=tot>=90?'Hampir semua jawabanmu tepat.':(tot>=70?'Konsepnya sudah kuat, tinggal dirapikan.':(tot>=50?'Fondasinya sudah ada. Ulangi ronde yang masih kurang.':'Tidak apa-apa. Main sekali lagi, skormu pasti naik.'));
  function bar(label,v,m){
    return '<div class="r"><span>'+label+'</span><span class="track"><span class="fill ram" style="width:'+(v/m*100)+'%"></span></span><span class="n">'+v+'</span></div>';
  }
  show(
    '<section class="panel">'+
    '<p class="eyebrow">Misi selesai</p>'+
    '<h2>'+title+'</h2>'+
    '<p class="sub" id="who"></p>'+
    '<div class="big">'+tot+'<small>/100</small></div>'+
    '<div id="rank-wrap"></div>'+
    '<p>'+line+'</p>'+
    '<div class="cmp">'+bar('R1 / 30',state.s.r1,30)+bar('R2 / 40',state.s.r2,40)+bar('R3 / 30',state.s.r3,30)+'</div>'+
    '<h3>Yang perlu kamu ingat</h3>'+
    '<ul class="takeaways">'+
      '<li>RAM bersifat <b>volatile</b>: data hilang saat listrik mati. Simpan dokumen sebelum padam.</li>'+
      '<li>ROM bersifat <b>non-volatile</b>: program awal untuk booting tetap ada tanpa listrik.</li>'+
      '<li>CMOS menyimpan jam dan pengaturan BIOS dengan bantuan baterai kecil. Baterai habis, pengaturan kembali ke default.</li>'+
      '<li><b>Random access</b> membuat RAM cepat. RAM yang terlalu kecil membuat komputer lag saat multitasking.</li>'+
    '</ul>'+
    '<input type="text" id="fallback" readonly hidden aria-label="Teks hasil untuk disalin">'+
    '<div class="actions">'+
      '<button class="btn primary" id="again" type="button">Main lagi</button>'+
      '<button class="btn" id="finish-lb" type="button">🏆 Papan Skor</button>'+
      '<button class="btn" id="copy" type="button">Salin hasil</button>'+
    '</div>'+
    '<p class="note" id="cmsg" aria-live="polite">Tunjukkan layar ini ke gurumu.</p>'+
    '</section>',4);
  $('#who').textContent=(state.name?state.name+' · ':'')+'waktu bermain '+mm+' menit '+ss+' detik';
  $('#again').onclick=intro;
  $('#finish-lb').onclick=function(){
    showLeaderboard(finish, state.sessionId);
  };
  submitFinish(tot, secs, title);
  $('#copy').onclick=function(){
    var txt='Blackout! Main Memory | '+(state.name||'Tanpa nama')+' | '+tot+'/100 (R1 '+state.s.r1+', R2 '+state.s.r2+', R3 '+state.s.r3+')';
    var done=function(){$('#cmsg').textContent='Hasil disalin.'};
    var fb=function(){
      var f=$('#fallback');
      f.hidden=false;
      f.value=txt;
      f.focus();
      f.select();
      $('#cmsg').textContent='Salin manual dari kolom di atas.';
    };
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(done,fb)}
      else{fb()}
    }catch(e){fb()}
  };
}

/* ---------- Leaderboard & Database API ---------- */
var lbOrder = 'desc';
var lbStatus = 'completed';
var CLOUD_URL = 'https://kvdb.io/Uiff6XYGoxi5tpqKY1NDSp/scores';

function getLocalSessions(){
  try{
    var s = localStorage.getItem('blackout-sessions');
    if(!s){
      var seeds = [
        {id:'seed-1', name:'Budi Santoso', total:96, r1:28, r2:40, r3:28, duration:320, title:'Arsitek Memori', status:'completed'},
        {id:'seed-2', name:'Siti Rahma', total:88, r1:24, r2:40, r3:24, duration:350, title:'Teknisi Senior', status:'completed'},
        {id:'seed-3', name:'Ahmad Fauzi', total:72, r1:20, r2:30, r3:22, duration:410, title:'Teknisi Senior', status:'completed'},
        {id:'seed-4', name:'Dewi Lestari', total:54, r1:14, r2:25, r3:15, duration:460, title:'Teknisi Magang', status:'completed'},
        {id:'seed-5', name:'Reza Pratama', total:38, r1:10, r2:18, r3:10, duration:480, title:'Calon Teknisi', status:'completed'}
      ];
      localStorage.setItem('blackout-sessions', JSON.stringify(seeds));
      return seeds;
    }
    return JSON.parse(s);
  }catch(e){
    return [];
  }
}

function fetchRemoteList(cb){
  fetch(CLOUD_URL + '?t=' + Date.now())
    .then(function(r){
      if(!r.ok) throw new Error('cloud error');
      return r.json();
    })
    .then(function(data){
      if(Array.isArray(data) && data.length > 0){
        try{localStorage.setItem('blackout-sessions', JSON.stringify(data))}catch(e){}
        cb(data);
      } else {
        cb(getLocalSessions());
      }
    })
    .catch(function(){
      cb(getLocalSessions());
    });
}

function pushRemoteList(list, cb){
  try{localStorage.setItem('blackout-sessions', JSON.stringify(list))}catch(e){}
  fetch(CLOUD_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(list)
  })
  .then(function(r){ if(cb) cb(r.ok); })
  .catch(function(){ if(cb) cb(false); });
}

function startSession(name, cb){
  state.sessionId = 'u_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  fetchRemoteList(function(list){
    list.push({
      id: state.sessionId,
      name: name || 'Anonim',
      total: 0, r1: 0, r2: 0, r3: 0, duration: 0,
      title: '', status: 'playing'
    });
    pushRemoteList(list);
    if(cb) cb();
  });
}

function renderRankBanner(rank, total){
  var rw=$('#rank-wrap');
  if(rw){
    rw.innerHTML=
      '<div class="rank-banner">'+
        '<div>🏆 Peringkat Kelas: <b>#'+rank+'</b> dari '+total+' siswa</div>'+
        '<button class="btn-pill active" id="quick-lb-btn" type="button">Buka Leaderboard &raquo;</button>'+
      '</div>';
    var qb=$('#quick-lb-btn');
    if(qb){qb.onclick=function(){showLeaderboard(finish, state.sessionId)}};
  }
}

function submitFinish(tot, secs, title){
  fetchRemoteList(function(list){
    var found = false;
    for(var i=0; i<list.length; i++){
      if(list[i].id === state.sessionId){
        list[i].total = tot;
        list[i].r1 = state.s.r1;
        list[i].r2 = state.s.r2;
        list[i].r3 = state.s.r3;
        list[i].duration = secs;
        list[i].title = title;
        list[i].status = 'completed';
        found = true;
        break;
      }
    }
    if(!found){
      list.push({
        id: state.sessionId,
        name: state.name || 'Anonim',
        total: tot, r1: state.s.r1, r2: state.s.r2, r3: state.s.r3,
        duration: secs, title: title, status: 'completed'
      });
    }
    pushRemoteList(list);
    var comp = list.filter(function(x){return x.status === 'completed'});
    comp.sort(function(a,b){return (b.total - a.total) || (a.duration - b.duration)});
    var myRank = 1;
    for(var k=0; k<comp.length; k++){
      if(comp[k].id === state.sessionId){myRank = k+1; break;}
    }
    renderRankBanner(myRank, comp.length);
  });
}

function showLeaderboard(returnFn, highlightedId){
  clearAll();
  var backFn = returnFn || intro;
  show(
    '<section class="panel">'+
    '<p class="eyebrow">Cloud Database Kelas &middot; Papan Skor Realtime</p>'+
    '<h2>🏆 Papan Peringkat (Leaderboard)</h2>'+
    '<p class="lead">Tersinkronisasi realtime antar seluruh HP & laptop siswa.</p>'+
    '<div id="lb-stats" class="stat-grid">'+
      '<div class="stat-card"><div class="val">-</div><div class="lbl">Siswa Selesai</div></div>'+
      '<div class="stat-card hi"><div class="val">-</div><div class="lbl">Nilai Tertinggi</div><div class="who">-</div></div>'+
      '<div class="stat-card lo"><div class="val">-</div><div class="lbl">Nilai Terendah</div><div class="who">-</div></div>'+
      '<div class="stat-card"><div class="val">-</div><div class="lbl">Rata-rata Kelas</div></div>'+
    '</div>'+
    '<div class="lb-controls">'+
      '<div class="lb-pills">'+
        '<button class="btn-pill '+(lbOrder==='desc'?'active':'')+'" id="sort-desc" type="button">⬆️ Nilai Tertinggi</button>'+
        '<button class="btn-pill '+(lbOrder==='asc'?'active lo':'')+'" id="sort-asc" type="button">⬇️ Nilai Terendah</button>'+
        '<button class="btn-pill '+(lbStatus==='all'?'active':'')+'" id="filter-all" type="button">'+(lbStatus==='all'?'Semua Sesi':'Hanya Selesai')+'</button>'+
      '</div>'+
      '<button class="lb-btn" id="lb-refresh" type="button">🔄 Segarkan</button>'+
    '</div>'+
    '<div class="lb-table-wrap">'+
      '<table class="lb-table">'+
        '<thead>'+
          '<tr>'+
            '<th>#</th>'+
            '<th>Nama Siswa</th>'+
            '<th>Skor Total</th>'+
            '<th>R1 / R2 / R3</th>'+
            '<th>Durasi</th>'+
            '<th>Gelar</th>'+
            '<th>Status</th>'+
          '</tr>'+
        '</thead>'+
        '<tbody id="lb-rows">'+
          '<tr><td colspan="7" class="empty-lb">Memuat data cloud realtime...</td></tr>'+
        '</tbody>'+
      '</table>'+
    '</div>'+
    '<div class="actions" style="margin-top:20px">'+
      '<button class="btn primary" id="lb-back" type="button">&laquo; Kembali</button>'+
    '</div>'+
    '</section>', 0
  );

  $('#lb-back').onclick = backFn;

  $('#sort-desc').onclick = function(){
    lbOrder = 'desc';
    showLeaderboard(backFn, highlightedId);
  };
  $('#sort-asc').onclick = function(){
    lbOrder = 'asc';
    showLeaderboard(backFn, highlightedId);
  };
  $('#filter-all').onclick = function(){
    lbStatus = (lbStatus==='all' ? 'completed' : 'all');
    showLeaderboard(backFn, highlightedId);
  };
  $('#lb-refresh').onclick = function(){
    loadLeaderboardData(highlightedId);
  };

  loadLeaderboardData(highlightedId);
  every(function(){
    loadLeaderboardData(highlightedId);
  }, 4000);
}

function loadLeaderboardData(highlightedId){
  fetchRemoteList(function(all){
    var filtered = all;
    if(lbStatus === 'completed'){
      filtered = all.filter(function(x){return x.status === 'completed'});
    }
    filtered.sort(function(a,b){
      if(lbOrder === 'asc'){
        return (a.total - b.total) || (b.duration - a.duration);
      } else {
        return (b.total - a.total) || (a.duration - b.duration);
      }
    });
    var players = filtered.map(function(item, idx){
      return {
        rank: idx + 1,
        id: item.id,
        name: item.name,
        total: item.total || 0,
        r1: item.r1 || 0,
        r2: item.r2 || 0,
        r3: item.r3 || 0,
        duration: item.duration || 0,
        title: item.title || '',
        status: item.status || 'completed'
      };
    });
    var comp = all.filter(function(x){return x.status === 'completed'});
    var maxP = null, minP = null, sum = 0;
    comp.forEach(function(c){
      sum += (c.total || 0);
      if(!maxP || c.total > maxP.total) maxP = c;
      if(!minP || c.total < minP.total) minP = c;
    });
    var stats = {
      total_players: all.length,
      total_completed: comp.length,
      highest_score: maxP ? maxP.total : 0,
      highest_scorer_name: maxP ? maxP.name : '-',
      lowest_score: minP ? minP.total : 0,
      lowest_scorer_name: minP ? minP.name : '-',
      average_score: comp.length ? Math.round((sum / comp.length)*10)/10 : 0
    };
    renderLeaderboardUI(players, stats, highlightedId);
  });
}

function renderLeaderboardUI(players, stats, highlightedId){
  var s = stats || {};
  var statsEl = $('#lb-stats');
  if(statsEl){
    statsEl.innerHTML =
      '<div class="stat-card"><div class="val">'+(s.total_completed||0)+'</div><div class="lbl">Siswa Selesai</div><div class="who">'+(s.total_players||0)+' total sesi</div></div>'+
      '<div class="stat-card hi"><div class="val">'+(s.highest_score||0)+'<small>/100</small></div><div class="lbl">Nilai Tertinggi</div><div class="who">'+(escapeHtml(s.highest_scorer_name)||'-')+'</div></div>'+
      '<div class="stat-card lo"><div class="val">'+(s.lowest_score||0)+'<small>/100</small></div><div class="lbl">Nilai Terendah</div><div class="who">'+(escapeHtml(s.lowest_scorer_name)||'-')+'</div></div>'+
      '<div class="stat-card"><div class="val">'+(s.average_score||0)+'</div><div class="lbl">Rata-rata Kelas</div><div class="who">skor total</div></div>';
  }

  var tbody = $('#lb-rows');
  if(!tbody) return;
  if(!players || players.length === 0){
    tbody.innerHTML = '<tr><td colspan="7" class="empty-lb">Belum ada data nilai tersimpan. Jadilah siswa pertama yang menyelesaikan misi!</td></tr>';
    return;
  }

  var html = '';
  players.forEach(function(p, idx){
    var isHl = highlightedId && (p.id === highlightedId);
    var mm = Math.floor((p.duration||0)/60), ss = (p.duration||0)%60;
    var durStr = (p.duration > 0) ? (mm+'m '+(ss<10?'0':'')+ss+'s') : '-';
    var rankBadge = (lbOrder === 'desc') ? (idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '#'+p.rank))) : ('#'+p.rank);
    var isDone = p.status === 'completed';

    html +=
      '<tr class="'+(isHl?'highlight':'')+'">'+
        '<td><span class="badge-rank">'+rankBadge+'</span></td>'+
        '<td><b>'+escapeHtml(p.name)+'</b>'+(isHl?' <span style="font-size:0.75rem;color:var(--board);font-weight:700">(Kamu)</span>':'')+'</td>'+
        '<td><span class="badge-score">'+p.total+'</span><small style="color:var(--muted)">/100</small></td>'+
        '<td style="font-family:var(--font-mono);font-size:0.8rem;color:var(--muted)">R1:'+p.r1+' | R2:'+p.r2+' | R3:'+p.r3+'</td>'+
        '<td style="font-family:var(--font-mono);font-size:0.8rem">'+durStr+'</td>'+
        '<td><span style="font-size:0.82rem">'+escapeHtml(p.title||'-')+'</span></td>'+
        '<td><span class="badge-status '+(isDone?'completed':'playing')+'">'+(isDone?'Selesai':'Main')+'</span></td>'+
      '</tr>';
  });
  tbody.innerHTML = html;
}

function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

var navLbBtn=document.getElementById('nav-lb-btn');
if(navLbBtn){
  navLbBtn.onclick=function(){
    showLeaderboard(intro);
  };
}

intro();
})();
