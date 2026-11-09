<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { LoaderCircle } from 'lucide-vue-next'
import WorkspaceFrame from '@/components/workspace/WorkspaceFrame.vue'
import AppMessage from '@/components/ui/AppMessage.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { useToast } from '@/composables/useToast'
import { companyLogoUrl, profilesApi, type CompanyProfileData, type ProfileOption } from '@/services/profiles'
import { profileAvatarStyle, profileInitials } from '@/utils/profileAvatar'
import { waitForMinimumDuration } from '@/utils/minimumDuration'

const profile = ref<CompanyProfileData | null>(null)
const departments = ref<ProfileOption[]>([])
const municipalitiesAll = ref<ProfileOption[]>([])
const sectors = ref<ProfileOption[]>([])
const loading = ref(true)
const saving = ref(false)
const logoSaving = ref(false)
const error = ref('')
const { notify } = useToast()
const { confirmation, askConfirmation, finishConfirmation } = useConfirmDialog()
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
const logoSrc = computed(() => profile.value?.logoUrl ? companyLogoUrl(profile.value.logoUrl) : '')
const companyInitials = computed(() => profileInitials(form.name))
const companyMarkStyle = computed(() => profileAvatarStyle(form.name, sectors.value.find(item => item.id === form.economicSectorId)?.name))
const phoneNational = computed({
  get() {
    const digits = form.phone.replace(/\D/g, '')
    const national = form.phone.startsWith('+505') || (digits.startsWith('505') && digits.length === 11) ? digits.slice(3, 11) : digits.slice(0, 8)
    return national.length > 4 ? `${national.slice(0, 4)} ${national.slice(4)}` : national
  },
  set(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    form.phone = digits ? `+505${digits}` : ''
  },
})
const validCompanyPhone = (value: string) => {
  if (value.length > 40 || !/^[+\d\s().-]+$/.test(value)) return false
  const digits = value.replace(/\D/g, '')
  const national = digits.startsWith('505') && digits.length === 11 ? digits.slice(3) : digits
  return /^[2-9]\d{7}$/.test(national)
}
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
  if (!await askConfirmation({ title: 'Guardar cambios del perfil', message: '¿Confirmas que quieres actualizar la información de tu empresa?' })) return
  const startedAt = performance.now()
  if (form.phone.trim() && !validCompanyPhone(form.phone)) { error.value = 'Ingresa un teléfono válido de Nicaragua con 8 dígitos.'; return }
  saving.value = true; error.value = ''
  let succeeded = false
  let failure: unknown
  try {
    const result = await profilesApi.updateCompany({ ...form, website: form.website || null, economicSectorId: form.economicSectorId || null, departmentId: form.departmentId || null, municipalityId: form.municipalityId || null, description: form.description || null, address: form.address || null, contactEmail: form.contactEmail || null, phone: form.phone || null, taxId: form.taxId || null })
    profile.value = { ...profile.value!, ...result.profile }
    succeeded = true
  } catch (e) { failure = e }
  finally { await waitForMinimumDuration(startedAt, 900); saving.value = false }
  if (succeeded) notify('Perfil actualizado', 'Los cambios se guardaron correctamente.')
  else notify('No se pudo guardar el perfil', failure instanceof Error ? failure.message : 'Inténtalo de nuevo.', 'error')
}
async function uploadLogo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
    error.value = 'Selecciona un logo JPG, PNG o WebP de máximo 2 MB.'
    return
  }
  if (profile.value?.logoUrl && !await askConfirmation({ title: 'Reemplazar logo', message: '¿Quieres reemplazar el logo actual de tu empresa?' })) return
  logoSaving.value = true; error.value = ''
  try {
    const result = await profilesApi.uploadCompanyLogo(file)
    if (profile.value) profile.value.logoUrl = result.fileId
    notify('Logo actualizado', 'El logo de empresa se guardó correctamente.')
    window.dispatchEvent(new Event('jinowork:company-logo-updated'))
  } catch (e) { notify('No se pudo subir el logo', e instanceof Error ? e.message : 'Inténtalo de nuevo.', 'error') }
  finally { logoSaving.value = false }
}
async function removeLogo() {
  if (!await askConfirmation({ title: 'Quitar logo', message: '¿Quieres quitar el logo actual? Se mostrarán las iniciales de tu empresa.', confirmLabel: 'Quitar', danger: true })) return
  logoSaving.value = true; error.value = ''
  try {
    await profilesApi.deleteCompanyLogo()
    if (profile.value) profile.value.logoUrl = null
    notify('Logo eliminado', 'Ahora se mostrarán las iniciales de la empresa.')
    window.dispatchEvent(new Event('jinowork:company-logo-updated'))
  } catch (e) { notify('No se pudo quitar el logo', e instanceof Error ? e.message : 'Inténtalo de nuevo.', 'error') }
  finally { logoSaving.value = false }
}
</script>

