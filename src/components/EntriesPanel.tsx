import React, { useState } from 'react'
import {
  Shuffle,
  ArrowDownAZ,
  Trash2,
  ListPlus,
  FileDown,
  Sparkles,
  Layers,
  Copy,
  Check,
} from 'lucide-react'
import { PRESET_LISTS } from '../utils/presets'

interface EntriesPanelProps {
  items: string[]
  onChangeItems: (items: string[]) => void
  onShuffle: () => void
  onSort: () => void
  onClear: () => void
  disabled?: boolean
}

export const EntriesPanel: React.FC<EntriesPanelProps> = ({
  items,
  onChangeItems,
  onShuffle,
  onSort,
  onClear,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'textarea' | 'list'>('textarea')
  const [showPresets, setShowPresets] = useState(false)
  const [copied, setCopied] = useState(false)

  // Raw text representation for textarea
  const textValue = items.join('\n')

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split('\n')
    // Keep empty lines while typing, but filter when setting to state or keep raw
    // To allow smooth line break typing, let's keep all lines and trim
    const filtered = lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    onChangeItems(filtered)
  }

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index)
    onChangeItems(updated)
  }

  const handleSelectPreset = (presetItems: string[]) => {
    onChangeItems(presetItems)
    setShowPresets(false)
  }

  const handleExportText = () => {
    const blob = new Blob([items.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kocok-nama-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(items.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Daftar Nama</h2>
          <span className="px-2 py-0.5 text-xs font-semibold text-blue-300 bg-blue-950/80 border border-blue-800/50 rounded-full">
            {items.length}
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveTab('textarea')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
              activeTab === 'textarea'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Teks
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Item
          </button>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center flex-wrap gap-1.5 p-2.5 bg-slate-900/60 border-b border-slate-800/80 text-xs">
        <button
          onClick={onShuffle}
          disabled={disabled || items.length < 2}
          className="flex items-center gap-1 px-2.5 py-1.5 text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-40 disabled:pointer-events-none rounded-lg border border-slate-700 transition-colors"
          title="Acak urutan nama"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
          <span>Acak</span>
        </button>

        <button
          onClick={onSort}
          disabled={disabled || items.length < 2}
          className="flex items-center gap-1 px-2.5 py-1.5 text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-40 disabled:pointer-events-none rounded-lg border border-slate-700 transition-colors"
          title="Urutkan nama A sampai Z"
        >
          <ArrowDownAZ className="w-3.5 h-3.5 text-emerald-400" />
          <span>Urutkan</span>
        </button>

        {/* Presets Button */}
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            disabled={disabled}
            className="flex items-center gap-1 px-2.5 py-1.5 text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-40 disabled:pointer-events-none rounded-lg border border-slate-700 transition-colors"
            title="Pilih contoh preset daftar nama"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Preset</span>
          </button>

          {/* Presets Dropdown */}
          {showPresets && (
            <div className="absolute left-0 mt-2 w-64 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 animate-in fade-in zoom-in-95">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                Pilih Contoh Daftar:
              </div>
              <div className="space-y-1">
                {PRESET_LISTS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.items)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors group"
                  >
                    <div className="font-medium text-xs group-hover:text-blue-400">
                      {preset.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleCopyClipboard}
          disabled={items.length === 0}
          className="flex items-center gap-1 px-2.5 py-1.5 text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-40 disabled:pointer-events-none rounded-lg border border-slate-700 transition-colors"
          title="Salin semua nama ke clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Salin</span>
            </>
          )}
        </button>

        <button
          onClick={handleExportText}
          disabled={items.length === 0}
          className="flex items-center gap-1 px-2.5 py-1.5 text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-40 disabled:pointer-events-none rounded-lg border border-slate-700 transition-colors ml-auto"
          title="Unduh daftar nama (.txt)"
        >
          <FileDown className="w-3.5 h-3.5 text-sky-400" />
          <span>Export</span>
        </button>

        <button
          onClick={onClear}
          disabled={disabled || items.length === 0}
          className="flex items-center gap-1 px-2.5 py-1.5 text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-900 disabled:opacity-40 disabled:pointer-events-none rounded-lg border border-rose-800/40 transition-colors"
          title="Hapus semua daftar nama"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Kosongkan</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3 min-h-[280px] flex flex-col overflow-hidden">
        {activeTab === 'textarea' ? (
          <div className="flex-1 flex flex-col h-full">
            <textarea
              value={textValue}
              onChange={handleTextChange}
              disabled={disabled}
              placeholder="Ketik atau paste nama di sini...&#10;Contoh:&#10;Budi Santoso&#10;Siti Rahma&#10;Andi Wijaya&#10;Dewi Lestari"
              className="w-full flex-1 p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              spellCheck={false}
            />
            <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Satu nama per baris (tekan Enter untuk baris baru)</span>
              <span>{items.length} entri</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                <ListPlus className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">Belum ada nama yang dimasukkan.</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Pindah ke tab Teks untuk mengetik atau klik tombol Preset di atas.
                </p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="flex items-center justify-between px-3 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-xs text-slate-200 transition-colors group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-mono text-slate-400 w-5">
                      {idx + 1}.
                    </span>
                    <span className="font-medium truncate">{item}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    disabled={disabled}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-all"
                    title={`Hapus ${item}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
