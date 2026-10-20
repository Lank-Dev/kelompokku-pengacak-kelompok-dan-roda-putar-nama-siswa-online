import React, { useState, useMemo } from 'react'
import {
  Shuffle,
  ArrowDownAZ,
  Trash2,
  FileDown,
  Sparkles,
  Copy,
  Check,
  Trophy,
  Users,
  Search,
  FilterX,
} from 'lucide-react'
import type { WinnerRecord } from '../types'
import { PRESET_LISTS } from '../utils/presets'

interface SidebarTabsProps {
  items: string[]
  history: WinnerRecord[]
  disabled?: boolean
  darkMode: boolean
  onChangeItems: (items: string[]) => void
  onShuffle: () => void
  onSort: () => void
  onClearItems: () => void
  onClearHistory: () => void
  onRemoveHistoryItem: (id: string) => void
}

export const SidebarTabs: React.FC<SidebarTabsProps> = ({
  items,
  history,
  disabled = false,
  darkMode,
  onChangeItems,
  onShuffle,
  onSort,
  onClearItems,
  onClearHistory,
  onRemoveHistoryItem,
}) => {
  const [activeTab, setActiveTab] = useState<'entries' | 'results'>('entries')
  const [showPresets, setShowPresets] = useState(false)
  const [copiedEntries, setCopiedEntries] = useState(false)
  const [copiedResults, setCopiedResults] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const textValue = items.join('\n')

  const uniqueCount = useMemo(() => new Set(items).size, [items])
  const duplicateCount = items.length - uniqueCount

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split('\n')
    const filtered = lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    onChangeItems(filtered)
  }

  const handleSelectPreset = (presetItems: string[]) => {
    onChangeItems(presetItems)
    setShowPresets(false)
  }

  const handleCopyEntries = () => {
    navigator.clipboard.writeText(items.join('\n'))
    setCopiedEntries(true)
    setTimeout(() => setCopiedEntries(false), 2000)
  }

  const handleExportEntries = () => {
    const blob = new Blob([items.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kocok-nama-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyResults = () => {
    if (history.length === 0) return
    const text = history
      .map((rec) => `Putaran #${rec.round}: ${rec.name} (${rec.timestamp})`)
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopiedResults(true)
    setTimeout(() => setCopiedResults(false), 2000)
  }

  // Remove duplicate entries
  const handleRemoveDuplicates = () => {
    const seen = new Set<string>()
    const deduplicated: string[] = []
    items.forEach((item) => {
      if (!seen.has(item)) {
        seen.add(item)
        deduplicated.push(item)
      }
    })
    onChangeItems(deduplicated)
  }

  // Filtered results for search
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history
    const q = searchQuery.toLowerCase()
    return history.filter((rec) => rec.name.toLowerCase().includes(q))
  }, [history, searchQuery])

  return (
    <div
      className={`flex flex-col h-full rounded-2xl shadow-md border overflow-hidden transition-colors ${
        darkMode
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Tab Navigation (Wheel of Names Style) */}
      <div
        className={`flex items-center border-b px-2 pt-2 gap-2 ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <button
          onClick={() => setActiveTab('entries')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'entries'
              ? 'border-blue-600 text-blue-600'
              : darkMode
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Entri</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] font-mono ${
              activeTab === 'entries'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            {items.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'results'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : darkMode
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Hasil</span>
          {history.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[11px] font-mono bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* Content for Entries Tab */}
      {activeTab === 'entries' && (
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-1.5 pb-2.5 border-b mb-2.5 border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={onShuffle}
              disabled={disabled || items.length < 2}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              title="Acak urutan nama"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-500" />
              <span>Acak</span>
            </button>

            <button
              onClick={onSort}
              disabled={disabled || items.length < 2}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              title="Urutkan alfabetis A-Z"
            >
              <ArrowDownAZ className="w-3.5 h-3.5 text-emerald-500" />
              <span>Urutkan</span>
            </button>

            {/* Presets Button */}
            <div className="relative">
              <button
                onClick={() => setShowPresets(!showPresets)}
                disabled={disabled}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                title="Pilih contoh preset (15, 50, 100, 250 orang)"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Preset</span>
              </button>

              {showPresets && (
                <div
                  className={`absolute left-0 mt-2 w-72 max-h-80 overflow-y-auto p-2 rounded-xl shadow-2xl z-40 border animate-in fade-in zoom-in-95 ${
                    darkMode
                      ? 'bg-slate-900 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                    Pilihan Preset Skala Besar:
                  </div>
                  <div className="space-y-1">
                    {PRESET_LISTS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.items)}
                        className={`w-full text-left p-2 rounded-lg transition-colors group ${
                          darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-semibold text-xs group-hover:text-blue-600 flex items-center justify-between">
                          <span>{preset.title}</span>
                          <span className="text-[10px] opacity-70 font-mono">
                            {preset.items.length} nama
                          </span>
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

            {/* Deduplicate Button (Aman untuk ratusan nama) */}
            {duplicateCount > 0 && (
              <button
                onClick={handleRemoveDuplicates}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-semibold transition-colors bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                title={`Hapus ${duplicateCount} nama duplikat`}
              >
                <FilterX className="w-3.5 h-3.5 text-amber-600" />
                <span>Hapus {duplicateCount} Duplikat</span>
              </button>
            )}

            <button
              onClick={handleCopyEntries}
              disabled={items.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              title="Salin semua nama"
            >
              {copiedEntries ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Salin</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportEntries}
              disabled={items.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 ml-auto"
              title="Unduh file (.txt)"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-500" />
              <span>Ekspor</span>
            </button>

            <button
              onClick={onClearItems}
              disabled={disabled || items.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300"
              title="Kosongkan semua daftar"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Kosongkan</span>
            </button>
          </div>

          {/* Textarea for entries */}
          <div className="flex-1 flex flex-col h-full">
            <textarea
              value={textValue}
              onChange={handleTextChange}
              disabled={disabled}
              placeholder="Ketik atau tempel nama di sini...&#10;Satu nama per baris:&#10;Budi&#10;Siti&#10;Andi&#10;Dewi"
              className={`w-full flex-1 p-3 rounded-xl font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border transition-colors ${
                darkMode
                  ? 'bg-slate-950/70 border-slate-800 text-slate-100 placeholder:text-slate-600'
                  : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
              spellCheck={false}
            />
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>1 baris = 1 irisan di roda</span>
              <span className="font-semibold">
                {items.length} entri ({uniqueCount} unik)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content for Results Tab */}
      {activeTab === 'results' && (
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          {/* Action Toolbar for Results */}
          <div className="flex items-center justify-between pb-2.5 border-b mb-2 border-slate-200 dark:border-slate-800 text-xs">
            <div className="font-semibold text-slate-600 dark:text-slate-300">
              Total {history.length} Pemenang
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyResults}
                disabled={history.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                title="Salin hasil ke clipboard"
              >
                {copiedResults ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-500" />
                    <span>Salin</span>
                  </>
                )}
              </button>

              <button
                onClick={onClearHistory}
                disabled={history.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300"
                title="Hapus semua riwayat hasil"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Hapus Semua</span>
              </button>
            </div>
          </div>

          {/* Search Bar for Results (Aman untuk ratusan riwayat) */}
          {history.length > 5 && (
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pemenang..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  darkMode
                    ? 'bg-slate-950 border-slate-800 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
          )}

          {/* Results List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 dark:text-slate-500">
                <Trophy className="w-10 h-10 mb-2 opacity-30 text-amber-500" />
                <p className="text-xs font-medium">
                  {searchQuery ? 'Tidak ada nama yang cocok.' : 'Belum ada pemenang yang tercatat.'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-600 mt-1">
                  Putar roda untuk melihat hasil pemenang di sini!
                </p>
              </div>
            ) : (
              filteredHistory.map((record) => (
                <div
                  key={record.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors group ${
                    darkMode
                      ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                      : 'bg-slate-50 border-slate-200 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-bold shrink-0">
                      #{record.round}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        {record.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{record.timestamp}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveHistoryItem(record.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-all shrink-0"
                    title="Hapus catatan ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
