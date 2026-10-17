const DEFAULT_EVENTS = [
  {id:"ev1",name:"FutureTech Summit 2026",category:"Technology",date:"2026-11-12",venue:"Innovation Hall, Chennai",capacity:120,description:"Explore the ideas shaping tomorrow, from responsible AI to the next wave of digital experiences.",accent:"violet",symbol:"✳",registrations:[]},
  {id:"ev2",name:"Design Beyond Boundaries",category:"Design",date:"2026-11-18",venue:"The Creative Studio, Chennai",capacity:70,description:"A hands-on gathering for visual thinkers, makers, and people who love turning bold ideas into reality.",accent:"coral",symbol:"✿",registrations:[]},
  {id:"ev3",name:"Founders & Forward",category:"Business",date:"2026-11-22",venue:"The Foundry, Chengalpattu",capacity:90,description:"Meet ambitious builders, learn from real startup stories, and find your next collaboration.",accent:"mint",symbol:"↗",registrations:[]},
  {id:"ev4",name:"CodeCraft Developer Day",category:"Technology",date:"2026-12-02",venue:"Digital Learning Centre",capacity:100,description:"A friendly day of coding, practical demos, problem-solving, and sharing what you build.",accent:"blue",symbol:"⌘",registrations:[]},
  {id:"ev5",name:"Canvas & Coffee",category:"Culture",date:"2026-12-08",venue:"The Courtyard Art Space",capacity:45,description:"Slow down, meet creative minds, and spend an afternoon making something just for joy.",accent:"gold",symbol:"✧",registrations:[]},
  {id:"ev6",name:"Ideas in Bloom",category:"Business",date:"2026-12-15",venue:"Vidhya Forum Auditorium",capacity:80,description:"A practical meetup on communication, teamwork, leadership, and growing your next big idea.",accent:"rose",symbol:"❋",registrations:[]}
];
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const store = {
  get(key, fallback){try{const v=localStorage.getItem("eventora_"+key);return v?JSON.parse(v):fallback}catch{return fallback}},
  set(key,value){localStorage.setItem("eventora_"+key,JSON.stringify(value))}
};
let events = store.get("events", DEFAULT_EVENTS);
let users = store.get("users", []);
let currentUser = store.get("currentUser", null);
let activeCategory = "All";
let selectedEventId = null;
let authMode = "login";
let toastTimer;
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const getUserRegistrations = () => events.flatMap(e => (e.registrations||[]).filter(r => currentUser && r.email === currentUser.email).map(r => ({...r,event:e})));
const getRemaining = event => Math.max(0, Number(event.capacity||0) - (event.registrations||[]).length);
const formatDate = date => { if(!date) return "Date to be announced"; const d=new Date(date+"T12:00:00"); return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); };
const dateParts = date => {if(!date)return {day:"TBA",month:"DATE"};const d=new Date(date+"T12:00:00");return {day:d.toLocaleDateString("en-IN",{day:"2-digit"}),month:d.toLocaleDateString("en-IN",{month:"short"}).toUpperCase()};};
function save(){store.set("events",events);store.set("users",users);store.set("currentUser",currentUser)}
function showToast(message){const toast=$("#toast");toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2800)}
function renderEvents(){
  const term=$("#searchInput").value.trim().toLowerCase();
  const filtered=events.filter(e=>(activeCategory==="All"||e.category===activeCategory)&&[e.name,e.category,e.venue,e.description].some(v=>String(v).toLowerCase().includes(term)));
  $("#eventGrid").innerHTML=filtered.map(e=>{const dp=dateParts(e.date);const left=getRemaining(e);return `<article class="event-card"><div class="event-art ${escapeHTML(e.accent||"violet")}"><span class="art-symbol">${escapeHTML(e.symbol||"✳")}</span><div class="art-date"><b>${dp.day}</b><span>${dp.month}<br>${new Date((e.date||"2026-01-01")+"T12:00:00").getFullYear()}</span></div></div><div class="event-card-body"><div class="card-meta-top"><span class="category-tag">${escapeHTML(e.category)}</span><span class="seats-label"><b>${left}</b> seats left</span></div><h3>${escapeHTML(e.name)}</h3><p>${escapeHTML(e.description)}</p><div class="card-location"><span>⌖</span>${escapeHTML(e.venue)}</div><div class="card-footer"><div><small>EVENT DATE</small><strong>${formatDate(e.date)}</strong></div><button class="card-link" data-open-event="${escapeHTML(e.id)}" aria-label="View ${escapeHTML(e.name)}">↗</button></div></div></article>`}).join("");
  $("#emptyState").classList.toggle("hidden",filtered.length>0);$("#eventGrid").classList.toggle("hidden",filtered.length===0);
  $("#resultsLabel").textContent=term||activeCategory!=="All"?`Showing ${filtered.length} matching ${filtered.length===1?"experience":"experiences"}`:"Showing all experiences";
  $("#statEvents").textContent=String(events.length).padStart(2,"0");$("#heroEventCount").textContent=`${events.length} curated experiences`;
  $$("[data-category]").forEach(b=>b.classList.toggle("active",b.dataset.category===activeCategory));
  renderDashboard();updateHeader();
}
function updateHeader(){const regs=getUserRegistrations();$("#ticketCount").textContent=regs.length;$("#userGreeting").textContent=currentUser?`Hi, ${currentUser.name.split(" ")[0]}`:"Welcome, guest";$("#authButton").textContent=currentUser?"Sign out":"Sign in"}
function renderTickets(){
 const regs=getUserRegistrations();$("#ticketsGrid").innerHTML=regs.map(({event:e,registrationId})=>{const dp=dateParts(e.date);return `<article class="ticket-card"><div class="ticket-info"><span class="category-tag">${escapeHTML(e.category)}</span><h3>${escapeHTML(e.name)}</h3><p>▦ &nbsp;${formatDate(e.date)}<br>⌖ &nbsp;${escapeHTML(e.venue)}<br>Ticket ID: ${escapeHTML(registrationId)}</p></div><div class="ticket-stub"><span>YOUR PASS</span><strong>${dp.day}</strong><small>${dp.month}</small><button data-cancel="${escapeHTML(e.id)}">Cancel ticket</button></div></article>`}).join("");
 $("#ticketsEmpty").classList.toggle("hidden",regs.length>0);$("#ticketsGrid").classList.toggle("hidden",regs.length===0);
}
function renderDashboard(){
 const totalRegs=events.reduce((sum,e)=>sum+(e.registrations||[]).length,0);$("#dashEvents").textContent=events.length;$("#dashRegistrations").textContent=totalRegs;$("#dashSeats").textContent=events.reduce((sum,e)=>sum+getRemaining(e),0);
 $("#manageEvents").innerHTML=events.length?events.map(e=>`<div class="manage-item"><div class="manage-swatch ${escapeHTML(e.accent||"violet")} event-art"></div><div class="manage-copy"><strong>${escapeHTML(e.name)}</strong><small>${(e.registrations||[]).length} registered · ${getRemaining(e)} seats left</small></div><button data-delete-event="${escapeHTML(e.id)}" aria-label="Delete ${escapeHTML(e.name)}">Delete</button></div>`).join(""):'<div class="manage-empty">No events yet. Create your first event.</div>';
}
function openEvent(id){
 const e=events.find(item=>item.id===id);if(!e)return;selectedEventId=id;const dp=dateParts(e.date);const visual=$("#modalVisual");visual.className=`modal-visual event-art ${e.accent||"violet"}`;visual.innerHTML=`<span class="modal-symbol">${escapeHTML(e.symbol||"✳")}</span>`;
 $("#modalCategory").textContent=e.category;$("#modalTitle").textContent=e.name;$("#modalDescription").textContent=e.description;
 $("#modalMeta").innerHTML=`<div>▦ <span>${formatDate(e.date)}</span></div><div>⌖ <span>${escapeHTML(e.venue)}</span></div><div>✦ <span>${e.capacity} total seats</span></div>`;
 const remaining=getRemaining(e);$("#modalSeats").textContent=`${remaining} of ${e.capacity}`;$("#modalMeter").style.width=`${e.capacity?remaining/e.capacity*100:0}%`;
 const already=currentUser&&(e.registrations||[]).some(r=>r.email===currentUser.email);const btn=$("#registerButton");btn.disabled=remaining===0||!!already;btn.style.opacity=btn.disabled?".55":"1";btn.textContent=already?"✓ Already registered":remaining===0?"Event fully booked":"Reserve my seat ↗";
 $("#modalMessage").textContent=currentUser?"": "Sign in or create a demo profile to reserve your seat.";$("#eventModal").classList.remove("hidden");
}
function closeEvent(){$("#eventModal").classList.add("hidden");selectedEventId=null}
function setView(view){
 $("#discoverSection").classList.toggle("hidden",view!=="discover");$("#ticketsSection").classList.toggle("hidden",view!=="tickets");$("#organiserSection").classList.toggle("hidden",view!=="organiser");$("#hero").classList.toggle("hidden",view!=="discover");$(".stats-strip").classList.toggle("hidden",view!=="discover");$(".quote-band").classList.toggle("hidden",view!=="discover");$(".newsletter-band").classList.toggle("hidden",view!=="discover");
 $$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("#main-nav")?.classList.remove("open");$("#mobileMenu").setAttribute("aria-expanded","false");
 if(view==="tickets")renderTickets();if(view==="organiser")renderDashboard();window.scrollTo({top:0,behavior:"smooth"});
}
function openAuth(mode="login"){authMode=mode;$("#authModal").classList.remove("hidden");$("#authMessage").textContent="";$("#authForm").reset();updateAuthMode()}
function closeAuth(){$("#authModal").classList.add("hidden")}
function updateAuthMode(){$$("#authForm [data-unused]").forEach(n=>n.remove());$("#nameField").classList.toggle("hidden",authMode!=="register");$("#authForm [name=name]").required=authMode==="register";$("#authTitle").innerHTML=authMode==="login"?'Welcome to <span>Eventora.</span>':'Make it <span>official.</span>';$("#authSubmit").textContent=authMode==="login"?"Sign in ↗":"Create account ↗";$$("[data-auth-mode]").forEach(b=>b.classList.toggle("active",b.dataset.authMode===authMode))}
function createRegistration(eventId){
 if(!currentUser){closeEvent();openAuth("login");$("#authMessage").textContent="Sign in first to reserve your seat.";return}
 const e=events.find(item=>item.id===eventId);if(!e)return;
 if((e.registrations||[]).some(r=>r.email===currentUser.email)){showToast("You already have a ticket for this event.");return}
 if(getRemaining(e)<1){showToast("Sorry, this event is fully booked.");openEvent(eventId);return}
 e.registrations=e.registrations||[];e.registrations.push({email:currentUser.email,name:currentUser.name,registrationId:"EV-"+Math.random().toString(36).slice(2,8).toUpperCase(),createdAt:new Date().toISOString()});save();renderEvents();renderTickets();openEvent(eventId);$("#modalMessage").textContent="You're registered! Your ticket is available in My Tickets.";$("#modalMessage").style.color="#239363";showToast("Seat reserved! Your ticket is ready.");
}
function cancelRegistration(eventId){
 if(!currentUser)return;const e=events.find(item=>item.id===eventId);if(!e)return;
 const before=(e.registrations||[]).length;e.registrations=(e.registrations||[]).filter(r=>r.email!==currentUser.email);if(e.registrations.length===before){showToast("Ticket not found.");return}
 save();renderEvents();renderTickets();showToast("Ticket cancelled and seat released.");
}
$("#eventGrid").addEventListener("click",e=>{const b=e.target.closest("[data-open-event]");if(b)openEvent(b.dataset.openEvent)});
$("#categoryFilters").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b){activeCategory=b.dataset.category;renderEvents()}});
$("#searchInput").addEventListener("input",renderEvents);$("#resetSearch").addEventListener("click",()=>{$("#searchInput").value="";activeCategory="All";renderEvents()});
$("#exploreButton").addEventListener("click",()=>$("#discoverSection").scrollIntoView({behavior:"smooth"}));
document.addEventListener("click",e=>{const view=e.target.closest("[data-view]");if(view){setView(view.dataset.view);$("#main-nav")?.classList.remove("open")}if(e.target.closest("[data-close-modal]"))closeEvent();if(e.target.closest("[data-close-auth]"))closeAuth();const cancel=e.target.closest("[data-cancel]");if(cancel&&confirm("Cancel this ticket? The seat will become available again."))cancelRegistration(cancel.dataset.cancel);const del=e.target.closest("[data-delete-event]");if(del){const ev=events.find(x=>x.id===del.dataset.deleteEvent);if(ev&&(ev.registrations||[]).length){if(!confirm("This event has registrations. Delete it anyway in this demo?"))return}if(confirm("Delete this event from the demo?")){events=events.filter(x=>x.id!==del.dataset.deleteEvent);save();renderEvents();showToast("Event deleted.")}}});
$("#registerButton").addEventListener("click",()=>{if(selectedEventId)createRegistration(selectedEventId)});
$("#authButton").addEventListener("click",()=>{if(currentUser){currentUser=null;save();updateHeader();renderEvents();showToast("You have signed out.");setView("discover")}else openAuth("login")});
$$("[data-auth-mode]").forEach(b=>b.addEventListener("click",()=>{authMode=b.dataset.authMode;updateAuthMode();$("#authMessage").textContent=""}));
$("#authForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const email=String(fd.get("email")).trim().toLowerCase();const password=String(fd.get("password"));if(authMode==="register"){const name=String(fd.get("name")).trim();if(!name){$("#authMessage").textContent="Please enter your name.";return}if(users.some(u=>u.email===email)){$("#authMessage").textContent="An account with this email already exists. Sign in instead.";return}const user={name,email,password};users.push(user);currentUser={name,email};save();closeAuth();updateHeader();renderEvents();showToast("Account created. Welcome to Eventora!")}else{const user=users.find(u=>u.email===email&&u.password===password);if(!user){$("#authMessage").textContent="Account not found or password does not match. Create a demo account if this is your first visit.";return}currentUser={name:user.name,email:user.email};save();closeAuth();updateHeader();renderEvents();showToast(`Welcome back, ${user.name.split(" ")[0]}!`)}if(selectedEventId)openEvent(selectedEventId)});
$("#demoOrganiser").addEventListener("click",()=>{currentUser={name:"Demo Organiser",email:"organiser@eventora.demo",role:"organiser"};save();closeAuth();updateHeader();setView("organiser");showToast("Demo organiser mode enabled.")});
$("#eventForm").addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const name=String(fd.get("name")).trim(),venue=String(fd.get("venue")).trim(),description=String(fd.get("description")).trim(),date=String(fd.get("date")),capacity=Number(fd.get("capacity"));if(!name||!venue||!description||!date||!Number.isInteger(capacity)||capacity<1){showToast("Please check all event details.");return}if(date<new Date().toISOString().slice(0,10)){showToast("Please choose today or a future date.");return}events.unshift({id:"ev"+Date.now(),name,category:String(fd.get("category")),date,venue,capacity,description,accent:String(fd.get("accent")),symbol:({violet:"✳",coral:"✿",mint:"❋",blue:"⌘"})[String(fd.get("accent"))]||"✳",registrations:[]});save();e.currentTarget.reset();e.currentTarget.elements.capacity.value=60;renderEvents();renderDashboard();showToast("Your new event is published!");});
$("#mobileMenu").addEventListener("click",()=>{const nav=$(".main-nav");nav.classList.toggle("open");$("#mobileMenu").setAttribute("aria-expanded",String(nav.classList.contains("open")))});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeEvent();closeAuth()}});
$("#year").textContent=new Date().getFullYear();
renderEvents();renderTickets();updateHeader();
