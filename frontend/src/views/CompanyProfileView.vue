<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import { profilesApi, type CompanyProfileData, type ProfileOption } from '@/services/profiles'

const profile = ref<CompanyProfileData | null>(null)
const departments = ref<ProfileOption[]>([])
const municipalitiesAll = ref<ProfileOption[]>([])
const sectors = ref<ProfileOption[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const message = ref('')
const form = reactive({ name: '', description: '', website: '', economicSectorId: '', departmentId: '', municipalityId: '', address: '', contactEmail: '', phone: '', taxId: '' })
const municipalities = computed(() => municipalitiesAll.value.filter(item => item.departmentId === form.departmentId))
const companySummary = computed(() => {
  return [sectors.value.find(item => item.id === form.economicSectorId)?.name, [municipalitiesAll.value.find(item => item.id === form.municipalityId)?.name, departments.value.find(item => item.id === form.departmentId)?.name].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'Añade el sector y la ubicación de tu empresa'
})

const companyCompletionItems = computed(() => profile.value ? [
  { label: 'Nombre de empresa', done: form.name.trim().length >= 2 && form.name.trim().length <= 160, target: '#company-identity' },
  { label: 'Descripción pública', done: form.description.trim().length >= 30 && form.description.trim().length <= 5000, target: '#company-identity' },
  { label: 'Sector económico', done: sectors.value.some(item => item.id === form.economicSectorId), target: '#company-identity' },
  { label: 'Ubicación', done: departments.value.some(item => item.id === form.departmentId) && municipalitiesAll.value.some(item => item.id === form.municipalityId && item.departmentId === form.departmentId), target: '#company-location' },
  { label: 'Sitio web (opcional)', done: !form.website.trim() || isValidWebsite(form.website), target: '#company-identity' },
] : [])
const companyCompletion = computed(() => companyCompletionItems.value.length ? Math.round(companyCompletionItems.value.filter(item => item.done).length / companyCompletionItems.value.length * 100) : 0)
const completedCompanyItems = computed(() => companyCompletionItems.value.filter(item => item.done).length)
const nextCompanyStep = computed(() => companyCompletionItems.value.find(item => !item.done) ?? null)
function isValidWebsite(value: string) {
  if (!value.trim()) return false
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname)
  } catch { return false }
}
onMounted(async () => {
  try {
    const result = await profilesApi.company()
    profile.value = result.profile; departments.value = result.catalogs.departments; municipalitiesAll.value = result.catalogs.municipalities; sectors.value = result.catalogs.economicSectors
    Object.assign(form, { name: result.profile.name, description: result.profile.description ?? '', website: result.profile.website ?? '', economicSectorId: result.profile.economicSectorId ?? '', departmentId: result.profile.departmentId ?? '', municipalityId: result.profile.municipalityId ?? '', address: result.profile.address ?? '', contactEmail: result.profile.contactEmail ?? '', phone: result.profile.phone ?? '', taxId: result.profile.taxId ?? '' })
  } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo cargar el perfil de empresa.' }
  finally { loading.value = false }
})

async function save() {
  if (saving.value) return
  saving.value = true; error.value = ''; message.value = ''
  try {
    const result = await profilesApi.updateCompany({ ...form, website: form.website || null, economicSectorId: form.economicSectorId || null, departmentId: form.departmentId || null, municipalityId: form.municipalityId || null, description: form.description || null, address: form.address || null, contactEmail: form.contactEmail || null, phone: form.phone || null, taxId: form.taxId || null })
    profile.value = { ...profile.value!, ...result.profile }
    message.value = 'Perfil de empresa actualizado.'
  } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudo guardar el perfil.' }
  finally { saving.value = false }
}
</script>

