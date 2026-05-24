'use client';

import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, Loader2 } from 'lucide-react';
import { saveProduct, uploadProductImage } from '@/app/actions/product-actions';

interface ProductFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function ProductForm({ onSuccess, onCancel: _onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    qty_available: 0,
    is_active: true,
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';
      const file = fileInputRef.current?.files?.[0];

      if (file) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);

        const base64Data = await fileToBase64(compressedFile);

        const uploadRes = await uploadProductImage(base64Data);
        if (!uploadRes.success || !uploadRes.imageUrl) {
          throw new Error(uploadRes.error || 'Upload failed');
        }

        imageUrl = uploadRes.imageUrl;
      }

      const result = await saveProduct({
        name: formData.name,
        description: formData.description || null,
        price: Math.round(parseFloat(formData.price) * 100),
        qty_available: formData.qty_available,
        is_active: formData.is_active,
        image_url: imageUrl,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save product');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image Upload */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="relative w-full aspect-video bg-[#0B0F19] border-2 border-dashed border-[#1E293B] rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden hover:border-[#00C853]/50 transition-colors"
      >
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <>
            <Camera size={40} className="text-[#94A3B8] mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Upload Photo</span>
          </>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageChange} 
          className="hidden" 
          accept="image/*" 
        />
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Product Name</label>
          <input
            required
            type="text"
            placeholder="e.g. Salted Soft Pretzel"
            className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl text-white px-4 py-3 outline-none focus:border-[#00C853] focus:ring-1 focus:ring-[#00C853] transition-colors"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Price ($)</label>
          <input
            required
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl text-white px-4 py-3 outline-none focus:border-[#00C853] focus:ring-1 focus:ring-[#00C853] transition-colors"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-[#0B0F19] border border-[#1E293B] rounded-xl">
          <span className="text-sm font-bold text-white">Show in Menu</span>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
            className={`w-14 h-7 rounded-full transition-colors relative ${formData.is_active ? 'bg-[#00C853]' : 'bg-[#1E293B]'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow ${formData.is_active ? 'translate-x-7' : ''}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#00C853] text-white font-bold rounded-xl hover:bg-[#00A844] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Save Product'}
        </button>
      </div>
    </form>
  );
}
