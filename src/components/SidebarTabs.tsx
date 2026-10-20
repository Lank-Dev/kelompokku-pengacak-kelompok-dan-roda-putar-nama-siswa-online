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
  activeTab: 'entries' | 'results'
  disabled?: boolean
  darkMode: boolean
  onTabChange: (tab: 'entries' | 'results') => void
  onChangeItems: (items: string[]) => void
  onShuffle: () => void
  onSort: () => void
  onClearItems: () => void
  onClearHistory: () => void
  onRemoveHistoryItem: (id: string) => void
}

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const SidebarTabs: React.FC<SidebarTabsProps> = ({
  items,
  history,
  activeTab,
  disabled = false,
  darkMode,
  onTabChange,
  onChangeItems,
  onShuffle,
  onSort,
  onClearItems,
  onClearHistory,
  onRemoveHistoryItem,
}) => {
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
    downloadTextFile(items.join('\n'), `kocok-nama-${Date.now()}.txt`)
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

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history
    const q = searchQuery.toLowerCase()
    return history.filter((rec) => rec.name.toLowerCase().includes(q))
  }, [history, searchQuery])

  return (
    <div
      className={`flex flex-col h-full rounded-2xl shadow-sm border overflow-hidden transition-colors ${
        darkMode
          ? 'bg-slate-900 border-slate-700 text-slate-100'
          : 'bg-white border-slate-300 text-slate-900'
      }`}
    >
      {/* Tab Navigation (Wheel of Names High Contrast) */}
      <div
        className={`flex items-center border-b px-2 pt-2 gap-2 ${
          darkMode ? 'border-slate-700 bg-slate-950/80' : 'border-slate-300 bg-slate-100/90'
        }`}
      >
        <button
          onClick={() => onTabChange('entries')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'entries'
              ? 'border-blue-600 text-blue-700 dark:text-blue-400 font-black'
              : darkMode
              ? 'border-transparent text-slate-400 hover:text-slate-100'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Entri</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
              activeTab === 'entries'
                ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-slate-950'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {items.length}
          </span>
        </button>

        <button
          onClick={() => onTabChange('results')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'results'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400 font-black'
              : darkMode
              ? 'border-transparent text-slate-400 hover:text-slate-100'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Hasil</span>
          {history.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-amber-500 text-slate-950">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* Content for Entries Tab */}
      {activeTab === 'entries' && (
        <div className="flex-1 flex flex-col p-3.5 overflow-hidden">
          {/* Action Toolbar with High Contrast */}
          <div className="flex items-center flex-wrap gap-1.5 pb-3 border-b mb-3 border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={onShuffle}
              disabled={disabled || items.length < 2}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 shadow-xs cursor-pointer"
              title="Acak urutan nama"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Acak</span>
            </button>

            <button
              onClick={onSort}
              disabled={disabled || items.length < 2}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 shadow-xs cursor-pointer"
              title="Urutkan alfabetis A-Z"
            >
              <ArrowDownAZ className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Urutkan</span>
            </button>

            {/* Presets Button */}
            <div className="relative">
              <button
                onClick={() => setShowPresets(!showPresets)}
                disabled={disabled}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 shadow-xs cursor-pointer"
                title="Pilih contoh preset (15, 50, 100, 250 orang)"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Preset</span>
              </button>

              {showPresets && (
                <div
                  className={`absolute left-0 mt-2 w-72 max-h-80 overflow-y-auto p-2 rounded-xl shadow-2xl z-40 border-2 animate-in fade-in zoom-in-95 ${
                    darkMode
                      ? 'bg-slate-900 border-slate-700 text-slate-100'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                    Pilihan Preset:
                  </div>
                  <div className="space-y-1">
                    {PRESET_LISTS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.items)}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors cursor-pointer group ${
                          darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-bold text-xs group-hover:text-blue-600 flex items-center justify-between">
                          <span>{preset.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                            {preset.items.length}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Deduplicate Button */}
            {duplicateCount > 0 && (
              <button
                onClick={handleRemoveDuplicates}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-colors bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 shadow-xs cursor-pointer"
                title={`Hapus ${duplicateCount} nama duplikat`}
              >
                <FilterX className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
                <span>Hapus {duplicateCount} Duplikat</span>
              </button>
            )}

            <button
              onClick={handleCopyEntries}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 shadow-xs cursor-pointer"
              title="Salin semua nama"
            >
              {copiedEntries ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Salin</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportEntries}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 shadow-xs ml-auto cursor-pointer"
              title="Unduh file (.txt)"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Ekspor</span>
            </button>

            <button
              onClick={onClearItems}
              disabled={disabled || items.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-200 shadow-xs cursor-pointer"
              title="Kosongkan semua daftar"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
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
              className={`w-full flex-1 p-3.5 rounded-xl font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 border transition-colors ${
                darkMode
                  ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-950 placeholder:text-slate-400'
              }`}
              spellCheck={false}
            />
            <div className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
              <span>1 baris = 1 irisan di roda</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                {items.length} entri ({uniqueCount} unik)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content for Results Tab (Ultra High-Contrast in White Mode) */}
      {activeTab === 'results' && (
        <div className="flex-1 flex flex-col p-3.5 overflow-hidden">
          {/* Action Toolbar for Results */}
          <div className="flex items-center justify-between pb-3 border-b mb-3 border-slate-200 dark:border-slate-800 text-xs">
            <div className="font-black text-sm text-slate-950 dark:text-slate-100">
              Total {history.length} Pemenang
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyResults}
                disabled={history.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 shadow-xs cursor-pointer"
                title="Salin hasil ke clipboard"
              >
                {copiedResults ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Salin</span>
                  </>
                )}
              </button>

              <button
                onClick={onClearHistory}
                disabled={history.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-colors disabled:opacity-40 disabled:pointer-events-none bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-200 shadow-xs cursor-pointer"
                title="Hapus semua riwayat hasil"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Hapus Semua</span>
              </button>
            </div>
          </div>

          {/* Search Bar for Results */}
          {history.length > 3 && (
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pemenang..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  darkMode
                    ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500'
                }`}
              />
            </div>
          )}

          {/* Results List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 dark:text-slate-400">
                <Trophy className="w-14 h-14 mb-2 text-amber-500 opacity-60" />
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {searchQuery ? 'Tidak ada nama yang cocok.' : 'Belum ada pemenang yang tercatat.'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Putar roda untuk melihat hasil pemenang di sini!
                </p>
              </div>
            ) : (
              filteredHistory.map((record, idx) => {
                const isLatest = idx === 0 && !searchQuery
                return (
                  <div
                    key={record.id}
                    className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 text-xs transition-all group ${
                      isLatest
                        ? 'border-amber-400 bg-amber-50/80 dark:bg-amber-950/40 shadow-sm'
                        : darkMode
                        ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-300 hover:bg-blue-50/70'
                    }`}
                  >
                    {isLatest && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.2 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider shadow-2xs">
                        Pemenang Terbaru
                      </span>
                    )}

                    <div className="flex items-center gap-3 truncate">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-mono text-xs font-black shrink-0 shadow-xs">
                        #{record.round}
                      </span>
                      <div className="truncate">
                        <div className="font-black text-sm sm:text-base text-slate-950 dark:text-white truncate">
                          {record.name}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                          {record.timestamp}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveHistoryItem(record.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-all shrink-0 cursor-pointer"
                      title="Hapus catatan ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
