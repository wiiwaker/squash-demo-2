import React, { useState } from 'react';
import { Upload, FileText, Download, Trash2, Folder, X } from 'lucide-react';
import { Language } from '../types';

interface Props {
  language: Language;
}

const RepositoryPage: React.FC<Props> = ({ language }) => {
  const t = {
    title: language === 'CN' ? '资料库' : 'Repository',
    subtitle: language === 'CN' ? '赛事文档、秩序册与成绩单归档' : 'Archive for documents, orders of play, and results.',
    upload: language === 'CN' ? '上传文件' : 'Upload File',
    fileName: language === 'CN' ? '文件名' : 'File Name',
    size: language === 'CN' ? '大小' : 'Size',
    date: language === 'CN' ? '日期' : 'Date',
    category: language === 'CN' ? '类别' : 'Category',
    cancel: language === 'CN' ? '取消' : 'Cancel',
    save: language === 'CN' ? '上传' : 'Upload',
  };

  const [showUpload, setShowUpload] = useState(false);
  const [newFile, setNewFile] = useState({ name: '', category: 'General' });

  const [files, setFiles] = useState([
    { id: 1, name: '2024_National_Prospectus.pdf', size: '2.4 MB', date: '2023-10-01', category: 'Prospectus' },
    { id: 2, name: 'Order_Of_Play_Day1.xlsx', size: '45 KB', date: '2023-10-20', category: 'Schedule' },
    { id: 3, name: 'Final_Results_Mens.pdf', size: '1.1 MB', date: '2023-10-25', category: 'Results' },
  ]);

  const handleUpload = () => {
      if(!newFile.name) return;
      setFiles([
          ...files, 
          { 
              id: Date.now(), 
              name: newFile.name, 
              category: newFile.category, 
              size: '100 KB', 
              date: new Date().toISOString().split('T')[0] 
          }
      ]);
      setShowUpload(false);
      setNewFile({ name: '', category: 'General' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative">
      {showUpload && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{t.upload}</h3>
                    <button onClick={() => setShowUpload(false)}><X size={20}/></button>
                  </div>
                  <div className="space-y-3">
                      <div>
                          <label className="block text-sm font-medium mb-1">{t.fileName}</label>
                          <input className="w-full border p-2 rounded" placeholder="e.g. Draw_v1.pdf" value={newFile.name} onChange={e => setNewFile({...newFile, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">{t.category}</label>
                          <select className="w-full border p-2 rounded" value={newFile.category} onChange={e => setNewFile({...newFile, category: e.target.value})} >
                              <option value="General">General</option>
                              <option value="Prospectus">Prospectus</option>
                              <option value="Schedule">Schedule</option>
                              <option value="Results">Results</option>
                          </select>
                      </div>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-500 text-sm">Drag and drop file here</div>
                  </div>
                  <div className="flex gap-2 mt-6">
                      <button onClick={() => setShowUpload(false)} className="flex-1 py-2 border rounded">{t.cancel}</button>
                      <button onClick={handleUpload} className="flex-1 py-2 bg-blue-600 text-white rounded font-bold">{t.save}</button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500 mt-1">{t.subtitle}</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Upload size={16} /> {t.upload}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-2">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-3">{t.category}</h3>
                <ul className="space-y-1">
                    {['All Files', 'Prospectus', 'Schedule', 'Results', 'Technical Reports'].map((cat, i) => (
                        <li key={cat}>
                            <button className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${i === 0 ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <Folder size={14} className={i === 0 ? 'text-blue-500' : 'text-slate-400'} />
                                {cat}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                     <tr>
                         <th className="px-6 py-4 font-medium">{t.fileName}</th>
                         <th className="px-6 py-4 font-medium">{t.category}</th>
                         <th className="px-6 py-4 font-medium">{t.size}</th>
                         <th className="px-6 py-4 font-medium">{t.date}</th>
                         <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {files.map(f => (
                         <tr key={f.id} className="hover:bg-slate-50 group">
                             <td className="px-6 py-4 flex items-center gap-3 font-medium text-slate-700">
                                 <div className="p-2 bg-slate-100 rounded text-slate-500"><FileText size={18} /></div>
                                 {f.name}
                             </td>
                             <td className="px-6 py-4 text-slate-500"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{f.category}</span></td>
                             <td className="px-6 py-4 text-slate-500 font-mono text-xs">{f.size}</td>
                             <td className="px-6 py-4 text-slate-500">{f.date}</td>
                             <td className="px-6 py-4 text-right">
                                 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors"><Download size={16}/></button>
                                     <button className="p-1 text-slate-400 hover:text-red-600 transition-colors" onClick={() => setFiles(files.filter(file => file.id !== f.id))}><Trash2 size={16}/></button>
                                 </div>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
        </div>
      </div>
    </div>
  );
};

export default RepositoryPage;