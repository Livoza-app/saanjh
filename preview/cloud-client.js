/** Saanjh experimental cross-device sign-in. Not enabled until a Supabase project is configured.
 * Supabase's publishable/anon key is public; NEVER use a service_role or Gemini secret here.
 * This module runs only in the browser. Gemini remains server-side.
 */
const host=window.SaanjhHost;
const $=id=>document.getElementById(id);
let supabase=null,account=null,revision=0,ready=false,syncTimer=null,working=false,dirty=false,conflicted=false,initialized=false,blocked=false;
const setStatus=(text,kind='')=>host.setSyncStatus(text,kind);
const stateSize=(doc)=>new Blob([JSON.stringify(doc)]).size;
function renderAccount(){const b=$('accountButton');if(!b)return;b.textContent=account?.email?'◉  My account':'◉  Sign in';}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function cleanText(t){return String(t||'').replace(/[<>]/g,'').slice(0,150)}

async function init(){
 try{
  const res=await fetch('/api/public-config',{cache:'no-store'});
  if(!res.ok)return;
  const config=await res.json();
  if(!config.configured){setStatus('Sync not configured');return;}
  const sdk=await import('https://esm.sh/@supabase/supabase-js@2.78.0?bundle');
  supabase=sdk.createClient(config.url,config.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
  initialized=true;
  const {data:{session},error}=await supabase.auth.getSession();
  if(error)throw error;
  if(session)await enterSession(session);
  else setStatus('Sign in to sync');
  supabase.auth.onAuthStateChange((event,session)=>{
   if(event==='SIGNED_OUT'){account=null;ready=false;revision=0;conflicted=false;dirty=false;clearTimeout(syncTimer);host.guestRestore();renderAccount();setStatus('Only on this device');return;}
   if(session&&event==='SIGNED_IN'&&!account){setTimeout(()=>enterSession(session).catch(report),0)}
  });
 }catch(err){setStatus('Cloud unavailable','warn');console.error('Saanjh auth initialization:',err);}
}
async function enterSession(session){
 if(!supabase||account)return;
 const {data,error}=await supabase.auth.getUser();
 if(error||!data?.user)throw error||Error('Unable to verify signed-in account');
 account={id:data.user.id,email:data.user.email||'',name:cleanText(data.user.user_metadata?.full_name)||'Parent'};
 renderAccount();setStatus('Loading your family…');
 await loadRemote(true);
}
async function loadRemote(initial=false){
 if(!account)return;
 ready=false;dirty=false;conflicted=false;
 const {data,error}=await supabase.from('saanjh_family_state').select('document,revision').eq('user_id',account.id).maybeSingle();
 if(error){setStatus('Cloud setup needed','warn');host.toast('Cloud database not ready. Run the SQL setup first.');return;}
 if(data){revision=data.revision;host.replaceState(data.document);ready=true;setStatus('Synced across devices','good');return;}
 revision=0;
 // Consent: never silently upload a device's sample family history into a new account.
 setStatus('Choose how to begin');
 const local=host.getState();
 const count=Object.values(local.threads||{}).reduce((n,t)=>n+(t.messages?.length||0),0);
 host.showModal('Welcome to your family space',`<p class="account-intro">You're signed in as <b>${cleanText(account.email)}</b>. Would you like to begin with a fresh profile, or bring the test history from this browser?</p><div class="account-actions"><button class="button" id="startFreshCloud" type="button">Start fresh</button><button class="button secondary" id="importLocalCloud" type="button">Import this browser's ${count} demo messages</button></div><p class="account-notice" style="margin-top:15px">Cloud sync stores the information in your account so it can appear on other devices. Use only fictional child details during this research phase.</p>`);
 $('startFreshCloud').onclick=()=>begin(host.newFamily(account.name));
 $('importLocalCloud').onclick=()=>{if(!confirm('Upload this browser’s demo family details and conversations to your cloud account? Only use fictional test information.'))return;begin(local)};
}
function begin(doc){host.replaceState(doc);ready=true;host.closeModal();dirty=true;setStatus('Saving your profile…');scheduleSave(0)}
async function saveToCloud(){
 if(!account||!ready||!dirty||conflicted||working||!supabase)return;
 working=true;setStatus('Saving securely…');
 const document=host.getState();
 if(stateSize(document)>1024*1024){working=false;setStatus('History too large','warn');host.toast('Your history is above the current 1 MB sync limit. Please export before changing devices.');return;}
 try{
  // Optimistic revision check prevents an older phone tab from overwriting newer laptop data.
  const before=revision;
  dirty=false;
  const {data,error}=await supabase.rpc('saanjh_save_state',{expected_revision:before,new_document:document});
  if(error){if(/SYNC_CONFLICT|40001/i.test(error.message||'')){conflicted=true;setStatus('Changes on another device','warn');host.toast('Newer data exists in your account. Open My account to reload it.');}else{dirty=true;setStatus('Sync paused — retry','warn');}return;}
  revision=data;
  setStatus('All changes saved','good');
 }catch(err){dirty=true;setStatus('Offline · not synced','warn');console.error('Saanjh sync:',err)}
 finally{working=false;if(dirty&&!conflicted)scheduleSave(1600)}
}
function scheduleSave(ms=700){clearTimeout(syncTimer);syncTimer=setTimeout(saveToCloud,ms)}
function changed(){if(!account||!ready||conflicted)return;dirty=true;setStatus('Changes to save…');scheduleSave()}
async function forceSave(){if(conflicted){host.toast('Reload cloud history first to avoid overwriting newer conversations.');return}dirty=true;await saveToCloud()}
async function refreshCloud(){if(dirty&&!confirm('Unsaved changes on this device will be discarded. Reload the latest cloud history?'))return;clearTimeout(syncTimer);await loadRemote(false);if(ready){host.closeModal();host.toast('Latest cloud history loaded.')}}
async function logOut(){if(dirty){await saveToCloud();if(dirty){host.toast('Could not sync your changes. Please retry before signing out.');return}}host.closeModal();await supabase.auth.signOut()}
async function deleteCloudData(){if(!confirm('Delete ALL family profiles and conversations stored in your Saanjh cloud account? This cannot undo earlier messages sent to Gemini.'))return;const {error}=await supabase.from('saanjh_family_state').delete().eq('user_id',account.id);if(error){host.toast(error.message);return}revision=0;ready=false;host.closeModal();await loadRemote(false)}
function exportCloud(){const text=JSON.stringify({exported_at:new Date().toISOString(),family:host.getState()},null,2);const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='saanjh-family-export.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000)}
function openAccount(){
 if(!initialized){host.showModal('Cross-device sign-in',`<p class="account-intro">Sign in with Google will securely sync your family profiles and previous conversations once a cloud account is configured.</p><div class="account-notice">This laptop still works in local demo mode. Your existing Gemini key is not a Google sign-in key: you must set up a Supabase project and a Google OAuth client once. See <b>CLOUD_LOGIN_SETUP.md</b> included in the project.</div><div class="modal-footer"><button class="button" id="dismissAccount">Got it</button></div>`);$('dismissAccount').onclick=host.closeModal;return;}
 if(!account){host.showModal('Your calm space, on every device',`<p class="account-intro">Continue with your Google account to keep your child profiles and conversation history together across your phone and desktop.</p><div class="account-actions"><button class="button" id="googleSignIn"><span class="google-g">G</span> Continue with Google</button></div><p class="account-notice" style="margin-top:16px">Saanjh is a research prototype. For now, use fictional profiles. Cloud sync requires a configured Supabase database and HTTPS hosting for phone access.</p>`);$('googleSignIn').onclick=async()=>{const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/'}});if(error)host.toast(error.message)};return;}
 host.showModal('Your Saanjh account',`<div class="account-detail">Signed in as <b>${cleanText(account.email)}</b><br><span id="accountSyncLine">${conflicted?'A more recent version exists on another device.':ready?'Your family data is stored in your Saanjh account.':'Cloud data not initialized.'}</span></div><div class="account-actions" style="margin-top:16px"><button class="button" id="syncNow" type="button">Save changes now</button><button class="button secondary" id="loadCloud" type="button">Load latest cloud history</button><button class="button secondary" id="exportAccount" type="button">Download my family history</button><button class="button ghost" id="logoutAccount" type="button">Sign out</button><button class="button danger" id="deleteAccountData" type="button">Delete cloud family history</button></div><p class="account-notice" style="margin-top:14px">Only use fictional details until security, retention, consent, and safety review are complete. Deleting cloud history does not remove earlier AI-provider requests.</p>`);
 $('syncNow').onclick=async()=>{await forceSave();if(!conflicted)host.closeModal()};$('loadCloud').onclick=refreshCloud;$('exportAccount').onclick=exportCloud;$('logoutAccount').onclick=logOut;$('deleteAccountData').onclick=deleteCloudData;
}
function report(e){setStatus('Sync issue','warn');host.toast(e?.message||String(e))}
window.SaanjhCloud={isSignedIn:()=>!!account,accessToken:()=>supabase?.auth?.getSession?sessionToken:null,changed,openAccount};
// Access token for the local Gemini server: fetched and held only in browser memory.
let sessionToken=null;
const interval=()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>{sessionToken=data?.session?.access_token||null}).catch(()=>{});};
setInterval(interval,30000);
init().then(interval);
