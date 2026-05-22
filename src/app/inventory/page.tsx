'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import imageCompression from 'browser-image-compression';
import { Plus, Minus, Trash2, Edit3, Camera, Loader2, Search } from 'lucide-react';
import BottomNav from '@/components/layout/BottomNav';
import Dialog from '@/components/ui/Dialog';
import { updateProductQty, toggleProductActive, deleteProduct, saveProduct, uploadProductImage, UploadResult } from '@/app/actions/product-actions';

const supabase = createClient();

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
  qty_available: number;
  created_at: string;
  updated_at: string;
}

function ProductCard({
  product,
  onRefresh,
  onEdit,
  onDelete,
}: {
  product: Product;
  onRefresh: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  const [qty, setQty] = useState(product.qty_available);
  const [updating, setUpdating] = useState(false);

  const updateQty = async (delta: number) => {
    const newQty = qty + delta;
    if (newQty < 0 || updating) return;
    setQty(newQty);
    setUpdating(true);
    try {
      const res = await updateProductQty(product.id, newQty);
      if ('error' in res) {
        console.error('Error updating qty:', res.error);
      }
    } catch (e) {
      console.error('Error updating qty:', e);
    } finally {
      setUpdating(false);
      onRefresh();
    }
  };

  const toggleActive = async () => {
    try {
      const res = await toggleProductActive(product.id);
      if ('error' in res) console.error('Error toggling active:', res.error);
    } catch (e) {
      console.error('Error toggling active:', e);
    } finally {
      onRefresh();
    }
  };

  return (
    <div className={`bg-white border-2 border-secondary rounded-bento overflow-hidden shadow-[4px_4px_0px_#1A1C1C] flex flex-col ${!product.is_active ? 'opacity-60' : ''}`}>
      <div className="h-40 bg-surface-container relative overflow-hidden border-b-2 border-secondary">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline font-bold text-sm">NO IMAGE</div>
        )}
        <button
          onClick={toggleActive}
          className={`absolute top-3 right-3 px-3 py-1.5 text-xs font-bold uppercase rounded-full border-2 transition-colors ${
            product.is_active
              ? 'bg-success text-white border-success'
              : 'bg-surface-container-highest text-on-surface-variant border-outline'
          }`}
        >
          {product.is_active ? 'Active' : 'Hidden'}
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-black uppercase text-sm leading-tight flex-1 truncate pr-2">{product.name}</h3>
          <span className="text-xl font-black text-primary whitespace-nowrap">${(product.price / 100).toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-surface-container border-2 border-secondary rounded-full px-1 py-1">
            <button
              onClick={() => updateQty(-1)}
              disabled={updating}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus size={18} strokeWidth={3} />
            </button>
            <span className="text-xl font-black min-w-[2.5ch] text-center tabular-nums">{qty}</span>
            <button
              onClick={() => updateQty(1)}
              disabled={updating}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => onEdit(product)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
              aria-label="Edit product"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-error/10 transition-colors text-error"
              aria-label="Delete product"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductForm({
  product,
  onSuccess,
}: {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product ? (product.price / 100).toString() : '');
  const [qtyAvailable, setQtyAvailable] = useState(product?.qty_available || 0);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = product?.image_url || '';

      if (imageFile) {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true };
        const compressedFile = await imageCompression(imageFile, options);

        // Convert to base64 for server action
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedFile);
        });

        const uploadRes: UploadResult = await uploadProductImage(base64);
        if (!uploadRes.success || !uploadRes.imageUrl) {
          throw new Error('Failed to upload image');
        }
        imageUrl = uploadRes.imageUrl;
      }

      const saveRes = await saveProduct({
        id: product?.id,
        name,
        description,
        price: Math.round(parseFloat(price) * 100),
        qty_available: qtyAvailable,
        is_active: isActive,
        image_url: imageUrl || null,
      });

      if (!saveRes.success) throw new Error(saveRes.error || 'Failed to save product');

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
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative w-full aspect-video bg-surface-container border-2 border-dashed border-outline rounded-bento flex flex-col items-center justify-center cursor-pointer overflow-hidden"
      >
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <>
            <Camera size={40} className="text-outline mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Upload Photo</span>
          </>
        )}
        <input ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" type="file" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Product Name</label>
        <input
          required
          type="text"
          placeholder="e.g. Salted Soft Pretzel"
          className="w-full p-3 border-2 border-secondary rounded-lg font-medium outline-none focus:border-primary transition-colors"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Description</label>
        <textarea
          rows={2}
          placeholder="Optional description"
          className="w-full p-3 border-2 border-secondary rounded-lg font-medium outline-none focus:border-primary transition-colors resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Price ($)</label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          className="w-full p-3 border-2 border-secondary rounded-lg font-medium outline-none focus:border-primary transition-colors"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Initial Stock</label>
        <input
          type="number"
          min="0"
          className="w-full p-3 border-2 border-secondary rounded-lg font-medium outline-none focus:border-primary transition-colors"
          value={qtyAvailable}
          onChange={(e) => setQtyAvailable(parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="flex items-center justify-between p-3 border-2 border-secondary rounded-lg">
        <span className="text-sm font-bold">Show in Menu</span>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`w-14 h-7 rounded-full transition-colors relative ${isActive ? 'bg-primary' : 'bg-outline'}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow ${isActive ? 'translate-x-7' : ''}`} />
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-primary text-white font-bold rounded-lg border-2 border-secondary shadow-[4px_4px_0px_#1A1C1C] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : product ? 'Update Product' : 'Save Product'}
      </button>
    </form>
  );
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      const res = await deleteProduct(id);
      if ('error' in res) console.error('Error deleting product:', res.error);
    } catch (e) {
      console.error('Error deleting product:', e);
    } finally {
      fetchProducts();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-secondary text-white px-5 py-4">
        <div className="max-w-5xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Inventory</span>
          <h1 className="text-2xl font-black uppercase">Snack Management</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-5 space-y-5">
        {/* Search + Add */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-secondary rounded-bento font-medium outline-none focus:border-primary transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-12 h-12 bg-primary text-white rounded-bento border-2 border-secondary shadow-[4px_4px_0px_#1A1C1C] flex items-center justify-center active:translate-y-0.5 active:shadow-none flex-shrink-0"
            aria-label="Add new snack"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-on-surface-variant">
            <p className="font-medium">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onRefresh={fetchProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingProduct ? 'Edit Snack' : 'Add New Snack'}
      >
        <ProductForm
          product={editingProduct}
          onSuccess={() => {
            setDialogOpen(false);
            setEditingProduct(null);
            fetchProducts();
          }}
          onCancel={() => setDialogOpen(false)}
        />
      </Dialog>

      <BottomNav />
    </main>
  );
}
