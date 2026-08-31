(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&r(c)}).observe(document,{childList:!0,subtree:!0});function n(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(s){if(s.ep)return;s.ep=!0;const a=n(s);fetch(s.href,a)}})();const b="../";function v(t){t&&(typeof t.preventDefault=="function"&&t.preventDefault(),typeof t.stopPropagation=="function"&&t.stopPropagation());try{window.sfx&&typeof window.sfx.playClick=="function"&&window.sfx.playClick()}catch{}try{if(window.top&&window.top!==window){window.top.location.href=b;return}}catch{}try{if(window.parent&&window.parent!==window){window.parent.location.href=b;return}}catch{}try{window.location.assign(b)}catch{window.location.href=b}}window.goToHome=v;["click","pointerdown","touchend"].forEach(t=>{document.addEventListener(t,e=>{const n=e.target;n&&(n.id==="btn-back"||n.id==="btn-close"||n.closest&&n.closest("#btn-back, .btn-top-back, #btn-close"))&&v(e)},!0)});const x={schoolName:"우리 학교",verses:[{"verseNum":1,"title":"교가 1절","lines":[{"fullText":"여기에 우리 학교 교가를 적어요","displayParts":[{"text":"여기에 우리 학교 "},{"target":"교","choseong":"ㄱ"},{"text":" "},{"target":"가","choseong":"ㄱ"},{"text":"를 적어요"}],"answers":["교","가"]},{"fullText":"가사를 한 줄씩 차례대로 적어요","displayParts":[{"text":"가사를 한 줄씩 "},{"target":"차","choseong":"ㅊ"},{"text":" "},{"target":"례","choseong":"ㄹ"},{"text":"대로 적어요"}],"answers":["차","례"]},{"fullText":"대괄호로 두 글자를 감싸면 빈칸이 돼요","displayParts":[{"text":"대괄호로 두 글자를 "},{"target":"감","choseong":"ㄱ"},{"text":" "},{"target":"싸","choseong":"ㅆ"},{"text":"면 빈칸이 돼요"}],"answers":["감","싸"]},{"fullText":"대괄호를 안 쓰면 알아서 골라 줘요","displayParts":[{"text":"대괄호를 안 쓰면 "},{"target":"알","choseong":"ㅇ"},{"text":" "},{"target":"아","choseong":"ㅇ"},{"text":"서 골라 줘요"}],"answers":["알","아"]}],"keypadTiles":["교","가","차","례","감","싸","알","아","꿈","빛"]}]};function B(t){const e=[...t];for(let n=e.length-1;n>0;n--){const r=Math.floor(Math.random()*(n+1));[e[n],e[r]]=[e[r],e[n]]}return e}class C{constructor(){this.ctx=null,this.muted=!1}init(){if(!this.ctx){const e=window.AudioContext||window.webkitAudioContext;e&&(this.ctx=new e)}this.ctx&&this.ctx.state==="suspended"&&this.ctx.resume()}playClick(){if(this.muted||(this.init(),!this.ctx))return;const e=this.ctx.createOscillator(),n=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(520,this.ctx.currentTime),e.frequency.exponentialRampToValueAtTime(300,this.ctx.currentTime+.05),n.gain.setValueAtTime(.2,this.ctx.currentTime),n.gain.exponentialRampToValueAtTime(.01,this.ctx.currentTime+.05),e.connect(n),n.connect(this.ctx.destination),e.start(),e.stop(this.ctx.currentTime+.05)}playTileSelect(){if(this.muted||(this.init(),!this.ctx))return;const e=this.ctx.createOscillator(),n=this.ctx.createGain();e.type="triangle",e.frequency.setValueAtTime(659.25,this.ctx.currentTime),n.gain.setValueAtTime(.25,this.ctx.currentTime),n.gain.exponentialRampToValueAtTime(.01,this.ctx.currentTime+.08),e.connect(n),n.connect(this.ctx.destination),e.start(),e.stop(this.ctx.currentTime+.08)}playCorrect(){if(this.muted||(this.init(),!this.ctx))return;[523.25,659.25,783.99,1046.5].forEach((n,r)=>{const s=this.ctx.createOscillator(),a=this.ctx.createGain();s.type="sine",s.frequency.value=n;const c=this.ctx.currentTime+r*.08;a.gain.setValueAtTime(.25,c),a.gain.exponentialRampToValueAtTime(.001,c+.3),s.connect(a),a.connect(this.ctx.destination),s.start(c),s.stop(c+.3)})}playWrong(){if(this.muted||(this.init(),!this.ctx))return;const e=this.ctx.createOscillator(),n=this.ctx.createGain();e.type="sawtooth",e.frequency.setValueAtTime(220,this.ctx.currentTime),e.frequency.setValueAtTime(180,this.ctx.currentTime+.1),n.gain.setValueAtTime(.2,this.ctx.currentTime),n.gain.exponentialRampToValueAtTime(.01,this.ctx.currentTime+.25),e.connect(n),n.connect(this.ctx.destination),e.start(),e.stop(this.ctx.currentTime+.25)}playMelodyTune(e){if(this.muted||(this.init(),!this.ctx))return;const n=[{f:392,d:.35},{f:440,d:.35},{f:523.25,d:.6},{f:523.25,d:.35},{f:587.33,d:.35},{f:659.25,d:.6},{f:587.33,d:.35},{f:523.25,d:.7}];let r=this.ctx.currentTime;n.forEach(s=>{const a=this.ctx.createOscillator(),c=this.ctx.createGain();a.type="sine",a.frequency.value=s.f,c.gain.setValueAtTime(.2,r),c.gain.exponentialRampToValueAtTime(.01,r+s.d),a.connect(c),c.connect(this.ctx.destination),a.start(r),a.stop(r+s.d),r+=s.d+.05}),e&&setTimeout(e,(r-this.ctx.currentTime)*1e3)}playApplause(){if(this.muted||(this.init(),!this.ctx))return;const e=this.ctx,n=e.currentTime,r=2.2,s=e.sampleRate*.5,a=e.createBuffer(1,s,e.sampleRate),c=a.getChannelData(0);for(let d=0;d<s;d++)c[d]=Math.random()*2-1;const l=50;for(let d=0;d<l;d++){const f=Math.random()*r,u=e.createBufferSource();u.buffer=a;const p=e.createBiquadFilter();p.type="bandpass",p.frequency.value=900+Math.random()*1100,p.Q.value=1.6;const m=e.createGain(),y=n+f,g=.035+Math.random()*.025;m.gain.setValueAtTime(.001,y),m.gain.linearRampToValueAtTime(.28+Math.random()*.15,y+.004),m.gain.exponentialRampToValueAtTime(.001,y+g),u.connect(p),p.connect(m),m.connect(e.destination),u.start(y),u.stop(y+g)}[523.25,659.25,783.99,1046.5,1318.51].forEach((d,f)=>{const u=e.createOscillator(),p=e.createGain();u.type="triangle",u.frequency.value=d;const m=n+f*.07;p.gain.setValueAtTime(.2,m),p.gain.exponentialRampToValueAtTime(.001,m+.6),u.connect(p),p.connect(e.destination),u.start(m),u.stop(m+.6)})}}const h=new C;function I(){let t=document.getElementById("confetti-canvas");t&&t.remove(),t=document.createElement("canvas"),t.id="confetti-canvas",t.style.position="fixed",t.style.top="0",t.style.left="0",t.style.width="100vw",t.style.height="100vh",t.style.pointerEvents="none",t.style.zIndex="10000",document.body.appendChild(t);const e=t.getContext("2d");t.width=window.innerWidth,t.height=window.innerHeight;const n=[],r=["#F43F5E","#3B82F6","#10B981","#F59E0B","#8B5CF6","#EC4899","#FACC15","#06B6D4","#FFD700"];function s(l,o,d){for(let u=0;u<70;u++){const p=d?-Math.PI*.28:-Math.PI*.72,m=(Math.random()-.5)*.7,y=p+m,g=16+Math.random()*22;n.push({x:l,y:o,vx:Math.cos(y)*g,vy:Math.sin(y)*g,size:9+Math.random()*11,color:r[Math.floor(Math.random()*r.length)],rotation:Math.random()*Math.PI*2,vRotation:(Math.random()-.5)*.25,gravity:.42,drag:.965,alpha:1,decay:.01+Math.random()*.008})}}const a=t.height*.75;s(0,a,!0),s(t.width,a,!1),setTimeout(()=>{s(0,a+40,!0),s(t.width,a+40,!1)},220),setTimeout(()=>{s(t.width*.08,a-80,!0),s(t.width*.92,a-80,!1)},450);function c(){e.clearRect(0,0,t.width,t.height);for(let l=n.length-1;l>=0;l--){const o=n[l];if(o.vx*=o.drag,o.vy*=o.drag,o.vy+=o.gravity,o.x+=o.vx,o.y+=o.vy,o.rotation+=o.vRotation,o.alpha-=o.decay,o.alpha<=0){n.splice(l,1);continue}e.save(),e.globalAlpha=o.alpha,e.translate(o.x,o.y),e.rotate(o.rotation),e.fillStyle=o.color,e.fillRect(-o.size/2,-o.size/2,o.size,o.size*1.3),e.restore()}n.length>0?requestAnimationFrame(c):t.parentNode&&t.parentNode.removeChild(t)}c()}const i={currentVerseIndex:0,score:0,timeRemaining:300,timerInterval:null,activeBoxIndex:0,userAnswers:{},boxKeyMap:{},usedKeypadIndices:new Set,shuffledKeypadTiles:[],isCompleted:!1};function T(){const t=window.innerWidth,e=window.innerHeight,n=t/1080,r=e/1920;return Math.min(n,r)}function L(){const t=document.getElementById("app-stage");if(!t)return;function e(){const n=T();t.style.transform=`scale(${n})`,document.querySelectorAll(".modal-scale-wrapper").forEach(r=>{r.style.transform=`scale(${n})`})}window.addEventListener("resize",e),e()}function A(){i.score=0,i.timeRemaining=300,i.userAnswers={},i.boxKeyMap={},i.usedKeypadIndices.clear(),i.activeBoxIndex=0,i.isCompleted=!1;const t=x.verses[i.currentVerseIndex];i.shuffledKeypadTiles=B(t.keypadTiles),$(),w()}function $(){i.timerInterval&&clearInterval(i.timerInterval),i.timerInterval=setInterval(()=>{i.timeRemaining--,E(),i.timeRemaining<=0&&(clearInterval(i.timerInterval),h.playWrong(),M(!1))},1e3)}function E(){const t=document.getElementById("timer-pill-badge");if(t){const e=Math.floor(i.timeRemaining/60),n=i.timeRemaining%60,r=`${e.toString().padStart(2,"0")}:${n.toString().padStart(2,"0")}`;t.innerHTML=`⏱ 남은 시간 ${r}`,i.timeRemaining<=15?t.classList.add("warning"):t.classList.remove("warning")}}function w(){const t=x.verses[i.currentVerseIndex],e=document.getElementById("view-container"),n=document.getElementById("app-footer");let r=0;const s=t.lines.map(a=>{let c="";return a.displayParts.forEach(l=>{if(l.text)c+=`<span>${l.text}</span>`;else if(l.target){const o=r++,d=i.userAnswers[o]||"",f=o===i.activeBoxIndex,u=d!=="";let p="choseong-box";f&&(p+=" active-target"),u&&(p+=" filled");const m=u?d:"";c+=`
          <div class="${p}" data-box-idx="${o}" data-choseong="${l.choseong}" data-target="${l.target}">
            ${m}
          </div>
        `}}),`<div class="chalk-lyric-row">${c}</div>`}).join("");e.innerHTML=`
    <!-- Top-Left Circular Back Button -->
    <a id="btn-back" class="btn-top-back" href="../" target="_top" aria-label="닫기" onclick="goToHome(event)">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </a>

    <!-- Title Banner Area -->
    <div class="title-banner-wrapper">
      <div class="title-center-block">
        <img src="./image123.webp" alt="우리학교 교가 맞추기" class="title-text-img" onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src='/assets/image123.webp';}" referrerPolicy="no-referrer">
        <div id="timer-pill-badge" class="timer-pill-badge">
          ⏱ 남은 시간 05:00
        </div>
      </div>
    </div>

    <!-- Main Green Chalkboard -->
    <div class="chalkboard-container">
      <!-- Lyrics Lines -->
      <div class="chalk-lyrics-container">
        ${s}
      </div>

      <!-- Chalkboard Bottom Ledge Tray -->
      <div class="chalkboard-tray">
        <div class="tray-eraser"></div>
        <div class="tray-chalks-row">
          <div class="chalk-stick chalk-white"></div>
          <div class="chalk-stick chalk-yellow"></div>
          <div class="chalk-stick chalk-pink"></div>
          <div class="chalk-stick chalk-blue"></div>
        </div>
      </div>
    </div>

    <!-- Bottom Wooden Syllable Keypad Tray -->
    <div class="syllable-keypad-tray">
      <div class="syllable-grid" id="syllable-keypad-grid">
        ${(i.shuffledKeypadTiles&&i.shuffledKeypadTiles.length?i.shuffledKeypadTiles:t.keypadTiles).map((a,c)=>`
            <button class="syllable-btn ${i.usedKeypadIndices.has(c)?"disabled":""}" data-key-idx="${c}" data-syllable="${a}">
              ${a}
            </button>
          `).join("")}
      </div>

      <!-- Action Buttons directly under syllable keypad grid -->
      <div class="keypad-actions-row">
        <button id="btn-reset-line" class="ctrl-btn ctrl-btn-sec">
          <svg style="width:36px;height:36px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          <span>처음부터</span>
        </button>
        <button id="btn-submit-answer" class="ctrl-btn ctrl-btn-pri">
          <svg style="width:36px;height:36px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>채점하기</span>
        </button>
        <button id="btn-view-lyrics" class="ctrl-btn ctrl-btn-accent">
          <svg style="width:36px;height:36px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          <span>가사 미리보기</span>
        </button>
      </div>
    </div>
  `,E(),n.innerHTML="",V(r)}function V(t){const e=document.getElementById("btn-back");e&&(e.onclick=a=>{a.preventDefault(),a.stopPropagation(),v()}),document.querySelectorAll(".choseong-box").forEach(a=>{a.addEventListener("click",c=>{h.playClick();const l=parseInt(c.currentTarget.dataset.boxIdx);if(i.userAnswers[l]){const o=i.boxKeyMap[l];if(o!==void 0)i.usedKeypadIndices.delete(o),delete i.boxKeyMap[l];else{const d=i.userAnswers[l];for(let f of i.usedKeypadIndices){const u=document.querySelector(`.syllable-btn[data-key-idx="${f}"]`);if(u&&u.dataset.syllable===d){i.usedKeypadIndices.delete(f);break}}}delete i.userAnswers[l]}i.activeBoxIndex=l,w()})}),document.querySelectorAll(".syllable-btn").forEach(a=>{a.addEventListener("click",c=>{if(c.currentTarget.classList.contains("disabled"))return;h.playTileSelect();const l=parseInt(c.currentTarget.dataset.keyIdx),o=c.currentTarget.dataset.syllable;i.userAnswers[i.activeBoxIndex]=o,i.boxKeyMap[i.activeBoxIndex]=l,i.usedKeypadIndices.add(l);let d=-1;for(let f=0;f<t;f++)if(!i.userAnswers[f]){d=f;break}d!==-1&&(i.activeBoxIndex=d),w()})});const n=document.getElementById("btn-reset-line");n&&n.addEventListener("click",()=>{h.playClick(),i.userAnswers={},i.boxKeyMap={},i.usedKeypadIndices.clear(),i.activeBoxIndex=0,w()});const r=document.getElementById("btn-submit-answer");r&&r.addEventListener("click",()=>{R(t)});const s=document.getElementById("btn-view-lyrics");s&&s.addEventListener("click",()=>{h.playClick(),S()})}function S(){const t=x.verses[i.currentVerseIndex],n=`
    <div class="result-overlay" id="lyrics-modal-overlay">
      <div class="modal-scale-wrapper" style="transform: scale(${T()});">
        <div class="result-dialog full-lyrics-dialog">
          <div class="lyrics-modal-header">
            <span class="lyrics-icon">🎼</span>
            <h2 class="lyrics-title">${x.schoolName} 교가 전체 가사</h2>
          </div>
          
          <div class="lyrics-content-card">
            <div class="lyrics-verse-badge">${t.title} 가사</div>
            <div class="lyrics-lines-list">
              ${t.lines.map((s,a)=>`
                <div class="lyrics-line-item">
                  <span class="line-num">${a+1}.</span>
                  <span class="line-text">${s.fullText}</span>
                </div>
              `).join("")}
              <div class="lyrics-refrain-item">
                <span class="refrain-star">⭐</span>
                <span class="refrain-text">"아 빛내자 우리 학교 우리 학교"</span>
              </div>
            </div>
          </div>

          <button id="btn-modal-close-lyrics" class="ctrl-btn ctrl-btn-pri" style="width: 100%; height: 160px; flex: 0 0 auto; margin-top: 24px; font-size: 38px; border-radius: 28px;">
            <span>확인</span>
          </button>
        </div>
      </div>
    </div>
  `,r=document.getElementById("lyrics-modal-overlay");r&&r.remove(),document.body.insertAdjacentHTML("beforeend",n),document.getElementById("btn-modal-close-lyrics").addEventListener("click",()=>{h.playClick();const s=document.getElementById("lyrics-modal-overlay");s&&s.remove()})}function k(t,e=!1){const n=document.getElementById("app-stage");if(!n)return;const r=document.querySelector(".game-toast-popup");r&&r.remove();const s=document.createElement("div");s.className=`game-toast-popup ${e?"wrong-toast":"success-toast"}`,s.innerHTML=`
    <div class="toast-icon">${e?"😢":"💯"}</div>
    <div class="toast-text">${t}</div>
  `,n.appendChild(s),setTimeout(()=>{s.classList.add("fade-out"),setTimeout(()=>{s.parentNode&&s.remove()},400)},2e3)}function R(t){const e=x.verses[i.currentVerseIndex];let n=[];e.lines.forEach(c=>{c.displayParts.forEach(l=>{l.target&&n.push(l.target)})});let r=!0,s=0;document.querySelectorAll(".choseong-box").forEach((c,l)=>{const o=i.userAnswers[l],d=n[l];o&&s++,o&&o===d?(c.classList.add("correct"),c.classList.remove("wrong")):(c.classList.add("wrong"),c.classList.remove("correct"),r=!1)}),r&&s===t?(i.timerInterval&&clearInterval(i.timerInterval),h.playCorrect(),h.playApplause(),I(),i.score=100,k("100점!",!1),setTimeout(()=>{M(!0)},350)):(h.playWrong(),k("아쉬워요 !",!0))}function M(t){t&&I();const n=`
    <div class="result-overlay">
      <div class="modal-scale-wrapper" style="transform: scale(${T()});">
        <div class="result-dialog">
          <div class="result-trophy">${t?"🏆":"⏰"}</div>
          <h2 class="result-title-text">${t?"교가 완성! 참 잘했어요!":"시간이 다 되었어요!"}</h2>
          
          <div class="result-score-big">${i.score} 점</div>

          <div style="font-size: 34px; color: #334155; font-weight: 700; line-height: 1.5; margin-top: 8px;">
            오늘도 멋지게 빛난 우리들!<br>
            다음에 또 만나요!
          </div>

          <div style="width: 100%; margin-top: 24px;">
            <button id="btn-modal-confirm" class="ctrl-btn ctrl-btn-pri" style="width: 100%; height: 160px; flex: 0 0 auto; margin-top: 24px; font-size: 38px; border-radius: 28px;">
              <span>확인</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;document.querySelectorAll(".result-overlay").forEach(r=>r.remove()),document.body.insertAdjacentHTML("beforeend",n),document.getElementById("btn-modal-confirm").addEventListener("click",()=>{h.playClick(),document.querySelectorAll(".result-overlay").forEach(r=>r.remove()),A()})}document.addEventListener("DOMContentLoaded",()=>{L();const t=document.getElementById("btn-back");t&&(t.onclick=n=>{n.preventDefault(),n.stopPropagation(),v()});const e=document.getElementById("btn-close");e&&(e.onclick=n=>{n.preventDefault(),n.stopPropagation(),v()}),A()});
