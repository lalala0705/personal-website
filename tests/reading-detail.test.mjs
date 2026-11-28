import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('book opens a dedicated detail dialog while preserving the shelf filter and scroll',()=>{
 const script=fs.readFileSync('life.js','utf8');let opens=0;
 const body={innerHTML:''},dialog={scrollTop:100,querySelector:()=>body,showModal:()=>opens++};
 const book={id:'test-book',title:'测试书籍',author:'作者',status:'reading',tone:'cream',cover:'cover.jpg',url:'https://weread.qq.com/'};
 const c={lifeItems:()=>[book],lifeFilter:'reading',lifeSelection:'',lifeDemo:false,lifeEscape:s=>s,document:{querySelector:()=>dialog}};
 vm.createContext(c);vm.runInContext(script.slice(script.indexOf('const bookStates='),script.indexOf('function renderPodcast(')),c);
 const shelf=c.renderReading();assert.doesNotMatch(shelf,/<aside/);assert.match(shelf,/aria-controls="book-detail-dialog"/);
 c.openBookDetail('test-book');assert.equal(opens,1);assert.match(body.innerHTML,/id="book-detail-title">测试书籍/);assert.match(body.innerHTML,/作者/);assert.match(body.innerHTML,/在微信读书打开/);assert.equal(c.lifeFilter,'reading');assert.equal(dialog.scrollTop,0);
 c.openBookDetail('missing');assert.equal(opens,1);
});
