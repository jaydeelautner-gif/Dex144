import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  Upload,
  FileSpreadsheet,
  FileJson,
  Image as ImageIcon,
  Globe,
  Lock,
  ExternalLink,
  Share2,
} from 'lucide-react';
import type {
  PokemonEntry,
  DlcId,
  GameId,
  GameCatchesMap,
} from '../data/pokemonData';
import {
  GENERATIONS,
  GAMES,
  getGameRunningTotalStats,
} from '../data/pokemonData';
import {
  GameLogoBadge,
  PokemonHomeLogoBadge,
  GAME_VISUAL_META,
} from './GameLogoBadge';

interface ExportStatsViewProps {
  dex: PokemonEntry[];
  caughtSet: Set<number>;
  shinySet: Set<number>;
  livingSet: Set<number>;
  ownedGames: GameId[];
  ownedDlcs: DlcId[];
  gameCatches: GameCatchesMap;
  trainerName: string;
  isCloudSynced: boolean;
  isPublic: boolean;
  onTogglePublic: (nextPublic: boolean) => void;
  publicShareUrl: string | null;
  onOpenPublicPreview: () => void;
  onImportProgress: (
    data: {
      caughtIds: number[];
      shinyIds: number[];
      livingIds: number[];
      ownedDlcs?: DlcId[];
      trainerName?: string;
    },
    mode: 'merge' | 'replace'
  ) => void;
}

