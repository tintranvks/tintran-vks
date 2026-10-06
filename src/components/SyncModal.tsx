import React, { useState } from 'react';
import { CalendarEvent, SyncDevice } from '../types/calendar';
import { syncEngine, SyncState } from '../services/sync';
import { 
  X, 
  RefreshCw, 
  Smartphone, 
  Laptop, 
  Download, 
  Upload, 
  CheckCircle, 
  Calendar, 
  QrCode, 
  Copy, 
  ArrowRight,
  HardDrive,
  Wifi,
  WifiOff,
  Cloud,
  Check,
  Radio,
  Lock
} from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onImportEvents: (newEvents: CalendarEvent[]) => void;
  isOnline: boolean;
  syncState: SyncState;
  onManualSyncNow: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  events,
  onImportEvents,
  isOnline,
  syncState,
  onManualSyncNow,
}) => {
  const [vaultIdInput, setVaultIdInput] = useState(() => syncEngine.getVaultId());
  const [peerCode, setPeerCode] = useState(() => syncEngine.generatePeerCode());
  const [inputCode, setInputCode] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const currentDevice: SyncDevice = syncEngine.getCurrentDevice();

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(peerCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateVaultId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultIdInput.trim()) return;
    syncEngine.setVaultId(vaultIdInput.trim());
    setStatusMsg(`Đã kết nối kho lưu trữ [${vaultIdInput.trim()}]. Đang tự động kéo dữ liệu...`);
  };

  const handleExportJson = () => {
    const jsonStr = syncEngine.exportDataPackage(events);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Đã xuất tệp sao lưu JSON thành công.');
  };

  const handleExportIcs = () => {
    const icsStr = syncEngine.exportToIcs(events);
    const blob = new Blob([icsStr], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos_calendar_${new Date().toISOString().split('T')[0]}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Đã xuất tệp iCalendar (.ics) cho Google / Apple / Outlook thành công.');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const merged = syncEngine.importDataPackage(text, events);
        onImportEvents(merged);
        setStatusMsg(`Đã hợp nhất thành công ${merged.length} sự kiện từ tệp!`);
      } catch (err) {
        setStatusMsg('Lỗi: ' + (err instanceof Error ? err.message : 'Tệp không hợp lệ'));
      }
    };
    reader.readAsText(file);
  };

  const handleConnectPeer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    // Direct peer sync switch
    syncEngine.setVaultId(`peer_${inputCode.trim()}`);
    setStatusMsg(`Đã kết nối kênh trực tiếp với mã thiết bị [${inputCode.trim()}].`);
    setInputCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Lưu Trữ & Tự Động Đồng Bộ Đa Thiết Bị
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lưu trữ đám mây liên tục · Server-Sent Events · IndexedDB Ngoại tuyến
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Alert if any */}
          {statusMsg && (
            <div className="p-3 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Automatic Cloud Sync Channel Card */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <Cloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold">Kênh Lưu Trữ Tự Động Đồng Bộ</h4>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    syncState === 'synced' ? 'bg-emerald-400' : syncState === 'syncing' ? 'bg-amber-400' : 'bg-slate-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    syncState === 'synced' ? 'bg-emerald-500' : syncState === 'syncing' ? 'bg-amber-500' : 'bg-slate-500'
                  }`} />
                </span>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  {syncState === 'synced' ? 'Đã đồng bộ thời gian thực' : syncState === 'syncing' ? 'Đang đồng bộ...' : 'Ngoại tuyến'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Nhập cùng một <strong>Tên Kênh (Vault ID)</strong> trên Laptop, PC và Điện thoại để mọi chỉnh sửa tự động cập nhật ngay lập tức giữa các thiết bị qua luồng Server-Sent Events.
            </p>

            <form onSubmit={handleUpdateVaultId} className="flex items-center gap-2">
              <input
                type="text"
                value={vaultIdInput}
                onChange={(e) => setVaultIdInput(e.target.value)}
                placeholder="Tên kênh lưu trữ (vd: tintran_vault)..."
                className="flex-1 px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                Kết nối kênh
              </button>
            </form>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                Cập nhật tức thời &lt; 50ms khi có thay đổi
              </span>
              <button
                type="button"
                onClick={onManualSyncNow}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Đồng bộ lại ngay
              </button>
            </div>
          </div>

          {/* Current Device Card */}
          <div className="p-3.5 rounded-xl border bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                {currentDevice.deviceName.includes('Điện thoại') ? (
                  <Smartphone className="w-5 h-5" />
                ) : (
                  <Laptop className="w-5 h-5" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentDevice.deviceName}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Thiết bị: {currentDevice.deviceId.substring(0, 10)}...</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Cục bộ IndexedDB
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              {isOnline ? (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <Wifi className="w-3.5 h-3.5" /> Trực tuyến
                </span>
              ) : (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                  <WifiOff className="w-3.5 h-3.5" /> Ngoại tuyến (Lưu máy)
                </span>
              )}
            </div>
          </div>

          {/* Peer-to-Peer 6-Digit Code Pairing */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-500" />
                Ghép đôi trực tiếp giữa Laptop và Điện thoại
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Mở Chronos trên điện thoại hoặc máy tính thứ hai và nhập mã kết nối này
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Mã kết nối an toàn:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                  {peerCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Sao chép mã"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-600 text-right">Đã sao chép mã kết nối!</p>
            )}

            {/* Input to pair with another device */}
            <form onSubmit={handleConnectPeer} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Nhập mã từ máy kia (vd: 839-204)..."
                className="flex-1 px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <span>Ghép đôi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Backup & Cross-Platform Calendar Export */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-slate-500" />
              Tùy chọn Xuất & Nhập Tệp Dự Phòng
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleExportJson}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-indigo-500" />
                    Sao lưu JSON đầy đủ
                  </div>
                  <div className="text-[11px] text-slate-500">Bảo toàn tất cả công việc & ưu tiên</div>
                </div>
              </button>

              <button
                onClick={handleExportIcs}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    Đồng bộ iCal (.ics)
                  </div>
                  <div className="text-[11px] text-slate-500">Mở trên Google / Apple Calendar</div>
                </div>
              </button>
            </div>

            <div className="pt-2">
              <label className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>Nhấn để chọn tệp sao lưu JSON phục hồi vào thiết bị này</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
