/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { FileText, Edit3, Calendar, CheckSquare, RefreshCw, Layers, ShieldCheck, Download } from 'lucide-react';
import { Document } from '../types';

interface DocChamberProps {
  documents: Document[];
  onUploadDocument: (name: string) => Promise<void>;
  onSignDocument: (id: string, signatureBase64: string) => Promise<void>;
}

export default function DocChamber({ documents, onUploadDocument, onSignDocument }: DocChamberProps) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [newDocName, setNewDocName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [signing, setSigning] = useState(false);
  
  // HTML5 Drawing Canvas states & refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  // Sync selected doc when list updates
  useEffect(() => {
    if (selectedDoc) {
      const refreshed = documents.find(d => d.id === selectedDoc.id);
      if (refreshed) {
        setSelectedDoc(refreshed);
      }
    } else if (documents.length > 0) {
      setSelectedDoc(documents[0]);
    }
  }, [documents]);

  // Set up drawing on Canvas
  useEffect(() => {
    if (selectedDoc?.status === 'Pending' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#2563eb'; // Sleek Royal Blue
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [selectedDoc]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasStrokes(true);

    const pos = getEventPosition(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault(); // Prevent scrolling on touch
    const pos = getEventPosition(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getEventPosition = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim()) return;
    setUploading(true);
    try {
      await onUploadDocument(newDocName);
      setNewDocName('');
    } finally {
      setUploading(false);
    }
  };

  const handleSignSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedDoc || !hasStrokes) return;
    
    setSigning(true);
    try {
      const signatureBase64 = canvas.toDataURL('image/png');
      await onSignDocument(selectedDoc.id, signatureBase64);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT: Documents list & uploads */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="font-sans font-bold text-slate-900 text-base mb-4 flex items-center">
            <Layers className="h-5 w-5 text-blue-600 mr-2" />
            Venture Agreement Chamber
          </h3>

          <form onSubmit={handleUpload} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="e.g. Convertible Note Term Sheet.pdf"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              disabled={uploading}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={uploading || !newDocName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center shadow-xs"
            >
              {uploading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <span>Upload</span>
              )}
            </button>
          </form>

          {documents.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
              <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-xs">No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {documents.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <FileText className={`h-5 w-5 mt-0.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div className="truncate flex-1">
                      <div className="font-sans font-semibold text-xs sm:text-sm truncate">
                        {doc.name}
                      </div>
                      <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500 font-mono">
                        <span>v{doc.version}</span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.5 rounded ${
                          doc.status === 'Signed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-sans' : 'bg-amber-50 text-amber-700 border border-amber-100 font-sans'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Document Vault & E-Sign viewport */}
      <div className="lg:col-span-7">
        {selectedDoc ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col h-full">
            {/* Header */}
            <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-slate-900 font-sans font-bold text-sm sm:text-base">
                  {selectedDoc.name}
                </h4>
                <p className="text-slate-500 text-xs mt-0.5 flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                  Uploaded on: {new Date(selectedDoc.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-blue-600 font-bold font-mono shadow-xs">
                Version {selectedDoc.version}.0
              </span>
            </div>

            {/* Viewport Simulation */}
            <div className="p-5 flex-1 space-y-5 bg-white">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 text-xs space-y-2 leading-relaxed">
                <p className="font-sans font-bold text-slate-800">VENTURE LEGAL AGREEMENT CONTEXT (SIMULATED SECURE VAULT):</p>
                <p>This document constitutes a binding venture agreement between <strong className="text-slate-800">{selectedDoc.creatorName}</strong> and the signatory investor.</p>
                <p>By signing on the digital coordinate pad below, both parties endorse and accept the terms of the conversion, equity fraction ratios, ledger payments, and board of directors clauses listed within certified file ID hash <strong className="text-blue-600 font-mono">MD5-{selectedDoc.id}</strong>.</p>
                <p>All recorded strokes are digitally stamped with the signer's identity and timestamped to provide instant verification under international e-signature compliance acts.</p>
              </div>

              {/* signature status / rendering canvas */}
              {selectedDoc.status === 'Signed' ? (
                <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-5 text-center space-y-3">
                  <div className="bg-emerald-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h5 className="text-emerald-700 font-sans font-bold text-xs uppercase tracking-wider">
                      Secured Electronic Signature Certified
                    </h5>
                    <p className="text-slate-500 text-[11px] mt-1 font-mono">
                      Stamped on: {new Date(selectedDoc.signedAt || '').toLocaleString()}
                    </p>
                  </div>
                  {selectedDoc.signatureData && (
                    <div className="bg-white rounded-xl p-3 inline-block max-w-xs border border-emerald-100 shadow-xs">
                      <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider mb-1 text-left">Signature matrix:</p>
                      <img
                        src={selectedDoc.signatureData}
                        alt="E-signature stamp"
                        className="max-h-24 mx-auto object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center uppercase tracking-wider">
                      <Edit3 className="h-4 w-4 mr-1 text-blue-600" />
                      Sign on Drawing Coordinate Pad
                    </label>
                    <button
                      onClick={clearCanvas}
                      disabled={!hasStrokes}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer disabled:opacity-40"
                    >
                      Clear Pad
                    </button>
                  </div>

                  {/* Draw canvas matrix */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={180}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-44 bg-slate-50 rounded-lg cursor-crosshair border border-dashed border-slate-300"
                    />
                  </div>

                  <button
                    onClick={handleSignSubmit}
                    disabled={signing || !hasStrokes}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {signing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4" />
                        <span>E-Sign & Certify Document (Upgrade Version)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xs">
            <FileText className="h-12 w-12 text-slate-300 mb-3" />
            <h4 className="text-slate-700 font-medium font-sans">No Document Selected</h4>
            <p className="text-slate-400 text-xs mt-1 max-w-sm">
              Choose an agreement card from the Venture Chamber listing or upload a new contract to review legal terms and bind electronic signatures.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