<template>
  <WorkspaceFrame eyebrow="Perfil de empresa" title="Información de la empresa" subtitle="Mantén actualizados los datos que acompañan tus vacantes." initials="JW">
    <template #heading-action><div class="profile-preview-actions"><RouterLink class="profile-preview-actions__back" to="/company">Volver al panel</RouterLink></div></template>
    <p v-if="error" class="workspace__error" role="alert">{{ error }}</p><p v-if="message" class="company-profile__message" role="status">{{ message }}</p><p v-if="loading" class="workspace__empty" role="status">Cargando perfil…</p>
    <template v-else-if="profile"><section class="company-profile-hero workspace__card" aria-label="Resumen de empresa"><span class="company-profile-hero__mark">{{ form.name.slice(0,2).toUpperCase() }}</span><div><span class="company-profile-hero__eyebrow">Perfil de empresa</span><h2>{{ form.name }}</h2><p>{{ companySummary }}</p></div><span class="company-profile-hero__status" :class="`company-profile-hero__status--${profile.verificationStatus.toLowerCase()}`"><i />{{ profile.verificationStatus === 'VERIFIED' ? 'Verificada' : profile.verificationStatus === 'REJECTED' ? 'Rechazada' : 'Pendiente de verificación' }}</span></section>
    <div class="company-profile-layout"><form class="workspace__card company-profile" @submit.prevent="save">
      <div class="company-profile__groups">
        <section id="company-identity" class="company-profile__group"><header><div><h2>Identidad</h2><p>Información que acompaña tus vacantes.</p></div></header><div class="company-profile__grid"><label>Nombre de la empresa<input v-model="form.name" maxlength="160" placeholder="Nombre comercial" required></label><label>Sector económico<select v-model="form.economicSectorId"><option value="">Sin especificar</option><option v-for="item in sectors" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label class="company-profile__wide">Descripción<textarea v-model="form.description" rows="3" maxlength="5000" placeholder="Cuenta qué hace la empresa y qué la distingue como lugar para trabajar."></textarea></label><label class="company-profile__wide">Sitio web<input v-model="form.website" type="url" maxlength="2000" placeholder="https://ejemplo.com"></label></div></section>
        <section id="company-location" class="company-profile__group"><header><div><h2>Ubicación</h2><p>Indica dónde se encuentra tu empresa.</p></div></header><div class="company-profile__grid"><label>Departamento<select v-model="form.departmentId" @change="form.municipalityId = ''"><option value="">Sin especificar</option><option v-for="item in departments" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label>Municipio<select v-model="form.municipalityId" :disabled="!form.departmentId"><option value="">Sin especificar</option><option v-for="item in municipalities" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label class="company-profile__wide">Dirección<input v-model="form.address" maxlength="500" placeholder="Dirección para documentos internos"></label></div></section>
        <section class="company-profile__group"><header><div><h2>Contacto y registro</h2><p>Datos privados de contacto y registro fiscal.</p></div></header><div class="company-profile__grid"><label>Correo de contacto<input v-model="form.contactEmail" type="email" maxlength="254" placeholder="talento@empresa.com"></label><label>Teléfono<input v-model="form.phone" type="tel" maxlength="40" placeholder="+505 8888 8888"></label><label>Identificación fiscal<input v-model="form.taxId" maxlength="80" placeholder="RUC o identificación fiscal"></label></div></section>
      </div>
      <button class="workspace__cta" type="submit" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar perfil' }}</button>
    </form><aside class="company-profile-aside" aria-label="Progreso de la página de empresa"><section class="company-profile-aside__card workspace__card"><span class="company-profile-aside__kicker">Presencia de empresa</span><div class="company-profile-aside__score"><span>{{ companyCompletion }}%</span></div><h2>Una buena presentación genera confianza.</h2><p>Completa la información pública para que los candidatos conozcan mejor tu empresa.</p><div class="company-profile-aside__track" role="progressbar" :aria-valuenow="companyCompletion" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso de la página de empresa"><span :style="{ width: `${companyCompletion}%` }" /></div><small class="company-profile-aside__count">{{ completedCompanyItems }} de {{ companyCompletionItems.length }} datos completados</small><a v-if="nextCompanyStep" class="company-profile-aside__next" :href="nextCompanyStep.target">Completar {{ nextCompanyStep.label }} <span aria-hidden="true">→</span></a><p v-else class="company-profile-aside__ready">Tu información pública está completa.</p></section><section class="company-profile-aside__verification workspace__card"><span class="company-profile-aside__verification-mark" :class="`is-${profile.verificationStatus.toLowerCase()}`" aria-hidden="true">{{ profile.verificationStatus === 'VERIFIED' ? '✓' : '!' }}</span><div><strong>{{ profile.verificationStatus === 'VERIFIED' ? 'Empresa verificada' : profile.verificationStatus === 'REJECTED' ? 'Verificación rechazada' : 'Verificación pendiente' }}</strong><p>{{ profile.verificationStatus === 'VERIFIED' ? 'Puedes publicar vacantes y recibir postulaciones.' : 'Solo las empresas verificadas pueden publicar vacantes.' }}</p></div></section><RouterLink class="company-profile-aside__preview" to="/company/profile/preview">Vista de candidato <span aria-hidden="true">→</span></RouterLink></aside></div></template>
  </WorkspaceFrame>
</template>

<style scoped>
.company-profile { padding: clamp(1rem,3vw,1.6rem); }.company-profile__verification { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; margin-bottom: 1.4rem; padding: .8rem 1rem; border-radius: .7rem; background: var(--panel); }.company-profile__verification small { width: 100%; color: var(--muted-foreground); }.company-profile__grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 1rem; margin-bottom: 1.25rem; }.company-profile__grid label { display: grid; gap: .4rem; color: var(--muted-foreground); font-size: .82rem; font-weight: 700; }.company-profile__grid input,.company-profile__grid select,.company-profile__grid textarea { min-width: 0; min-height: 2.7rem; padding: .65rem .75rem; border: 1px solid var(--border); border-radius: .6rem; background: var(--surface); color: var(--foreground); font: inherit; }.company-profile__grid textarea { resize: vertical; }.company-profile__wide { grid-column: 1/-1; }.company-profile__message { color: var(--primary); font-weight: 700; }
@media(max-width:640px){.company-profile__grid{grid-template-columns:1fr}.company-profile__wide{grid-column:auto}}
</style>

