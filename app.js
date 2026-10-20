/* 色カラ 楽曲ビンゴメーカー：コメント付きJavaScript
 * HTML内のidを使って各部品と接続します。
 * 画像処理はブラウザー内で行います。
 */

/* 01. HTML要素の取得と描画の準備
 * $ はidからHTML要素を取得する関数、c はcanvas、ctx は2D描画用オブジェクトです。 */
const $=id=>document.getElementById(id), c=$('canvas'), ctx=c.getContext('2d');

/* 02. 標準フォント一覧と選択肢の作成
 * OSやブラウザーによって実際に表示されるフォントは異なります。 */
const fonts=[['ゴシック', 'sans-serif'], ['明朝', 'serif'], ['丸ゴシック', '"Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif'], ['等幅', 'monospace'], ['手書き風', 'cursive']];
for(const id of ['nameFont', 'songFont'])for(const [label, value]of fonts)$(id).add(new Option(label, value));

/* 03. 編集データの初期値
 * stateに名前・25曲・追加画像を保存します。selectedは曲の番号（0〜24）、layerは画像の番号です。 */
let state= {
  name: '', nameColor: '#d91d37', nameFont: 'sans-serif', nameSize: 36, songs: Array.from( {
    length: 25
  }, ()=>( {
    text: '', color: '#d91d37', font: 'sans-serif', size: 18
  })), images: []
}, selected=0, layer=-1;

/* 04. 背景画像を読み込み、読み込み完了後に描画します。 */
const base=new Image();
base.onload=draw;
base.src='template.jpg';

/* 追加画像を配置する左上の範囲。座標は元画像586×329pxを基準にします。 */
const box= {
  x: 0, y: 82, w: 265, h: 166
};

/* 05. 画像の位置・サイズを計算
 * x・y・scaleは配置枠に対する割合（％）です。縦横比を保って表示します。 */
function bounds(im) {
  return {
    x: box.x+im.x*box.w/100, y: box.y+im.y*box.h/100, w: box.w*im.scale/100, h: box.w*im.scale/100*im.img.height/im.img.width
  }
}

/* 06. 文字を枠内に収めて描画
 * 改行と自動折り返しを処理し、収まるまで文字サイズを小さくします。 */
function textFit(text, x, y, w, h, size, font, color) {
  if(!text)return;
  let lines;
  function wrap(n) {
    ctx.font=`bold ${n}px ${font}`;
    let out=[];
    for(const line of text.split('\n')) {
      let s='';
      for(const ch of Array.from(line)) {
        if(ctx.measureText(s+ch).width>w&&s) {
          out.push(s);
          s=ch
        }
        else s+=ch
      }
      out.push(s)
    }
    return out
  }
  while(size>5) {
    lines=wrap(size);
    if(lines.length*size*1.18<=h)break;
    size-=.5
  }
  ctx.fillStyle=color;
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  lines.forEach((line, i)=>ctx.fillText(line, x+w/2, y+h/2+(i-(lines.length-1)/2)*size*1.18))
}

/* 07. 完成画像の再描画
 * 元画像の3倍の解像度で出力します。背景→追加画像→名前→25曲の順に描画します。
 * clipで追加画像が左上の範囲からはみ出すのを防ぎます。 */
function draw() {
  ctx.setTransform(3, 0, 0, 3, 0, 0);
  ctx.clearRect(0, 0, 586, 329);
  if(base.complete&&base.naturalWidth)ctx.drawImage(base, 0, 0, 586, 329);
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  for(const im of state.images) {
    if(im.img) {
      let b=bounds(im);
      ctx.drawImage(im.img, b.x, b.y, b.w, b.h)
    }
  }
  ctx.restore();
  textFit(state.name, 8, 284, 242, 43, +state.nameSize, state.nameFont, state.nameColor);
  state.songs.forEach((s, i)=>textFit(s.text, 274+(i%5)*62.0, 61+Math.floor(i/5)*53.5, 53, 46, +s.size, s.font, s.color));
}

/* 08. 画像一覧と調整スライダーを更新
 * 選択中の画像を強調し、その画像の位置・サイズを操作欄へ反映します。 */
function syncLayers() {
  const el=$('layers');
  el.replaceChildren();
  state.images.forEach((im, i)=> {
    let b=document.createElement('button'); b.textContent=`${i+1} · ${im.name}`; b.className=i===layer?'active': ''; b.onclick=()=> {
      layer=i; syncLayers()
    }; el.append(b)
  });
  $('imageControls').hidden=layer<0;
  if(layer>=0) {
    const im=state.images[layer];
    $('scale').value=im.scale;
    $('posX').value=im.x;
    $('posY').value=im.y
  }
}

