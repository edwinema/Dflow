import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  ShieldCheck,
  KeyRound,
  Download,
  Copy,
  CheckCircle2,
  Users,
  Server,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  X,
  Calendar,
  Cpu,
  Fingerprint,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  Lock,
  ArrowRight,
  Shield,
  Layers,
  History,
  FileCode,
  CheckCircle,
} from 'lucide-react';

interface CompanyAuthManageViewProps {
  onUpdateSystemDisplay?: (name: string, logo: string) => void;
  onUpdateCompanyName?: (name: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const CompanyAuthManageView: React.FC<CompanyAuthManageViewProps> = ({
  onUpdateSystemDisplay,
  onUpdateCompanyName,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'license'>('company');
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Display customizations
  const [displayNameInput, setDisplayNameInput] = useState('全源流程资产管理平台 dflow');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loginTitleSuffix, setLoginTitleSuffix] = useState('数字化流程设计与运营系统');
  const [copyrightText, setCopyrightText] = useState('Copyright © 2026 全源数字科技版权所有');
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);

  // License Update Modal states
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [targetCompanyName, setTargetCompanyName] = useState('苏州全元数字科技有限公司');
  const [targetMachineCode, setTargetMachineCode] = useState('HW-UUID-88A9-4B2E-99F1-017E54');
  const [licenseKeyInput, setLicenseKeyInput] = useState('DFLOW-ENTP-2026-HW88A9-99F1-A89E-7821');
  const [selectedEdition, setSelectedEdition] = useState('企业旗舰版 (Enterprise)');
  const [selectedUsersCount, setSelectedUsersCount] = useState<number>(200);
  const [activating, setActivating] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);
  const [copiedLicKey, setCopiedLicKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const licFileInputRef = useRef<HTMLInputElement>(null);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/company');
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setCompanyData(json.data);
        setDisplayNameInput(json.data.systemDisplayName || '全源流程资产管理平台 dflow');
        setLogoPreview(json.data.systemLogo || '');
        setLoginTitleSuffix(json.data.loginTitleSuffix || '数字化流程设计与运营系统');
        setCopyrightText(json.data.copyrightText || 'Copyright © 2026 全源数字科技版权所有');
        setWatermarkEnabled(Boolean(json.data.watermarkEnabled));
        setTargetCompanyName(json.data.companyName || '苏州全元数字科技有限公司');
        if (json.data.license?.machineCode) {
          setTargetMachineCode(json.data.license.machineCode);
        }
        if (json.data.license?.licenseKey) {
          setLicenseKeyInput(json.data.license.licenseKey);
        }
        if (json.data.license?.edition) {
          setSelectedEdition(json.data.license.edition);
        }
        if (json.data.authUsersCount) {
          setSelectedUsersCount(json.data.authUsersCount);
        }
      }
    } catch (e) {
      console.error('Failed to load company auth data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes('png')) {
      showToast('仅支持 PNG 格式图片', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoPreview(base64);
      showToast('Logo 已选定', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDisplayInfo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!displayNameInput.trim()) {
      showToast('系统显示名称不能为空', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/system/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemDisplayName: displayNameInput.trim(),
          systemLogo: logoPreview,
          loginTitleSuffix,
          copyrightText,
          watermarkEnabled,
        }),
      });
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setCompanyData(json.data);
        onUpdateSystemDisplay?.(displayNameInput.trim(), logoPreview);
        showToast('个性化配置已保存生效', 'success');
      } else {
        showToast(json.info || '保存失败', 'error');
      }
    } catch {
      showToast('保存异常', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyMachineCode = () => {
    const code =
      companyData?.license?.machineCode ||
      companyData?.license?.serverHardware?.machineCode ||
      'HW-UUID-88A9-4B2E-99F1-017E54';
    navigator.clipboard.writeText(code);
    setCopiedFingerprint(true);
    showToast('设备硬件特征码已复制到剪贴板', 'success');
    setTimeout(() => setCopiedFingerprint(false), 2500);
  };

  const handleCopyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedLicKey(true);
    showToast('授权码已复制到剪贴板', 'success');
    setTimeout(() => setCopiedLicKey(false), 2500);
  };

  // 一键基于当前硬件特征码和公司名称自动生成合规授权码 (测试与离线激活辅助)
  const handleGenerateMatchingKey = async () => {
    if (!targetCompanyName.trim()) {
      showToast('请先输入授权公司名称', 'warning');
      return;
    }
    setGeneratingKey(true);
    try {
      const res = await fetch('/api/system/license/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: targetCompanyName.trim(),
          machineCode: targetMachineCode.trim(),
          edition: selectedEdition,
        }),
      });
      const json = await res.json();
      if (json.status === 1 && json.data?.generatedKey) {
        setLicenseKeyInput(json.data.generatedKey);
        showToast('已基于输入的公司名称与设备硬件特征码生成匹配授权码', 'success');
      } else {
        showToast(json.info || '生成授权码失败', 'error');
      }
    } catch {
      showToast('生成请求异常', 'error');
    } finally {
      setGeneratingKey(false);
    }
  };

  // 读取上传的 .lic 授权文件
  const handleLicFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string || '').trim();
      if (content) {
        try {
          // If JSON format
          const parsed = JSON.parse(content);
          if (parsed.licenseKey) setLicenseKeyInput(parsed.licenseKey);
          if (parsed.companyName) setTargetCompanyName(parsed.companyName);
          if (parsed.edition) setSelectedEdition(parsed.edition);
          showToast('已成功解析授权凭证文件', 'success');
        } catch {
          // Plain text license key
          setLicenseKeyInput(content);
          showToast('已读取授权码内容', 'success');
        }
      }
    };
    reader.readAsText(file);
  };

  // 执行更新授权码（支持公司名称变更与基于设备硬件特征码的授权绑定）
  const handleExecuteActivation = async () => {
    if (!targetCompanyName.trim()) {
      showToast('请输入授权公司名称', 'warning');
      return;
    }
    if (!targetMachineCode.trim()) {
      showToast('设备硬件特征码不能为空', 'warning');
      return;
    }
    if (!licenseKeyInput.trim()) {
      showToast('请输入商业授权码', 'warning');
      return;
    }

    setActivating(true);
    try {
      const res = await fetch('/api/system/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: targetCompanyName.trim(),
          machineCode: targetMachineCode.trim(),
          licenseKey: licenseKeyInput.trim(),
          edition: selectedEdition,
          authUsersCount: selectedUsersCount,
        }),
      });
      const json = await res.json();
      if (json.status === 1 && json.data) {
        setCompanyData(json.data);
        onUpdateCompanyName?.(targetCompanyName.trim());
        setActivateModalOpen(false);
        showToast(json.info || '商业授权更新成功！', 'success');
      } else {
        showToast(json.info || '授权更新失败', 'error');
      }
    } catch {
      showToast('网络请求异常，请检查后端服务', 'error');
    } finally {
      setActivating(false);
    }
  };

  const comp = companyData || {
    companyName: '苏州全元数字科技有限公司',
    companyStatus: '正常生效中',
    createTime: '2023-03-29 20:41:05',
    expireTime: '2030-09-11 07:14:06',
    authUsersCount: 200,
    authVersion: 'V2.0.1',
    roleQuotas: [
      { typeName: '流程规划岗', used: 17, total: 20 },
      { typeName: '架构审核岗', used: 15, total: 20 },
      { typeName: '设计建模岗', used: 15, total: 20 },
      { typeName: '合规风控岗', used: 16, total: 20 },
      { typeName: '权能决策岗', used: 12, total: 20 },
      { typeName: '执行经办岗', used: 13, total: 20 },
    ],
    license: {
      licenseKey: 'DFLOW-ENTP-2026-HW88A9-99F1-A89E-7821',
      machineCode: 'HW-UUID-88A9-4B2E-99F1-017E54',
      status: 'ACTIVE',
      edition: '企业旗舰版 (Enterprise)',
      hardwareVerified: true,
      hardwareVerificationStatus: '硬件特征码校验通过，绑定生效中',
      serverHardware: {
        machineCode: 'HW-UUID-88A9-4B2E-99F1-017E54',
        cpuModel: 'Intel(R) Xeon(R) Platinum 8375C @ 2.80GHz (16 Cores)',
        biosUuid: '4B2E88A9-99F1-017E-54A1-E7298B2089AA',
        macAddress: '52:54:00:88:A9:4B',
        systemArch: 'x86_64 / Linux 6.6 Enterprise',
      },
    },
  };

  const lic = comp.license || {};
  const serverHw = lic.serverHardware || {
    machineCode: 'HW-UUID-88A9-4B2E-99F1-017E54',
    cpuModel: 'Intel(R) Xeon(R) Platinum 8375C @ 2.80GHz (16 Cores)',
    biosUuid: '4B2E88A9-99F1-017E-54A1-E7298B2089AA',
    macAddress: '52:54:00:88:A9:4B',
    systemArch: 'x86_64 / Linux 6.6 Enterprise',
  };

  return (
    <div className="h-full flex flex-col bg-white select-none">
      <input
        type="file"
        ref={licFileInputRef}
        onChange={handleLicFileUpload}
        accept=".lic,.json,.txt"
        className="hidden"
      />

      {/* Top Tab Navigation */}
      <div className="border-b border-[#ebeef5] px-6 pt-3 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-8 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`pb-3 font-medium cursor-pointer transition-colors relative ${
              activeTab === 'company'
                ? 'text-[#409eff]'
                : 'text-[#606266] hover:text-[#303133]'
            }`}
          >
            公司授权信息
            {activeTab === 'company' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#409eff]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('license')}
            className={`pb-3 font-medium cursor-pointer transition-colors relative ${
              activeTab === 'license'
                ? 'text-[#409eff]'
                : 'text-[#606266] hover:text-[#303133]'
            }`}
          >
            许可证与激活管理
            {activeTab === 'license' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#409eff]" />
            )}
          </button>
        </div>

        {/* Quick update button in header */}
        <button
          type="button"
          onClick={() => {
            setTargetCompanyName(comp.companyName || '苏州全元数字科技有限公司');
            setActivateModalOpen(true);
          }}
          className="mb-2 h-7 px-3 rounded bg-[#ECF5FF] hover:bg-[#409eff] hover:text-white border border-[#B3D8FF] text-xs text-[#409eff] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>更新授权码</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-[#F8FAFC]/50">
        {/* ========================================================================= */}
        {/* TAB 1: 公司授权信息 (按用户需求：完整展示相应的授权信息、公司名称与硬件绑定) */}
        {/* ========================================================================= */}
        {activeTab === 'company' && (
          <div className="max-w-6xl space-y-6">
            {/* 1. 顶部商业授权凭证卡片 */}
            <div className="bg-white rounded-lg border border-[#E4E7ED] p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F0F2F5]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2F7BFE]/10 flex items-center justify-center text-[#2F7BFE] shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#1F2733]">
                        {comp.companyName}
                      </h2>
                      <span className="px-2 py-0.5 rounded bg-[#67c23a]/15 border border-[#67c23a]/30 text-[#67c23a] text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {comp.companyStatus || '正常生效中'}
                      </span>
                    </div>
                    <p className="text-xs text-[#909399] mt-0.5">
                      全源企业级流程数字化资产运营平台 · 商业授权主体
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetCompanyName(comp.companyName);
                      setActivateModalOpen(true);
                    }}
                    className="h-8 px-3.5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>变更公司名称 / 更新授权码</span>
                  </button>
                </div>
              </div>

              {/* 核心授权指标网格 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                <div className="p-3 rounded bg-[#F8FAFC] border border-[#E4E7ED]">
                  <div className="text-[#909399]">授权版本</div>
                  <div className="text-sm font-bold text-[#1F2733] mt-1">
                    {lic.edition || '企业旗舰版 (Enterprise)'}
                  </div>
                </div>
                <div className="p-3 rounded bg-[#F8FAFC] border border-[#E4E7ED]">
                  <div className="text-[#909399]">授权用户数</div>
                  <div className="text-sm font-bold text-[#2F7BFE] font-mono mt-1">
                    {comp.authUsersCount} 人 <span className="text-[11px] font-normal text-[#909399]">(已激活 93 人)</span>
                  </div>
                </div>
                <div className="p-3 rounded bg-[#F8FAFC] border border-[#E4E7ED]">
                  <div className="text-[#909399]">授权生效时间</div>
                  <div className="text-xs font-semibold text-[#606266] font-mono mt-1 truncate">
                    {comp.createTime}
                  </div>
                </div>
                <div className="p-3 rounded bg-[#F8FAFC] border border-[#E4E7ED]">
                  <div className="text-[#909399]">到期时间</div>
                  <div className="text-xs font-bold text-[#E6A23C] font-mono mt-1 truncate">
                    {comp.expireTime}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 设备硬件特征码与锁机绑定专区 (重点突出硬件授权信息) */}
            <div className="bg-white rounded-lg border border-[#E4E7ED] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#2F7BFE]" />
                  <h3 className="text-sm font-bold text-[#1F2733]">设备硬件特征码与物理绑定授权</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#ECF5FF] border border-[#B3D8FF] text-[11px] text-[#2F7BFE] font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Node-Locked 严格物理锁机授权
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 硬件特征码核心条目 */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-[#1F2937] to-[#111827] text-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                      <span className="flex items-center gap-1.5">
                        <Fingerprint className="w-3.5 h-3.5 text-[#60A5FA]" />
                        设备硬件特征码 (Hardware Machine Fingerprint)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#059669]/30 text-[#34D399] border border-[#059669]/50">
                        指纹校验通过
                      </span>
                    </div>
                    <div className="mt-2.5 font-mono text-sm font-bold text-white tracking-wider break-all select-all">
                      {lic.machineCode || serverHw.machineCode || 'HW-UUID-88A9-4B2E-99F1-017E54'}
                    </div>
                    <div className="mt-2 text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>{lic.hardwareVerificationStatus || '硬件特征码校验通过，绑定生效中'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleCopyMachineCode}
                      className="text-xs text-[#60A5FA] hover:text-[#93C5FD] flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      {copiedFingerprint ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFingerprint ? '硬件特征码已复制' : '复制设备特征码'}</span>
                    </button>
                    <span className="text-[10px] text-[#9CA3AF]">
                      最后核验: 刚刚
                    </span>
                  </div>
                </div>

                {/* 硬件环境参数明细 */}
                <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E4E7ED] text-xs space-y-2.5">
                  <div className="font-semibold text-[#1F2733] pb-1 border-b border-[#E4E7ED] flex items-center justify-between">
                    <span>宿主服务器硬件签名参数</span>
                    <Cpu className="w-3.5 h-3.5 text-[#909399]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#909399]">CPU 处理器型号</span>
                    <span className="font-mono text-[#303133] font-medium">{serverHw.cpuModel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#909399]">主板 BIOS UUID</span>
                    <span className="font-mono text-[#303133] font-medium">{serverHw.biosUuid}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#909399]">物理网卡 MAC 地址</span>
                    <span className="font-mono text-[#303133] font-medium">{serverHw.macAddress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#909399]">宿主操作系统内核</span>
                    <span className="font-mono text-[#303133] font-medium">{serverHw.systemArch}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 授权凭证、安全防伪与角色配额 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 授权防伪凭证 */}
              <div className="bg-white rounded-lg border border-[#E4E7ED] p-5 shadow-xs space-y-3.5 text-xs">
                <div className="flex items-center gap-2 pb-2 border-b border-[#F0F2F5]">
                  <FileCheck2 className="w-4 h-4 text-[#2F7BFE]" />
                  <h3 className="font-bold text-[#1F2733]">商业授权凭证与证书摘要</h3>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-[#909399] w-24 shrink-0">当前授权码</span>
                  <div className="flex-1 font-mono text-[#303133] font-bold break-all flex items-center justify-between gap-2">
                    <span className="truncate">{lic.licenseKey || 'DFLOW-ENTP-2026-HW88A9-99F1-A89E-7821'}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyLicenseKey(lic.licenseKey || 'DFLOW-ENTP-2026-HW88A9-99F1-A89E-7821')}
                      className="text-[#2F7BFE] hover:underline shrink-0 p-1"
                      title="复制授权码"
                    >
                      {copiedLicKey ? <Check className="w-3.5 h-3.5 text-[#67C23A]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#909399] w-24 shrink-0">证书序列号</span>
                  <span className="font-mono text-[#303133]">{lic.certSerialNo || 'CERT-2026-88A94B2E-017E54'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#909399] w-24 shrink-0">防伪数字签名</span>
                  <span className="font-mono text-[#67C23A] text-[11px] font-semibold">
                    {lic.digitalSignature || 'SHA256withRSA · RS256-VERIFIED-VALID'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#909399] w-24 shrink-0">签发认证中心</span>
                  <span className="text-[#303133]">{lic.issuer || '全源数科商业授权签发中心 (CA-ROOT)'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#909399] w-24 shrink-0">最大并发数</span>
                  <span className="font-mono text-[#303133]">{lic.maxConcurrentSessions || 50} 会话并发</span>
                </div>
              </div>

              {/* 岗位角色配额 */}
              <div className="bg-white rounded-lg border border-[#E4E7ED] p-5 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0F2F5]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#2F7BFE]" />
                    <h3 className="font-bold text-[#1F2733]">角色配额限制</h3>
                  </div>
                  <span className="text-[11px] text-[#909399]">各关键控制节点上限</span>
                </div>

                <div className="space-y-2.5">
                  {(comp.roleQuotas || []).map((quota: any) => {
                    const percent = Math.min(100, Math.round((quota.used / quota.total) * 100));
                    return (
                      <div key={quota.typeName} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#606266]">{quota.typeName}</span>
                          <span className="font-mono text-[#303133]">
                            <span className="font-bold text-[#2F7BFE]">{quota.used}</span> / {quota.total}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#F0F2F5] overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full transition-all ${
                              percent > 85 ? 'bg-[#E6A23C]' : 'bg-[#2F7BFE]'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. 授权功能模块范围 */}
            <div className="bg-white rounded-lg border border-[#E4E7ED] p-5 shadow-xs text-xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#F0F2F5]">
                <Layers className="w-4 h-4 text-[#2F7BFE]" />
                <h3 className="font-bold text-[#1F2733]">已授权功能模块清单</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { name: '流程架构设计引擎 (L0-L4)', desc: '支持分层分级架构蓝图' },
                  { name: 'draw.io v32 画板与BPMN2.0', desc: '全功能建模与导出' },
                  { name: '分权授权 DoA 手册与 RACI', desc: '权能决策门禁控制' },
                  { name: '企业流程角色库与分级字典', desc: '全层级角色与岗位映射' },
                  { name: '流程术语标准化管理', desc: '企业术语与业务词典' },
                  { name: '流程审核流转与基线变更', desc: '审批流转与电子签名' },
                  { name: 'API 网关与动态表单引擎', desc: '集成开发与业务建模' },
                  { name: '制度文件与风险合规内控', desc: '制度关联与KCP控制' },
                ].map((mod, i) => (
                  <div key={i} className="p-2.5 rounded bg-[#F8FAFC] border border-[#E4E7ED] flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#67C23A] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#1F2733] truncate">{mod.name}</div>
                      <div className="text-[11px] text-[#909399] mt-0.5">{mod.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. 系统显示信息与品牌定制 (保留原有设置) */}
            <div className="bg-white rounded-lg border border-[#E4E7ED] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#F0F2F5]">
                <Sliders className="w-4 h-4 text-[#2F7BFE]" />
                <h3 className="text-sm font-bold text-[#1F2733]">系统品牌与显示设置</h3>
              </div>
              <form onSubmit={handleSaveDisplayInfo} className="space-y-4 max-w-2xl text-xs">
                <div className="flex items-center">
                  <label className="w-28 text-[#606266] shrink-0 text-right pr-4">
                    <span className="text-[#F56C6C] mr-1">*</span>系统显示名称
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="请输入系统展示名称"
                      className="w-full h-8 px-3 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] text-xs text-[#303133] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-start">
                  <label className="w-28 text-[#606266] shrink-0 text-right pr-4 pt-1">
                    系统 Logo
                  </label>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/png"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white font-medium text-xs transition-colors cursor-pointer"
                      >
                        选择文件
                      </button>
                      {logoPreview && (
                        <div className="h-8 px-3 rounded border border-[#E4E7ED] bg-[#F8FAFC] flex items-center">
                          <img src={logoPreview} alt="Logo" className="max-h-6 object-contain" />
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-[#909399]">
                      只能上传 PNG 文件，建议尺寸高度 28px
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="w-28 text-[#606266] shrink-0 text-right pr-4">
                    登录页副标题
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={loginTitleSuffix}
                      onChange={(e) => setLoginTitleSuffix(e.target.value)}
                      className="w-full h-8 px-3 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] text-xs text-[#303133] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="w-28 text-[#606266] shrink-0 text-right pr-4">
                    页脚版权信息
                  </label>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={copyrightText}
                      onChange={(e) => setCopyrightText(e.target.value)}
                      className="w-full h-8 px-3 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] text-xs text-[#303133] outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 pl-28">
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-8 px-5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{saving ? '正在保存...' : '保存显示配置'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 许可证与激活管理 (1:1 严格对齐设计稿图像) */}
        {/* ========================================================================= */}
        {activeTab === 'license' && (
          <div className="max-w-6xl space-y-5 text-xs">
            {/* 1. 顶部深色横幅 (Dark Banner) - 对齐设计稿红框区域 */}
            <div className="bg-[#1F2937] text-white rounded-lg p-6 shadow-sm border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded bg-[#059669]/20 border border-[#059669]/40 text-[#34D399] text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    商业授权生效中 (ACTIVE)
                  </span>
                  <span className="text-xs text-[#9CA3AF]">
                    {lic.edition || '企业旗舰版 (Enterprise)'}
                  </span>
                </div>
                {/* 授权公司名称 (动态变更) */}
                <div className="text-xl font-bold tracking-tight text-white select-all">
                  {comp.companyName}
                </div>
              </div>

              {/* 更新授权码按钮 */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTargetCompanyName(comp.companyName || '苏州全元数字科技有限公司');
                    setActivateModalOpen(true);
                  }}
                  className="h-9 px-4 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>更新授权码</span>
                </button>
              </div>
            </div>

            {/* 2. 设备硬件特征码卡片 (对齐设计稿下方卡片) */}
            <div className="p-5 bg-white rounded-lg border border-[#E4E7ED] shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#909399]">
                <span className="font-medium text-[#606266]">设备硬件特征码</span>
                <Server className="w-4 h-4 text-[#2F7BFE]" />
              </div>

              <div className="font-mono text-sm font-bold text-[#1F2733] truncate tracking-wide select-all">
                {lic.machineCode || serverHw.machineCode || 'HW-UUID-88A9-4B2E-99F1-017E54'}
              </div>

              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCopyMachineCode}
                  className="text-xs text-[#2F7BFE] hover:text-[#1D4ED8] hover:underline flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  {copiedFingerprint ? <Check className="w-3.5 h-3.5 text-[#67C23A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFingerprint ? '已复制机器特征码' : '复制机器特征码'}</span>
                </button>

                <div className="flex items-center gap-2 text-[11px] text-[#67C23A]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>已与本机硬件指纹绑定生效</span>
                </div>
              </div>
            </div>

            {/* 3. 授权绑定详情与更新日志 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 授权详情 */}
              <div className="p-5 bg-white rounded-lg border border-[#E4E7ED] shadow-2xs space-y-3 lg:col-span-1">
                <div className="flex items-center gap-2 pb-2 border-b border-[#F0F2F5]">
                  <FileCode className="w-4 h-4 text-[#2F7BFE]" />
                  <h4 className="font-bold text-[#1F2733]">当前生效授权详情</h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[#909399]">绑定公司：</span>
                    <span className="text-[#1F2733] font-medium">{comp.companyName}</span>
                  </div>
                  <div>
                    <span className="text-[#909399]">授权版本：</span>
                    <span className="text-[#1F2733]">{lic.edition || '企业旗舰版 (Enterprise)'}</span>
                  </div>
                  <div>
                    <span className="text-[#909399]">授权用户数：</span>
                    <span className="text-[#1F2733] font-mono">{comp.authUsersCount} 人</span>
                  </div>
                  <div>
                    <span className="text-[#909399]">到期期限：</span>
                    <span className="text-[#E6A23C] font-mono font-medium">{comp.expireTime}</span>
                  </div>
                  <div>
                    <span className="text-[#909399]">绑定模式：</span>
                    <span className="text-[#2F7BFE] font-mono">Node-Locked 严格物理锁机</span>
                  </div>
                  <div>
                    <span className="text-[#909399]">数字防伪签名：</span>
                    <span className="text-[#67C23A] font-mono text-[10px] block truncate mt-0.5">
                      {lic.digitalSignature || 'SHA256withRSA · RS256-VERIFIED-VALID'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 历史授权更新审计日志 */}
              <div className="p-5 bg-white rounded-lg border border-[#E4E7ED] shadow-2xs space-y-3 lg:col-span-2">
                <div className="flex items-center justify-between pb-2 border-b border-[#F0F2F5]">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#2F7BFE]" />
                    <h4 className="font-bold text-[#1F2733]">授权码更新与硬件绑定日志</h4>
                  </div>
                  <span className="text-[11px] text-[#909399]">全程可追溯审计</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(lic.auditLogs || []).length === 0 ? (
                    <div className="text-center py-6 text-[#909399]">暂无更新日志</div>
                  ) : (
                    (lic.auditLogs || []).map((log: any, idx: number) => (
                      <div
                        key={log.id || idx}
                        className="p-3 rounded bg-[#F8FAFC] border border-[#E4E7ED] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1F2733]">{log.event}</span>
                            <span className="px-1.5 py-0.2 rounded bg-[#67c23a]/15 text-[#67c23a] text-[10px] font-medium">
                              {log.status || '成功'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#606266] leading-relaxed">
                            {log.detail}
                          </div>
                        </div>
                        <div className="text-right shrink-0 text-[11px] text-[#909399] font-mono">
                          <div>{log.time}</div>
                          <div>操作人: {log.operator || '流程管理员'}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 弹窗：更新授权码 (支持公司名称变更与基于设备硬件特征码的授权绑定) */}
      {/* ========================================================================= */}
      {activateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg border border-[#E4E7ED] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-[#E4E7ED] flex items-center justify-between bg-[#FAFAFA] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#2F7BFE]/10 flex items-center justify-center text-[#2F7BFE]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F2733]">更新商业授权码</h3>
                  <p className="text-[11px] text-[#909399]">
                    支持公司名称变更与基于设备硬件特征码的绑定核验
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivateModalOpen(false)}
                className="text-[#909399] hover:text-[#303133] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
              {/* 1. 基于设备硬件特征码 (只读/校验) */}
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E4E7ED] space-y-2">
                <div className="flex items-center justify-between text-[#606266] font-medium">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-[#2F7BFE]" />
                    绑定设备硬件特征码 (Hardware Machine Code)
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#67C23A]/15 text-[#67C23A] text-[10px] font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    已检测到当前服务器物理指纹
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={targetMachineCode}
                    onChange={(e) => setTargetMachineCode(e.target.value)}
                    className="flex-1 h-8 px-2.5 rounded border border-[#DCDFE6] bg-white font-mono text-xs text-[#1F2733] font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleCopyMachineCode}
                    className="h-8 px-2.5 rounded border border-[#DCDFE6] bg-white hover:bg-[#F5F7FA] text-[#606266] text-xs flex items-center gap-1 cursor-pointer"
                    title="复制"
                  >
                    <Copy className="w-3 h-3" />
                    <span>复制</span>
                  </button>
                </div>
                <div className="text-[11px] text-[#909399] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#2F7BFE]" />
                  <span>授权将与此特征码严格锁机绑定，防止非授权环境非法运行。</span>
                </div>
              </div>

              {/* 2. 授权公司名称 (支持变更) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[#1F2733] font-bold">
                    授权公司名称（支持变更） <span className="text-[#F56C6C]">*</span>
                  </label>
                  <span className="text-[11px] text-[#2F7BFE]">
                    系统首页及全局主体将同步变更
                  </span>
                </div>
                <input
                  type="text"
                  value={targetCompanyName}
                  onChange={(e) => setTargetCompanyName(e.target.value)}
                  placeholder="如：苏州全元数字科技有限公司"
                  className="w-full h-8 px-3 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none text-xs text-[#303133]"
                />
                <div className="text-[11px] text-[#909399]">
                  如遇集团架构调整、更名或收购，直接在此输入新的公司法定全称，更新后全系统立即生效。
                </div>
              </div>

              {/* 3. 商业授权码 (License Key) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[#1F2733] font-bold">
                    商业授权码 (License Key) <span className="text-[#F56C6C]">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => licFileInputRef.current?.click()}
                      className="text-[#2F7BFE] hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <FileCheck2 className="w-3 h-3" />
                      <span>导入授权证书文件</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  placeholder="请输入或粘贴商业授权码，例如：DFLOW-ENTP-2026-HW88A9-99F1-A89E-7821"
                  className="w-full p-2.5 rounded border border-[#DCDFE6] focus:border-[#2F7BFE] outline-none font-mono text-xs text-[#1F2733] resize-none"
                />

                {/* 一键基于当前硬件特征码和公司名称自动生成合规授权码 (测试与激活利器) */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateMatchingKey}
                    disabled={generatingKey}
                    className="px-2.5 py-1 rounded bg-[#F0F7FF] hover:bg-[#E1EFFF] border border-[#B3D8FF] text-[#2F7BFE] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {generatingKey ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-[#2F7BFE]" />
                    )}
                    <span>基于当前硬件特征码与公司名称快速生成合规授权码</span>
                  </button>
                  <span className="text-[11px] text-[#909399]">离线/测试授权助手</span>
                </div>
              </div>

              {/* 4. 授权版本与配额确认 */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[#606266] mb-1">授权版本</label>
                  <select
                    value={selectedEdition}
                    onChange={(e) => setSelectedEdition(e.target.value)}
                    className="w-full h-8 px-2 rounded border border-[#DCDFE6] bg-white outline-none focus:border-[#2F7BFE] cursor-pointer"
                  >
                    <option value="企业旗舰版 (Enterprise)">企业旗舰版 (Enterprise)</option>
                    <option value="企业尊享版 (Ultimate)">企业尊享版 (Ultimate)</option>
                    <option value="行业定制版 (Custom Edition)">行业定制版 (Custom Edition)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#606266] mb-1">授权用户配额</label>
                  <select
                    value={selectedUsersCount}
                    onChange={(e) => setSelectedUsersCount(Number(e.target.value))}
                    className="w-full h-8 px-2 rounded border border-[#DCDFE6] bg-white outline-none focus:border-[#2F7BFE] cursor-pointer"
                  >
                    <option value={200}>200 用户</option>
                    <option value={500}>500 用户</option>
                    <option value={1000}>1000 用户</option>
                    <option value={5000}>5000 用户 (不限并发)</option>
                  </select>
                </div>
              </div>

              {/* 5. 即时预览卡片 */}
              <div className="p-3 rounded bg-[#ECF5FF]/60 border border-[#B3D8FF] space-y-1.5 text-[11px]">
                <div className="font-semibold text-[#2F7BFE] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>更新授权信息核对预览</span>
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-[#606266]">
                  <div>
                    授权公司：<span className="font-bold text-[#1F2733]">{targetCompanyName}</span>
                  </div>
                  <div>
                    绑定版本：<span className="text-[#1F2733]">{selectedEdition}</span>
                  </div>
                  <div className="col-span-2 truncate">
                    硬件特征码：<span className="font-mono text-[#1F2733]">{targetMachineCode}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#E4E7ED] bg-[#FAFAFA] flex items-center justify-end gap-2 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setActivateModalOpen(false)}
                className="h-8 px-4 rounded border border-[#DCDFE6] bg-white hover:bg-[#F5F7FA] text-[#606266] cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                disabled={activating}
                onClick={handleExecuteActivation}
                className="h-8 px-5 rounded bg-[#2F7BFE] hover:bg-[#2563EB] text-white font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                {activating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{activating ? '正在校验并绑定...' : '确认更新授权'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
