export default function AdminTabs({ activeTab, setActiveTab, isSuper }) {
  const tabs = [
    { id: 'galleries', label: 'Galleries' },
    { id: 'upload', label: 'Upload' },
    { id: 'clients', label: 'Clients' },
    { id: 'requests', label: 'Requests' }
  ];
  if (isSuper) tabs.push({ id: 'admins', label: 'Admins' });

  return (
    <div className="flex border-b border-gray-700 mb-8 overflow-x-auto">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
            activeTab === tab.id ? 'border-b-2 border-gold text-gold' : 'text-gray-400 hover:text-gray-200'
          }`}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}