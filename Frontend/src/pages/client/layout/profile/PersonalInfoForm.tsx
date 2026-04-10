// Frontend/src/pages/client/layout/profile/PersonalInfoForm.tsx
import { useState, useRef, useEffect } from 'react';
import { Upload, Eye, FileText, CheckCircle2, Save, Loader2, ShieldCheck, User, GraduationCap, Briefcase, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import WebcamCapture from './WebcamCapture';
import { motion, AnimatePresence } from 'framer-motion';
import OTPVerification from './OTPVerification';

interface PersonalInfoFormProps {
  initialData: {
    firstname: string; lastname: string; dateofbirth: string;
    phone: string; email: string; educationLevel?: string;
    otherEducation?: string; isEmployed?: string;
    idDocument?: string; address1Document?: string; address2Document?: string;
  };
  setProfileData: React.Dispatch<React.SetStateAction<any>>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EDUCATION_OPTIONS = [
  { value: 'secondary', label: 'Secondary' },
  { value: 'higher secondary', label: 'Higher Secondary' },
  { value: "bachelor's degree", label: "Bachelor's Degree" },
  { value: "master's degree", label: "Master's Degree" },
  { value: 'doctorate', label: 'Doctorate' },
  { value: 'other', label: 'Other' },
];

type DocField = 'idDocument' | 'address1Document' | 'address2Document';
const DOC_FIELDS: { field: DocField; label: string; sub: string; color: string }[] = [
  { field: 'idDocument', label: 'ID Document', sub: "Passport, national ID, or driver's license", color: '#6366f1' },
  { field: 'address1Document', label: 'Address Proof 1', sub: 'Utility bill or bank statement', color: '#10b981' },
  { field: 'address2Document', label: 'Address Proof 2', sub: 'Secondary proof (optional)', color: '#f59e0b' },
];

const formatPath = (p?: string) => p ? p.replace(/\\/g, '/') : '';
const getDocUrl = (path?: string) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_BASE_URL.replace('/api', '')}/${formatPath(path)}`;
};

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ initialData, setProfileData }) => {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [files, setFiles] = useState<Record<DocField, File | null>>({ idDocument: null, address1Document: null, address2Document: null });
  const [previews, setPreviews] = useState<Record<DocField, string>>({ idDocument: '', address1Document: '', address2Document: '' });
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const docRefs: Record<DocField, React.RefObject<HTMLInputElement>> = {
    idDocument: useRef<HTMLInputElement>(null),
    address1Document: useRef<HTMLInputElement>(null),
    address2Document: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    setPreviews({
      idDocument: getDocUrl(initialData.idDocument),
      address1Document: getDocUrl(initialData.address1Document),
      address2Document: getDocUrl(initialData.address2Document),
    });
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: uploaded } = e.target;
    if (uploaded?.[0]) {
      const file = uploaded[0];
      const field = name as DocField;
      setFiles(p => ({ ...p, [field]: file }));
      setFormData(p => ({ ...p, [field]: file.name }));
      if (file.type === 'application/pdf') {
        setPreviews(p => ({ ...p, [field]: 'PDF_DOC' }));
      } else {
        setPreviews(p => ({ ...p, [field]: URL.createObjectURL(file) }));
      }
    }
  };

  const handleCaptured = (file: File, fieldName: string) => {
    const field = fieldName as DocField;
    setFiles(p => ({ ...p, [field]: file }));
    setFormData(p => ({ ...p, [field]: file.name }));
    setPreviews(p => ({ ...p, [field]: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!formData.educationLevel?.trim()) errors.push('Please select your education level');
    if (formData.educationLevel === 'other' && !formData.otherEducation?.trim()) errors.push('Please specify your education level');
    if (!formData.isEmployed) errors.push('Please select your employment status');
    if (!formData.idDocument && !files.idDocument) errors.push('Please upload your ID document');
    if (!formData.address1Document && !files.address1Document) errors.push('Please upload Address Document 1');
    if (!formData.address2Document && !files.address2Document) errors.push('Please upload Address Document 2');
    if (errors.length > 0) { errors.forEach(err => toast.error(err)); return; }
    setPendingFormData({ educationLevel: formData.educationLevel, otherEducation: formData.otherEducation || '', isEmployed: formData.isEmployed, files });
    setOtpDialogOpen(true);
  };

  const handleOTPVerified = async () => {
    if (!pendingFormData) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('clientToken');
      const sessionId = sessionStorage.getItem('sessionId');
      const sessionToken = sessionStorage.getItem('sessionToken');
      if (!token) { toast.error("Please login to update your profile"); return; }

      const fd = new FormData();
      fd.append('educationLevel', pendingFormData.educationLevel);
      fd.append('otherEducation', pendingFormData.otherEducation || '');
      fd.append('isEmployed', pendingFormData.isEmployed);
      if (pendingFormData.files.idDocument) fd.append('idDocument', pendingFormData.files.idDocument);
      if (pendingFormData.files.address1Document) fd.append('address1Document', pendingFormData.files.address1Document);
      if (pendingFormData.files.address2Document) fd.append('address2Document', pendingFormData.files.address2Document);

      const response = await axios.post(`${API_BASE_URL}/api/profile/personal-info`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'x-session-id': sessionId || '', 'x-session-token': sessionToken || '', 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success("Personal information updated. Pending KYC verification.");
        const updatedData = response.data.data || {};
        setProfileData((prev: any) => ({
          ...prev,
          personalInfo: { ...formData, idDocument: updatedData.idDocument || formData.idDocument, address1Document: updatedData.address1Document || formData.address1Document, address2Document: updatedData.address2Document || formData.address2Document }
        }));
        (['idDocument', 'address1Document', 'address2Document'] as DocField[]).forEach(field => {
          if (updatedData[field]) {
            const path = updatedData[field];
            setFormData(prev => ({ ...prev, [field]: path }));
            setPreviews(prev => ({ ...prev, [field]: path.startsWith('http') ? path : `${API_BASE_URL.replace('/api', '')}/${formatPath(path)}` }));
          }
        });
        setPendingFormData(null);
      }
    } catch {
      toast.error("Failed to update personal information");
    } finally {
      setLoading(false);
    }
  };

  const isDocUploaded = (field: DocField) => !!(previews[field] && previews[field] !== 'PDF_DOC') || !!files[field];

  const renderDocPreview = (field: DocField) => {
    const preview = previews[field];
    const fileName = formData[field] as string;
    const isPdf = preview === 'PDF_DOC' || (typeof fileName === 'string' && fileName.toLowerCase().endsWith('.pdf'));
    const pdfUrl = preview !== 'PDF_DOC' && preview ? preview : getDocUrl(fileName);

    if (isPdf && pdfUrl && pdfUrl !== 'PDF_DOC') {
      return (
        <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => window.open(pdfUrl, '_blank')}
          className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366f1' }}>
          <Eye className="w-3 h-3" />View PDF
        </motion.button>
      );
    }
    const imgSrc = preview && preview !== 'PDF_DOC' && (preview.startsWith('blob:') || preview.startsWith('http')) ? preview : null;
    if (imgSrc) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="mt-2 rounded-xl overflow-hidden cursor-pointer group relative"
          style={{ border: '1px solid var(--theme-border)', maxWidth: 160 }}
          onClick={() => setLightboxImg(imgSrc)}>
          <img src={imgSrc} alt={field} className="w-full h-24 object-cover block" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-5 h-5 text-white" />
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">

        {/* Section: Personal Details (read-only) */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <User className="w-4 h-4" style={{ color: '#6366f1' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Personal Details</p>
              <p className="text-[10px]" style={{ color: 'var(--theme-text-disabled)' }}>Read-only — contact support to update</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>Read-only</span>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'First Name', value: formData.firstname },
              { label: 'Last Name', value: formData.lastname },
              { label: 'Date of Birth', value: formData.dateofbirth ? new Date(formData.dateofbirth).toLocaleDateString() : '' },
              { label: 'Phone', value: formData.phone },
              { label: 'Email', value: formData.email },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--theme-text-disabled)' }}>{f.label}</label>
                <div className="px-3 py-2 rounded-xl text-sm font-medium truncate"
                  style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)', opacity: 0.75 }}>
                  {f.value || '—'}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Section: Additional Info */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <GraduationCap className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Additional Information</p>
              <p className="text-[10px]" style={{ color: 'var(--theme-text-disabled)' }}>Education & employment status</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--theme-text-disabled)' }}>Education Level</label>
              <select value={formData.educationLevel || ''}
                onChange={e => setFormData(p => ({ ...p, educationLevel: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--theme-bg-main)', border: '1.5px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
                onFocus={e => (e.target.style.borderColor = '#6366f1')}
                onBlur={e => (e.target.style.borderColor = 'var(--theme-border)')}>
                <option value="">Select education level</option>
                {EDUCATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <AnimatePresence>
              {formData.educationLevel === 'other' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--theme-text-disabled)' }}>Please specify</label>
                  <input type="text" placeholder="Your education level"
                    value={formData.otherEducation || ''}
                    onChange={e => setFormData(p => ({ ...p, otherEducation: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--theme-bg-main)', border: '1.5px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
                    onFocus={e => (e.target.style.borderColor = '#6366f1')}
                    onBlur={e => (e.target.style.borderColor = 'var(--theme-border)')} />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--theme-text-disabled)' }}>
                <span className="flex items-center gap-1.5"><Briefcase className="w-3 h-3" />Employment Status</span>
              </label>
              <div className="flex gap-3">
                {(['yes', 'no'] as const).map(v => {
                  const isSelected = formData.isEmployed === v;
                  return (
                    <label key={v} className="flex-1 flex items-center justify-center gap-2.5 cursor-pointer py-2.5 px-4 rounded-xl transition-all duration-200"
                      style={{ border: `1.5px solid ${isSelected ? '#6366f1' : 'var(--theme-border)'}`, background: isSelected ? 'rgba(99,102,241,0.1)' : 'var(--theme-bg-main)' }}>
                      <input type="radio" value={v} checked={isSelected} onChange={() => setFormData(p => ({ ...p, isEmployed: v }))} className="sr-only" />
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all" style={{ borderColor: isSelected ? '#6366f1' : 'var(--theme-border)' }}>
                        {isSelected && <div className="w-2 h-2 rounded-full" style={{ background: '#6366f1' }} />}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: isSelected ? '#6366f1' : 'var(--theme-text-muted)' }}>
                        {v === 'yes' ? 'Employed' : 'Unemployed'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section: Document Uploads */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>KYC Documents</p>
              <p className="text-[10px]" style={{ color: 'var(--theme-text-disabled)' }}>JPEG, PNG, or PDF • Max 5 MB each</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {DOC_FIELDS.map(({ field, label, sub, color }) => {
              const uploaded = isDocUploaded(field);
              return (
                <motion.div key={field} whileHover={{ y: -2 }}
                  className="rounded-xl p-4 transition-all duration-200"
                  style={{ background: 'var(--theme-bg-main)', border: `1.5px solid ${uploaded ? `${color}50` : 'var(--theme-border)'}` }}>
                  <input ref={docRefs[field]} name={field} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                        <FileText className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>{label}</p>
                    </div>
                    {uploaded && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] mb-3" style={{ color: 'var(--theme-text-muted)' }}>{sub}</p>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={() => docRefs[field].current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                      style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                      <Upload className="w-3 h-3" />Upload
                    </button>
                    <WebcamCapture onCapture={handleCaptured} fieldName={field} />
                  </div>
                  {renderDocPreview(field)}
                  {files[field] && (
                    <p className="text-[10px] mt-2 truncate" style={{ color: 'var(--theme-text-muted)' }}>{files[field]!.name}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer / Submit */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl px-5 py-4"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <p className="text-xs text-center sm:text-left" style={{ color: 'var(--theme-text-muted)' }}>
            Changes require OTP verification and admin KYC approval.
          </p>
          <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save & Verify</>}
          </motion.button>
        </motion.div>
      </div>

      {/* OTP Dialog */}
      <OTPVerification open={otpDialogOpen} onOpenChange={setOtpDialogOpen}
        updateType="personalInfo" formData={pendingFormData} onVerified={handleOTPVerified} />

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={() => setLightboxImg(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
              <button onClick={() => setLightboxImg(null)}
                className="absolute -top-4 -right-4 w-8 h-8 rounded-full flex items-center justify-center z-10"
                style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
                <X className="w-4 h-4" style={{ color: 'var(--theme-text-primary)' }} />
              </button>
              <img src={lightboxImg} alt="Document preview" className="w-full h-auto rounded-2xl max-h-[80vh] object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};

export default PersonalInfoForm;
