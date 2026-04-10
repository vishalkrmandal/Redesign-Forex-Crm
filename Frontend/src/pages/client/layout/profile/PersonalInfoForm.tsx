// Frontend/src/pages/client/layout/profile/PersonalInfoForm.tsx
import { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Eye, FileText, CheckCircle, AlertCircle, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import WebcamCapture from './WebcamCapture';
import { motion } from 'framer-motion';

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
  { value: 'secondary',          label: 'Secondary' },
  { value: 'higher secondary',   label: 'Higher Secondary' },
  { value: "bachelor's degree",  label: "Bachelor's Degree" },
  { value: "master's degree",    label: "Master's Degree" },
  { value: 'doctorate',          label: 'Doctorate' },
  { value: 'other',              label: 'Other' },
];

type DocField = 'idDocument' | 'address1Document' | 'address2Document';
const DOC_FIELDS: { field: DocField; label: string; sub: string }[] = [
  { field: 'idDocument',       label: 'ID Document',      sub: 'Passport, national ID, or driver\'s license' },
  { field: 'address1Document', label: 'Address Proof 1',  sub: 'Utility bill or bank statement' },
  { field: 'address2Document', label: 'Address Proof 2',  sub: 'Secondary proof of address (optional)' },
];

const labelStyle: React.CSSProperties = { display:'block', fontSize:12, fontWeight:600, color:'var(--theme-text-muted)', marginBottom:6 };
const readonlyStyle: React.CSSProperties = {
  width:'100%', height:42, borderRadius:10, fontSize:13, padding:'0 12px', boxSizing:'border-box',
  background:'var(--theme-border)', border:'1.5px solid var(--theme-border)',
  color:'var(--theme-text-disabled)', cursor:'not-allowed',
};
const inputStyle: React.CSSProperties = {
  width:'100%', height:42, borderRadius:10, fontSize:13, padding:'0 12px', boxSizing:'border-box',
  background:'var(--theme-bg-main)', border:'1.5px solid var(--theme-border)',
  color:'var(--theme-text-primary)', outline:'none', transition:'border-color 0.15s',
};

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ initialData, setProfileData }) => {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<Record<DocField, File | null>>({ idDocument: null, address1Document: null, address2Document: null });
  const [previews, setPreviews] = useState<Record<DocField, string>>({ idDocument: '', address1Document: '', address2Document: '' });

  const docRefs: Record<DocField, React.RefObject<HTMLInputElement>> = {
    idDocument:       useRef<HTMLInputElement>(null),
    address1Document: useRef<HTMLInputElement>(null),
    address2Document: useRef<HTMLInputElement>(null),
  };

  const formatPath = (p?: string) => p ? p.replace(/\\/g, '/') : '';
  const getDocUrl = (path?: string) => {
    if (!path) return '';
    return path.startsWith('http') ? path : `${API_BASE_URL.replace('/api', '')}/${formatPath(path)}`;
  };

  useEffect(() => {
    setPreviews({
      idDocument:       getDocUrl(initialData.idDocument),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('clientToken');
      if (!token) { toast.error('Please login'); return; }

      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (!['firstname','lastname','dateofbirth','phone','email'].includes(k) && v != null) {
          fd.append(k, v as string);
        }
      });
      if (files.idDocument)       fd.append('idDocument',       files.idDocument);
      if (files.address1Document) fd.append('address1Document', files.address1Document);
      if (files.address2Document) fd.append('address2Document', files.address2Document);

      const res = await axios.post(`${API_BASE_URL}/api/profile/personal-info`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success('Personal information updated successfully');
        const updated = res.data.data || {};
        setProfileData((p: any) => ({
          ...p, personalInfo: {
            ...formData,
            idDocument:       updated.idDocument       || formData.idDocument,
            address1Document: updated.address1Document || formData.address1Document,
            address2Document: updated.address2Document || formData.address2Document,
          },
        }));
        (['idDocument','address1Document','address2Document'] as DocField[]).forEach(field => {
          if (updated[field]) setPreviews(p => ({ ...p, [field]: getDocUrl(updated[field]) }));
        });
      }
    } catch {
      toast.error('Failed to update personal information');
    } finally {
      setLoading(false);
    }
  };

  const renderDocPreview = (field: DocField) => {
    const preview = previews[field];
    const fileName = formData[field] as string;
    const isPdf = preview === 'PDF_DOC' || (typeof fileName === 'string' && fileName.toLowerCase().endsWith('.pdf'));
    const pdfUrl = preview !== 'PDF_DOC' && preview ? preview : (fileName?.startsWith('http') ? fileName : getDocUrl(fileName));

    if (isPdf && pdfUrl && pdfUrl !== 'PDF_DOC') {
      return (
        <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
          <button type="button" onClick={() => window.open(pdfUrl, '_blank')}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', color:'#6366f1' }}>
            <Eye style={{ width:12, height:12 }} /> View PDF
          </button>
        </div>
      );
    }
    if (isPdf) {
      return <p style={{ fontSize:11, color:'var(--theme-text-muted)', marginTop:8 }}>PDF will be viewable after saving.</p>;
    }
    const imgSrc = preview && preview !== 'PDF_DOC' && (preview.startsWith('blob:') || preview.startsWith('http')) ? preview : null;
    if (imgSrc) {
      return (
        <motion.div
          initial={{ opacity:0, scale:0.95 }}
          animate={{ opacity:1, scale:1 }}
          style={{ marginTop:10, borderRadius:10, overflow:'hidden', border:'1.5px solid var(--theme-border)', maxWidth:200, cursor:'pointer' }}
          onClick={() => window.open(imgSrc,'_blank')}
        >
          <img src={imgSrc} alt={field} style={{ width:'100%', height:'auto', maxHeight:120, objectFit:'cover', display:'block' }} />
          <div style={{ padding:'5px 8px', fontSize:10, color:'var(--theme-text-muted)', background:'var(--theme-bg-main)' }}>
            <Eye style={{ width:10, height:10, display:'inline', marginRight:4 }} />Click to view full size
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const isDocUploaded = (field: DocField) => {
    return !!(previews[field] && previews[field] !== 'PDF_DOC') || !!files[field];
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ borderRadius:14, border:'1px solid var(--theme-border)', overflow:'hidden' }}>

        {/* Section: Personal Details (read-only) */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--theme-border)', background:'var(--theme-bg-card)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <span style={{ width:4, height:18, borderRadius:2, background:'#6366f1', display:'inline-block' }} />
            <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, color:'var(--theme-text-muted)', margin:0 }}>Personal Details</p>
            <span style={{ fontSize:10, padding:'1px 6px', borderRadius:4, background:'rgba(99,102,241,0.1)', color:'#6366f1', fontWeight:600 }}>Read-only</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label:'First Name',   value:formData.firstname },
              { label:'Last Name',    value:formData.lastname },
              { label:'Date of Birth', value:formData.dateofbirth ? new Date(formData.dateofbirth).toLocaleDateString() : '' },
              { label:'Phone',        value:formData.phone },
              { label:'Email',        value:formData.email },
            ].map(f => (
              <div key={f.label}>
                <label style={labelStyle}>{f.label}</label>
                <input value={f.value} readOnly style={readonlyStyle} />
              </div>
            ))}
          </div>
        </div>

        {/* Section: Additional Info */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--theme-border)', background:'var(--theme-bg-card)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <span style={{ width:4, height:18, borderRadius:2, background:'#10b981', display:'inline-block' }} />
            <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, color:'var(--theme-text-muted)', margin:0 }}>Additional Information</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Education */}
            <div>
              <label style={labelStyle}>Education Level</label>
              <select
                value={formData.educationLevel || ''}
                onChange={e => setFormData(p => ({ ...p, educationLevel: e.target.value }))}
                style={{ ...inputStyle }}
                onFocus={e => e.target.style.borderColor='#6366f1'}
                onBlur={e => e.target.style.borderColor='var(--theme-border)'}
              >
                <option value="">Select education level</option>
                {EDUCATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Other education */}
            {formData.educationLevel === 'other' && (
              <div>
                <label style={labelStyle}>Please specify</label>
                <input
                  type="text" placeholder="Your education level"
                  value={formData.otherEducation || ''}
                  onChange={e => setFormData(p => ({ ...p, otherEducation: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor='#6366f1'}
                  onBlur={e => e.target.style.borderColor='var(--theme-border)'}
                />
              </div>
            )}

            {/* Employment */}
            <div>
              <label style={labelStyle}>Employment Status</label>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                {(['yes','no'] as const).map(v => (
                  <label key={v} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'9px 16px', borderRadius:10, border:`1.5px solid ${formData.isEmployed===v ? '#6366f1' : 'var(--theme-border)'}`, background:formData.isEmployed===v ? 'rgba(99,102,241,0.08)' : 'var(--theme-bg-main)', flex:1, justifyContent:'center' }}>
                    <input type="radio" value={v} checked={formData.isEmployed===v} onChange={() => setFormData(p => ({ ...p, isEmployed: v }))} style={{ accentColor:'#6366f1' }} />
                    <span style={{ fontSize:13, fontWeight:600, color:formData.isEmployed===v ? '#6366f1' : 'var(--theme-text-muted)' }}>
                      {v === 'yes' ? 'Employed' : 'Unemployed'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Document Uploads */}
        <div style={{ padding:'20px 24px', background:'var(--theme-bg-card)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <span style={{ width:4, height:18, borderRadius:2, background:'#f59e0b', display:'inline-block' }} />
            <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, color:'var(--theme-text-muted)', margin:0 }}>Document Uploads</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DOC_FIELDS.map(({ field, label, sub }) => (
              <div key={field} style={{
                padding:16, borderRadius:12, border:'1.5px solid var(--theme-border)',
                background:'var(--theme-bg-main)', transition:'border-color 0.15s',
              }}>
                <input ref={docRefs[field]} name={field} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="hidden" />

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <FileText style={{ width:14, height:14, color:'var(--theme-text-muted)' }} />
                    <p style={{ fontSize:13, fontWeight:700, color:'var(--theme-text-primary)', margin:0 }}>{label}</p>
                  </div>
                  {isDocUploaded(field) && (
                    <CheckCircle style={{ width:14, height:14, color:'#10b981' }} />
                  )}
                </div>
                <p style={{ fontSize:11, color:'var(--theme-text-muted)', marginBottom:12 }}>{sub}</p>

                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button
                    type="button"
                    onClick={() => docRefs[field].current?.click()}
                    style={{
                      display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8,
                      fontSize:12, fontWeight:600, cursor:'pointer',
                      background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', color:'#6366f1',
                    }}
                  >
                    <Upload style={{ width:12, height:12 }} /> Upload
                  </button>
                  <WebcamCapture onCapture={handleCaptured} fieldName={field} />
                </div>

                {/* Preview */}
                {renderDocPreview(field)}

                {/* File name after upload */}
                {files[field] && (
                  <p style={{ fontSize:10, color:'var(--theme-text-muted)', marginTop:6, wordBreak:'break-all' }}>
                    📎 {files[field]!.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', background:'var(--theme-bg-main)', borderTop:'1px solid var(--theme-border)', display:'flex', justifyContent:'flex-end' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'10px 24px', borderRadius:10,
              border:'none', cursor:'pointer', fontSize:14, fontWeight:700,
              background:'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'white',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? (
              <><div style={{ width:14, height:14, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />Saving…</>
            ) : (
              <><Save style={{ width:14, height:14 }} />Save Personal Info</>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
};

export default PersonalInfoForm;
