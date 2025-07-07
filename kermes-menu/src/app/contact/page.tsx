"use client";
import { useState } from 'react';
import PageContainer from '../components/PageContainer';
import SendIcon from '@mui/icons-material/Send';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const mailto = () => {
    const subject = encodeURIComponent(`Kermes İletişim - ${name}`);
    const body = encodeURIComponent(message);
    // Send to mhsbkommuc@gmail.com, cc talebelergfc@gmail.com
    return `mailto:mhsbkommuc@gmail.com?cc=talebelergfc@gmail.com&subject=${subject}&body=${body}`;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.location.href = mailto();
    setSent(true);
    setName('');
    setMessage('');
  };

  return (
    <PageContainer>
      <div className="bg-white/90 rounded-2xl shadow-lg p-6 border border-gray-200 mt-8 mb-6">
        <h1 className="text-3xl font-extrabold text-black mb-4 text-center tracking-tight">İletişim</h1>
        <p className="text-gray-700 mb-2 text-center">
          Bize ulaşmak için aşağıdaki formu doldurun veya{' '}
          <a href="mailto:mhsbkommuc@gmail.com?cc=talebelergfc@gmail.com" className="text-black underline font-semibold">mhsbkommuc@gmail.com</a>{' '}
          adresine e-posta gönderin.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 bg-white/90 rounded-2xl shadow-lg p-5 border border-gray-200">
        <input
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white placeholder-gray-400 text-black"
          placeholder="İsim"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white placeholder-gray-400 text-black"
          placeholder="Mesaj"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          required
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-black to-gray-800 text-white rounded-lg py-2 font-semibold flex items-center justify-center gap-2 shadow-lg hover:from-gray-900 hover:to-black transition-all duration-200 group text-base"
        >
          <span>Gönder</span>
          <SendIcon className="group-hover:translate-x-1 transition-transform duration-200" fontSize="small" />
        </button>
        {sent && (
          <div className="flex items-center justify-center mt-4">
            <span className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full shadow-sm transition-opacity duration-700 opacity-100 animate-fadeIn">
              <svg className="w-5 h-5 text-white animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span className="font-semibold">Mesajınız için teşekkürler!</span>
            </span>
          </div>
        )}
      </form>
    </PageContainer>
  );
}