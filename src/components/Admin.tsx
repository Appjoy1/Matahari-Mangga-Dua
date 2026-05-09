import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  LogOut, 
  Settings as SettingsIcon, 
  Utensils, 
  Calendar, 
  Layout, 
  Save,
  X,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logout, 
  subscribeToCollection,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  setDoc,
  query, 
  where, 
  onSnapshot,
  Timestamp,
  getDoc
} from 'firebase/firestore';

interface MenuItem {
  id: string;
  category: string;
  name: string;
  price: string;
  desc: string;
  image: string;
}

interface Reservation {
  id: string;
  tableId: string;
  date: string;
  time: string;
  userName: string;
  userPhone: string;
  createdAt: any;
}

interface Table {
  id: string;
  type: string;
  status: string;
  capacity: number;
}

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'reservations' | 'tables' | 'settings'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // Simple admin check: hardcoded for the owner's email
        if (u.email === 'kerjarodi54@gmail.com') {
          setIsAdmin(true);
          // Set as admin in DB if not exists
          await setDoc(doc(db, 'admins', u.uid), { email: u.email }, { merge: true });
        } else {
          // Check DB
          const adminDoc = await getDoc(doc(db, 'admins', u.uid));
          setIsAdmin(adminDoc.exists());
        }
      } else {
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const unsubMenu = subscribeToCollection<MenuItem>('menu_items', (data) => {
        if (data.length === 0) {
          const initialMenu = [
            { category: 'Coffee', name: 'Coastal Cold Brew', price: 'Rp 45.000', desc: 'Kopi fermentasi 18 jam dengan sentuhan aroma jeruk dan kelapa.', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop' },
            { category: 'Brunch', name: 'Avocado Breeze Toast', price: 'Rp 65.000', desc: 'Sourdough panggang dengan alpukat mentega, telur apung, dan pesto kemangi.', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop' },
            { category: 'Mains', name: 'Grilled Snapper Mangga Dua', price: 'Rp 115.000', desc: 'Kakap putih segar dengan bumbu rempah laut dan acar mangga muda.', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop' },
            { category: 'Signature', name: 'Matahari Sunrise Bowl', price: 'Rp 75.000', desc: 'Smoothie bowl naga merah, mangga, granola rumahan, dan kelapa panggang.', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop' },
          ];
          initialMenu.forEach(m => addDoc(collection(db, 'menu_items'), m));
        }
        setMenuItems(data);
      });
      const unsubRes = subscribeToCollection<Reservation>('reservations', setReservations);
      const unsubTables = subscribeToCollection<Table>('tables', (data) => {
        if (data.length === 0) {
          // Seed initial tables if empty
          const initialTables = [
            { id: '1', type: 'small', capacity: 2, status: 'available', x: '15%', y: '20%' },
            { id: '2', type: 'small', capacity: 2, status: 'occupied', x: '15%', y: '40%' },
            { id: '3', type: 'large', capacity: 6, status: 'available', x: '15%', y: '70%' },
            { id: '4', type: 'medium', capacity: 4, status: 'booked', x: '45%', y: '20%' },
            { id: '5', type: 'large', capacity: 8, status: 'available', x: '45%', y: '50%' },
            { id: '6', type: 'medium', capacity: 4, status: 'available', x: '45%', y: '80%' },
            { id: '7', type: 'small', capacity: 2, status: 'available', x: '75%', y: '20%' },
            { id: '8', type: 'small', capacity: 2, status: 'booked', x: '75%', y: '40%' },
            { id: '9', type: 'medium', capacity: 4, status: 'available', x: '75%', y: '70%' },
          ];
          initialTables.forEach(t => setDoc(doc(db, 'tables', t.id), t));
        }
        setTables(data.sort((a,b) => parseInt(a.id) - parseInt(b.id)));
      });
      
      const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
        if (doc.exists()) setPdfUrl(doc.data().menuPdfUrl || '');
      });

      return () => {
        unsubMenu();
        unsubRes();
        unsubTables();
        unsubSettings();
      };
    }
  }, [isAdmin]);

  const handleSaveItem = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem.id) {
        await updateDoc(doc(db, 'menu_items', editingItem.id), editingItem);
      } else {
        await addDoc(collection(db, 'menu_items'), editingItem);
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'menu_items');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Hapus item ini?')) {
      try {
        await deleteDoc(doc(db, 'menu_items', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, 'menu_items');
      }
    }
  };

  const handleUpdateTable = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'tables', id), { status });
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'tables');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), { menuPdfUrl: pdfUrl });
      alert('Settings saved!');
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'settings');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50 px-5">
        <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl text-center space-y-8">
          <h1 className="font-display text-4xl font-bold text-green-800">Admin Login</h1>
          <p className="text-on-surface-variant">Silakan login dengan akun Google terdaftar untuk mengakses dashboard manajemen.</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full py-4 rounded-full bg-green-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            Login dengan Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
          <p>Maaf, email Anda ({user.email}) tidak terdaftar sebagai admin.</p>
          <button onClick={logout} className="text-primary font-bold underline">Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-outline-variant p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="font-display text-2xl font-bold text-green-700 px-4">Admin Hub</div>
          <nav className="space-y-2">
            {[
              { id: 'menu', icon: Utensils, label: 'Menu' },
              { id: 'reservations', icon: Calendar, label: 'Reservasi' },
              { id: 'tables', icon: Layout, label: 'Meja' },
              { id: 'settings', icon: SettingsIcon, label: 'Settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                  activeTab === tab.id ? 'bg-green-100 text-green-800' : 'text-on-surface-variant hover:bg-green-50'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="pt-6 border-t border-outline-variant">
          <div className="flex items-center gap-3 mb-6 px-4">
            <img src={user.photoURL} className="w-10 h-10 rounded-full border border-green-200" alt="avatar" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-on-surface truncate">{user.displayName}</p>
              <p className="text-[10px] text-outline truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-display font-bold capitalize text-green-800">{activeTab}</h2>
          {activeTab === 'menu' && (
            <button 
              onClick={() => { setEditingItem({ category: 'Coffee', name: '', price: '', desc: '', image: '' }); setIsModalOpen(true); }}
              className="bg-green-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 shadow-lg transition-all"
            >
              <Plus size={20} /> Tambah Menu
            </button>
          )}
        </header>

        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {menuItems.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-3xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
                <img src={item.image} className="w-full h-48 object-cover rounded-2xl mb-4" />
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{item.category}</span>
                    <h4 className="font-bold text-lg">{item.name}</h4>
                  </div>
                  <div className="text-green-700 font-bold">{item.price}</div>
                </div>
                <p className="text-sm text-outline mb-4 line-clamp-2">{item.desc}</p>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="flex-1 py-2 rounded-xl border border-outline-variant hover:bg-green-50 transition-colors flex justify-center items-center gap-2 font-bold text-sm">
                    <Edit size={16} /> Edit
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="flex-1 py-2 rounded-xl border border-outline-variant hover:bg-red-50 text-red-500 transition-colors flex justify-center items-center gap-2 font-bold text-sm">
                    <Trash2 size={16} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="bg-white rounded-3xl border border-outline-variant overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-green-50/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-green-800">Nama</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-green-800">Meja</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-green-800">Waktu</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-green-800">WA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {reservations.map(res => (
                  <tr key={res.id}>
                    <td className="px-6 py-4 font-bold text-sm">{res.userName}</td>
                    <td className="px-6 py-4 text-sm">Table {res.tableId}</td>
                    <td className="px-6 py-4 text-sm">{res.date} • {res.time}</td>
                    <td className="px-6 py-4 text-sm">
                      <a href={`https://wa.me/${res.userPhone}`} target="_blank" rel="noreferrer" className="text-green-600 font-bold hover:underline">
                        Chat WA
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map(table => (
              <div key={table.id} className="bg-white p-6 rounded-3xl border border-outline-variant text-center space-y-4">
                <div className="font-display font-bold text-xl">T-{table.id}</div>
                <div className="text-[10px] font-bold text-outline uppercase">{table.type} ({table.capacity} PAX)</div>
                <select 
                  value={table.status}
                  onChange={(e) => handleUpdateTable(table.id, e.target.value)}
                  className={`w-full text-xs font-bold p-2 rounded-xl outline-none border transition-colors ${
                    table.status === 'available' ? 'bg-green-50 border-green-200 text-green-700' :
                    table.status === 'booked' ? 'bg-red-50 border-red-200 text-red-700' :
                    'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                >
                  <option value="available">Tersedia</option>
                  <option value="booked">Booked</option>
                  <option value="occupied">Terisi</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-md bg-white p-8 rounded-[3rem] border border-outline-variant space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-green-800 ml-1">Menu PDF URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                  <input 
                    type="text" 
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    placeholder="https://example.com/menu.pdf"
                    className="w-full pl-12 pr-4 py-4 rounded-3xl bg-green-50/50 border border-green-100 outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <button onClick={handleSaveSettings} className="bg-green-600 text-white p-4 rounded-3xl hover:scale-105 transition-all shadow-lg">
                  <Save size={24} />
                </button>
              </div>
              <p className="text-[10px] text-outline text-center uppercase tracking-widest">Update link ini agar pengunjung bisa download daftar menu terbaru.</p>
            </div>
          </div>
        )}
      </main>

      {/* Modal for Add/Edit Menu */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-green-950/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 overflow-hidden"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-green-50 text-outline transition-colors"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-2xl font-display font-bold text-green-800 mb-8">{editingItem.id ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
              
              <form onSubmit={handleSaveItem} className="space-y-5 text-sm uppercase font-bold tracking-widest text-green-800/60">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label>Kategori</label>
                    <select 
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-4 py-3 outline-none focus:border-green-500 text-on-surface normal-case"
                    >
                      <option>Coffee</option>
                      <option>Brunch</option>
                      <option>Mains</option>
                      <option>Signature</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label>Harga</label>
                    <input 
                      type="text" 
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                      placeholder="Rp 45.000"
                      className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-4 py-3 outline-none focus:border-green-500 text-on-surface"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label>Nama Menu</label>
                  <input 
                    type="text" 
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-4 py-3 outline-none focus:border-green-500 text-on-surface"
                  />
                </div>

                <div className="space-y-2">
                  <label>Deskripsi</label>
                  <textarea 
                    value={editingItem.desc}
                    onChange={(e) => setEditingItem({ ...editingItem, desc: e.target.value })}
                    className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-4 py-3 outline-none focus:border-green-500 text-on-surface h-24 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label>Image URL</label>
                  <input 
                    type="text" 
                    value={editingItem.image}
                    onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                    className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-4 py-3 outline-none focus:border-green-500 text-on-surface"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 rounded-full bg-green-600 text-white font-bold text-lg shadow-xl hover:scale-105 transition-all mt-4"
                >
                  Simpan Perubahan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
