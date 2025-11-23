import { useState, useEffect } from 'react';
import { getAuth } from '../api';
import AdminTabs from '../components/AdminTabs';
import {
  getAdminGalleries, createGallery, uploadImages, getClients, assignGallery,
  getGalleryRequests, updateGalleryRequestStatus, getHighResRequests, updateHighResRequestStatus,
  getAdmins, createAdmin, deleteAdmin
} from '../api';

export default function AdminDashboard() {
  const { user } = getAuth();
  const [activeTab, setActiveTab] = useState('galleries');
  const [galleries, setGalleries] = useState([]);
  const [clients, setClients] = useState([]);
  const [galleryRequests, setGalleryRequests] = useState([]);
  const [highResRequests, setHighResRequests] = useState([]);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'galleries' || activeTab === 'upload') {
        const data = await getAdminGalleries();
        setGalleries(data);
      }
      if (activeTab === 'clients') {
        const [clientsData, galleriesData] = await Promise.all([getClients(), getAdminGalleries()]);
        setClients(clientsData);
        setGalleries(galleriesData);
      }
      if (activeTab === 'requests') {
        const [galleryReqs, highResReqs] = await Promise.all([getGalleryRequests(), getHighResRequests()]);
        setGalleryRequests(galleryReqs);
        setHighResRequests(highResReqs);
      }
      if (activeTab === 'admins' && user.role === 'super') {
        const data = await getAdmins();
        setAdmins(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold gradient-text mb-8">Admin Dashboard</h1>

        <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} isSuper={user.role === 'super'} />

        {activeTab === 'galleries' && <GalleriesTab galleries={galleries} onUpdate={loadData} />}
        {activeTab === 'upload' && <UploadTab galleries={galleries} onUpdate={loadData} />}
        {activeTab === 'clients' && <ClientsTab clients={clients} galleries={galleries} onUpdate={loadData} />}
        {activeTab === 'requests' && <RequestsTab galleryRequests={galleryRequests} highResRequests={highResRequests} onUpdate={loadData} />}
        {activeTab === 'admins' && user.role === 'super' && <AdminsTab admins={admins} onUpdate={loadData} />}
      </div>
    </div>
  );
}

function GalleriesTab({ galleries, onUpdate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createGallery(name, description);
      setName('');
      setDescription('');
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gold mb-4">Create New Gallery</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Gallery Name</label>
            <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea className="input-field" rows="3" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
          </div>
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating...' : 'Create Gallery'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-gold mb-4">All Galleries</h2>
        <div className="space-y-4">
          {galleries.map(gallery => (
            <div key={gallery.id} className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-bold">{gallery.name}</h3>
              <p className="text-gray-400">{gallery.description}</p>
              <p className="text-sm text-gray-500 mt-2">{gallery.image_count} images</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UploadTab({ galleries, onUpdate }) {
  const [selectedGallery, setSelectedGallery] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedGallery || files.length === 0) {
      alert('Select a gallery and at least one file');
      return;
    }

    setUploading(true);
    try {
      await uploadImages(selectedGallery, files);
      setFiles([]);
      alert('Images uploaded successfully!');
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gold mb-4">Upload Images</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Select Gallery</label>
          <select className="input-field" value={selectedGallery} onChange={(e) => setSelectedGallery(e.target.value)} required>
            <option value="">Choose a gallery...</option>
            {galleries.map(gallery => (
              <option key={gallery.id} value={gallery.id}>{gallery.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Select Images</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="input-field" required />
          {files.length > 0 && <p className="text-sm text-gray-400 mt-2">{files.length} file(s) selected</p>}
        </div>

        <button type="submit" disabled={uploading} className="btn-primary">
          {uploading ? 'Uploading...' : 'Upload Images'}
        </button>
      </form>
    </div>
  );
}

function ClientsTab({ clients, galleries, onUpdate }) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedGallery, setSelectedGallery] = useState('');
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssigning(true);
    try {
      await assignGallery(selectedClient, selectedGallery);
      alert('Gallery assigned successfully!');
      setSelectedClient('');
      setSelectedGallery('');
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div>
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gold mb-4">Assign Gallery to Client</h2>
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Select Client</label>
            <select className="input-field" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} required>
              <option value="">Choose a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Select Gallery</label>
            <select className="input-field" value={selectedGallery} onChange={(e) => setSelectedGallery(e.target.value)} required>
              <option value="">Choose a gallery...</option>
              {galleries.map(gallery => (
                <option key={gallery.id} value={gallery.id}>{gallery.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={assigning} className="btn-primary">
            {assigning ? 'Assigning...' : 'Assign Gallery'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-gold mb-4">All Clients</h2>
        <div className="space-y-4">
          {clients.map(client => (
            <div key={client.id} className="bg-gray-700 p-4 rounded-lg">
              <p className="font-bold">{client.email}</p>
              <p className="text-sm text-gray-400">Galleries: {client.galleries || 'None'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RequestsTab({ galleryRequests, highResRequests, onUpdate }) {
  const handleUpdateGalleryRequest = async (id, status) => {
    try {
      await updateGalleryRequestStatus(id, status);
      onUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateHighResRequest = async (id, status) => {
    try {
      await updateHighResRequestStatus(id, status);
      if (status === 'paid') {
        alert('✅ Request marked as PAID. Client can now download their high-res images!');
      } else if (status === 'delivered') {
        alert('✅ Request marked as DELIVERED.');
      }
      onUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gold mb-4">Gallery Requests</h2>
        <div className="space-y-4">
          {galleryRequests.length === 0 ? (
            <p className="text-gray-400">No gallery requests</p>
          ) : (
            galleryRequests.map(req => (
              <div key={req.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-bold">{req.client_email}</p>
                  <p className="text-sm text-gray-400">Status: {req.status}</p>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateGalleryRequest(req.id, 'approved')}
                      className="btn-primary text-sm px-3 py-1"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateGalleryRequest(req.id, 'rejected')}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-blue mb-4">High-Res Download Requests</h2>
        <div className="space-y-4">
          {highResRequests.length === 0 ? (
            <p className="text-gray-400">No high-res requests</p>
          ) : (
            highResRequests.map(req => (
              <div key={req.id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold">{req.client_email}</p>
                    <p className="text-sm text-gray-400">
                      {req.image_ids.length} image(s) • Status: <span className={`font-semibold ${
                        req.status === 'pending' ? 'text-yellow-400' : 
                        req.status === 'paid' ? 'text-green-400' : 'text-blue-400'
                      }`}>{req.status.toUpperCase()}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Requested: {new Date(req.created_at).toLocaleString()}</p>
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateHighResRequest(req.id, 'paid')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold text-sm"
                        title="Mark as paid - unlocks download for client"
                      >
                        ✓ Mark Paid
                      </button>
                    </div>
                  )}
                  {req.status === 'paid' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateHighResRequest(req.id, 'delivered')}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminsTab({ admins, onUpdate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createAdmin(email, password);
      setEmail('');
      setPassword('');
      onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;
    try {
      await deleteAdmin(id);
      onUpdate();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gold mb-4">Create New Admin</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Password</label>
            <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating...' : 'Create Admin'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-gold mb-4">All Admins</h2>
        <div className="space-y-4">
          {admins.map(admin => (
            <div key={admin.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold">{admin.email}</p>
                <p className="text-sm text-gray-400">Role: {admin.role}</p>
              </div>
              {admin.role !== 'super' && (
                <button onClick={() => handleDelete(admin.id)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}