'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Shield, CheckCircle2, Globe, Eye, Users,
  Scale, FileText, Lock, Printer,
  UploadCloud, ChevronRight, AlertCircle, Sparkles, KeyRound
} from 'lucide-react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

type UploadStatus = 'idle' | 'uploading' | 'error';

type TrustDocument = {
  id: string;
  assetId: string;
  fileName: string;
  url: string;
};

type AssetDocumentLookup = Record<string, TrustDocument | undefined>;

const StatPill = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 shadow-sm">
    <div className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div>
      <div className="text-[11px] text-muted-foreground font-light uppercase tracking-wider">{label}</div>
      <div className="text-[13px] font-light text-foreground mt-0.5">{value}</div>
    </div>
  </div>
);

const SectionHeader = ({ number, title, icon: Icon }: { number: string; title: string; icon: any }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center text-[12px] font-semibold shrink-0">
      {number}
    </div>
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <h3 className="text-[15px] font-semibold text-foreground tracking-tight">{title}</h3>
    </div>
  </div>
);

const UploadZone = ({
  id,
  title,
  label,
  description,
  isHighlighted = false,
  uploadedFiles,
  uploadStatuses,
  assetDocuments,
  onUpload,
  onOpenProtectedViewer,
  fileInputRefs,
}: {
  id: string;
  title: string;
  label: string;
  description: string;
  isHighlighted?: boolean;
  uploadedFiles: Record<string, string>;
  onUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadStatuses: Record<string, UploadStatus>;
  assetDocuments: AssetDocumentLookup;
  onOpenProtectedViewer: (doc: TrustDocument) => void;
  fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}) => {
  const fileName = uploadedFiles[id];
  const isUploading = uploadStatuses[id] === 'uploading';
  const hasError = uploadStatuses[id] === 'error';
  const uploadedDoc = assetDocuments[id];

  const handleZoneClick = () => {
    if (uploadedDoc) {
      onOpenProtectedViewer(uploadedDoc);
      return;
    }
    fileInputRefs.current[id]?.click();
  };

  return (
    <div
      onClick={handleZoneClick}
      className={`cursor-pointer transition-all duration-200 rounded-lg p-4 text-center border ${
        fileName
          ? 'border-primary/30 bg-primary/5 py-2'
          : isHighlighted
          ? 'border-secondary bg-secondary/20 hover:bg-secondary/30'
          : 'border-dashed border-border hover:border-primary/30 hover:bg-secondary/10'
      }`}
    >
      <input
        ref={(el) => { fileInputRefs.current[id] = el; }}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onUpload(id, e)}
      />
      {isUploading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <UploadCloud className="w-4 h-4 animate-pulse" />
          <span className="text-[13px] font-light">Uploading...</span>
        </div>
      ) : fileName ? (
        <div className="flex items-center justify-between gap-2 text-primary">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="w-4 h-4 shrink-0" />
            <div className="min-w-0 text-left">
              <p className="text-[12px] font-semibold text-foreground truncate">{title}</p>
              <p className="text-[11px] font-light truncate">{fileName}</p>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">View PDF</span>
        </div>
      ) : (
        <div>
          <UploadCloud className={`w-7 h-7 mx-auto mb-2 ${isHighlighted ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`text-[13px] font-light block mb-1 ${isHighlighted ? 'text-foreground' : 'text-foreground'}`}>
            {label}
          </span>
          <span className="text-[11px] text-muted-foreground">{description}</span>
          {hasError && <span className="block mt-2 text-[11px] text-red-500">Upload failed. Try again.</span>}
        </div>
      )}
    </div>
  );
};

const AssetCard = ({
  title,
  description,
  uploadLabel,
  uploadDescription,
  id,
  badge,
  isHighlighted = false,
  uploadedFiles,
  uploadStatuses,
  assetDocuments,
  onUpload,
  onOpenProtectedViewer,
  fileInputRefs,
}: {
  title: string;
  description: string;
  uploadLabel: string;
  uploadDescription: string;
  id: string;
  badge?: string;
  isHighlighted?: boolean;
  uploadedFiles: Record<string, string>;
  uploadStatuses: Record<string, UploadStatus>;
  assetDocuments: AssetDocumentLookup;
  onUpload: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenProtectedViewer: (doc: TrustDocument) => void;
  fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}) => (
  <div
    className={`bg-card border border-border shadow-sm rounded-lg flex flex-col overflow-hidden hover:border-foreground/20 transition-colors ${
      isHighlighted ? 'ring-1 ring-primary/30' : ''
    }`}
  >
    <div className="p-4 border-b border-border bg-[#FFF6ED]">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-[14px] text-foreground leading-snug">{title}</div>
        {badge && (
          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-secondary/60 text-primary border border-primary/20 font-light uppercase tracking-wider">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[12px] text-muted-foreground mt-1 font-light leading-relaxed">{description}</p>
    </div>
    <div className="p-4 mt-auto">
      <UploadZone
        id={id}
        title={title}
        label={uploadLabel}
        description={uploadDescription}
        isHighlighted={isHighlighted}
        uploadedFiles={uploadedFiles}
        uploadStatuses={uploadStatuses}
        assetDocuments={assetDocuments}
        onUpload={onUpload}
        onOpenProtectedViewer={onOpenProtectedViewer}
        fileInputRefs={fileInputRefs}
      />
    </div>
  </div>
);

const TrustPage = () => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>({});
  const [documents, setDocuments] = useState<TrustDocument[]>([]);
  const [isAccessUnlocked, setIsAccessUnlocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [activeDocument, setActiveDocument] = useState<TrustDocument | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [replaceCode, setReplaceCode] = useState('');
  const [replaceCodeError, setReplaceCodeError] = useState('');
  const [isManagementUnlocked, setIsManagementUnlocked] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const trustViewPassword = process.env.NEXT_PUBLIC_TRUST_VIEW_PASSWORD;
  const trustReplacePassword = process.env.NEXT_PUBLIC_TRUST_REPLACE_PASSWORD;
  const totalDocs = 8;

  const assetDocuments = documents.reduce<AssetDocumentLookup>((acc, doc) => {
    if (!acc[doc.assetId]) {
      acc[doc.assetId] = doc;
    }
    return acc;
  }, {});

  const uploadedCount = Object.keys(assetDocuments).length;

  useEffect(() => {
    const docsQuery = query(collection(db, 'trust_documents'), orderBy('uploadedAt', 'desc'));
    const unsubscribe = onSnapshot(docsQuery, (snapshot) => {
      const nextDocs = snapshot.docs.map((docItem) => {
        const data = docItem.data() as Omit<TrustDocument, 'id'>;
        return {
          id: docItem.id,
          assetId: data.assetId,
          fileName: data.fileName,
          url: data.url,
        };
      });
      setDocuments(nextDocs);
      setUploadedFiles(() => {
        const latestByAsset: Record<string, string> = {};
        nextDocs.forEach((doc) => {
          if (!latestByAsset[doc.assetId]) {
            latestByAsset[doc.assetId] = doc.fileName;
          }
        });
        return latestByAsset;
      });
    });

    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatuses((prev) => ({ ...prev, [id]: 'uploading' }));

    try {
      const fileRef = ref(storage, `trust-documents/${id}/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, 'trust_documents'), {
        assetId: id,
        fileName: file.name,
        url,
        uploadedAt: serverTimestamp(),
      });

      setUploadedFiles((prev) => ({ ...prev, [id]: file.name }));
      setUploadStatuses((prev) => ({ ...prev, [id]: 'idle' }));
    } catch (error) {
      console.error(`Failed to upload ${id}:`, error);
      setUploadStatuses((prev) => ({ ...prev, [id]: 'error' }));
    }
  };

  const handleUnlock = () => {
    if (!trustViewPassword) {
      setAccessError('Trust view password is not configured.');
      return;
    }
    if (accessCode.trim() !== trustViewPassword) {
      setAccessError('Invalid access code. Request access below.');
      return;
    }
    setAccessError('');
    setIsAccessUnlocked(true);
  };

  const requestAccess = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!validEmail) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setEmailError('');
    setRequestStatus('submitting');
    try {
      await addDoc(collection(db, 'trust_access_requests'), {
        email: normalizedEmail,
        requestedAt: serverTimestamp(),
        status: 'pending',
      });
      setRequestStatus('submitted');
      setEmail('');
    } catch (error) {
      console.error('Failed to submit access request:', error);
      setRequestStatus('error');
    }
  };

  const openProtectedViewer = (doc: TrustDocument) => {
    setActiveDocument(doc);
    setAccessError('');
    setRequestStatus('idle');
    setIsAccessUnlocked(false);
    setAccessCode('');
  };

  const openKeyModal = () => {
    setIsKeyModalOpen(true);
    setReplaceCode('');
    setReplaceCodeError('');
  };

  const submitManagementCode = () => {
    if (!trustReplacePassword) {
      setReplaceCodeError('Management password is not configured.');
      return;
    }
    if (replaceCode.trim() !== trustReplacePassword) {
      setReplaceCodeError('Invalid code.');
      return;
    }

    setIsManagementUnlocked(true);
    setIsKeyModalOpen(false);
    setReplaceCode('');
    setReplaceCodeError('');
  };

  const sharedProps = {
    uploadedFiles,
    uploadStatuses,
    assetDocuments,
    onUpload: handleFileUpload,
    onOpenProtectedViewer: openProtectedViewer,
    fileInputRefs,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Topbar — matches dashboard Topbar pattern */}
      <header className="h-[52px] border-b border-border bg-white shrink-0 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 font-light text-[13px] text-foreground">
          <svg viewBox="0 0 892.5 186.5" className="h-7 w-auto">
            <path fill="#005e04" d="M213.05,97.15c-3.77-1.36-8.94-2.23-15.53-2.61l-12.25-.86c-2.72-.19-4.57-.55-5.55-1.09-.98-.54-1.47-1.34-1.47-2.42,0-1.33.79-2.37,2.37-3.13,1.58-.76,3.96-1.14,7.12-1.14,2.6,0,4.75.27,6.46.81,1.71.54,3.07,1.27,4.08,2.18,1.01.92,1.68,1.98,1.99,3.18h22.03c-.44-3.8-2.14-7.14-5.08-10.02-2.94-2.88-6.85-5.11-11.73-6.7-4.88-1.58-10.45-2.37-16.71-2.37s-11.97.68-16.71,2.04c-4.75,1.36-8.45,3.43-11.11,6.22-2.66,2.79-3.99,6.27-3.99,10.45,0,3.17.85,5.9,2.56,8.21,1.71,2.31,4.53,4.16,8.45,5.55,3.92,1.39,9.21,2.31,15.86,2.75l9.21.66c3.35.25,5.75.65,7.17,1.19,1.42.54,2.14,1.41,2.14,2.61,0,1.39-.9,2.45-2.71,3.18-1.8.73-4.42,1.09-7.83,1.09-2.79,0-5.14-.25-7.08-.76-1.93-.51-3.5-1.23-4.7-2.18-1.2-.95-2.03-2.09-2.47-3.42h-22.03c.19,3.99,1.76,7.5,4.7,10.54,2.94,3.04,7.03,5.38,12.25,7.03,5.22,1.65,11.28,2.47,18.19,2.47s12.52-.73,17.43-2.18c4.91-1.46,8.7-3.66,11.4-6.6,2.69-2.94,4.04-6.6,4.04-10.97,0-3.23-.81-5.98-2.42-8.26-1.61-2.28-4.31-4.1-8.07-5.46Z"/>
            <path fill="#005e04" d="M285.79,77.73c-3.7-2.09-8.18-3.13-13.44-3.13-4.31,0-8.26,1-11.87,2.99-2.89,1.6-5.42,3.82-7.6,6.66v-26.74h-21.75v73.12h21.75v-26.02c0-2.6.47-4.81,1.42-6.65.95-1.84,2.31-3.26,4.08-4.27,1.77-1.01,3.86-1.52,6.27-1.52,3.48,0,6.16.95,8.02,2.85,1.87,1.9,2.8,4.62,2.8,8.17v27.44h21.75v-30.58c0-5.13-.98-9.61-2.94-13.44-1.96-3.83-4.8-6.79-8.5-8.88Z"/>
            <path fill="#005e04" d="M365.46,88.84c-2.5-5.06-6.09-8.97-10.78-11.73-4.69-2.75-10.35-4.13-17-4.13s-12.05,1.19-17.14,3.56c-5.1,2.37-9.12,5.71-12.06,10.02-2.94,4.31-4.42,9.31-4.42,15s1.52,10.92,4.56,15.29c3.04,4.37,7.18,7.76,12.44,10.16,5.25,2.41,11.24,3.61,17.95,3.61,5.19,0,10.32-.74,15.38-2.23,5.06-1.49,9.53-3.62,13.39-6.41v-12.72c-3.29,2.09-6.92,3.67-10.87,4.75-3.96,1.08-7.99,1.61-12.11,1.61s-7.91-.58-10.83-1.76c-2.91-1.17-5.08-2.86-6.51-5.08-.42-.65-.77-1.35-1.06-2.09h42.8c0-6.84-1.25-12.79-3.75-17.85ZM331.09,88.93c1.87-1.14,4.13-1.71,6.79-1.71,2.41,0,4.48.48,6.22,1.42,1.74.95,3.13,2.33,4.18,4.13.54.94.98,2,1.33,3.18h-23.62c.22-.79.49-1.56.84-2.28.98-2.02,2.41-3.61,4.27-4.75Z"/>
            <rect fill="#005e04" x="376.91" y="57.5" width="21.75" height="73.12"/>
            <path fill="#005e04" d="M446.51,55.88c-6.4,0-11.81.97-16.24,2.9-4.43,1.93-7.79,4.78-10.07,8.55-2.24,3.7-3.37,8.25-3.41,13.63h-10.93v15.95h10.92v33.71h21.75v-33.71h21.27v-15.95h-21.27v-.66c0-2.85.73-4.95,2.18-6.31,1.46-1.36,4.24-2.04,8.36-2.04,2.22,0,4.31.16,6.27.47,1.96.32,3.93.76,5.89,1.33v-15.76c-2.6-.7-5.02-1.22-7.26-1.57-2.25-.35-4.73-.52-7.45-.52Z"/>
            <path fill="#e8a205" d="M493.48,90.4c1.9-.98,4.11-1.47,6.65-1.47,3.29,0,6.08.78,8.36,2.33,2.28,1.55,3.74,3.81,4.37,6.79h21.56c-.51-5.06-2.31-9.46-5.41-13.2-3.1-3.74-7.14-6.65-12.11-8.74-4.97-2.09-10.56-3.13-16.76-3.13-6.77,0-12.77,1.22-17.99,3.66-5.22,2.44-9.29,5.81-12.2,10.11-2.91,4.31-4.37,9.34-4.37,15.1s1.46,10.64,4.37,15c2.91,4.37,6.98,7.76,12.2,10.16,5.22,2.41,11.22,3.61,17.99,3.61,6.2,0,11.79-1.04,16.76-3.13,4.97-2.09,9.01-5.02,12.11-8.78,3.1-3.77,4.91-8.15,5.41-13.15h-21.56c-.63,2.72-2.09,4.92-4.37,6.6-2.28,1.68-5.06,2.52-8.36,2.52-2.53,0-4.75-.49-6.65-1.47-1.9-.98-3.36-2.42-4.37-4.32-1.01-1.9-1.52-4.24-1.52-7.03s.51-5.14,1.52-7.07c1.01-1.93,2.47-3.39,4.37-4.37Z"/>
            <path fill="#e8a205" d="M589.96,74.59l-1.32,10.04c-2.39-3.43-5.29-6.15-8.7-8.14-4.02-2.34-8.63-3.51-13.82-3.51s-9.91,1.19-13.96,3.56c-4.05,2.37-7.2,5.73-9.45,10.07-2.25,4.34-3.37,9.42-3.37,15.24s1.12,10.72,3.37,15.05c2.25,4.34,5.4,7.71,9.45,10.11,4.05,2.41,8.7,3.61,13.96,3.61s9.8-1.19,13.82-3.56c3.42-2.02,6.31-4.76,8.68-8.2l1.34,10.15h22.6l-3.61-27.25,3.61-27.16h-22.6ZM585.4,108.21c-1.65,1.84-3.55,3.29-5.7,4.37-2.15,1.08-4.4,1.61-6.74,1.61s-4.31-.54-6.08-1.61c-1.77-1.08-3.15-2.53-4.13-4.37-.98-1.84-1.47-3.96-1.47-6.36s.49-4.54,1.47-6.41c.98-1.87,2.36-3.34,4.13-4.42,1.77-1.08,3.8-1.61,6.08-1.61s4.59.54,6.74,1.61c2.15,1.08,4.05,2.55,5.7,4.42,1.65,1.87,2.85,4,3.61,6.41-.76,2.41-1.96,4.53-3.61,6.36Z"/>
            <path fill="#e8a205" d="M675.66,97.15c-3.77-1.36-8.94-2.23-15.53-2.61l-12.25-.86c-2.72-.19-4.57-.55-5.55-1.09-.98-.54-1.47-1.34-1.47-2.42,0-1.33.79-2.37,2.37-3.13,1.58-.76,3.96-1.14,7.12-1.14,2.6,0,4.75.27,6.46.81,1.71.54,3.07,1.27,4.08,2.18,1.01.92,1.68,1.98,1.99,3.18h22.03c-.44-3.8-2.14-7.14-5.08-10.02-2.94-2.88-6.85-5.11-11.73-6.7-4.88-1.58-10.45-2.37-16.71-2.37s-11.97.68-16.71,2.04c-4.75,1.36-8.45,3.43-11.11,6.22-2.66,2.79-3.99,6.27-3.99,10.45,0,3.17.85,5.9,2.56,8.21,1.71,2.31,4.53,4.16,8.45,5.55,3.93,1.39,9.21,2.31,15.86,2.75l9.21.66c3.36.25,5.75.65,7.17,1.19,1.42.54,2.14,1.41,2.14,2.61,0,1.39-.9,2.45-2.71,3.18-1.8.73-4.42,1.09-7.83,1.09-2.79,0-5.14-.25-7.07-.76-1.93-.51-3.5-1.23-4.7-2.18s-2.03-2.09-2.47-3.42h-22.03c.19,3.99,1.76,7.5,4.7,10.54,2.94,3.04,7.03,5.38,12.25,7.03,5.22,1.65,11.28,2.47,18.18,2.47s12.52-.73,17.43-2.18c4.91-1.46,8.7-3.66,11.4-6.6,2.69-2.94,4.04-6.6,4.04-10.97,0-3.23-.81-5.98-2.42-8.26-1.62-2.28-4.31-4.1-8.07-5.46Z"/>
            <path fill="#e8a205" d="M738.57,113.57c-2.03.41-4.34.62-6.93.62-4.18,0-6.98-.76-8.4-2.28-1.42-1.52-2.14-4.11-2.14-7.79v-13.58h22.03v-15.95h-22.03v-14.72h-12.35l-9.5,16.33-10.83,4.94v9.4h10.83v16.52c0,4.81,1,8.99,2.99,12.53,1.99,3.55,5,6.27,9.02,8.17,4.02,1.9,9.13,2.85,15.34,2.85,3.42,0,6.68-.27,9.78-.81,3.1-.54,5.67-1.12,7.69-1.76v-16.05c-1.65.63-3.48,1.16-5.51,1.57Z"/>
            <g>
              <rect fill="#005e04" x="124.76" y="82.89" width="12.5" height="12.52"/>
              <rect fill="#005e04" x="91.17" y="82.89" width="29.54" height="12.52"/>
              <rect fill="#005e04" x="91.17" y="99.43" width="29.54" height="12.52"/>
              <rect fill="#005e04" x="91.17" y="117.09" width="29.54" height="12.52"/>
              <rect fill="#005e04" x="57.73" y="99.43" width="29.54" height="12.52"/>
              <rect fill="#005e04" x="40.68" y="82.89" width="46.39" height="12.52"/>
              <rect fill="#005e04" x="124.76" y="99.43" width="12.5" height="12.52"/>
              <rect fill="#005e04" x="124.76" y="117.09" width="12.5" height="12.52"/>
              <rect fill="#005e04" x="74.78" y="117.09" width="12.5" height="12.52"/>
            </g>
            <g>
              <rect fill="#e8a205" x="764.96" y="82.89" width="12.5" height="12.52" transform="translate(1542.41 178.31) rotate(-180)"/>
              <rect fill="#e8a205" x="781.5" y="82.89" width="29.54" height="12.52" transform="translate(1592.55 178.31) rotate(-180)"/>
              <rect fill="#e8a205" x="781.5" y="99.43" width="29.54" height="12.52" transform="translate(1592.55 211.39) rotate(-180)"/>
              <rect fill="#e8a205" x="781.5" y="117.09" width="29.54" height="12.52" transform="translate(1592.55 246.71) rotate(-180)"/>
              <rect fill="#e8a205" x="814.94" y="99.43" width="29.54" height="12.52" transform="translate(1659.43 211.39) rotate(-180)"/>
              <rect fill="#e8a205" x="815.15" y="82.89" width="46.39" height="12.52" transform="translate(1676.69 178.31) rotate(-180)"/>
              <rect fill="#e8a205" x="764.96" y="99.43" width="12.5" height="12.52" transform="translate(1542.41 211.39) rotate(-180)"/>
              <rect fill="#e8a205" x="764.96" y="117.09" width="12.5" height="12.52" transform="translate(1542.41 246.71) rotate(-180)"/>
              <rect fill="#e8a205" x="814.94" y="117.09" width="12.5" height="12.52" transform="translate(1642.38 246.71) rotate(-180)"/>
            </g>
          </svg>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <button
              onClick={openKeyModal}
              className={`p-1.5 rounded-md border transition-colors ${
                isManagementUnlocked
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border hover:bg-secondary/50'
              }`}
              title="Enter management code"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-secondary/40 border border-border rounded-md px-2.5 py-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground font-light text-[12px]">Ghana AI Strategy Aligned</span>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border hover:bg-secondary/50 transition-colors text-[12px]">
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-light">Export Pack</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Hero Section — styled like a dashboard info banner */}
        <div className="bg-card border border-border shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="text-[18px] font-semibold text-foreground mb-1">Our Commitment to Accountability</h1>
                <p className="text-[13px] text-muted-foreground leading-relaxed max-w-2xl">
                  This public trust pack provides transparency into our governance, data ethics, and algorithmic
                  accountability standards — aligned with the Ghana National AI Strategy.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-[12px] text-muted-foreground font-mono bg-background border border-border rounded-md px-3 py-1.5 shrink-0">
                <span className="text-primary font-light">{uploadedCount}</span>
                <span>/ {totalDocs} docs uploaded</span>
              </div>
            </div>
          </div>

          {/* Pillars row — like a metrics strip in the dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {[
              { icon: Globe, label: 'Data Sovereignty', value: 'Ghana-Based Hosting & Control' },
              { icon: Eye, label: 'Transparency', value: 'Human-in-the-Loop Safeguards' },
              { icon: Users, label: 'Inclusivity', value: 'Localised Context-Aware Logic' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-6 py-4">
                <div className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground font-light uppercase tracking-wider">{item.label}</div>
                  <div className="text-[13px] font-light text-foreground mt-0.5">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress / status strip */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Governance', done: !!uploadedFiles['governance-statement'] && !!uploadedFiles['ai-inventory'] && !!uploadedFiles['risk-escalation'] },
            { label: 'Ethics & Privacy', done: !!uploadedFiles['data-ethics'] && !!uploadedFiles['acceptable-use'] && !!uploadedFiles['code-ethics'] },
            { label: 'Public Accountability', done: !!uploadedFiles['accountability-guideline'] && !!uploadedFiles['customer-disclosure'] },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-1.5 text-[12px] font-light shadow-sm">
              {s.done
                ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                : <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
              }
              <span className={s.done ? 'text-foreground' : 'text-muted-foreground'}>{s.label}</span>
              <span className={`text-[11px] ml-1 ${s.done ? 'text-primary' : 'text-muted-foreground'}`}>
                {s.done ? 'Complete' : 'Pending'}
              </span>
            </div>
          ))}
        </div>

        {/* Section 2 — Governance */}
        <section>
          <SectionHeader number="2" title="Governance Foundations & Risk Management" icon={Scale} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AssetCard
              title="AI Governance Statement"
              description="High-level public commitment to ethical AI usage."
              uploadLabel="Upload PDF / Link Document"
              uploadDescription="Required: Governance framework document"
              id="governance-statement"
              {...sharedProps}
            />
            <AssetCard
              title="AI Inventory List"
              description="Summary of internal AI models and systems in use."
              uploadLabel="Upload CSV / PDF"
              uploadDescription="Required: Complete AI systems inventory"
              id="ai-inventory"
              {...sharedProps}
            />
            <AssetCard
              title="Risk Escalation Map"
              description="Process for reporting and mitigating algorithmic risks."
              uploadLabel="Upload Diagram / Workflow"
              uploadDescription="Required: Risk escalation process flow"
              id="risk-escalation"
              {...sharedProps}
            />
          </div>
        </section>

        {/* Section 3 — Ethics & Data Privacy */}
        <section>
          <SectionHeader number="3" title="Applied Ethics & Data Privacy" icon={Lock} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AssetCard
              title="Data Ethics Checklist"
              description="Internal verification for ethical data sourcing and handling."
              uploadLabel="Upload Checklist Result"
              uploadDescription="Required: Completed ethics verification"
              id="data-ethics"
              {...sharedProps}
            />
            <AssetCard
              title="Acceptable Use Policy"
              description="Rules for user interaction with AI features."
              uploadLabel="Upload Policy Document"
              uploadDescription="Required: User interaction guidelines"
              id="acceptable-use"
              {...sharedProps}
            />
            <AssetCard
              title="Code of Ethics"
              description="Company-wide standards for responsible AI development."
              uploadLabel="Upload Ethics Charter"
              uploadDescription="Required: Company ethics standards"
              id="code-ethics"
              {...sharedProps}
            />
          </div>
        </section>

        {/* Section 4 — Public Trust & Accountability */}
        <section>
          <SectionHeader number="4" title="Public Trust & Accountability" icon={FileText} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssetCard
              title="Algorithmic Accountability Guideline"
              description="Public declaration of logic, API dependencies, and data sovereignty — covering third-party hosting and data flows."
              uploadLabel="Click to Upload Accountability Pack"
              uploadDescription="Required: Third-party APIs & Hosting Details"
              id="accountability-guideline"
              badge="Procurement Ready"
              isHighlighted={true}
              {...sharedProps}
            />
            <AssetCard
              title="Customer Disclosure Statement"
              description="Onboarding copy explaining AI interaction and human fallbacks — must include bias control statements."
              uploadLabel="Click to Upload UI Screens/Copy"
              uploadDescription="Must include fallback & bias control statements"
              id="customer-disclosure"
              badge="B2C / User Facing"
              isHighlighted={true}
              {...sharedProps}
            />
          </div>
        </section>

        {/* AI Note — like the RCA info box */}
        <div className="bg-secondary/30 p-4 rounded-xl border border-border flex items-start gap-4">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            All documentation submitted here is stored in secure cloud storage and used solely for compliance readiness review. ShelfCast
            aligns with Pillars 4 (Data Sovereignty) and 6 (Ethical Governance) of the Ghana National AI Strategy and the
            ARISE Framework.
          </p>
        </div>

        {/* Footer strip */}
        <div className="flex flex-wrap gap-2 pb-8">
          {['Pillar 4: Data Sovereignty', 'Pillar 6: Ethical Governance', 'ARISE Framework'].map((tag) => (
            <span key={tag} className="text-[11px] font-light text-muted-foreground border border-border px-2.5 py-1 rounded-md bg-card">
              {tag}
            </span>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground font-light self-center">
            Public AI Trust Pack — ShelfCast Intelligence
          </span>
        </div>

      </main>

      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[14px] font-semibold text-foreground">Enter management access code</p>
              <p className="text-[12px] text-muted-foreground mt-1">
                Use the management code to unlock privileged actions.
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={replaceCode}
                  onChange={(e) => setReplaceCode(e.target.value)}
                  placeholder="Replace access code"
                  className="flex-1 text-[13px] bg-transparent outline-none"
                />
              </div>
              {replaceCodeError && <p className="text-[11px] text-red-500">{replaceCodeError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsKeyModalOpen(false)}
                  className="text-[12px] px-3 py-1.5 rounded-md border border-border hover:bg-secondary/50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitManagementCode}
                  className="text-[12px] px-3 py-1.5 rounded-md border border-border hover:bg-secondary/50"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeDocument && (
        <div className="fixed inset-0 z-[60] bg-black/60 p-4 md:p-8 flex items-center justify-center">
          <div className={`w-full bg-white rounded-lg border border-border overflow-hidden flex flex-col ${
            isAccessUnlocked ? 'max-w-5xl h-[85vh]' : 'max-w-xl h-auto'
          }`}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-[13px] text-foreground font-light">{activeDocument.fileName}</p>
                <p className="text-[11px] text-muted-foreground">
                  View-only mode (client-side deterrent): print and download shortcuts are blocked in this viewer.
                </p>
              </div>
              <button
                onClick={() => setActiveDocument(null)}
                className="text-[12px] px-3 py-1.5 rounded-md border border-border hover:bg-secondary/50 transition-colors"
              >
                Close
              </button>
            </div>

            {!isAccessUnlocked ? (
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="bg-secondary/20 border border-border rounded-lg p-4">
                  <p className="text-[13px] text-foreground mb-2">Enter access code to view this PDF</p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="Access code"
                      className="flex-1 border border-border rounded-md px-3 py-2 text-[13px] bg-white"
                    />
                    <button
                      onClick={handleUnlock}
                      className="px-3 py-2 rounded-md border border-border text-[12px] hover:bg-secondary/50"
                    >
                      Unlock
                    </button>
                  </div>
                  {accessError && <p className="text-[11px] text-red-500 mt-2">{accessError}</p>}
                </div>

                <div className="bg-secondary/10 border border-border rounded-lg p-4">
                  <p className="text-[13px] text-foreground mb-2">No code? Request access</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="flex-1 border border-border rounded-md px-3 py-2 text-[13px] bg-white"
                    />
                    <button
                      onClick={requestAccess}
                      disabled={requestStatus === 'submitting'}
                      className="px-3 py-2 rounded-md border border-border text-[12px] hover:bg-secondary/50 disabled:opacity-60"
                    >
                      {requestStatus === 'submitting' ? 'Submitting...' : 'Request'}
                    </button>
                  </div>
                  {emailError && <p className="text-[11px] text-red-500 mt-2">{emailError}</p>}
                  {requestStatus === 'submitted' && (
                    <p className="text-[11px] text-primary mt-2">Access request submitted.</p>
                  )}
                  {requestStatus === 'error' && (
                    <p className="text-[11px] text-red-500 mt-2">Could not submit request. Try again.</p>
                  )}
                </div>
              </div>
            ) : (
              <iframe
                title={activeDocument.fileName}
                src={`${activeDocument.url}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full flex-1"
                onContextMenu={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && ['p', 's'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                  }
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustPage;