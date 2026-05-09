import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu as MenuIcon, 
  X, 
  Coffee, 
  Leaf, 
  Star, 
  Clock, 
  MapPin, 
  Phone, 
  Camera, 
  Instagram, 
  MessageCircle,
  ArrowRight,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Heart,
  Download,
  FileText
} from 'lucide-react';
import { 
  db, 
  subscribeToCollection, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

const NAVBAR_LINKS = [
  { name: 'Home', href: '#home' },
  { name: 'Tentang', href: '#tentang' },
  { name: 'Menu', href: '#menu' },
  { name: 'Galeri', href: '#galeri' },
  { name: 'Booking', href: '#booking' },
];

const FEATURES = [
  {
    icon: <Leaf className="w-6 h-6 text-primary" />,
    title: 'Bahan Segar',
    description: 'Semua bahan kami berasal dari petani lokal dengan kualitas terbaik.'
  },
  {
    icon: <Coffee className="w-6 h-6 text-primary" />,
    title: 'Kopi Kurasi',
    description: 'Biji kopi pilihan yang dipanggang dengan presisi untuk aroma sempurna.'
  }
];

const GALLERY_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1544145945-f904253db0ad?q=80&w=800', size: 'large' },
  { url: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=800', size: 'small' },
  { url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800', size: 'medium' },
  { url: 'https://images.unsplash.com/photo-1534433843472-35db31745ed0?q=80&w=800', size: 'small' },
  { url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=800', size: 'medium' },
  { url: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=800', size: 'large' },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Andini Putri',
    role: 'Food Blogger',
    content: '"Tempat yang luar biasa untuk melarikan diri dari keramaian kota. Kopinya enak dan suasananya benar-benar seperti di Bali."',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
  },
  {
    id: 2,
    name: 'Budi Santoso',
    role: 'Digital Nomad',
    content: '"Sangat merekomendasikan menu breakfast-nya. Suasananya tenang, cocok sekali untuk meeting santai atau sekadar baca buku."',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  },
  {
    id: 3,
    name: 'Clara Wijaya',
    role: 'Interior Designer',
    content: '"Detail arsitekturnya luar biasa. Pencahayaan alaminya membuat setiap sudut sangat estetik untuk difoto."',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop'
  }
];

const MENU_CATEGORIES = ['Semua', 'Coffee', 'Brunch', 'Mains', 'Signature'];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState('Semua');
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubMenu = subscribeToCollection('menu_items', setMenuItems);
    const unsubTables = subscribeToCollection('tables', setTables);
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) setPdfUrl(doc.data().menuPdfUrl || '');
    });

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const testimonialInterval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);

    return () => {
      unsubMenu();
      unsubTables();
      unsubSettings();
      window.removeEventListener('scroll', handleScroll);
      clearInterval(testimonialInterval);
    };
  }, []);

  const filteredMenu = activeMenuCategory === 'Semua' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeMenuCategory);

  const handleBooking = async () => {
    if (!selectedTable || !bookingDate || !bookingTime || !userName || !userPhone) {
      alert('Mohon isi semua data reservasi');
      return;
    }

    try {
      await addDoc(collection(db, 'reservations'), {
        tableId: selectedTable,
        date: bookingDate,
        time: bookingTime,
        userName,
        userPhone,
        createdAt: serverTimestamp()
      });
      // Mark table as booked (optimistic update for demo or strictly via admin?)
      // The user wants admin to manage, but let's make it interactive
      await updateDoc(doc(db, 'tables', selectedTable), { status: 'booked' });
      
      alert('Reservasi berhasil! Tim kami akan menghubungi Anda melalui WhatsApp.');
      setSelectedTable(null);
      setUserName('');
      setUserPhone('');
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'reservations');
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed scroll-smooth">
      {/* Navigation - Same as before */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'py-3 glass shadow-sm' : 'py-5 bg-transparent'
      }`}>
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] flex justify-between items-center">
          <div className="font-display text-2xl font-bold text-primary tracking-tight">
            Matahari <span className="hidden md:inline">Mangga Dua</span>
          </div>

          <div className="hidden md:flex gap-8 items-center">
            {NAVBAR_LINKS.map((link) => (
              <a key={link.name} href={link.href} className="text-on-surface-variant hover:text-primary transition-colors font-sans text-sm font-medium tracking-wide">
                {link.name}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a href="#booking" className="hidden md:block bg-primary text-white px-6 py-2.5 rounded-full hover:scale-105 transition-transform font-sans font-bold shadow-lg shadow-primary/20">
              Booking Meja
            </a>
            <button className="md:hidden p-2 text-primary focus:outline-none" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <MenuIcon size={32} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} className="fixed inset-0 z-50 bg-background md:hidden p-10 flex flex-col pt-24">
            <button className="absolute top-6 right-6 text-primary" onClick={() => setIsMenuOpen(false)}>
              <X size={32} />
            </button>
            <div className="flex flex-col gap-6 text-center">
              {NAVBAR_LINKS.map((link) => (
                <a key={link.name} href={link.href} className="text-3xl font-display text-primary font-bold" onClick={() => setIsMenuOpen(false)}>
                  {link.name}
                </a>
              ))}
              <a href="#booking" onClick={() => setIsMenuOpen(false)} className="mt-8 bg-primary text-white py-4 rounded-full font-bold text-lg shadow-xl block text-center">
                Booking Meja
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Hero */}
        <section id="home" className="relative h-[100dvh] min-h-[700px] flex flex-col justify-end overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src="https://images.unsplash.com/photo-1544145945-f904253db0ad?q=80&w=2670" alt="Hero" className="w-full h-full object-cover scale-105 animate-slow-zoom" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10"></div>
          </div>
          <div className="relative z-10 max-w-[1280px] mx-auto w-full px-5 md:px-[64px] pb-20">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl text-white">
              <span className="inline-block px-4 py-1.5 rounded-full glass-dark font-sans text-xs font-bold uppercase tracking-[0.2em] mb-6">Welcome to Matahari</span>
              <h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.2] mb-8 tracking-tight">Pelarian Tropis Anda di Tengah Kota</h1>
              <p className="font-sans text-white/90 text-lg leading-relaxed mb-10 max-w-lg">Sajian kopi pilihan dan kuliner premium dalam suasana yang tenang dan asri.</p>
              <div className="flex flex-col sm:flex-row gap-5">
                <a href="#booking" className="px-10 py-5 rounded-full bg-primary text-white font-bold text-lg shadow-2xl hover:scale-105 transition-all text-center">Booking Meja</a>
                <a href="#menu" className="px-10 py-5 rounded-full glass-dark text-white border border-white/30 font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-3">Lihat Menu <ArrowRight size={20} /></a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Menu Section with SLIDER */}
        <section id="menu" className="py-[120px] bg-surface-container-lowest overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
            <div className="text-center mb-16 space-y-4">
              <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs">Pilihan Menu</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold">Karya Seni di Setiap Sajian</h2>
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {MENU_CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setActiveMenuCategory(cat)} className={`px-6 py-2 rounded-full font-sans font-bold text-sm transition-all ${activeMenuCategory === cat ? 'bg-primary text-white shadow-lg' : 'bg-surface-container-high text-on-surface-variant hover:bg-outline-variant'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div 
                ref={scrollRef}
                className="flex gap-8 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-10"
              >
                <AnimatePresence mode='popLayout'>
                  {filteredMenu.map((item) => (
                    <motion.div 
                      layout 
                      key={item.id || item.name} 
                      className="min-w-[300px] md:min-w-[400px] snap-center group/item"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <div className="relative rounded-[2.5rem] overflow-hidden aspect-square mb-6 shadow-md group-hover/item:shadow-xl transition-shadow">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700" />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-primary text-sm shadow-sm">{item.price}</div>
                      </div>
                      <div className="space-y-2 px-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-display text-2xl font-bold text-primary">{item.name}</h4>
                          <button className="text-outline-variant hover:text-red-400 transition-colors cursor-pointer"><Heart size={20} /></button>
                        </div>
                        <p className="text-on-surface-variant text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Slider Arrows */}
              <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all z-10 md:-translate-x-6">
                <ChevronLeft size={24} />
              </button>
              <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all z-10 md:translate-x-6">
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Download PDF Menu */}
            <div className="mt-16 flex flex-col items-center gap-6">
              <div className="w-20 h-1 bg-primary/10 rounded-full"></div>
              <p className="text-on-surface-variant font-medium text-center">Ingin melihat daftar lengkap di luar layar ini?</p>
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 px-8 py-4 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-all group"
              >
                <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                Daftar Semua Menu (PDF)
              </a>
            </div>
          </div>
        </section>

        {/* Gallery - Same as before */}
        <section id="galeri" className="py-[120px] bg-background">
          <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div className="space-y-4">
                <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs">Galeri</span>
                <h2 className="font-display text-4xl md:text-5xl font-bold">Tangkap Momen Anda</h2>
              </div>
              <p className="text-on-surface-variant max-w-sm md:text-right">Setiap sudut Matahari Mangga Dua dirancang untuk menginspirasi kreativitas dan ketenangan visual.</p>
            </div>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {GALLERY_IMAGES.map((img, idx) => (
                <motion.div key={idx} whileHover={{ y: -5 }} className="relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
                  <img src={img.url} alt={`Gallery ${idx}`} className="w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"><Camera className="text-primary" size={20} /></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking with Real Data */}
        <section id="booking" className="py-[120px] bg-green-50/50 border-y border-green-100">
          <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-4 text-center lg:text-left">
                  <span className="text-primary font-bold uppercase tracking-[0.2em] text-xs">Reservasi Elektronik</span>
                  <h2 className="font-display text-4xl md:text-5xl font-bold text-primary">Pilih Meja Favorit Anda</h2>
                  <p className="text-on-surface-variant text-lg">Lihat ketersediaan meja secara real-time. Pilih area yang paling sesuai dengan kebutuhan Anda.</p>
                </div>

                <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-green-100 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-4 py-3 outline-none focus:border-green-500 text-sm" />
                    <select value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-4 py-3 outline-none focus:border-green-500 text-sm">
                      <option value="">Pilih Jam</option>
                      <option>10:00</option><option>12:00</option><option>15:00</option><option>18:00</option><option>20:00</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <input type="text" placeholder="Nama Lengkap" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-4 py-3 outline-none focus:border-green-500 text-sm" />
                    <input type="text" placeholder="Nomor WhatsApp (62xxx)" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} className="w-full bg-green-50/50 border border-green-100 rounded-2xl px-4 py-3 outline-none focus:border-green-500 text-sm" />
                  </div>
                  <div className="pt-4 space-y-4 border-t border-green-100">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">Meja Terpilih:</span>
                      <span className="font-bold text-green-700">{selectedTable ? `Table ${selectedTable}` : 'Belum memilih'}</span>
                    </div>
                    <button onClick={handleBooking} disabled={!selectedTable || !bookingDate || !bookingTime || !userName || !userPhone} className="w-full py-4 rounded-full bg-primary text-white font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                      Konfirmasi Reservasi
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 relative h-[600px] bg-green-900/5 rounded-[4rem] border border-green-100 flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full max-w-xl max-h-[500px]">
                  {tables.map((table) => (
                    <motion.button
                      key={table.id}
                      whileHover={table.status === 'available' ? { scale: 1.1 } : {}}
                      onClick={() => { if (table.status === 'available') setSelectedTable(selectedTable === table.id ? null : table.id); }}
                      style={{ left: table.x, top: table.y }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 ${table.type === 'small' ? 'w-16 h-16 rounded-2xl' : table.type === 'medium' ? 'w-24 h-24 rounded-3xl' : 'w-32 h-20 rounded-[2rem]'} ${selectedTable === table.id ? 'bg-green-600 text-white shadow-2xl scale-110 z-10' : table.status === 'available' ? 'bg-white border-2 border-green-100 text-green-800 shadow-sm' : table.status === 'booked' ? 'bg-red-50 border border-red-100 text-red-300 cursor-not-allowed' : 'bg-green-900/20 text-green-900/40 cursor-not-allowed'}`}
                    >
                      <div className="text-center">
                        <div className="text-[10px] font-bold opacity-60 leading-none mb-1">{table.type.toUpperCase()}</div>
                        <div className="font-display font-bold text-sm">{table.status === 'occupied' ? 'BUSY' : `T-${table.id}`}</div>
                        <div className="text-[8px] font-medium opacity-50">{table.capacity} PAX</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Same as before */}
      <footer className="bg-surface-container-highest py-20 px-5 md:px-[64px]">
        <div className="max-w-[1280px] mx-auto text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
            <div className="space-y-6">
              <h3 className="font-display text-4xl font-bold text-primary">Matahari</h3>
              <p className="text-on-surface-variant max-w-xs mx-auto md:mx-0 font-medium">© 2024 Matahari Mangga Dua. Sebuah oasis tropis yang menyajikan ketenangan dan kuliner premium.</p>
            </div>
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Kontak & Lokasi</h4>
              <ul className="space-y-5 text-on-surface-variant">
                <li className="flex items-center justify-center md:justify-start gap-3"><Phone size={18} className="text-primary" /> <span className="font-medium">0811-6090-864</span></li>
                <li className="flex items-center justify-center md:justify-start gap-3"><MapPin size={18} className="text-primary" /> <span className="font-medium">Jl. Sisingamangaraja Mangga Dua</span></li>
                <li className="flex items-center justify-center md:justify-start gap-3"><Clock size={18} className="text-primary" /> <span className="font-medium">Open Daily: 08:00 - 22:00</span></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-primary uppercase tracking-[0.2em]">Ikuti Kami</h4>
              <div className="flex justify-center md:justify-start gap-4">
                {[Instagram, Camera, MessageCircle].map((Icon, i) => (
                  <a key={i} href="#" className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-primary border border-primary/10 shadow-sm"><Icon size={24} /></a>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-8 text-xs font-bold text-outline uppercase tracking-[0.2em]">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
            <div className="text-xs text-outline font-bold tracking-widest uppercase">Designed for Tropical Lovers</div>
            <a href="/admin" className="text-[10px] text-outline/30 hover:text-primary transition-colors uppercase tracking-widest">Staff Only</a>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
        <motion.a href="https://wa.me/628116090864" target="_blank" rel="noreferrer" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-16 h-16 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center">
          <MessageCircle size={32} />
        </motion.a>
        <motion.a href="#booking" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center md:hidden">
          <Utensils size={32} />
        </motion.a>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slow-zoom { from { transform: scale(1); } to { transform: scale(1.1); } }
        .animate-slow-zoom { animation: slow-zoom 20s ease-in-out infinite alternate; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