/* 09. 名前の入力イベント
 * 入力のたびにstateを更新し、プレビューを描き直します。 */
for(const key of ['name', 'nameColor', 'nameFont', 'nameSize'])$(key).oninput=()=> {
  state[key]=$(key).value;
  draw()
};

/* 10. 25個のマス選択ボタンを作成
 * 画面には1〜25、内部データでは0〜24を使います。 */
for(let i=0; i<25; i++) {
  let b=document.createElement('button');
  b.textContent=i+1;
  b.onclick=()=> {
    selected=i;
    syncSong()
  };
  $('songs').append(b)
}

/* 11. 選択中の曲を編集欄に表示
 * 入力済みのマスを色で示し、選択中の文字スタイルを各入力欄へ反映します。 */
function syncSong() {
  [...$('songs').children].forEach((b, i)=> {
    b.className=selected===i?'active': ''; b.style.color=state.songs[i].text?'#b6f4d9': ''
  });
  $('songLabel').textContent=`${selected+1}マス目の曲名`;
  const s=state.songs[selected];
  $('songText').value=s.text;
  $('songColor').value=s.color;
  $('songFont').value=s.font;
  $('songSize').value=s.size
}

/* 12. 曲名・文字色・フォント・文字サイズの変更イベント */
for(const [id, key]of [['songText', 'text'], ['songColor', 'color'], ['songFont', 'font'], ['songSize', 'size']])$(id).oninput=()=> {
  state.songs[selected][key]=$(id).value;
  draw();
  [...$('songs').children][selected].style.color=state.songs[selected].text?'#b6f4d9': ''
};

/* 13. 選択中の文字スタイルを全25マスへコピー
 * 曲名そのものは変更しません。 */
$('applyAll').onclick=()=> {
  const s=state.songs[selected];
  state.songs.forEach(v=>Object.assign(v, {
    font: s.font, color: s.color, size: s.size
  }));
  draw();
  message('全25マスに文字スタイルを反映しました')
};

/* 14. 1行1曲の一括入力
 * 左上から順に反映し、入力のない残りのマスは空欄にします。 */
$('bulkApply').onclick=()=> {
  const lines=$('bulk').value.split('\n');
  state.songs.forEach((s, i)=>s.text=lines[i]||'');
  syncSong();
  draw();
  message('曲名をまとめて反映しました')
};

/* 15. 利用者向けの完了・エラーメッセージを表示 */
function message(t) {
  $('status').textContent=t
}

/* 16. ファイルをData URLへ変換
 * Promiseで読み込み完了を待てるようにしています。 */
function readFile(f) {
  return new Promise((res, rej)=> {
    const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f)
  })
}

/* 17. URLから画像を読み込み、Imageオブジェクトを返します。 */
function loadImage(src) {
  return new Promise((res, rej)=> {
    const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=src
  })
}

/* 18. 複数画像の追加
 * 1枚ずつ読み込み、初期位置・サイズを設定して一覧へ追加します。 */
$('files').onchange=async e=> {
  for(const f of e.target.files) {
    try {
      if(f.size>20*1024*1024)throw Error('画像は1枚20MB以内で選択してください');
      const src=await readFile(f), img=await loadImage(src);
      state.images.push( {
        name: f.name, src, img, x: 10, y: 0, scale: 65
      });
      layer=state.images.length-1
    }
    catch(err) {
      message('画像を読み込めませんでした：'+err.message)
    }
  }
  syncLayers();
  draw();
  e.target.value=''
};

/* 19. 選択画像の位置・サイズの変更
 * 先頭の + は入力値の文字列を数値へ変換します。 */
for(const [id, key]of [['scale', 'scale'], ['posX', 'x'], ['posY', 'y']])$(id).oninput=()=> {
  if(layer<0)return;
  state.images[layer][key]=+$(id).value;
  draw()
};

/* 20. 選択画像を削除し、残った最後の画像を選択します。 */
$('remove').onclick=()=> {
  state.images.splice(layer, 1);
  layer=state.images.length-1;
  syncLayers();
  draw()
};

/* 21. 選択画像を配列の末尾へ移動
 * 描画順が最後になるので、ほかの追加画像より手前に表示されます。 */
$('front').onclick=()=> {
  state.images.push(state.images.splice(layer, 1)[0]);
  layer=state.images.length-1;
  syncLayers();
  draw()
};

/* 22. ドラッグ操作の状態
 * ドラッグ開始位置と、画像の元の位置を保持します。 */
let drag=null;

/* 画面上のポインター座標を、元画像基準の座標へ変換します。 */
function point(e) {
  const r=c.getBoundingClientRect();
  return {
    x: (e.clientX-r.left)*586/r.width, y: (e.clientY-r.top)*329/r.height
  }
}