export const ExportStatsView: React.FC<ExportStatsViewProps> = ({
  dex,
  caughtSet,
  shinySet,
  livingSet,
  ownedGames,
  ownedDlcs,
  gameCatches,
  trainerName,
  isCloudSynced,
  isPublic,
  onTogglePublic,
  publicShareUrl,
  onOpenPublicPreview,
  onImportProgress,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const displayTrainerName =
    trainerName && trainerName.trim() ? trainerName.trim() : 'Guest';

  const totalCount = dex.length;
  const caughtCount = caughtSet.size;
  const shinyCount = shinySet.size;
  const storedInHomeCount = livingSet.size;
  const caughtPct = totalCount > 0 ? ((caughtCount / totalCount) * 100).toFixed(1) : '0.0';
  const storedInHomePct =
    totalCount > 0 ? ((storedInHomeCount / totalCount) * 100).toFixed(1) : '0.0';

  const ownedGamesStats = useMemo(() => {
    return GAMES.filter((g) => ownedGames.includes(g.id)).map((game) => {
      const stats = getGameRunningTotalStats(
        dex,
        game.id,
        [],
        gameCatches[game.id] || []
      );
      const pct =
        stats.baseTotal > 0
          ? Math.round((stats.caughtCount / stats.baseTotal) * 100)
          : 0;
      return {
        game,
        meta: GAME_VISUAL_META[game.id],
        caught: stats.caughtCount,
        total: stats.baseTotal,
        pct,
      };
    });
  }, [dex, ownedGames, gameCatches]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gamesToDraw = ownedGamesStats.slice(0, 8);
    const rowsOfGames = Math.max(1, Math.ceil(gamesToDraw.length / 2));
    const w = 960;
    const h = 340 + rowsOfGames * 74;

    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = '#0B0F17';
    ctx.fillRect(0, 0, w, h);

    // Subtle border frame
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    // Header
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 14px "JetBrains Mono", monospace';
    ctx.fillText('HOMEDEX — LIVING POKÉDEX & POKÉMON HOME CARD', 48, 60);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 32px "Bricolage Grotesque", sans-serif';
    ctx.fillText(displayTrainerName, 48, 102);

    // Top-right Pokémon HOME Crest Badge
    const homeBadgeX = w - 260;
    const homeBadgeY = 44;
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(homeBadgeX, homeBadgeY, 212, 42);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(homeBadgeX, homeBadgeY, 212, 42);

    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.arc(homeBadgeX + 24, homeBadgeY + 21, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#A7F3D0';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText('POKÉMON HOME', homeBadgeX + 44, homeBadgeY + 20);

    ctx.fillStyle = '#6EE7B7';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText(`${storedInHomeCount} / ${totalCount} STORED`, homeBadgeX + 44, homeBadgeY + 34);

    // Top 3 KPI Blocks
    const kpis = [
      {
        label: 'STORED IN POKÉMON HOME',
        value: `${storedInHomeCount} / ${totalCount}`,
        sub: `${storedInHomePct}% Stored in HOME`,
        color: '#34D399',
      },
      {
        label: 'NATIONAL DEX CAUGHT',
        value: `${caughtCount} / ${totalCount}`,
        sub: `${caughtPct}% Complete`,
        color: '#38BDF8',
      },
      {
        label: 'SHINY DEX REGISTERED',
        value: `${shinyCount} / ${totalCount}`,
        sub: `${((shinyCount / Math.max(1, totalCount)) * 100).toFixed(1)}% Shiny`,
        color: '#FBBF24',
      },
    ];

    kpis.forEach((kpi, idx) => {
      const boxX = 48 + idx * 296;
      const boxY = 128;
      const boxW = 272;
      const boxH = 108;

      ctx.fillStyle = '#111827';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 12px "JetBrains Mono", monospace';
      ctx.fillText(kpi.label, boxX + 20, boxY + 30);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '700 28px "JetBrains Mono", monospace';
      ctx.fillText(kpi.value, boxX + 20, boxY + 68);

      ctx.fillStyle = kpi.color;
      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillText(kpi.sub, boxX + 20, boxY + 92);
    });

    // Owned Games Progress Section
    ctx.fillStyle = '#E2E8F0';
    ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `Owned Games Progress (${ownedGamesStats.length} Owned — Base Game Pokédexes)`,
      48,
      274
    );

    if (gamesToDraw.length === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillText('No owned games selected yet.', 48, 310);
    } else {
      gamesToDraw.forEach((item, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 48 + col * 440;
        const y = 292 + row * 72;
        const barW = 424;

        ctx.fillStyle = '#111827';
        ctx.fillRect(x, y, barW, 60);
        ctx.strokeStyle = '#1E293B';
        ctx.strokeRect(x, y, barW, 60);

        ctx.fillStyle = '#1E293B';
        ctx.fillRect(x + 12, y + 10, 54, 22);
        ctx.strokeStyle = '#38BDF8';
        ctx.strokeRect(x + 12, y + 10, 54, 22);
        ctx.fillStyle = '#E0F2FE';
        ctx.font = '700 11px "JetBrains Mono", monospace';
        ctx.fillText(item.meta.shortCode, x + 20, y + 25);

        ctx.fillStyle = '#F1F5F9';
        ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(item.game.shortTitle, x + 76, y + 25);

        ctx.fillStyle = '#34D399';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.fillText(
          `${item.caught}/${item.total} (${item.pct}%)`,
          x + barW - 125,
          y + 25
        );

        ctx.fillStyle = '#1E293B';
        ctx.fillRect(x + 12, y + 40, barW - 24, 8);

        ctx.fillStyle = '#10B981';
        const fillW = Math.max(0, Math.round(((barW - 24) * item.pct) / 100));
        ctx.fillRect(x + 12, y + 40, fillW, 8);
      });
    }
  }, [
    dex,
    caughtCount,
    shinyCount,
    storedInHomeCount,
    caughtPct,
    storedInHomePct,
    displayTrainerName,
    isCloudSynced,
    ownedGamesStats,
    totalCount,
  ]);

  const downloadCsv = (mode: 'all' | 'caught') => {
    const headers = [
      'DexNumber',
      'Name',
      'Generation',
      'Region',
      'Types',
      'Caught',
      'Shiny',
      'StoredInPokemonHome',
      'BoxNumber',
      'BoxSlot',
      'PokeBankClosureRisk',
    ];

    const filtered = dex.filter((p) => {
      if (mode === 'caught') return caughtSet.has(p.id);
      return true;
    });

    const rows = filtered.map((p) => {
      return [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.generation,
        p.region,
        `"${p.types.join('/')}"`,
        caughtSet.has(p.id) ? 'TRUE' : 'FALSE',
        shinySet.has(p.id) ? 'TRUE' : 'FALSE',
        livingSet.has(p.id) ? 'TRUE' : 'FALSE',
        p.boxNumber,
        p.boxSlot,
        `"${p.homeTransfer.pokeBankClosureRisk.badgeLabel.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      mode === 'caught'
        ? 'homedex-caught-only.csv'
        : 'homedex-full-progress.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadJsonBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'HomeDex',
      trainerName: displayTrainerName,
      summary: {
        totalNationalDex: totalCount,
        caughtCount,
        shinyCount,
        storedInHomeCount,
      },
      ownedGames,
      ownedDlcs,
      caughtIds: Array.from(caughtSet).sort((a, b) => a - b),
      shinyIds: Array.from(shinySet).sort((a, b) => a - b),
      livingIds: Array.from(livingSet).sort((a, b) => a - b),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `homedex-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadTrainerCardPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `homedex-card-${displayTrainerName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  const buildTextReport = (): string => {
    const lines = [
      `# HomeDex — Trainer Progress Report (${displayTrainerName})`,
      `- Stored in Pokémon HOME: ${storedInHomeCount} / ${totalCount} (${storedInHomePct}%)`,
      `- National Pokédex Caught: ${caughtCount} / ${totalCount} (${caughtPct}%)`,
      `- Shiny Pokédex Registered: ${shinyCount} / ${totalCount} (${((shinyCount / Math.max(1, totalCount)) * 100).toFixed(1)}%)`,
      '',
      '## Owned Games Progress (Base Game)',
      ...ownedGamesStats.map(
        (g) => `- ${g.game.title}: ${g.caught} / ${g.total} (${g.pct}%)`
      ),
      '',
      '## Generation Breakdown',
      ...GENERATIONS.map((g) => {
        const genTotal = g.range[1] - g.range[0] + 1;
        let genCaught = 0;
        for (let id = g.range[0]; id <= g.range[1]; id++) {
          if (caughtSet.has(id)) genCaught++;
        }
        const pct = Math.round((genCaught / genTotal) * 100);
        return `- ${g.roman} (${g.region}): ${genCaught} / ${genTotal} (${pct}%)`;
      }),
    ];
    return lines.join('\n');
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildTextReport());
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyPublicLink = async () => {
    if (!publicShareUrl) return;
    try {
      await navigator.clipboard.writeText(publicShareUrl);
      setCopiedPublicUrl(true);
      setTimeout(() => setCopiedPublicUrl(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed.caughtIds)) {
          setImportFeedback('Invalid backup file: missing caughtIds array.');
          return;
        }
        onImportProgress(
          {
            caughtIds: parsed.caughtIds,
            shinyIds: Array.isArray(parsed.shinyIds) ? parsed.shinyIds : [],
            livingIds: Array.isArray(parsed.livingIds) ? parsed.livingIds : [],
            ownedDlcs: Array.isArray(parsed.ownedDlcs) ? parsed.ownedDlcs : undefined,
            trainerName: typeof parsed.trainerName === 'string' ? parsed.trainerName : undefined,
          },
          importMode
        );
        setImportFeedback(
          `Successfully imported ${parsed.caughtIds.length} caught entries (${importMode} mode).`
        );
      } catch {
        setImportFeedback('Could not parse JSON file. Ensure it is a valid HomeDex backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Public Stats Page Sharing Banner */}
      <div className="bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xl">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            {isPublic ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono-tabular font-semibold text-emerald-300">
                <Globe className="w-3.5 h-3.5" />
                PUBLIC STATS PAGE ENABLED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono-tabular font-semibold text-slate-300">
                <Lock className="w-3.5 h-3.5" />
                PRIVATE STATS PAGE
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">
            Shareable Public Living Dex & Game Origin Page
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Enable your Public Stats Page to share your Living Dex with every Pokémon's selected regional variant, the game it was caught in (with official game logos), and your owned games progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onTogglePublic(!isPublic)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isPublic
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>
              {isPublic ? 'Public Page Active (Click to Make Private)' : 'Make Public Stats Page Shareable'}
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenPublicPreview}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-xs font-semibold text-sky-200 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Public Stats Page</span>
          </button>
          {isPublic && publicShareUrl && (
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-lg"
            >
              {copiedPublicUrl ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Public URL!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Copy Public Share Link</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Top Export Actions & Shareable Trainer Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Export Formats & Import */}
        <div className="lg:col-span-5 bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              Export & Backup Progress Stats
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Export your complete Living Dex spreadsheet, download a JSON backup, or copy a formatted summary of your Pokémon HOME and owned games progress.
            </p>

            <div className="flex flex-col gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => downloadCsv('all')}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer shadow-lg"
              >
                <span className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Full Progress CSV
                </span>
                <Download className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => downloadCsv('caught')}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Download Caught-Only CSV ({caughtCount} Pokémon)
                </span>
                <Download className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={downloadJsonBackup}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
                  <FileJson className="w-4 h-4 text-sky-400" />
                  Export Full JSON Backup File
                </span>
                <Download className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleCopyReport}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
                  {copiedReport ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                  {copiedReport
                    ? 'Copied Markdown Summary!'
                    : 'Copy Text / Discord Progress Summary'}
                </span>
              </button>
            </div>
          </div>

          {/* Restore / Import Backup */}
          <div className="pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono-tabular">
                Restore From JSON Backup
              </span>
              <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    importMode === 'merge'
                      ? 'bg-slate-800 text-slate-100 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  Merge
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    importMode === 'replace'
                      ? 'bg-rose-500/20 text-rose-300 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  Replace
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/50 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              Select Backup File ({importMode === 'merge' ? 'Merges with current' : 'Replaces current'})
            </button>
            {importFeedback && (
              <p className="text-xs text-emerald-400 mt-2 font-mono-tabular">
                {importFeedback}
              </p>
            )}
          </div>
        </div>

        {/* Right: Shareable Trainer Card Preview */}
        <div className="lg:col-span-7 bg-[#0F1522] border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">
                  Global Trainer Progress Card
                </h2>
                <PokemonHomeLogoBadge size="xs" label="HOME + Owned Games" />
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Shows your Pokémon HOME storage count and base-game progress across your owned games.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTrainerCardPng}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-lg"
            >
              <ImageIcon className="w-4 h-4" />
              Download Card PNG
            </button>
          </div>

          {/* HTML Card Preview */}
          <div className="bg-[#0B0F17] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
              <div>
                <div className="text-[11px] font-mono-tabular text-slate-400">
                  TRAINER CARD — LIVING DEX & POKÉMON HOME
                </div>
                <div className="text-xl font-bold text-slate-100 mt-0.5">
                  {displayTrainerName}
                </div>
              </div>
              <PokemonHomeLogoBadge
                size="md"
                label={`${storedInHomeCount} / ${totalCount} Stored in Pokémon HOME`}
              />
            </div>

            {/* Owned Games Progress Grid */}
            <div>
              <div className="text-xs font-mono-tabular text-slate-400 mb-2.5">
                OWNED GAMES PROGRESS (BASE GAME POKÉDEX)
              </div>
              {ownedGamesStats.length === 0 ? (
                <div className="text-xs text-slate-500 py-2">
                  No owned games selected. Mark games as owned in Settings to display their progress here.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ownedGamesStats.map((item) => (
                    <div
                      key={item.game.id}
                      className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-2.5 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <GameLogoBadge gameId={item.game.id} size="xs" />
                          <span className="text-xs font-semibold text-slate-100 truncate">
                            {item.game.shortTitle}
                          </span>
                        </div>
                        <span className="text-xs font-mono-tabular text-emerald-400 font-semibold shrink-0">
                          {item.caught}/{item.total} ({item.pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${Math.min(100, item.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Canvas for PNG Export */}
          <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#0B0F17]">
            <canvas
              ref={canvasRef}
              className="w-full h-auto block"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
