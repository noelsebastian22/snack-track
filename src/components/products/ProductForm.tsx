'use client';

import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera, X, Loader2 } from 'lucide-react';
import { saveProduct, uploadProductImage } from '@/app/actions/product-actions';

interface ProductFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
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
        // Compress image
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);

        // Convert to base64 for server action upload
        const base64Data = await fileToBase64(compressedFile);

        // Upload via server action
        const uploadRes = await uploadProductImage(base64Data);
        if (!uploadRes.success || !uploadRes.imageUrl) {
          throw new Error(uploadRes.error || 'Upload failed');
        }

        imageUrl = uploadRes.imageUrl;
      }

      // Save to database via server action
      const result = await saveProduct({
        name: formData.name,
        description: formData.description || null,
        price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
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
    <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-white border-2 border-[var(--color-secondary)] rounded-[var(--radius-lg)]">
      <div className="flex justify-between items-center mb-2">
        <h2 className="headline-lg">Add Product</h2>
        <button type="button" onClick={onCancel} className="p-2">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Image Upload */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full aspect-square bg-[var(--color-surface-container)] border-2 border-dashed border-[var(--color-outline)] rounded-[var(--radius-md)] flex flex-col items-center justify-center cursor-pointer overflow-hidden"
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <Camera size={48} className="text-[var(--color-outline)]" />
              <span className="label-bold mt-2">Upload Photo</span>
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
        <div className="space-y-2">
          <label className="label-bold block">Product Name</label>
          <input
            required
            type="text"
            placeholder="e.g. Salted Soft Pretzel"
            className="w-full p-3 border-2 border-[var(--color-secondary)] rounded-[var(--radius-default)] body-md outline-none focus:border-[var(--color-primary)]"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="label-bold block">Price ($)</label>
          <input
            required
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full p-3 border-2 border-[var(--color-secondary)] rounded-[var(--radius-default)] body-md outline-none focus:border-[var(--color-primary)]"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between p-3 border-2 border-[var(--color-secondary)] rounded-[var(--radius-default)]">
          <span className="label-bold">Show in Menu</span>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
            className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_active ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-outline)]'}`}
          >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[var(--spacing-touch-target)] bg-[var(--color-primary)] text-white label-bold rounded-[var(--radius-default)] border-2 border-[var(--color-secondary)] active:translate-y-0.5 flex items-center justify-center"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Save Product'}
        </button>
      </div>
    </form>
  );
}