<style scoped>
.company-profile{padding:1.1rem 1.3rem}.company-profile__verification{margin:-.1rem -.1rem 1rem;padding:.55rem .7rem;border-radius:.65rem;background:color-mix(in srgb,var(--secondary) 55%,var(--surface));font-size:.75rem}.company-profile__verification small{font-size:.69rem}.company-profile__groups{display:grid}.company-profile__group{display:grid;grid-template-columns:minmax(11rem,.58fr) minmax(0,1.42fr);gap:1.1rem;padding:1.15rem 0;border-top:1px solid var(--border)}.company-profile__group:first-child{border-top:0}.company-profile__group>header{display:flex;align-items:flex-start;gap:.7rem}company-profile__group>header h2{margin:.05rem 0;font:800 .88rem Manrope,sans-serif;letter-spacing:-.025em}.company-profile__group>header p{margin:.25rem 0 0;color:var(--muted-foreground);font-size:.7rem;line-height:1.45}.company-profile__grid{gap:.7rem;margin:0}.company-profile__grid label{gap:.3rem;font-size:.74rem}.company-profile__grid input,.company-profile__grid select,.company-profile__grid textarea{min-height:2.4rem;padding:.5rem .65rem;border-radius:.55rem;font-size:.8rem}.company-profile__grid textarea{min-height:5rem}.company-profile>button{margin-top:1rem}
@media(max-width:700px){.company-profile__group{grid-template-columns:1fr;gap:.65rem}.company-profile{padding:.9rem}.company-profile__verification{margin-bottom:.6rem}}
</style>

