import React, { useState, useEffect } from 'react';
import { useAuth } from '../../application/context/AuthContext';
import apiClient from '../../infrastructure/api/client';
import { Camera, Mail, User as UserIcon, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [supabaseUid, setSupabaseUid] = useState<string | null>(null);
  const [uidLoading, setUidLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/auth/me-with-uid')
      .then((res) => {
        console.log('UID Response:', res.data);
        if (res.data?.data?.supabaseAuthUid) {
          setSupabaseUid(res.data.data.supabaseAuthUid);
        }
      })
      .catch((err) => {
        console.error('Error obteniendo UID:', err);
      })
      .finally(() => {
        setUidLoading(false);
      });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      alert('Profile updated successfully!');
    }, 800);
  };

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover Photo */}
        <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
          <button className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white transition-colors">
            <Camera size={18} />
          </button>
        </div>
        
        <div className="px-8 pb-8">
          {/* Avatar */}
          <div className="relative flex justify-between items-end -mt-16 mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden shadow-md">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-indigo-600">
                    {name.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <button className="absolute bottom-1 right-1 p-2 bg-white rounded-full border border-gray-200 shadow-sm text-gray-600 hover:text-indigo-600 transition-colors">
                <Camera size={18} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 outline-none cursor-not-allowed" 
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">Email cannot be changed.</p>
              </div>
            </div>

            {uidLoading ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supabase UID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Loader2 size={16} className="text-gray-400 animate-spin" />
                  </div>
                  <input 
                    type="text" 
                    value="Cargando..." 
                    readOnly 
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-400 text-sm outline-none" 
                  />
                </div>
              </div>
            ) : supabaseUid ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supabase UID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xs">UID</span>
                  </div>
                  <input 
                    type="text" 
                    value={supabaseUid} 
                    readOnly 
                    className="w-full pl-14 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 text-xs outline-none" 
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supabase UID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-xs">UID</span>
                  </div>
                  <input 
                    type="text" 
                    value="No disponible" 
                    readOnly 
                    className="w-full pl-14 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-400 text-xs outline-none" 
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
              <textarea 
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                rows={4} 
                placeholder="Tell us a little about yourself..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none"
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end border-t border-gray-100">
              <button 
                type="button" 
                className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-lg mr-3 transition-colors"
                onClick={() => {
                  setName(user?.name || '');
                  setBio(user?.bio || '');
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-70"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
