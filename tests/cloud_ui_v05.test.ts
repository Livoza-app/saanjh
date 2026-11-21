import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const html=readFileSync(resolve(root,'saanjh-preview.html'),'utf8');
const client=readFileSync(resolve(root,'cloud-client.js'),'utf8');
const server=readFileSync(resolve(root,'src/preview-server.ts'),'utf8');
const sql=readFileSync(resolve(root,'sql/saanjh-cloud-auth-and-memory.sql'),'utf8');

test('one-click sign in has a real OAuth call, not a pretend login button',()=>{
 assert.match(html,/id="accountButton"/);
 assert.match(client,/supabase\.auth\.signInWithOAuth\(\{provider:'google'/);
 assert.match(client,/if\(!config\.configured\)/);
 assert.match(html,/Sync not configured|Sign in and sync/);
});
test('Cloud sync is scoped per signed-in user with optimistic revisions',()=>{
 assert.match(client,/\.eq\('user_id',account\.id\)/);
 assert.match(client,/rpc\('saanjh_save_state'/);
 assert.match(client,/expected_revision:before/);
 assert.match(sql,/saanjh_owner_select/);
 assert.match(sql,/auth\.uid\(\)\)=user_id/);
 assert.match(sql,/SYNC_CONFLICT/);
 assert.match(sql,/revoke insert,update on public\.saanjh_family_state/);
});
test('Browser never contains Gemini API key or secret Supabase keys',()=>{
 assert.doesNotMatch(client,/process\.env\.GEMINI_API_KEY|service_role\s*:/i);
 assert.match(server,/verifiedCloudUser/);
 assert.match(server,/\/auth\/v1\/user/);
 assert.match(server,/saanjh_claim_reply/);
 assert.match(server,/server\.listen\(port,'127\.0\.0\.1'/);
});
test('Responsive design includes mobile menu and separate human-readable save status',()=>{
 assert.match(html,/id="mobileMenu"/);
 assert.match(html,/id="mobileBackdrop"/);
 assert.match(html,/id="syncStatus"/);
 assert.match(html,/prefers-reduced-motion/);
 assert.match(html,/aria-label="Guidance language"/);
});