<template>
  <WorkspaceFrame eyebrow="Perfil de empresa" title="Información de la empresa" subtitle="Mantén actualizados los datos que acompañan tus ofertas." initials="JW">
    <template #heading-action><div class="profile-preview-actions"><RouterLink class="profile-preview-actions__back" to="/company/profile">Volver al perfil de empresa</RouterLink></div></template>
    <AppMessage v-if="error" variant="error" title="Hay un problema con el perfil de empresa" :message="error" />
    <AppMessage v-if="loading" variant="loading" message="Cargando perfil…" />
    <template v-else-if="profile"><section class="company-profile-hero workspace__card" aria-label="Resumen de empresa"><span class="company-profile-hero__mark" :style="companyMarkStyle"><img v-if="logoSrc" :src="logoSrc" alt="Logo de la empresa"><span v-else>{{ companyInitials }}</span></span><div><span class="company-profile-hero__eyebrow">Perfil de empresa</span><h2>{{ form.name }}</h2><p>{{ companySummary }}</p></div><div class="company-profile-hero__tools"><span class="company-profile-hero__status" :class="`company-profile-hero__status--${profile.verificationStatus.toLowerCase()}`"><i />{{ profile.verificationStatus === 'VERIFIED' ? 'Verificada' : profile.verificationStatus === 'REJECTED' ? 'Rechazada' : 'Pendiente de verificación' }}</span><div class="company-profile-hero__logo-actions"><label class="company-profile-hero__logo-upload">{{ logoSaving ? 'Subiendo...' : logoSrc ? 'Cambiar logo' : 'Subir logo' }}<input type="file" accept="image/jpeg,image/png,image/webp" :disabled="logoSaving" @change="uploadLogo"></label><button v-if="logoSrc" type="button" :disabled="logoSaving" @click="removeLogo">Quitar</button></div></div></section>
    <div class="company-profile-layout"><form class="workspace__card company-profile" @submit.prevent="save">
      <div class="company-profile__groups">
        <section id="company-identity" class="company-profile__group"><header><div><h2>Identidad</h2><p>Información que acompaña tus ofertas.</p></div></header><div class="company-profile__grid"><label>Nombre de la empresa<input v-model="form.name" maxlength="160" placeholder="Nombre comercial" required></label><label>Sector económico<select v-model="form.economicSectorId"><option value="">Sin especificar</option><option v-for="item in sectors" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label class="company-profile__wide">Descripción<textarea v-model="form.description" rows="3" maxlength="5000" placeholder="Cuenta qué hace la empresa y qué la distingue como lugar para trabajar."></textarea></label><label class="company-profile__wide">Sitio web<input v-model="form.website" type="url" maxlength="2000" placeholder="https://ejemplo.com"></label></div></section>
        <section id="company-location" class="company-profile__group"><header><div><h2>Ubicación</h2><p>Indica dónde se encuentra tu empresa.</p></div></header><div class="company-profile__grid"><label>Departamento<select v-model="form.departmentId" @change="form.municipalityId = ''"><option value="">Sin especificar</option><option v-for="item in departments" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label>Municipio<select v-model="form.municipalityId" :disabled="!form.departmentId"><option value="">Sin especificar</option><option v-for="item in municipalities" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label class="company-profile__wide">Dirección<input v-model="form.address" maxlength="500" placeholder="Dirección para documentos internos"></label></div></section>
        <section class="company-profile__group"><header><div><h2>Contacto y registro</h2><p>Datos privados de contacto y registro fiscal.</p></div></header><div class="company-profile__grid"><label>Correo de contacto<input v-model="form.contactEmail" type="email" maxlength="254" placeholder="talento@empresa.com"></label><label>Teléfono<div class="phone-input"><span class="phone-input__country" aria-label="Nicaragua">🇳🇮</span><span class="phone-input__prefix" aria-hidden="true">+505</span><input id="company-phone" v-model="phoneNational" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="9" placeholder="8888 8888" aria-label="Número de teléfono de Nicaragua"></div><small>8 dígitos · Nicaragua</small></label><label>Identificación fiscal<input v-model="form.taxId" maxlength="80" placeholder="RUC o identificación fiscal"></label></div></section>
      </div>
      <button class="workspace__cta company-profile__save profile-save-button" type="submit" :disabled="saving" :aria-busy="saving"><LoaderCircle v-if="saving" class="company-profile__save-spinner" :size="16" aria-hidden="true" />{{ saving ? 'Guardando…' : 'Guardar perfil' }}</button>
    </form><aside class="company-profile-aside" aria-label="Progreso de la página de empresa"><section class="company-profile-aside__card workspace__card"><span class="company-profile-aside__kicker">Presencia de empresa</span><div class="company-profile-aside__score"><span>{{ companyCompletion }}%</span></div><h2>Una buena presentación genera confianza.</h2><p>Completa la información pública para que los candidatos conozcan mejor tu empresa.</p><div class="company-profile-aside__track" role="progressbar" :aria-valuenow="companyCompletion" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso de la página de empresa"><span :style="{ width: `${companyCompletion}%` }" /></div><small class="company-profile-aside__count">{{ completedCompanyItems }} de {{ companyCompletionItems.length }} datos completados</small><a v-if="nextCompanyStep" class="company-profile-aside__next" :href="nextCompanyStep.target">Completar {{ nextCompanyStep.label }} <span aria-hidden="true">→</span></a><p v-else class="company-profile-aside__ready">Tu información pública está completa.</p></section><section class="company-profile-aside__verification workspace__card"><span class="company-profile-aside__verification-mark" :class="`is-${profile.verificationStatus.toLowerCase()}`" aria-hidden="true">{{ profile.verificationStatus === 'VERIFIED' ? '✓' : '!' }}</span><div><strong>{{ profile.verificationStatus === 'VERIFIED' ? 'Empresa verificada' : profile.verificationStatus === 'REJECTED' ? 'Verificación rechazada' : 'Verificación pendiente' }}</strong><p>{{ profile.verificationStatus === 'VERIFIED' ? 'Puedes publicar ofertas y recibir postulaciones.' : 'Solo las empresas verificadas pueden publicar ofertas.' }}</p></div></section><RouterLink class="company-profile-aside__action" to="/company/jobs"><span><strong>Gestionar ofertas</strong><small>Revisa publicaciones y candidaturas</small></span><span aria-hidden="true">→</span></RouterLink><RouterLink class="company-profile-aside__action company-profile-aside__action--primary" to="/company/jobs/new"><span><strong>Crear oferta</strong><small>Publica una oportunidad para tu empresa</small></span><span aria-hidden="true">→</span></RouterLink></aside></div></template>
    <AppConfirmDialog v-if="confirmation" :title="confirmation.title" :message="confirmation.message" :confirm-label="confirmation.confirmLabel" :danger="confirmation.danger" @confirm="finishConfirmation(true)" @cancel="finishConfirmation(false)" />
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
.company-profile-hero{position:relative;display:flex;align-items:center;gap:1rem;overflow:hidden;margin-bottom:1rem;padding:1.15rem 1.35rem;background:linear-gradient(110deg,var(--palette-ink),var(--primary));color:#fff}.company-profile-hero:after{position:absolute;top:-4rem;right:5rem;width:10rem;height:10rem;border:1px solid rgb(255 255 255 / 16%);border-radius:50%;box-shadow:0 0 0 18px rgb(255 255 255 / 5%),0 0 0 36px rgb(255 255 255 / 4%);content:""}.company-profile-hero__mark{position:relative;z-index:1;display:grid;width:3.8rem;height:3.8rem;flex:none;place-items:center;border:1px solid rgb(255 255 255 / 36%);border-radius:1rem .9rem 1rem .25rem;background:rgb(255 255 255 / 14%);font:850 1.15rem Manrope,sans-serif}.company-profile-hero>div{position:relative;z-index:1;min-width:0;flex:1}.company-profile-hero__eyebrow{color:rgb(255 255 255 / 66%);font-size:.64rem;font-weight:850;letter-spacing:.13em;text-transform:uppercase}.company-profile-hero h2{margin:.2rem 0;font:800 1.35rem Manrope,sans-serif;letter-spacing:-.04em}.company-profile-hero p{margin:0;color:rgb(255 255 255 / 80%);font-size:.78rem}.company-profile-hero__status{position:relative;z-index:1;display:inline-flex;align-items:center;gap:.4rem;border:1px solid rgb(255 255 255 / 28%);border-radius:999px;padding:.5rem .7rem;color:#fff;font-size:.68rem;font-weight:750;white-space:nowrap}.company-profile-hero__status i{width:.45rem;height:.45rem;border-radius:50%;background:#ffd27a}.company-profile-hero__status--verified i{background:#7de2b0}.company-profile-hero__status--rejected i{background:#ff9aa2}
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
.company-profile-hero{width:100%;min-width:0;background:linear-gradient(110deg,#102747,var(--primary))}
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

<style>
.workspace--company .company-profile-hero{min-height:8.3rem;margin-bottom:1rem;padding:1.2rem 1.45rem;border:0!important;background:linear-gradient(110deg,var(--palette-violet),var(--primary))!important;color:#fff}
.workspace--company .company-profile-hero__mark{width:4rem;height:4rem;border:0;border-radius:0;background:rgb(255 255 255 / 17%);font-size:1.15rem}
.workspace--company .company-profile-hero__mark{aspect-ratio:1;border-radius:50%!important}
.workspace--company .company-profile-hero__mark{overflow:hidden;border-radius:50%}
.workspace--company .company-profile-hero__mark img{width:100%;height:100%;border-radius:50%!important;object-fit:contain;background:var(--surface)}
.workspace--company .company-profile-hero__mark>span{display:grid;width:100%;height:100%;place-items:center;color:#fff;font-weight:850}
.workspace--company .company-profile-hero__status{border:0;border-radius:0;background:rgb(255 255 255 / 12%)}
.workspace--company .company-profile-layout{grid-template-columns:minmax(0,2fr) minmax(16rem,.78fr);align-items:start;gap:1rem}
.workspace--company .company-profile{padding:1.15rem;background:var(--surface)}
.workspace--company .company-profile__groups{display:block!important}
.workspace--company .company-profile__group{display:block!important;padding:0 0 1.1rem!important;margin:0 0 1.1rem;border:0!important;border-bottom:1px solid var(--border)!important;background:transparent!important}
.workspace--company .company-profile__group:last-child{padding-bottom:0;margin-bottom:0;border-bottom:0!important}
.workspace--company .company-profile__group>header{margin:0 0 .75rem}
.workspace--company .company-profile__group>header h2{margin:0;color:var(--foreground);font:800 .92rem Manrope,sans-serif}
.workspace--company .company-profile__group>header p{margin:.2rem 0 0;color:var(--muted-foreground);font-size:.72rem}
.workspace--company .company-profile__grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem .85rem}
.workspace--company .company-profile__grid label{gap:.35rem;color:var(--muted-foreground);font-size:.73rem;font-weight:750}
.workspace--company .company-profile__grid input,.workspace--company .company-profile__grid select,.workspace--company .company-profile__grid textarea{min-height:2.55rem;padding:.55rem .7rem;border:1px solid var(--border);border-radius:0;background:var(--surface);font:500 .8rem Manrope,sans-serif}
.workspace--company .company-profile__grid textarea{min-height:5.8rem}
.workspace--company .company-profile>button{min-height:2.6rem;margin-top:1.1rem;border:0;border-radius:0;background:linear-gradient(100deg,var(--palette-violet),var(--primary));box-shadow:none}
.workspace--company .company-profile-aside{position:sticky;top:5.5rem;grid-template-columns:minmax(0,1fr);gap:.7rem}
.workspace--company .company-profile-aside__card{min-height:17rem;padding:1.15rem!important;border:0!important;border-radius:0!important;background:linear-gradient(150deg,#102747,#1d4778)!important;color:#fff}
.workspace--company .company-profile-aside__score{width:2.7rem;border:0;border-radius:0;background:rgb(255 255 255 / 12%);color:#fff}
.workspace--company .company-profile-aside__track{height:.35rem;border-radius:0}
.workspace--company .company-profile-aside__track span{border-radius:0;background:linear-gradient(90deg,#59c3de,#a7dded)}
.workspace--company .company-profile-aside__next{min-height:2.65rem;border:0;border-radius:0;background:#f7faff;color:#15345b}
.workspace--company .company-profile-aside__verification{padding:.85rem 0;border:0!important;border-radius:0!important;background:transparent!important}
.workspace--company .company-profile-aside__verification strong{color:var(--foreground);font-size:.75rem}
.workspace--company .company-profile-aside__action{display:flex;align-items:center;justify-content:space-between;gap:.7rem;padding:.8rem 0;border:0;border-bottom:1px solid var(--border);border-radius:0;background:transparent;color:var(--foreground);text-decoration:none}
.workspace--company .company-profile-aside__action>span:first-child{display:grid;gap:.2rem}
.workspace--company .company-profile-aside__action strong{font-size:.76rem}
.workspace--company .company-profile-aside__action small{color:var(--muted-foreground);font-size:.66rem;line-height:1.4}
.workspace--company .company-profile-aside__action>span:last-child{color:var(--primary);font-size:1.1rem}
.workspace--company .company-profile-aside__action--primary{color:var(--primary)}
@media(max-width:1000px){.workspace--company .company-profile-layout{grid-template-columns:minmax(0,1fr)}.workspace--company .company-profile-aside{position:static;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}.workspace--company .company-profile-aside__card{grid-row:span 3}}
@media(max-width:640px){.workspace--company .company-profile-layout{grid-template-columns:minmax(0,1fr)}.workspace--company .company-profile-aside{grid-template-columns:minmax(0,1fr)}.workspace--company .company-profile-aside__card{grid-row:auto}.workspace--company .company-profile__grid{grid-template-columns:minmax(0,1fr)}.workspace--company .company-profile__wide{grid-column:auto}.workspace--company .company-profile-hero{align-items:flex-start;flex-wrap:wrap}.workspace--company .company-profile-hero__status{margin-left:0}}
</style>

<style>
.workspace--company .workspace__main{padding-top:.55rem!important}
.workspace--company .workspace__heading{margin-bottom:.8rem}
.workspace--company .company-profile-hero__tools{position:relative;z-index:1;display:grid;justify-items:end;gap:.45rem;flex:none;min-width:8rem}
.workspace--company .company-profile-hero__logo-actions{display:flex;align-items:center;gap:.5rem}
.workspace--company .company-profile-hero__logo-upload,.workspace--company .company-profile-hero__logo-actions button{display:inline-flex;min-height:1.8rem;align-items:center;padding:0 .55rem;border:0;background:rgb(255 255 255 / 13%);color:#fff;font:700 .66rem Manrope,sans-serif;cursor:pointer}
.workspace--company .company-profile-hero__logo-upload input{display:none}
.workspace--company .company-profile-hero__logo-actions button{background:transparent;color:rgb(255 255 255 / 78%)}
@media(max-width:640px){.workspace--company .company-profile-hero__tools{justify-items:start;min-width:100%;grid-template-columns:auto 1fr;align-items:center}.workspace--company .company-profile-hero__logo-actions{justify-self:end}}
</style>

<style>
.workspace--company .company-profile .phone-input{display:grid;grid-template-columns:2.6rem 3.2rem minmax(0,1fr);align-items:center;min-height:2.55rem;overflow:hidden;border:1px solid var(--border);background:var(--surface);transition:border-color .18s,box-shadow .18s}
.workspace--company .company-profile .phone-input:focus-within{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--primary) 12%,transparent)}
.workspace--company .company-profile .phone-input__country{display:grid;height:100%;place-items:center;border-right:1px solid var(--border);background:var(--panel);font-size:1.1rem}
.workspace--company .company-profile .phone-input__prefix{padding-left:.55rem;color:var(--foreground);font-size:.82rem;font-weight:750}
.workspace--company .company-profile .phone-input input{width:100%;min-width:0;min-height:2.5rem;padding:.45rem .6rem;border:0!important;outline:0;background:transparent!important;box-shadow:none!important;font-variant-numeric:tabular-nums}
.workspace--company .company-profile .company-profile__save{gap:.5rem}
.workspace--company .company-profile-layout{padding-bottom:5rem}
.workspace--company .company-profile .company-profile__save-spinner{animation:company-profile-spin .8s linear infinite}
@keyframes company-profile-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.workspace--company .company-profile .company-profile__save-spinner{animation-duration:1.8s}}
</style>

<style scoped>
/* Unifica el banner y la tarjeta de progreso con la paleta de los perfiles. */
.workspace--company .company-profile-hero{isolation:isolate;background-color:#1b3a33!important;background-image:linear-gradient(105deg,rgb(18 55 46 / 95%),rgb(36 83 69 / 91%)),url('/assets/jinowork-svgs-mejorados/left/03-ondas-oscuras.svg'),url('/assets/jinowork-svgs-mejorados/left/01-contornos-oscuros.svg')!important;background-position:center,center bottom,center;background-size:cover,cover,cover}
.workspace--company .company-profile-hero:after{display:none!important}
.workspace--company .company-profile-hero__eyebrow{color:#f4d9d0}
.workspace--company .company-profile-hero h2{color:#fffdfb}
.workspace--company .company-profile-hero p{color:rgb(255 253 251 / 88%)}
.workspace--company .company-profile-hero__status{border:1px solid rgb(255 253 251 / 22%);border-radius:999px;background:rgb(255 253 251 / 10%);color:#fffdfb}
.workspace--company .company-profile-aside__card{position:relative;isolation:isolate;overflow:hidden;background-color:#1b3a33!important;background-image:linear-gradient(120deg,rgb(18 55 46 / 96%),rgb(36 83 69 / 93%)),url('/assets/jinowork-svgs-mejorados/left/03-ondas-oscuras.svg'),url('/assets/jinowork-svgs-mejorados/left/01-contornos-oscuros.svg')!important;background-position:center,center bottom,center;background-size:cover,cover,cover;color:#fffdfb}
.workspace--company .company-profile-aside__card>*{position:relative;z-index:1}
.workspace--company .company-profile-aside__kicker{color:#f4d9d0}
.workspace--company .company-profile-aside__score{width:auto;min-width:2.8rem;height:2rem;aspect-ratio:auto;padding:0 .55rem;border:1px solid rgb(255 253 251 / 22%);border-radius:999px;background:rgb(255 253 251 / 10%);color:#fffdfb}
.workspace--company .company-profile-aside__card h2{color:#fffdfb}
.workspace--company .company-profile-aside__card>p{color:rgb(255 253 251 / 86%)}
.workspace--company .company-profile-aside__track{height:.42rem;border-radius:999px;background:rgb(255 253 251 / 20%)}
.workspace--company .company-profile-aside__track span{border-radius:inherit;background:linear-gradient(90deg,#d97761,#efa48c)}
.workspace--company .company-profile-aside__count{color:rgb(255 253 251 / 78%)}
.workspace--company .company-profile-aside__next{border:1px solid rgb(255 253 251 / 14%);border-radius:.75rem;background:rgb(255 253 251 / 10%);color:#fffdfb}
.workspace--company .company-profile-aside__next span{color:#f4d9d0}
.workspace--company .company-profile-aside__ready{color:#c9ead8!important}
@media(max-width:640px){.workspace--company .company-profile-hero{background-position:center,center bottom,center}.workspace--company .company-profile-aside__card{min-height:0}}
</style>

<style>
/* Mantiene el porcentaje como una insignia compacta y despejada. */
.workspace.workspace--company .company-profile-aside__card{padding:1.35rem!important}
.workspace.workspace--company .company-profile-aside__kicker{padding-right:5rem}
.workspace.workspace--company .company-profile-aside__score{position:absolute!important;top:1.15rem!important;right:1.2rem!important;display:inline-flex!important;width:max-content!important;min-width:0!important;height:2rem!important;align-items:center;padding:0 .7rem!important}
.workspace.workspace--company .company-profile-aside__card h2{margin:.9rem 0 .4rem!important}
.workspace.workspace--company .company-profile .profile-save-button{background:#2f5f52!important;background-image:none!important;box-shadow:0 10px 26px rgb(27 58 51 / 24%)!important}
.workspace.workspace--company .company-profile .profile-save-button:hover:not(:disabled),.workspace.workspace--company .company-profile .profile-save-button:focus-visible,.workspace.workspace--company .company-profile .profile-save-button:active{background:#234b40!important;background-image:none!important;box-shadow:0 12px 28px rgb(27 58 51 / 30%)!important}
.workspace.workspace--company .company-profile-aside{gap:.85rem}
.workspace.workspace--company .company-profile-aside__verification{align-items:center;padding:1rem 1.05rem;border:0;border-radius:1rem;background:#fffdfb;box-shadow:0 10px 28px rgb(47 48 38 / 5%)}
.workspace.workspace--company .company-profile-aside__verification-mark{width:2rem;height:2rem;background:#16865c;color:#fff}
.workspace.workspace--company .company-profile-aside__verification strong{font-size:.8rem;color:#1b3a33}
.workspace.workspace--company .company-profile-aside__verification p{margin-top:.3rem;font-size:.76rem;line-height:1.5}
.workspace.workspace--company .company-profile-aside__action{min-height:3.7rem;padding:.75rem .9rem;border:0;border-radius:.9rem;background:rgb(255 253 251 / 72%);transition:background .18s ease,transform .18s ease}
.workspace.workspace--company .company-profile-aside__action:hover{background:#fffdfb;transform:translateX(2px)}
.workspace.workspace--company .company-profile-aside__action strong{font-size:.8rem;color:#1b3a33}
.workspace.workspace--company .company-profile-aside__action small{font-size:.72rem}
.workspace.workspace--company .company-profile-aside__action>span:last-child{display:grid;width:1.8rem;height:1.8rem;place-items:center;border-radius:50%;background:#e7efe9;color:#2f5f52}
/* La navegación móvil ocupa el borde inferior; deja el guardado encima de ella. */
@media(max-width:1024px){
  .workspace.workspace--company .company-profile-layout{padding-bottom:8.5rem}
  .workspace.workspace--company .company-profile .profile-save-button{z-index:1111!important;bottom:calc(4.15rem + env(safe-area-inset-bottom,0px) + .85rem)!important}
}
@media(max-width:600px){
  .workspace.workspace--company .company-profile .profile-save-button{right:1rem!important;left:1rem!important;width:calc(100% - 2rem)!important}
}
</style>