<style scoped>
.company-profile-hero{position:relative;display:flex;align-items:center;gap:1rem;overflow:hidden;margin-bottom:1rem;padding:1.15rem 1.35rem;background:linear-gradient(110deg,var(--palette-ink),#1769c2);color:#fff}.company-profile-hero:after{position:absolute;top:-4rem;right:5rem;width:10rem;height:10rem;border:1px solid rgb(255 255 255 / 16%);border-radius:50%;box-shadow:0 0 0 18px rgb(255 255 255 / 5%),0 0 0 36px rgb(255 255 255 / 4%);content:""}.company-profile-hero__mark{position:relative;z-index:1;display:grid;width:3.8rem;height:3.8rem;flex:none;place-items:center;border:1px solid rgb(255 255 255 / 36%);border-radius:1rem .9rem 1rem .25rem;background:rgb(255 255 255 / 14%);font:850 1.15rem Manrope,sans-serif}.company-profile-hero>div{position:relative;z-index:1;min-width:0;flex:1}.company-profile-hero__eyebrow{color:rgb(255 255 255 / 66%);font-size:.64rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.company-profile-hero h2{margin:.2rem 0;font:800 1.35rem Manrope,sans-serif;letter-spacing:-.04em}.company-profile-hero p{margin:0;color:rgb(255 255 255 / 80%);font-size:.78rem}.company-profile-hero__status{position:relative;z-index:1;display:inline-flex;align-items:center;gap:.4rem;border:1px solid rgb(255 255 255 / 28%);border-radius:999px;padding:.5rem .7rem;color:#fff;font-size:.68rem;font-weight:750;white-space:nowrap}.company-profile-hero__status i{width:.45rem;height:.45rem;border-radius:50%;background:#ffd27a}.company-profile-hero__status--verified i{background:#7de2b0}.company-profile-hero__status--rejected i{background:#ff9aa2}
.profile-preview-actions{display:flex;align-items:center;gap:.8rem}.profile-preview-actions__preview{display:inline-flex;min-height:2.55rem;align-items:center;padding:0 .85rem;border:1px solid var(--border);border-radius:.7rem;background:var(--surface);color:var(--primary);font-size:.76rem;font-weight:800}.profile-preview-actions__back{color:var(--muted-foreground);font-size:.76rem;font-weight:700}
@media(max-width:600px){.company-profile-hero{align-items:flex-start;flex-wrap:wrap;padding:1rem}.company-profile-hero>div{min-width:calc(100% - 5rem)}.company-profile-hero__status{margin-left:4.8rem}}

.company-profile-layout{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(15rem,.75fr);align-items:start;gap:1rem}
.company-profile-layout>.company-profile{margin:0}
.company-profile-aside{position:sticky;top:5.25rem;display:grid;gap:.75rem}
.company-profile-aside__card,.company-profile-aside__verification{padding:1rem;border:1px solid var(--border);border-radius:.85rem;background:var(--surface);box-shadow:none}
.company-profile-aside__card{position:relative;overflow:hidden;background:linear-gradient(150deg,#102747,#1d4778);color:#fff}
.company-profile-aside__kicker{color:#a9c8f0;font-size:.6rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
.company-profile-aside__score{position:absolute;top:.8rem;right:.8rem;display:grid;width:2.8rem;aspect-ratio:1;place-items:center;border:2px solid #73cde0;border-radius:50%;background:#17375c;color:#fff;font-size:.67rem;font-weight:850}
.company-profile-aside__card h2{max-width:14rem;margin:.85rem 0 .35rem;color:#fff;font:800 1.08rem/1.25 Manrope,sans-serif;letter-spacing:-.03em}
.company-profile-aside__card>p{margin:.3rem 0 .7rem;color:rgb(232 241 253 / 75%);font-size:.71rem;line-height:1.55}
.company-profile-aside__track{height:.35rem;overflow:hidden;border-radius:999px;background:rgb(255 255 255 / 17%)}
.company-profile-aside__track span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#59c3de,#a7dded);transition:width .35s ease}
.company-profile-aside__count{display:block;margin-top:.4rem;color:#c6d8ef;font-size:.63rem}
.company-profile-aside__next{display:flex;justify-content:space-between;gap:.5rem;margin-top:.75rem;padding:.6rem .7rem;border-radius:.65rem;background:#f7faff;color:#15345b;font-size:.7rem;font-weight:800}
.company-profile-aside__next span{color:#3268dd}
.company-profile-aside__ready{color:#bcf5dd!important}
.company-profile-aside__verification{display:flex;align-items:flex-start;gap:.65rem}
.company-profile-aside__verification-mark{display:grid;width:1.8rem;height:1.8rem;flex:none;place-items:center;border-radius:50%;background:#ca8516;color:white;font-weight:900}
.company-profile-aside__verification-mark.is-verified{background:#16865c}.company-profile-aside__verification-mark.is-rejected{background:#b23c48}
.company-profile-aside__verification>div{min-width:0}
.company-profile-aside__verification strong{font-size:.73rem}
.company-profile-aside__verification p{margin:.25rem 0 0;color:var(--muted-foreground);font-size:.66rem;line-height:1.5}
.company-profile-aside__preview{display:flex;justify-content:space-between;gap:.6rem;padding:.8rem;border:1px solid var(--border);border-radius:.75rem;background:var(--secondary);color:var(--primary);font-size:.73rem;font-weight:800}
@media(max-width:900px){.company-profile-layout{grid-template-columns:1fr}.company-profile-aside{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}.company-profile-aside__card{grid-row:span 2}}
@media(max-width:640px){.company-profile-aside{grid-template-columns:1fr}.company-profile-aside__card{grid-row:auto}}
</style>

<style scoped>
.company-profile-hero{width:100%;min-width:0;background:linear-gradient(110deg,#102747,#1769c2)}
.company-profile-layout{width:100%;min-width:0;grid-template-columns:minmax(0,1fr) minmax(16rem,19rem);gap:1.1rem}
.company-profile-layout>.company-profile,.company-profile-layout>.company-profile-aside{min-width:0}
.company-profile{width:100%;min-width:0}
.company-profile__groups,.company-profile__group{min-width:0}
.company-profile__group{padding:.9rem}
.company-profile__group{align-self:start;align-content:start}
.company-profile__grid{grid-template-columns:repeat(2,minmax(0,1fr));min-width:0;align-content:start;align-items:start;grid-auto-rows:max-content}
.company-profile__grid label{align-content:start;align-self:start;line-height:1.4}
.company-profile__grid input,.company-profile__grid select,.company-profile__grid textarea{align-self:start}
.company-profile-aside{min-width:0}
.company-profile-aside__card,.company-profile-aside__verification,.company-profile-aside__preview{min-width:0;width:100%}
@media(max-width:1180px){.company-profile-layout{grid-template-columns:minmax(0,1fr)}.company-profile-aside{position:static;grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch}.company-profile-aside__card{grid-row:auto}.company-profile-aside__preview{align-self:start}}
@media(max-width:760px){.company-profile__groups{grid-template-columns:1fr!important}.company-profile__group:nth-child(3){grid-column:auto!important}}
@media(max-width:640px){.company-profile-aside{grid-template-columns:minmax(0,1fr)}.company-profile__grid{grid-template-columns:minmax(0,1fr)}.company-profile__wide{grid-column:auto}.company-profile{padding:.85rem}.company-profile-hero{gap:.75rem}.company-profile-hero__status{margin-left:0}}
</style>
