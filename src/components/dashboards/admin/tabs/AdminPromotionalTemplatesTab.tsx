'use client'

import React, { useState } from 'react'
import {
  Palette,
  Eye,
  Save,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Layers,
  History,
  ShieldAlert,
  Globe,
  Plus,
  Sliders,
} from 'lucide-react'
import { useAdminToast } from '../AdminToast'
import {
  PromotionalTemplate,
  listPromotionalTemplates,
  getActiveTemplate,
  saveTemplateDraft,
  publishTemplateVersion,
  restorePreviousTemplateVersion,
  getTemplateAuditLogs,
} from '@/modules/promotional-toolkit/templates'
import { PromotionalCardCanvas } from '@/components/promotional-toolkit/PromotionalCardCanvas'

export function AdminPromotionalTemplatesTab() {
  const { showToast } = useAdminToast()
  const [templates, setTemplates] = useState<PromotionalTemplate[]>(listPromotionalTemplates())
  const [activeTab, setActiveTab] = useState<'EDITOR' | 'AUDIT_LOGS'>('EDITOR')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(getActiveTemplate().id)
  const [currentEdit, setCurrentEdit] = useState<PromotionalTemplate>(getActiveTemplate())
  const [previewAspect, setPreviewAspect] = useState<'SQUARE_1_1' | 'PORTRAIT_9_16' | 'LANDSCAPE_16_9'>(
    'SQUARE_1_1'
  )
  const [previewLang, setPreviewLang] = useState<'EN' | 'SW'>('EN')
  const [auditLogs, setAuditLogs] = useState(getTemplateAuditLogs())

  const handleSelectTemplate = (tpl: PromotionalTemplate) => {
    setSelectedTemplateId(tpl.id)
    setCurrentEdit(JSON.parse(JSON.stringify(tpl)))
  }

  const handleSaveDraft = () => {
    const saved = saveTemplateDraft(currentEdit, 'Admin Admin')
    setTemplates(listPromotionalTemplates())
    setAuditLogs(getTemplateAuditLogs())
    setCurrentEdit(saved)
    showToast('info', 'Draft Saved', `Template draft for "${saved.name}" has been updated.`)
  }

  const handlePublish = () => {
    const published = publishTemplateVersion(currentEdit.id, 'Admin Admin')
    if (published) {
      setTemplates(listPromotionalTemplates())
      setAuditLogs(getTemplateAuditLogs())
      setCurrentEdit(JSON.parse(JSON.stringify(published)))
      showToast('success', 'Template Published', `Version ${published.version} of "${published.name}" is now live.`)
    }
  }

  const handleRestorePrevious = () => {
    const restored = restorePreviousTemplateVersion(currentEdit.id, 'Admin Admin')
    if (restored) {
      setTemplates(listPromotionalTemplates())
      setAuditLogs(getTemplateAuditLogs())
      setCurrentEdit(JSON.parse(JSON.stringify(restored)))
      showToast('warning', 'Version Restored', `Restored previous template settings for "${restored.name}".`)
    } else {
      showToast('error', 'Restore Unavailable', 'No previous historical version available to restore.')
    }
  }

  return (
    <div className="space-y-5 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Promotional Card Templates & Controls</span>
            <span className="text-[10px] bg-orange-100 dark:bg-orange-950/60 text-[#FF6A00] font-extrabold px-2.5 py-0.5 rounded-full">
              Admin Governance
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure partner promotional card presets, layout rules, CTA text overrides, public field visibility, and view version audit trails.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('EDITOR')}
            className={`py-1.5 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'EDITOR'
                ? 'bg-white dark:bg-slate-900 text-[#FF6A00] shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Template Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`py-1.5 px-3.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'AUDIT_LOGS'
                ? 'bg-white dark:bg-slate-900 text-[#FF6A00] shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'EDITOR' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Left Column: Template Selection & Controls */}
          <div className="lg:col-span-7 space-y-4">
            {/* Template Selector Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#FF6A00]" />
                  <span>Select Active Template</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full">
                  Ver {currentEdit.version} ({currentEdit.status})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedTemplateId === tpl.id
                        ? 'bg-white dark:bg-slate-900 border-[#FF6A00] text-slate-900 dark:text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-extrabold truncate text-xs">{tpl.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      v{tpl.version} • {tpl.isDefault ? 'Default' : 'Custom'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Field Toggles & Limits */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white">Public Field Visibility Controls</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={currentEdit.publicFieldToggles.showPrice}
                    onChange={(e) =>
                      setCurrentEdit({
                        ...currentEdit,
                        publicFieldToggles: { ...currentEdit.publicFieldToggles, showPrice: e.target.checked },
                      })
                    }
                    className="rounded text-[#FF6A00]"
                  />
                  <span>Show Public Price</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={currentEdit.publicFieldToggles.showLocation}
                    onChange={(e) =>
                      setCurrentEdit({
                        ...currentEdit,
                        publicFieldToggles: { ...currentEdit.publicFieldToggles, showLocation: e.target.checked },
                      })
                    }
                    className="rounded text-[#FF6A00]"
                  />
                  <span>Show Region</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={currentEdit.publicFieldToggles.showSpecs}
                    onChange={(e) =>
                      setCurrentEdit({
                        ...currentEdit,
                        publicFieldToggles: { ...currentEdit.publicFieldToggles, showSpecs: e.target.checked },
                      })
                    }
                    className="rounded text-[#FF6A00]"
                  />
                  <span>Show Specifications</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={currentEdit.publicFieldToggles.showQrCode}
                    onChange={(e) =>
                      setCurrentEdit({
                        ...currentEdit,
                        publicFieldToggles: { ...currentEdit.publicFieldToggles, showQrCode: e.target.checked },
                      })
                    }
                    className="rounded text-[#FF6A00]"
                  />
                  <span>Show QR Code</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={currentEdit.publicFieldToggles.showRefCode}
                    onChange={(e) =>
                      setCurrentEdit({
                        ...currentEdit,
                        publicFieldToggles: { ...currentEdit.publicFieldToggles, showRefCode: e.target.checked },
                      })
                    }
                    className="rounded text-[#FF6A00]"
                  />
                  <span>Show Promo Ref</span>
                </label>
              </div>
            </div>

            {/* Length & Text Overrides */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white">Call to Action & Text Length Limits</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    English CTA Text
                  </label>
                  <input
                    type="text"
                    value={currentEdit.ctaTextEn}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, ctaTextEn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Kiswahili CTA Text
                  </label>
                  <input
                    type="text"
                    value={currentEdit.ctaTextSw}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, ctaTextSw: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Max Title Character Length
                  </label>
                  <input
                    type="number"
                    value={currentEdit.imageSettings.maxTitleLength}
                    onChange={(e) =>
                      setCurrentEdit({
                        ...currentEdit,
                        imageSettings: {
                          ...currentEdit.imageSettings,
                          maxTitleLength: Number(e.target.value) || 75,
                        },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Max Description Character Length
                  </label>
                  <input
                    type="number"
                    value={currentEdit.imageSettings.maxDescriptionLength}
                    onChange={(e) =>
                      setCurrentEdit({
                        ...currentEdit,
                        imageSettings: {
                          ...currentEdit.imageSettings,
                          maxDescriptionLength: Number(e.target.value) || 160,
                        },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Save & Publish Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={handleSaveDraft}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={handlePublish}
                className="py-2.5 px-4 rounded-xl bg-[#FF6A00] hover:bg-[#EA580C] text-white font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish Version</span>
              </button>
              <button
                onClick={handleRestorePrevious}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore Previous</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Multi-Format Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-500 uppercase text-[10px]">
                  Live Format Output Preview
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setPreviewAspect('SQUARE_1_1')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      previewAspect === 'SQUARE_1_1' ? 'bg-[#FF6A00] text-white' : 'text-slate-400'
                    }`}
                  >
                    1:1
                  </button>
                  <button
                    onClick={() => setPreviewAspect('PORTRAIT_9_16')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      previewAspect === 'PORTRAIT_9_16' ? 'bg-[#FF6A00] text-white' : 'text-slate-400'
                    }`}
                  >
                    9:16
                  </button>
                  <button
                    onClick={() => setPreviewAspect('LANDSCAPE_16_9')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      previewAspect === 'LANDSCAPE_16_9' ? 'bg-[#FF6A00] text-white' : 'text-slate-400'
                    }`}
                  >
                    16:9
                  </button>
                </div>
              </div>

              {/* Render Canvas Preview */}
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex justify-center">
                <PromotionalCardCanvas
                  dealTitle="Toyota Hiace 2018–2022 for Tour Fleet"
                  dealCategory="Vehicles"
                  dealRegion="Arusha"
                  dealPriceDisplay="TZS 85,000,000"
                  dealSummary="Tour operator seeking a clean Toyota Hiace with verified service history."
                  dealImageUrl="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&h=800&q=90"
                  opportunityType="REVERSE_SOURCING"
                  trackingCode="LUMO-6AAF-TOYOTA"
                  referralUrl="https://lumo.co.tz/p/LUMO-6AAF-TOYOTA"
                  aspectRatio={previewAspect}
                  selectedLanguage={previewLang}
                  template={currentEdit}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Language: {previewLang === 'EN' ? 'English' : 'Kiswahili'}</span>
                <button
                  onClick={() => setPreviewLang(previewLang === 'EN' ? 'SW' : 'EN')}
                  className="text-[#FF6A00] font-bold hover:underline"
                >
                  Toggle Language
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Logs List */
        <div className="space-y-3 text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200">
            Audit Log History of Promotional Card Template Changes
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/40">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{log.templateName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md font-bold">
                      v{log.version}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{log.notes}</div>
                </div>

                <div className="text-right shrink-0 font-mono text-[10px] text-slate-400">
                  <div>{log.actorAdmin}</div>
                  <div>{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
