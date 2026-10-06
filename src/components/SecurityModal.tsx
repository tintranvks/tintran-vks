import React, { useState } from 'react';
import { SecurityStatus } from '../types/calendar';
import { securityEngine } from '../services/security';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Key, 
  Download, 
  CheckCircle, 
  AlertCircle,
  FileCode2,
  HardDrive
} from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityStatus: SecurityStatus;
  onRefreshStatus: () => void;
  onExportEncryptedVault: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  securityStatus,
  onRefreshStatus,
  onExportEncryptedVault,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSettingNew, setIsSettingNew] = useState(!securityStatus.isEncryptionConfigured);

  if (!isOpen) return null;

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (passphrase.length < 6) {
      setErrorMsg('Mật khẩu bảo mật phải có độ dài tối thiểu 6 ký tự.');
      return;
    }

    if (passphrase !== confirmPassphrase) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      await securityEngine.setupPassphrase(passphrase);
      setSuccessMsg('Đã thiết lập mã hóa AES-256-GCM thành công! Dữ liệu của bạn được bảo vệ tuyệt đối.');
      setPassphrase('');
      setConfirmPassphrase('');
      setIsSettingNew(false);
      onRefreshStatus();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Thiết lập mật khẩu thất bại.');
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const ok = await securityEngine.unlockVault(passphrase);
      if (ok) {
        setSuccessMsg('Mở khóa kho bảo mật thành công!');
        setPassphrase('');
        onRefreshStatus();
      } else {
        setErrorMsg('Mật khẩu không chính xác. Vui lòng thử lại.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Mở khóa thất bại.');
    }
  };

  const handleLock = () => {
    securityEngine.lockVault();
    onRefreshStatus();
    setSuccessMsg('Đã khóa an toàn kho dữ liệu.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bảo Mật Tuyệt Đối & Mã Hóa Đầu-Cuối
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tiêu chuẩn quân sự AES-256-GCM · Không lưu mật khẩu trên máy chủ
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Security Status Box */}
          <div className="p-4 rounded-xl border bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Trạng thái kho mã hóa:
              </span>
              {securityStatus.isEncryptionConfigured ? (
                securityStatus.isUnlocked ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5" /> Đã mở khóa (Sẵn sàng)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Đang khóa an toàn
                  </span>
                )
              ) : (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Chưa thiết lập mật khẩu
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2 font-mono">
              <div>Thuật toán: <span className="font-semibold text-slate-700 dark:text-slate-200">AES-256-GCM</span></div>
              <div>Key Derivation: <span className="font-semibold text-slate-700 dark:text-slate-200">PBKDF2 100k rounds</span></div>
              <div>Bảo vệ ngoại tuyến: <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Cục bộ</span></div>
              <div>Môi trường: <span className="font-semibold text-slate-700 dark:text-slate-200">Web Cryptography API</span></div>
            </div>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Unlock or Setup */}
          {securityStatus.isEncryptionConfigured && !securityStatus.isUnlocked && !isSettingNew ? (
            <form onSubmit={handleUnlock} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nhập mật khẩu chính để mở khóa dữ liệu
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Mật khẩu bảo mật cá nhân của bạn..."
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Mở khóa kho
                </button>

                <button
                  type="button"
                  onClick={() => setIsSettingNew(true)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                >
                  Đặt lại mật khẩu mới
                </button>
              </div>
            </form>
          ) : isSettingNew || !securityStatus.isEncryptionConfigured ? (
            <form onSubmit={handleSetup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu bảo mật cá nhân (Tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  required
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Nhập mật khẩu an toàn..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Xác nhận lại mật khẩu
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Nhập lại mật khẩu vừa gõ..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  Kích hoạt mã hóa bảo mật
                </button>
                {securityStatus.isEncryptionConfigured && (
                  <button
                    type="button"
                    onClick={() => setIsSettingNew(false)}
                    className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dữ liệu của bạn hiện đang được bảo vệ an toàn trên thiết bị này.</span>
                </div>
                <button
                  onClick={handleLock}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" /> Khóa kho ngay
                </button>
              </div>
            </div>
          )}

          {/* GitHub & Open Source Safety Disclosure */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-indigo-500" />
              An toàn tuyệt đối khi công khai mã nguồn lên GitHub
            </h4>
            <p className="leading-relaxed">
              Toàn bộ cơ chế mã hóa hoạt động 100% bằng chuẩn Web Cryptography tích hợp sẵn trong trình duyệt. Không có khóa bí mật (API Keys hay Credentials) nào bị nhúng cố định trong mã nguồn. Bạn hoàn toàn có thể đẩy dự án lên GitHub công khai mà không sợ rò rỉ bất kỳ thông tin riêng tư nào.
            </p>
          </div>

          {/* Export Encrypted Vault Backup */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" /> Sao lưu dự phòng
            </span>
            <button
              onClick={onExportEncryptedVault}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Tải tệp sao lưu JSON an toàn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
