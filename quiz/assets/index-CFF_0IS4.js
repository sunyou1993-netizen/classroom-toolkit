(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))t(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&t(o)}).observe(document,{childList:!0,subtree:!0});function n(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function t(s){if(s.ep)return;s.ep=!0;const i=n(s);fetch(s.href,i)}})();const d={image1680:"./image%201680.webp",image1681:"./image%201681.png",image1682:"./image%201682.webp",image1684:"./image%201684.webp",image1685:"./image%201685.png",image1687:"./image%201687.webp",image4:"./image4.webp",image31:"./image31.webp",image7:"./image7.webp"},m="./",y=[{id:"school",title:"교가",desc:"우리 학교 노래를 불러봐요",iconBg:"#E0F2FE",iconImg:d.image1680,url:"./song/app.html",questions:[]},{id:"sokdam",title:"속담",desc:"재미있는 속담을 맞혀봐요",iconBg:"#FEF3C7",iconImg:d.image1682,url:"./proverb/app.html",questions:[]},{id:"general",title:"사자성어",desc:"조상님들의 지혜를 맞혀봐요",iconBg:"#FFF7ED",iconImg:d.image1681,url:"./fourchar/app.html",questions:[]},{id:"environment",title:"환경",desc:"함께 지구를 지켜요",iconBg:"#EEF2FF",iconImg:d.image1684,url:"./environment/app.html",questions:[]},{id:"safety",title:"안전",desc:"안전하고 건강하게 생활해요",iconBg:"#FEF2F2",iconImg:d.image1685,url:"./safe/app.html",questions:[]},{id:"school_violence",title:"학교폭력",desc:"친구를 이해하고 배려해요",iconBg:"#ECFDF5",iconImg:d.image1687,url:"./violence/app.html",questions:[]}];class f{constructor(){this.ctx=null,this.enabled=!0}init(){try{if(!this.ctx){const e=window.AudioContext||window.webkitAudioContext;e&&(this.ctx=new e)}this.ctx&&this.ctx.state==="suspended"&&this.ctx.resume().catch(()=>{})}catch{}}playClick(){if(this.enabled)try{if(this.init(),!this.ctx)return;const e=this.ctx.createOscillator(),n=this.ctx.createGain();e.type="sine",e.frequency.setValueAtTime(587.33,this.ctx.currentTime),e.frequency.exponentialRampToValueAtTime(880,this.ctx.currentTime+.08),n.gain.setValueAtTime(.15,this.ctx.currentTime),n.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+.08),e.connect(n),n.connect(this.ctx.destination),e.start(),e.stop(this.ctx.currentTime+.08)}catch{}}playCorrect(){if(this.enabled)try{if(this.init(),!this.ctx)return;const e=this.ctx.currentTime;[523.25,659.25,783.99,1046.5].forEach((t,s)=>{const i=this.ctx.createOscillator(),o=this.ctx.createGain();i.type="triangle",i.frequency.setValueAtTime(t,e+s*.08),o.gain.setValueAtTime(.2,e+s*.08),o.gain.exponentialRampToValueAtTime(.001,e+s*.08+.25),i.connect(o),o.connect(this.ctx.destination),i.start(e+s*.08),i.stop(e+s*.08+.25)})}catch{}}playIncorrect(){if(this.enabled)try{if(this.init(),!this.ctx)return;const e=this.ctx.currentTime;[311.13,293.66].forEach((t,s)=>{const i=this.ctx.createOscillator(),o=this.ctx.createGain();i.type="sawtooth",i.frequency.setValueAtTime(t,e+s*.12),o.gain.setValueAtTime(.12,e+s*.12),o.gain.exponentialRampToValueAtTime(.001,e+s*.12+.2),i.connect(o),o.connect(this.ctx.destination),i.start(e+s*.12),i.stop(e+s*.12+.2)})}catch{}}}const p=new f;class w{constructor(){this.canvasEl=null,this.viewportEl=null,this.currentView="home",this.activeCategory=null,this.questionsList=[],this.currentQIndex=0,this.score=0,this.selectedOption=null,this.timerInterval=null,this.timerSeconds=30,this.isNavigating=!1}init(){this.viewportEl=document.getElementById("signage-viewport"),this.canvasEl=document.getElementById("app"),this.setupScaler(),this.renderHome();const e=document.getElementById("initial-app-loader");e&&setTimeout(()=>{e.classList.add("fade-out"),setTimeout(()=>{e&&e.parentNode&&e.parentNode.removeChild(e)},300)},400),window.addEventListener("resize",()=>this.setupScaler()),window.addEventListener("pointerdown",()=>{p.init()},{passive:!0}),window.addEventListener("message",n=>{if(n&&n.data!==void 0&&n.data!==null){let t=n.data;if(typeof t=="string")try{t=JSON.parse(t)}catch{}const i=typeof t=="string"?t.toLowerCase():"",o=t==="goHome"||t.action==="home"||t.type==="home"||t.type==="HOME_NAVIGATION",l=i.includes("popupopen")||i.includes("modalopen")||i.includes("showpopup")||i.includes("showmodal")||i.includes("dialogopen")||i.includes("alertopen")||i==="popup"||i==="modal"||i==="dim"||t.action==="showPopup"||t.action==="showModal"||t.action==="openPopup"||t.action==="openModal"||t.type==="POPUP_OPEN"||t.type==="MODAL_OPEN"||t.type==="SHOW_POPUP"||t.type==="SHOW_MODAL"||t.type==="OPEN_POPUP"||t.type==="OPEN_MODAL"||t.popup===!0||t.modal===!0||t.isPopupOpen===!0||t.isModalOpen===!0||t.isOpen===!0||t.showBackBtn===!1||t.hideBack===!0,r=i.includes("popupclose")||i.includes("modalclose")||i.includes("hidepopup")||i.includes("hidemodal")||i.includes("dialogclose")||i.includes("closepopup")||i.includes("closemodal")||t.action==="hidePopup"||t.action==="hideModal"||t.action==="closePopup"||t.action==="closeModal"||t.type==="POPUP_CLOSE"||t.type==="MODAL_CLOSE"||t.type==="HIDE_POPUP"||t.type==="HIDE_MODAL"||t.type==="CLOSE_POPUP"||t.type==="CLOSE_MODAL"||t.popup===!1||t.modal===!1||t.isPopupOpen===!1||t.isModalOpen===!1||t.isOpen===!1||t.showBackBtn===!0||t.hideBack===!1;if(o)window.location.href=m;else if(t.type==="POPUP_STATE"){const a=!!t.hasPopup;document.body.classList.toggle("has-popup",a),document.body.classList.toggle("modal-open",a);const c=document.getElementById("btn-iframe-back");c&&(a?(c.style.setProperty("display","none","important"),c.style.setProperty("visibility","hidden","important"),c.style.setProperty("opacity","0","important"),c.style.setProperty("z-index","-9999","important"),c.style.setProperty("pointer-events","none","important")):(c.style.removeProperty("display"),c.style.removeProperty("visibility"),c.style.removeProperty("opacity"),c.style.removeProperty("z-index"),c.style.removeProperty("pointer-events")))}else if(l){document.body.classList.add("has-popup","modal-open");const a=document.getElementById("btn-iframe-back");a&&(a.style.setProperty("display","none","important"),a.style.setProperty("visibility","hidden","important"),a.style.setProperty("opacity","0","important"),a.style.setProperty("z-index","-9999","important"),a.style.setProperty("pointer-events","none","important"))}else if(r){document.body.classList.remove("has-popup","modal-open");const a=document.getElementById("btn-iframe-back");a&&(a.style.removeProperty("display"),a.style.removeProperty("visibility"),a.style.removeProperty("opacity"),a.style.removeProperty("z-index"),a.style.removeProperty("pointer-events"))}}});try{new MutationObserver(()=>{const t=!!document.querySelector('.modal-dim, .popup-dim, .dim-backdrop, .modal-overlay, .dim-overlay, .kiosk-modal, .kiosk-popup, [role="dialog"], dialog[open], [class*="popup"]:not(.interactive-sparkle):not(.kiosk-popup-card), [class*="modal"], [class*="dim"], .swal2-container, .alert-dialog, .overlay');document.body.classList.toggle("has-popup",t),document.body.classList.toggle("modal-open",t);const s=document.getElementById("btn-iframe-back");s&&t?(s.style.setProperty("display","none","important"),s.style.setProperty("visibility","hidden","important"),s.style.setProperty("opacity","0","important"),s.style.setProperty("z-index","-9999","important"),s.style.setProperty("pointer-events","none","important")):s&&!t&&!document.body.classList.contains("modal-open")&&(s.style.removeProperty("display"),s.style.removeProperty("visibility"),s.style.removeProperty("opacity"),s.style.removeProperty("z-index"),s.style.removeProperty("pointer-events"))}).observe(document.body,{childList:!0,subtree:!0,attributes:!0})}catch(n){console.warn("MutationObserver not available",n)}}setupScaler(){if(!this.viewportEl||!this.canvasEl)return;const e=window.innerWidth,n=window.innerHeight,t=e/1080,s=n/1920;this.canvasEl.style.transform=`scale(${t}, ${s})`,this.canvasEl.style.transformOrigin="center center"}clearTimers(){this.timerInterval&&(clearInterval(this.timerInterval),this.timerInterval=null)}showToast(e){let n=document.querySelector(".sound-toast");n||(n=document.createElement("div"),n.className="sound-toast",this.canvasEl.appendChild(n)),n.innerText=e,n.classList.add("show"),setTimeout(()=>n.classList.remove("show"),1800)}renderHome(){this.clearTimers(),this.currentView="home",this.isNavigating=!1,document.body.classList.remove("has-popup","modal-open"),this.canvasEl&&(this.canvasEl.className="signage-canvas view-home",this.canvasEl.style.backgroundImage="url('./image67.webp')",this.canvasEl.style.backgroundColor="#FFFFFF");const e=`
      <!-- Main Body Content -->
      <main class="content-body">
        <!-- Hero Mascot & Title Section -->
        <section class="hero-banner">
          <div class="star-container" aria-hidden="true">
            <svg class="twinkle-star star-1" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-2" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-3" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-4" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-5" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-6" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-7" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-8" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-9" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-10" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-11" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-12" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-13" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-14" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-15" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-16" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-17" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-18" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-19" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-20" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-21" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-22" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-23" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
            <svg class="twinkle-star star-24" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/></svg>
          </div>
          <div class="hero-mascot hero-left-mascot">
            <img src="${d.image4}" alt="선생님 곰돌이" class="hero-bear-img" />
          </div>
          <div class="hero-center-content">
            <img src="${d.image31}" alt="무엇을 맞춰볼까요?" class="hero-title-img" />
          </div>
          <div class="hero-mascot hero-right-mascot">
            <img src="${d.image7}" alt="OX 곰돌이" class="hero-bear-img" />
          </div>
        </section>

        <!-- Cards Grid (3 Columns x 2 Rows) -->
        <section class="cards-grid">
          ${y.map(n=>`
            <div class="quiz-card" data-cat-id="${n.id}">
              <div class="card-icon-area">
                <img src="${n.iconImg}" alt="${n.title}" class="quiz-card-img" />
              </div>
              <div class="card-info">
                <h3 class="card-title">${n.title}</h3>
                <p class="card-desc">${n.desc}</p>
              </div>
            </div>
          `).join("")}
        </section>
      </main>
    `;this.canvasEl.innerHTML=e,this.bindHomeEvents()}bindHomeEvents(){const e=this.canvasEl.querySelectorAll(".quiz-card");e.forEach(t=>{const s=i=>{i&&(i.preventDefault(),i.stopPropagation());const o=Date.now();if(this.lastNavTime&&o-this.lastNavTime<150)return;this.lastNavTime=o,e.forEach(a=>a.classList.remove("selected","pressed")),t.classList.add("selected");try{p.playClick()}catch{}const l=t.getAttribute("data-cat-id"),r=y.find(a=>a.id===l);r&&(r.url?this.renderExternalIframe(r.url,r.title):this.startQuizCategory(r))};t.addEventListener("pointerdown",()=>{t.classList.add("pressed")}),t.addEventListener("pointerup",()=>{t.classList.remove("pressed")}),t.addEventListener("pointercancel",()=>{t.classList.remove("pressed")}),t.addEventListener("click",s)});const n=this.canvasEl.querySelector(".hero-banner");if(n){const t=(s,i)=>{const o=n.getBoundingClientRect(),l=s-o.left,r=i-o.top,a=document.createElementNS("http://www.w3.org/2000/svg","svg");a.setAttribute("class","interactive-sparkle"),a.setAttribute("viewBox","0 0 24 24"),a.style.left=`${l}px`,a.style.top=`${r}px`;const c=Math.floor(Math.random()*20)+18;a.style.width=`${c}px`,a.style.height=`${c}px`,a.innerHTML='<path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5z"/>',n.appendChild(a),setTimeout(()=>{a.remove()},800)};n.addEventListener("click",s=>{for(let i=0;i<4;i++)setTimeout(()=>{const o=s.clientX+(Math.random()*80-40),l=s.clientY+(Math.random()*80-40);t(o,l)},i*60)})}}renderExternalIframe(e,n="외부 퀴즈"){this.clearTimers(),this.currentView="external",document.body.classList.remove("has-popup","modal-open"),this.canvasEl&&(this.canvasEl.className="signage-canvas view-external",this.canvasEl.style.backgroundImage="none",this.canvasEl.style.backgroundColor="#FFFFFF");const t=`
      <div class="external-iframe-container">
        <!-- Top Shimmer Progress Bar -->
        <div class="iframe-top-progress" id="iframe-progress"></div>

        <!-- Floating Back Button (Hides automatically on popup) -->
        <button class="kiosk-iframe-back-btn" id="btn-iframe-back" title="뒤로가기" aria-label="메인 화면으로 돌아가기">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <!-- Pure White Loading Indicator with Pulse Interaction -->
        <div id="iframe-loading-indicator" class="iframe-loading-overlay">
          <div class="loading-interaction-wrapper">
            <div class="loading-pulse-ring"></div>
            <div class="loading-spinner"></div>
          </div>
          <p class="loading-text">${n} 퀴즈</p>
          <p class="loading-subtext">화면을 불러오는 중입니다...</p>
        </div>

        <iframe 
          id="external-quiz-iframe" 
          src="${e}" 
          class="external-quiz-frame" 
          title="${n}" 
          allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media; clipboard-write; web-share" 
          loading="eager">
        </iframe>
      </div>
    `;this.canvasEl.innerHTML=t;const s=u=>{u&&(u.preventDefault(),u.stopPropagation());try{p.playClick()}catch{}window.location.href=m},i=document.getElementById("btn-iframe-back");i&&(i.addEventListener("click",s),i.addEventListener("touchend",s));const o=document.getElementById("external-quiz-iframe"),l=document.getElementById("iframe-loading-indicator"),r=document.getElementById("iframe-progress");let a=!1;const c=()=>{a||(a=!0,l&&(l.classList.add("fade-out"),setTimeout(()=>{l&&l.parentNode&&l.parentNode.removeChild(l)},150)),r&&(r.style.opacity="0",setTimeout(()=>{r&&r.parentNode&&r.parentNode.removeChild(r)},150)))};o&&(o.addEventListener("load",()=>{setTimeout(c,60);let u=!1;try{const h=o.contentWindow.location.pathname,L=window.location.pathname,g=L.replace(/[^/]*$/,"");u=h===L||h===g||h===g+"index.html"||h===g+"app.html"}catch{}u&&this.renderHome()}),setTimeout(c,1800))}startQuizCategory(e){if(!e)return;if(this.clearTimers(),e.url){this.renderExternalIframe(e.url,e.title);return}if(!e.questions||e.questions.length===0){this.renderHome();return}this.activeCategory=e;const n=[...e.questions].sort(()=>Math.random()-.5);this.questionsList=n.slice(0,Math.min(5,n.length)),this.currentQIndex=0,this.score=0,this.renderQuestion()}renderQuestion(){if(this.clearTimers(),this.currentView="quiz",this.isNavigating=!1,this.selectedOption=null,this.canvasEl&&(this.canvasEl.className="signage-canvas view-quiz",this.canvasEl.style.backgroundImage="url('./image67.webp')",this.canvasEl.style.backgroundColor="#FFFFFF"),!this.questionsList||this.currentQIndex>=this.questionsList.length){this.renderResult();return}const e=this.questionsList[this.currentQIndex],n=`
      <!-- Header Bar (Height: 120px) -->
      <header class="header-bar">
        <div class="header-left">
          <button class="back-btn" id="btn-quiz-back" title="뒤로가기">
            <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h1 class="header-title">${this.activeCategory?this.activeCategory.title:"퀴즈"}</h1>
        </div>
      </header>

      <!-- Quiz Content Body -->
      <main class="content-body">
        <div class="quiz-play-view">
          <!-- Progress Meta Bar -->
          <div class="quiz-meta-bar">
            <div class="quiz-progress-badge">
              문제 ${this.currentQIndex+1} / ${this.questionsList.length}
            </div>
            <div class="quiz-timer" id="timer-display">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span id="timer-sec">30</span>초
            </div>
          </div>

          <!-- Question Card -->
          <div class="question-card">
            <div class="question-tag">Q ${this.currentQIndex+1}</div>
            <h2 class="question-text">${e.question}</h2>
          </div>

          <!-- Options List -->
          <div class="options-list" id="options-container">
            ${e.options.map((t,s)=>`
              <button class="option-btn" data-opt-idx="${s}">
                <div class="option-left">
                  <div class="option-num">${s+1}</div>
                  <div class="option-text">${t}</div>
                </div>
              </button>
            `).join("")}
          </div>

          <!-- Feedback Box Placeholder -->
          <div id="feedback-placeholder"></div>
        </div>
      </main>
    `;this.canvasEl.innerHTML=n,this.bindQuizEvents(),this.startQuestionTimer()}startQuestionTimer(){this.clearTimers(),this.timerSeconds=30;const e=document.getElementById("timer-sec");this.timerInterval=setInterval(()=>{this.timerSeconds--,e&&(e.innerText=this.timerSeconds),this.timerSeconds<=0&&(this.clearTimers(),this.selectedOption===null&&this.currentView==="quiz"&&this.handleAnswerSubmit(-1))},1e3)}bindQuizEvents(){const e=document.getElementById("btn-quiz-back");e&&e.addEventListener("click",t=>{t&&(t.preventDefault(),t.stopPropagation()),p.playClick(),window.location.href=m}),this.canvasEl.querySelectorAll(".option-btn").forEach(t=>{t.addEventListener("click",s=>{if(s&&(s.preventDefault(),s.stopPropagation()),this.selectedOption!==null)return;const i=parseInt(t.getAttribute("data-opt-idx"),10);this.handleAnswerSubmit(i)})})}handleAnswerSubmit(e){this.clearTimers(),this.selectedOption=e;const n=this.questionsList[this.currentQIndex],t=e===n.answer,s=e===-1;t?(this.score++,p.playCorrect()):p.playIncorrect(),this.canvasEl.querySelectorAll(".option-btn").forEach((r,a)=>{a===n.answer?r.classList.add("correct"):a===e&&!t&&r.classList.add("incorrect"),r.style.pointerEvents="none"});const o=document.getElementById("feedback-placeholder");if(o){let r=t?"🎉 정답입니다!":s?"⏰ 시간 초과!":"💡 아쉽네요!";o.innerHTML=`
        <div class="feedback-box">
          <div class="feedback-text ${t?"correct-msg":"incorrect-msg"}">
            ${r} ${n.explanation||""}
          </div>
          <button class="next-btn" id="btn-next-action">
            ${this.currentQIndex<this.questionsList.length-1?"다음 문제":"결과 보기"}
          </button>
        </div>
      `}const l=document.getElementById("btn-next-action");l&&(l.onclick=r=>{r&&(r.preventDefault(),r.stopPropagation()),this.advanceQuiz()})}advanceQuiz(){p.playClick(),this.currentQIndex++,this.currentQIndex<this.questionsList.length?this.renderQuestion():this.renderResult()}renderResult(){this.clearTimers(),this.currentView="result",this.isNavigating=!1,this.canvasEl&&(this.canvasEl.className="signage-canvas view-result",this.canvasEl.style.backgroundImage="url('./image67.webp')",this.canvasEl.style.backgroundColor="#FFFFFF");const e=this.questionsList.length,n=e>0?this.score/e:0;let t="🏆",s="훌륭해요!";n===1?(t="🌟",s="만점입니다! 축하해요!"):n>=.6?(t="👏",s="참 잘했어요!"):(t="💪",s="다음엔 만점에 도전해보세요!");const i=this.activeCategory?this.activeCategory.title:"퀴즈",o=`
      <!-- Header Bar (Height: 120px) -->
      <header class="header-bar">
        <div class="header-left">
          <button class="back-btn" id="btn-result-home" title="홈">
            <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>
          <h1 class="header-title">퀴즈 결과</h1>
        </div>
      </header>

      <!-- Main Body Content -->
      <main class="content-body">
        <div class="result-card">
          <img src="${d.image4}" alt="선생님 곰돌이" class="result-mascot-img" />
          <div class="result-badge">${t}</div>
          <h2 class="result-title">${s}</h2>
          <div class="result-score">
            총 ${e}문제 중 <span>${this.score}문제</span> 정답!
          </div>
          <p class="hero-subtitle">
            ${i} 퀴즈를 모두 완료했습니다.
          </p>
          <div class="result-actions">
            <button class="result-btn result-btn-primary" id="btn-retry-quiz">
              다시 도전하기
            </button>
            <button class="result-btn result-btn-secondary" id="btn-other-quiz">
              처음 화면으로
            </button>
          </div>
        </div>
      </main>
    `;this.canvasEl.innerHTML=o,this.bindResultEvents()}bindResultEvents(){[document.getElementById("btn-result-home"),document.getElementById("btn-other-quiz")].forEach(t=>{t&&t.addEventListener("click",s=>{s&&(s.preventDefault(),s.stopPropagation()),p.playClick(),window.location.href=m})});const n=document.getElementById("btn-retry-quiz");n&&n.addEventListener("click",t=>{t&&(t.preventDefault(),t.stopPropagation()),p.playClick(),this.currentQIndex=0,this.score=0,this.renderQuestion()})}}document.addEventListener("DOMContentLoaded",()=>{new w().init()});