/* 23. クリック・タッチ開始
 * 右側なら曲のマスを選択、左上なら最前面の画像から当たり判定を行います。 */
c.onpointerdown=e=> {
  const p=point(e);
  if(p.x>=270&&p.y>=57) {
    selected=Math.min(24, Math.max(0, Math.floor((p.y-57)/54))*5+Math.min(4, Math.floor((p.x-270)/63)));
    syncSong();
    return
  }
  if(p.x>265||p.y<82||p.y>248)return;
  for(let i=state.images.length-1; i>=0; i--) {
    const b=bounds(state.images[i]);
    if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h) {
      layer=i;
      drag= {
        p, x: state.images[i].x, y: state.images[i].y
      };
      c.setPointerCapture(e.pointerId);
      syncLayers();
      break
    }
  }
};

/* 24. ドラッグ移動
 * ポインターの移動量を％に変換し、画像の位置とプレビューを更新します。 */
c.onpointermove=e=> {
  if(!drag)return;
  const p=point(e), im=state.images[layer];
  im.x=Math.min(100, Math.max(-50, drag.x+(p.x-drag.p.x)*100/box.w));
  im.y=Math.min(100, Math.max(-50, drag.y+(p.y-drag.p.y)*100/box.h));
  syncLayers();
  draw()
};

/* 25. マウス・タッチの終了またはキャンセルでドラッグを終了 */
c.onpointerup=c.onpointercancel=()=>drag=null;

/* 26. ファイル保存の共通処理
 * Blobから一時URLを作り、ダウンロード後にURLを解放します。 */
function download(blob, name) {
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url;
  a.download=name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 15000)
}

/* 27. PNG画像を保存
 * フォントの準備を待ち、canvasをPNG形式のBlobへ変換します。 */
$('download').onclick=async()=> {
  await document.fonts.ready;
  draw();
  c.toBlob(b=> {
    if(b) {
      download(b, '色カラ-楽曲ビンゴ.png'); message('PNG画像を保存しました')
    }
    else message('画像の保存に失敗しました')
  }, 'image/png')
};

/* 28. 編集状態をJSON形式で保存
 * Imageオブジェクトは除外し、画像のData URL・位置・サイズなどを保存します。 */
$('saveProject').onclick=()=> {
  download(new Blob([JSON.stringify( {
    ...state, images: state.images.map(( {
      img, ...im
    })=>im)
  })], {
    type: 'application/json'
  }), '色カラ-編集データ.json');
  message('編集データを保存しました')
};

/* 29. 編集データの読み込み
 * 曲数・色・数値・画像形式を確認し、画像を復元して編集画面へ反映します。 */
$('loadProject').onchange=async e=> {
  try {
    const f=e.target.files[0];
    if(!f)return;
    const s=JSON.parse(await f.text());
    if(!Array.isArray(s.songs)||s.songs.length!==25||!Array.isArray(s.images)||s.images.length>100)throw Error();
    for(const song of s.songs)if(typeof song.text!=='string'||typeof song.font!=='string'||!/^#[0-9a-f]{6}$/i.test(song.color)||!Number.isFinite(+song.size))throw Error();
    for(const im of s.images) {
      if(typeof im.src!=='string'||!im.src.startsWith('data:image/')||!['x', 'y', 'scale'].every(k=>Number.isFinite(+im[k])))throw Error();
      im.img=await loadImage(im.src)
    }
    if(typeof s.name!=='string'||!Number.isFinite(+s.nameSize)||typeof s.nameFont!=='string'||!/^#[0-9a-f]{6}$/i.test(s.nameColor))throw Error();
    state=s;
    for(const key of ['name', 'nameColor', 'nameFont', 'nameSize'])$(key).value=state[key];
    layer=s.images.length-1;
    syncLayers();
    syncSong();
    draw();
    message('編集データを読み込みました')
  }
  catch {
    message('編集データを読み込めません。保存したJSONファイルを選択してください')
  }
  e.target.value=''
};

/* 30. フォントファイルの追加
 * FontFaceでブラウザーへ登録し、名前用・曲名用の選択肢に追加します。
 * フォントファイルそのものは編集データに含まれません。 */
$('fontUpload').onchange=async e=> {
  try {
    const f=e.target.files[0];
    if(!f)return;
    const family='CustomFont'+Date.now(), face=new FontFace(family, await f.arrayBuffer());
    await face.load();
    document.fonts.add(face);
    for(const id of ['songFont', 'nameFont'])$(id).add(new Option(f.name, family));
    message('フォントを追加しました。フォント欄から選択できます')
  }
  catch {
    message('フォントを読み込めませんでした')
  }
};
syncSong();
