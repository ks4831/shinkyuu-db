import { LEARNING_KEYS, TRANSFER_FORMAT, TRANSFER_VERSION } from './learningDataTransfer'

/* ──────────────────────────────────────────────────────────────
   旧サイト（shinkyuu-db.vercel.app）の学習記録を書き出すブックマークレット

   旧サイトには保存ページがなく、旧サイトへの新しいデプロイも行わない（Vercel Hobby の
   非商用条件のため）。そこで、利用者が旧サイトを開いた状態で実行できる短いコードを用意する。

   - localStorage を読むだけ（setItem・removeItem・clear は使わない）
   - 通信しない（fetch・XMLHttpRequest・画像の読み込みなどは使わない）
   - 対象は LEARNING_KEYS の11キーだけ。計測用のキーや他の値は読まない
   - 書き出す形式は新サイトの読み込み（parseImport）と同じ
   - 旧サイト以外のページで実行したときは何もしない
   ────────────────────────────────────────────────────────────── */

export const LEGACY_HOSTS = ['shinkyuu-db.vercel.app']

/** ブックマークレットの本体（javascript: を付ける前のコード） */
export function legacyExportSource(hosts: string[] = LEGACY_HOSTS): string {
  const keys = JSON.stringify(LEARNING_KEYS.map((k) => k.key))
  return `(function(){
var H=${JSON.stringify(hosts)},K=${keys},d={},n=0,s=null;
function msg(t){var m=document.createElement('div');m.textContent=t;m.setAttribute('style','position:fixed;left:8px;right:8px;top:8px;z-index:2147483647;background:#fff;color:#111;border:2px solid #16a34a;border-radius:8px;padding:12px;font:14px/1.6 sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.2)');document.body.appendChild(m);setTimeout(function(){m.remove()},10000)}
if(H.indexOf(location.hostname)<0){msg('鍼灸国試DBの旧サイト（'+H[0]+'）を開いてから実行してください。');return}
try{s=window.localStorage}catch(e){}
if(!s){msg('このブラウザでは学習記録を読み取れませんでした。');return}
for(var i=0;i<K.length;i++){try{var r=s.getItem(K[i]);if(!r)continue;var v=JSON.parse(r);if(v===null||typeof v!=='object')continue;if(Array.isArray(v)?v.length===0:Object.keys(v).length===0)continue;d[K[i]]=v;n++}catch(e){}}
if(!n){msg('このブラウザには学習記録が見つかりませんでした。');return}
var t=new Date(),p=function(x){return(x<10?'0':'')+x};
var f={format:${JSON.stringify(TRANSFER_FORMAT)},version:${TRANSFER_VERSION},exportedAt:t.toISOString(),data:d};
var u=URL.createObjectURL(new Blob([JSON.stringify(f)],{type:'application/json'}));
var a=document.createElement('a');a.href=u;a.download='shinkyuu-db-learning-'+t.getFullYear()+p(t.getMonth()+1)+p(t.getDate())+'.json';
document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},1000);
msg(n+'項目の学習記録をファイルに保存しました。新しいサイトの「学習記録の保存と読み込み」で、このファイルを読み込んでください。');
})()`
}

/** ブックマークに登録する文字列 */
export function legacyExportBookmarklet(hosts: string[] = LEGACY_HOSTS): string {
  return 'javascript:' + encodeURIComponent(legacyExportSource(hosts).replace(/\n/g, ''))
}
