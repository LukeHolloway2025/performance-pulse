import { useEffect, useState } from 'react';
import { useAuth } from './authContext';
import { Login } from './Login'; 

interface Manager {
  id: number;
  phone_number: string;
  first_name: string;
  last_name: string;
  store: string;
  role: string;
  message: string;
  yesterdays_status: string;
  todays_status: string;
  message_sent: number | string | boolean;
}

const STORES = [
  "Arlington Acura", "Arlington Lexus", "Arlington Nissan",
  "FW KIA", "FW Lexus", "FW Nissan / Infiniti", "FW Toyota",
  "Gurnee Hyundai", "Gurnee VW", "Indy Honda", "Indy Hyundai",
  "Kenosha Nissan", "Laf. Honda", "Laf. Hyundai", "Laf. KIA",
  "Laf. Toyota", "Oakbrook Toyota", "Schaumburg Ford",
  "Schaumburg Honda", "Schaumburg KIA"
].sort();

const ROLES = [
  "Advisor", "Appraiser", "BDC Manager", "BDC Team", "Finance Manager", 
  "GSM", "Office", "Parts", "Parts Manager", "Porter", 
  "Sales Manager", "Salesperson", "Service Advisor", "Service Manager", 
  "Technician"
].sort();

function App() {  const { userProfile, isLoading: authLoading } = useAuth();

  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Manager | null, direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
  
  const [filterStore, setFilterStore] = useState<string>('All');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [filterSent, setFilterSent] = useState<string>('All');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  const [newManager, setNewManager] = useState({ 
    first_name: '', last_name: '', phone_number: '', store: STORES[0], role: ROLES[0]
  });

  // Role Checks
  const isAdmin = userProfile?.roles?.some((role: string) => role.toLowerCase() === 'administrator');
  const isSuperUser = userProfile?.roles?.some((role: string) => 
    ['administrator', 'director', 'banyan'].some(allowed => role.toLowerCase().includes(allowed))
  );

  useEffect(() => {
    if (!userProfile) return;

    fetch('https://rohrmanacademy.com/wp-json/finance/v1/managers')
      .then((res) => res.json())
      .then((data: Manager[]) => {
        setManagers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, [userProfile]);

  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newManager.first_name || !newManager.last_name || !newManager.phone_number) return;

    const payload = { ...newManager };

    fetch('https://rohrmanacademy.com/wp-json/finance/v1/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setManagers([...managers, { 
          ...payload, id: data.id, message: '', yesterdays_status: '—', todays_status: '—', message_sent: 0 
        }]);
        setNewManager({ first_name: '', last_name: '', phone_number: '', store: STORES[0], role: ROLES[0] });
      }
    });
  };

  const handleDeleteManager = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this manager?")) return;

    fetch(`https://rohrmanacademy.com/wp-json/finance/v1/delete/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setManagers(managers.filter(m => m.id !== id));
      }
    });
  };

  const handleSort = (key: keyof Manager) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // 1. Establish the base managers this user is ALLOWED to see
  const viewableManagers = managers.filter(m => {
    // GM Store Restriction
    if (!isSuperUser && userProfile?.store) {
      if (m.store.toLowerCase() !== userProfile.store.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  // 2. Apply the active dropdown filters to the viewable managers
  const filteredManagers = viewableManagers.filter(m => {
    if (filterStore !== 'All' && m.store !== filterStore) return false;
    if (filterRole !== 'All' && m.role !== filterRole) return false;
    if (filterSent === 'Sent' && Number(m.message_sent) !== 1) return false;
    if (filterSent === 'Unsent' && Number(m.message_sent) === 1) return false;
    return true;
  });

  // 3. Sort the final list
  const sortedManagers = [...filteredManagers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ columnKey }: { columnKey: keyof Manager }) => {
      const isActive = sortConfig.key === columnKey;
      const isAscending = sortConfig.direction === 'ascending';

      return (
        <svg 
          className={`inline-block w-4 h-4 ml-1 ${
            isActive ? 'text-cyan-500 opacity-100' : 'text-gray-300 opacity-0 group-hover:opacity-50'
          }`}
          style={{ 
            transform: isActive && !isAscending ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      );
    };

  const getStatusColor = (status: string) => {
    if (!status || status === '—') return 'bg-gray-100 text-gray-500';
    const s = status.toUpperCase();
    if (s === 'MENTOR') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'HITTER') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s === 'BUILDER') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (s === 'UNDERPERFORMER') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-white font-medium animate-pulse">Verifying Access...</p>
      </div>
    );
  }

  if (!userProfile) {
    return <Login />;
  }

  return (
    <div className="min-h-screen p-6 md:p-12 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
              Performance <span className="text-cyan-300">Pulse</span>
            </h1>
            <p className="text-blue-100 mt-2 font-medium">Daily Notification Status Dashboard</p>
          </div>
          <div className="flex flex-col items-center md:items-end bg-black/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
            <span className="text-white font-medium text-sm">
              Logged in as <strong className="text-cyan-300">{userProfile.display_name}</strong>
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white/80 backdrop-blur-xl shadow-lg rounded-3xl p-6 mb-8 border border-white/40">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add new Team Member</h2>
            <form onSubmit={handleAddManager} className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <input type="text" placeholder="First Name" required 
                className="bg-white/60 border border-gray-200 text-gray-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all shadow-sm"
                value={newManager.first_name} onChange={e => setNewManager({...newManager, first_name: e.target.value})} />
              
              <input type="text" placeholder="Last Name" required 
                className="bg-white/60 border border-gray-200 text-gray-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all shadow-sm"
                value={newManager.last_name} onChange={e => setNewManager({...newManager, last_name: e.target.value})} />
              
              <select 
                className="bg-white/60 border border-gray-200 text-gray-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all shadow-sm" 
                value={newManager.role} onChange={e => setNewManager({...newManager, role: e.target.value})}>
                {ROLES.map(role => (<option key={role} value={role}>{role}</option>))}
              </select>

              <input type="text" placeholder="Phone (e.g. 1765...)" required 
                className="bg-white/60 border border-gray-200 text-gray-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all shadow-sm"
                value={newManager.phone_number} onChange={e => setNewManager({...newManager, phone_number: e.target.value})} />
              
              <select 
                className="bg-white/60 border border-gray-200 text-gray-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all shadow-sm" 
                value={newManager.store} onChange={e => setNewManager({...newManager, store: e.target.value})}>
                {STORES.map(store => (<option key={store} value={store}>{store}</option>))}
              </select>

              <button type="submit" 
                className="bg-gradient-to-r from-cyan-500 via-blue-600 to-green-400 bg-[length:200%_auto] hover:bg-[right_center] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:translate-y-0 active:shadow-sm transition-all duration-200 ease-out">
                + Add
              </button>
            </form>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-xl shadow-md rounded-2xl p-4 mb-6 border border-white/40 flex flex-col md:flex-row flex-wrap gap-4 items-center">
          <div className="flex items-center w-full md:w-auto">
            <span className="font-bold text-gray-700 mr-2">Filters:</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap gap-3 w-full md:w-auto flex-1">
            {isSuperUser && (
              <select 
                className="bg-white border border-gray-200 text-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
                value={filterStore} onChange={e => setFilterStore(e.target.value)}
              >
                <option value="All">All Stores</option>
                {STORES.map(store => <option key={store} value={store}>{store}</option>)}
              </select>
            )}

            <select 
              className="bg-white border border-gray-200 text-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
              value={filterRole} onChange={e => setFilterRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
            </select>

            <select 
              className="bg-white border border-gray-200 text-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
              value={filterSent} onChange={e => setFilterSent(e.target.value)}
            >
              <option value="All">All Sent Statuses</option>
              <option value="Sent">Sent Only</option>
              <option value="Unsent">Unsent Only</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500 font-medium w-full md:w-auto text-center md:text-right">
            Showing {sortedManagers.length} of {viewableManagers.length}
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/40 transition-all duration-300">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-cyan-800 font-medium animate-pulse">Loading data...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden lg:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wider select-none">
                      <th className="p-5 font-semibold cursor-pointer group hover:bg-gray-100 transition-colors rounded-tl-3xl text-left" onClick={() => handleSort('first_name')}>
                        <div className="flex items-center">Name <SortIcon columnKey="first_name" /></div>
                      </th>
                      <th className="p-5 font-semibold cursor-pointer group hover:bg-gray-100 transition-colors text-left" onClick={() => handleSort('store')}>
                        <div className="flex items-center">Store <SortIcon columnKey="store" /></div>
                      </th>
                      <th className="p-5 font-semibold cursor-pointer group hover:bg-gray-100 transition-colors text-left" onClick={() => handleSort('role')}>
                        <div className="flex items-center">Role <SortIcon columnKey="role" /></div>
                      </th>
                      <th className="p-5 font-semibold text-left">Phone</th>
                      <th className="p-5 font-semibold cursor-pointer group hover:bg-gray-100 transition-colors text-left" onClick={() => handleSort('yesterdays_status')}>
                        <div className="flex items-center text-xs">Yesterday's Status <SortIcon columnKey="yesterdays_status" /></div>
                      </th>
                      <th className="p-5 font-semibold cursor-pointer group hover:bg-gray-100 transition-colors text-left" onClick={() => handleSort('todays_status')}>
                        <div className="flex items-center text-xs">Today's Status <SortIcon columnKey="todays_status" /></div>
                      </th>
                      <th className="p-5 font-semibold text-left cursor-pointer group hover:bg-gray-100 transition-colors" onClick={() => handleSort('message_sent')}>
                        <div className="flex items-center justify-start ml-2">Sent? <SortIcon columnKey="message_sent" /></div>
                      </th>
                      {isAdmin && <th className="p-5 font-semibold text-left rounded-tr-3xl">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedManagers.map((m, index) => (
                      <tr 
                        key={m.id} 
                        className="hover:bg-cyan-50/50 transition-colors duration-200 animate-fade-in-up relative hover:z-50"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className="p-5 whitespace-nowrap">
                          <div className="font-bold text-gray-800">{m.first_name} {m.last_name}</div>
                        </td>
                        <td className="p-5 whitespace-nowrap text-gray-600 font-medium">
                          {m.store}
                        </td>
                        <td className="p-5 whitespace-nowrap text-gray-600 font-medium text-sm">
                          {m.role || '—'}
                        </td>
                        <td className="p-5 whitespace-nowrap text-gray-500 text-sm">
                          {m.phone_number}
                        </td>
                        <td className="p-5 whitespace-nowrap">
                          <span className={`px-4 py-1.5 text-xs font-bold rounded-full border shadow-sm ${getStatusColor(m.yesterdays_status)}`}>
                            {m.yesterdays_status || '—'}
                          </span>
                        </td>
                        <td className="p-5 whitespace-nowrap">
                          <span className={`px-4 py-1.5 text-xs font-bold rounded-full border shadow-sm ${getStatusColor(m.todays_status)}`}>
                            {m.todays_status || '—'}
                          </span>
                        </td>
                        <td className="p-5 whitespace-nowrap text-left">
                          <div className="relative inline-flex flex-col items-center justify-center group hover:z-50 ml-2">
                            <div 
                              onClick={() => {
                                if (Number(m.message_sent) === 1) {
                                  setSelectedMessage(m.message || "No message sent.");
                                } else {
                                  setSelectedMessage("No message sent today.");
                                }
                              }}
                              className={`w-24 h-10 rounded-xl flex items-center justify-center border-2 transition-all active:scale-95 cursor-pointer ${
                                Number(m.message_sent) === 1 ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-200' : 'bg-white border-gray-300'
                              }`}
                            >
                              {Number(m.message_sent) === 1 ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter px-1">No Text Sent</span>
                              )}
                            </div>
                            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-max max-w-xs bg-gray-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] pointer-events-none whitespace-pre-wrap border border-gray-700 text-left">
                              {Number(m.message_sent) === 1 && m.message ? m.message : 'No message sent today.'}
                              <div className="absolute left-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-l-gray-900"></div>
                            </div>
                          </div>
                        </td>
                        {isAdmin && (
                          <td className="p-5 whitespace-nowrap text-center">
                            <button 
                              onClick={() => handleDeleteManager(m.id)}
                              className="bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 shadow-sm"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - Shown on mobile */}
              <div className="lg:hidden grid grid-cols-1 gap-4 p-4">
                {sortedManagers.map((m, index) => (
                  <div 
                    key={m.id}
                    className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-lg relative animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-lg font-bold text-gray-800">{m.first_name} {m.last_name}</div>
                        <div className="text-sm text-cyan-700 font-semibold">{m.store}</div>
                        <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{m.role || '—'}</div>
                      </div>
                      
                      <div className="relative group">
                        <div 
                          onClick={() => {
                            if (Number(m.message_sent) === 1) {
                              setSelectedMessage(m.message || "No message sent.");
                            } else {
                              setSelectedMessage("No message sent today.");
                            }
                          }}
                          className={`w-24 h-10 rounded-xl flex items-center justify-center border-2 transition-all active:scale-95 cursor-pointer ${
                            Number(m.message_sent) === 1 ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-200' : 'bg-white border-gray-300'
                          }`}
                        >
                          {Number(m.message_sent) === 1 ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold">No Text Sent</span>
                          )}
                        </div>
                        {/* Desktop-only tooltip (hidden on small screens if you want, but good for larger mobile/tablets) */}
                        <div className="absolute right-0 top-full mt-3 w-64 bg-gray-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] pointer-events-none whitespace-pre-wrap border border-gray-700 text-left hidden lg:block">
                          {Number(m.message_sent) === 1 && m.message ? m.message : 'No message sent today.'}
                          <div className="absolute right-4 bottom-full border-[6px] border-transparent border-b-gray-900"></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Yesterday</div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border inline-block ${getStatusColor(m.yesterdays_status)}`}>
                          {m.yesterdays_status || '—'}
                        </span>
                      </div>
                      <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Today</div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border inline-block ${getStatusColor(m.todays_status)}`}>
                          {m.todays_status || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-500 font-medium">
                        {m.phone_number}
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteManager(m.id)}
                          className="text-rose-500 hover:text-rose-700 font-bold text-xs uppercase tracking-widest px-2 py-1"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Message Modal for Mobile/Tablets */}
      {selectedMessage !== null && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedMessage(null)}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Message Sent</h3>
              <button 
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-700 whitespace-pre-wrap leading-relaxed">
              {selectedMessage}
            </div>
            <button 
              onClick={() => setSelectedMessage(null)}
              className="mt-8 w-full bg-cyan-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-cyan-100 hover:bg-cyan-700 active:scale-95 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;