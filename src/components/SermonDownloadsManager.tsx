import React from 'react';
import {
  Download,
  Pause,
  Play,
  X,
  CheckCircle2,
  Trash2,
  HardDrive,
} from 'lucide-react';
import { SermonDownloadTask, SermonItem } from '../lib/domainLogic';

export interface SermonDownloadsManagerProps {
  tasks: SermonDownloadTask[];
  onPause: (sermonId: string) => void;
  onResume: (sermonId: string) => void;
  onCancel: (sermonId: string) => void;
  onWatchOffline: (sermon: SermonItem) => void;
  onStartSampleDownload?: () => void;
}

export const SermonDownloadsManager: React.FC<SermonDownloadsManagerProps> = ({
  tasks,
  onPause,
  onResume,
  onCancel,
  onWatchOffline,
  onStartSampleDownload,
}) => {
  const activeCount = tasks.filter((t) => t.status === 'downloading').length;
  const pausedCount = tasks.filter((t) => t.status === 'paused').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalDownloadedMb = tasks
    .reduce((acc, t) => acc + (t.downloadedMb || 0), 0)
    .toFixed(1);

  return (
    <div
      data-testid="sermon-downloads-manager"
      className="rounded-2xl bg-[#131d31] border border-[#0095f6]/40 p-3.5 space-y-3 shadow-lg"
    >
      {/* Manager Header & Storage Summary */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0095f6]/20 border border-[#0095f6]/40 flex items-center justify-center text-[#38bdf8]">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
              <span>⬇️ Global Sermon Downloads Manager</span>
            </h2>
            <p className="text-[10px] text-slate-400">
              Pause, resume, or cancel active transfers & watch saved sermons offline
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-[#0b0f19] border border-slate-800 text-[10px] font-bold text-[#38bdf8] font-mono-tabular shrink-0">
          {totalDownloadedMb} MB saved
        </span>
      </div>

      {/* Status Counters Row */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="p-2 rounded-xl bg-[#0b0f19] border border-slate-800">
          <p className="text-xs font-extrabold text-[#38bdf8] font-mono-tabular">
            {activeCount}
          </p>
          <p className="text-[10px] text-slate-400">Active</p>
        </div>
        <div className="p-2 rounded-xl bg-[#0b0f19] border border-slate-800">
          <p className="text-xs font-extrabold text-amber-400 font-mono-tabular">
            {pausedCount}
          </p>
          <p className="text-[10px] text-slate-400">Paused</p>
        </div>
        <div className="p-2 rounded-xl bg-[#0b0f19] border border-slate-800">
          <p className="text-xs font-extrabold text-emerald-400 font-mono-tabular">
            {completedCount}
          </p>
          <p className="text-[10px] text-slate-400">Completed</p>
        </div>
      </div>

      {/* Download Tasks List */}
      {tasks.length === 0 ? (
        <div className="p-4 rounded-xl bg-[#0b0f19] border border-slate-800 text-center space-y-2">
          <p className="text-xs font-bold text-white">No active or saved downloads</p>
          <p className="text-[10px] text-slate-400">
            Tap &ldquo;Download Offline&rdquo; on any sermon to queue it here with pause/resume controls.
          </p>
          {onStartSampleDownload && (
            <button
              type="button"
              onClick={onStartSampleDownload}
              className="px-3 py-1.5 rounded-full bg-[#0095f6] text-white text-[11px] font-bold"
            >
              ⬇️ Download Featured Sermon
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isDownloading = task.status === 'downloading';
            const isPaused = task.status === 'paused';
            const isCompleted = task.status === 'completed';

            return (
              <div
                key={task.sermonId}
                data-testid={`download-task-${task.sermonId}`}
                className="p-3 rounded-xl bg-[#0b0f19] border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={task.sermon.thumbnailUrl}
                      alt={task.sermon.title}
                      className="w-12 h-9 rounded-lg object-cover shrink-0 border border-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-white truncate">
                        {task.sermon.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono-tabular whitespace-nowrap overflow-hidden">
                        <span>
                          {task.downloadedMb} / {task.totalMb} MB
                        </span>
                        <span>•</span>
                        <span
                          className={
                            isCompleted
                              ? 'text-emerald-400 font-bold'
                              : isPaused
                              ? 'text-amber-400 font-bold'
                              : 'text-[#38bdf8] font-bold'
                          }
                        >
                          {isCompleted
                            ? '✓ Completed'
                            : isPaused
                            ? `⏸ Paused (${task.progress}%)`
                            : `⬇ ${task.progress}% (${task.speedMbps})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Controls: Pause / Resume / Cancel / Watch */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isDownloading && (
                      <button
                        type="button"
                        onClick={() => onPause(task.sermonId)}
                        aria-label={`Pause download ${task.sermon.title}`}
                        title="Pause Download"
                        className="h-7 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </button>
                    )}

                    {isPaused && (
                      <button
                        type="button"
                        onClick={() => onResume(task.sermonId)}
                        aria-label={`Resume download ${task.sermon.title}`}
                        title="Resume Download"
                        className="h-7 px-2.5 rounded-lg bg-[#0095f6] hover:bg-[#1d9bf0] text-white text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Play className="w-3 h-3" />
                        <span>Resume</span>
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => onWatchOffline(task.sermon)}
                        aria-label={`Watch offline ${task.sermon.title}`}
                        className="h-7 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Watch</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onCancel(task.sermonId)}
                      aria-label={
                        isCompleted
                          ? `Remove offline sermon ${task.sermon.title}`
                          : `Cancel download ${task.sermon.title}`
                      }
                      title={isCompleted ? 'Remove Offline Copy' : 'Cancel Download'}
                      className="h-7 w-7 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-[10px] font-bold flex items-center justify-center transition"
                    >
                      {isCompleted ? (
                        <Trash2 className="w-3.5 h-3.5" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    data-testid={`download-progress-${task.sermonId}`}
                    style={{ width: `${task.progress}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : isPaused
                        ? 'bg-amber-400'
                        : 'bg-gradient-to-r from-[#0095f6] to-[#38bdf8]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
