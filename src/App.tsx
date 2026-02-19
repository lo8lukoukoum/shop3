/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { 
  LayoutGrid, 
  ShoppingCart, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Download, 
  Upload, 
  Share2, 
  Send,
  Barcode,
  X,
  Check
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useInventory, Product } from './hooks/useInventory';
import { Scanner } from './components/Scanner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'checkout' | 'inventory' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('checkout');
  const { products, addProduct, updateProduct, deleteProduct, findByBarcode, exportData, importData } = useInventory();
  
  // Checkout State
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Inventory Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleScan = useCallback((barcode: string) => {
    const product = findByBarcode(barcode);
    if (product) {
      setCart(prev => {
        const existing = prev.find(item => item.product.barcode === barcode);
        if (existing) {
          return prev.map(item => 
            item.product.barcode === barcode 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
      toast.success(`已添加: ${product.name}`);
      // Beep or haptic feedback could be added here
    } else {
      toast.error(`未找到条码: ${barcode}`);
      // Optionally open add product modal with this barcode
      setEditingProduct({ barcode, name: '', price: 0, stock: 0 });
      setIsModalOpen(true);
    }
    setIsScanning(false);
  }, [findByBarcode]);

  const handleAddOrUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.barcode || !editingProduct?.name) return;

    if (editingProduct.id) {
      updateProduct(editingProduct as Product);
      toast.success('商品已更新');
    } else {
      const newProduct: Product = {
        ...editingProduct as Product,
        id: crypto.randomUUID(),
      };
      addProduct(newProduct);
      toast.success('商品已添加');
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('数据已导出');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) {
        toast.success('数据导入成功');
      } else {
        toast.error('数据格式错误');
      }
    };
    reader.readAsText(file);
  };

  const handleShare = async () => {
    const data = exportData();
    if (navigator.share) {
      try {
        await navigator.share({
          title: '库存数据备份',
          text: '这是我的商品库存数据备份。',
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(data);
      toast.success('数据已复制到剪贴板');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 pb-20">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-bottom border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Barcode className="text-emerald-600" />
          <span>条码收银助手</span>
        </h1>
        {activeTab === 'checkout' && cart.length > 0 && (
          <button 
            onClick={() => setCart([])}
            className="text-sm text-red-500 font-medium"
          >
            清空购物车
          </button>
        )}
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {/* Checkout Tab */}
        {activeTab === 'checkout' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setIsScanning(!isScanning)}
                className={cn(
                  "w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-md",
                  isScanning ? "bg-red-500 text-white" : "bg-emerald-600 text-white"
                )}
              >
                {isScanning ? <X size={24} /> : <Barcode size={24} />}
                {isScanning ? "停止扫描" : "开始扫码结账"}
              </button>

              {isScanning && (
                <div className="animate-in fade-in zoom-in duration-300">
                  <Scanner onScan={handleScan} active={isScanning} />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
                <h2 className="font-bold">当前订单</h2>
                <span className="text-xs text-zinc-500">共 {cart.length} 项商品</span>
              </div>
              
              {cart.length === 0 ? (
                <div className="p-12 text-center text-zinc-400">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                  <p>购物车是空的，请扫码添加商品</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {cart.map((item, idx) => (
                    <div key={idx} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-xs text-zinc-500">¥{item.product.price} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-emerald-700">¥{(item.product.price * item.quantity).toFixed(2)}</p>
                        <button 
                          onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-6 bg-emerald-50 border-t border-emerald-100 flex justify-between items-center">
                <span className="text-emerald-800 font-medium">总金额</span>
                <span className="text-3xl font-black text-emerald-700">¥{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="text" 
                  placeholder="搜索商品名称或条码..." 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              <button 
                onClick={() => {
                  setEditingProduct({ barcode: '', name: '', price: 0, stock: 0 });
                  setIsModalOpen(true);
                }}
                className="p-3 bg-emerald-600 text-white rounded-xl shadow-md"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="grid gap-3">
              {products.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 bg-white rounded-2xl border border-dashed border-zinc-300">
                  <LayoutGrid size={48} className="mx-auto mb-4 opacity-20" />
                  <p>库存中没有商品</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 text-emerald-600 font-bold"
                  >
                    立即添加
                  </button>
                </div>
              ) : (
                products.map(product => (
                  <div key={product.id} className="bg-white p-4 rounded-xl border border-zinc-200 flex justify-between items-center shadow-sm">
                    <div>
                      <h3 className="font-bold">{product.name}</h3>
                      <p className="text-xs text-zinc-500 font-mono">{product.barcode}</p>
                      <div className="mt-1 flex gap-3 text-sm">
                        <span className="text-emerald-600 font-bold">¥{product.price}</span>
                        <span className="text-zinc-400">库存: {product.stock}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-zinc-400 hover:text-emerald-600"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('确定要删除该商品吗？')) deleteProduct(product.id);
                        }}
                        className="p-2 text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-zinc-50/50">
                <h2 className="font-bold text-zinc-500 text-xs uppercase tracking-wider">数据管理</h2>
              </div>
              
              <button 
                onClick={handleExport}
                className="w-full p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Download size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold">导出数据</p>
                  <p className="text-xs text-zinc-500">将库存备份为 JSON 文件</p>
                </div>
              </button>

              <label className="w-full p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold">导入数据</p>
                  <p className="text-xs text-zinc-500">从备份文件恢复库存</p>
                </div>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>

              <button 
                onClick={handleShare}
                className="w-full p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Share2 size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold">分享备份</p>
                  <p className="text-xs text-zinc-500">通过系统分享发送数据</p>
                </div>
              </button>

              <button 
                className="w-full p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Send size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold">发送报表</p>
                  <p className="text-xs text-zinc-500">生成今日销售统计报告</p>
                </div>
              </button>
            </div>

            <div className="p-4 text-center text-zinc-400 text-xs">
              <p>版本 1.0.0</p>
              <p className="mt-1">数据存储于本地浏览器缓存</p>
            </div>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-6 py-3 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('checkout')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'checkout' ? "text-emerald-600" : "text-zinc-400"
          )}
        >
          <ShoppingCart size={24} />
          <span className="text-[10px] font-bold">收银台</span>
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'inventory' ? "text-emerald-600" : "text-zinc-400"
          )}
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] font-bold">库存</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'settings' ? "text-emerald-600" : "text-zinc-400"
          )}
        >
          <SettingsIcon size={24} />
          <span className="text-[10px] font-bold">设置</span>
        </button>
      </nav>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingProduct?.id ? '编辑商品' : '添加新商品'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400"><X /></button>
            </div>
            
            <form onSubmit={handleAddOrUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">条形码</label>
                <div className="flex gap-2">
                  <input 
                    required
                    type="text" 
                    value={editingProduct?.barcode || ''} 
                    onChange={e => setEditingProduct(prev => ({ ...prev, barcode: e.target.value }))}
                    className="flex-1 p-3 rounded-xl border border-zinc-200 bg-zinc-50 font-mono"
                    placeholder="扫描或输入条码"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      // In a real mobile app, this would trigger camera
                      toast('请点击主页的扫码按钮进行扫描');
                    }}
                    className="p-3 bg-zinc-100 text-zinc-600 rounded-xl"
                  >
                    <Barcode size={20} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">商品名称</label>
                <input 
                  required
                  type="text" 
                  value={editingProduct?.name || ''} 
                  onChange={e => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-zinc-200"
                  placeholder="例如：可口可乐 500ml"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">价格 (¥)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={editingProduct?.price || ''} 
                    onChange={e => setEditingProduct(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="w-full p-3 rounded-xl border border-zinc-200"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">初始库存</label>
                  <input 
                    required
                    type="number" 
                    value={editingProduct?.stock || ''} 
                    onChange={e => setEditingProduct(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                    className="w-full p-3 rounded-xl border border-zinc-200"
                    placeholder="0"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg mt-4 flex items-center justify-center gap-2"
              >
                <Check size={20} />
                保存商品
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
