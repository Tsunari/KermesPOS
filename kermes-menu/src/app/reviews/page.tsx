"use client";
import { useState } from 'react';
import PageContainer from '../components/PageContainer';

const initialReviews = [
  { name: 'Ali', rating: 5, comment: 'Harika yemekler ve atmosfer!' },
  { name: 'Ayşe', rating: 4, comment: 'Çok güzel, tekrar geleceğim.' },
];

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
};

function StarRating({ value, onChange, readOnly = false }: StarRatingProps) {
  return (
    <div className="flex items-center space-x-1">
      {[1,2,3,4,5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'} ${readOnly ? 'pointer-events-none' : ''}`}
          onClick={() => !readOnly && onChange && onChange(star)}
          aria-label={`Rate ${star}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(initialReviews);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReviews([{ name, rating, comment }, ...reviews]);
    setName('');
    setRating(5);
    setComment('');
  };

  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold text-black mb-6 text-center tracking-tight">Reviews</h1>
        <form onSubmit={handleSubmit} className="space-y-3 bg-white/90 rounded-2xl shadow-lg p-5 mb-6 border border-gray-200">
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white placeholder-gray-400"
            placeholder="İsim"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <StarRating value={rating} onChange={setRating} />
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white placeholder-gray-400"
            placeholder="Yorum"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={2}
            required
          />
          <button type="submit" className="w-full bg-black text-white rounded py-2 font-semibold hover:bg-gray-900 transition">Gönder</button>
        </form>
        <div className="space-y-4">
          {reviews.map((r, idx) => (
            <div key={idx} className="bg-white/90 rounded-2xl shadow p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-black">{r.name}</span>
                <StarRating value={r.rating} readOnly />
              </div>
              <p className="text-gray-700 text-sm">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
} 