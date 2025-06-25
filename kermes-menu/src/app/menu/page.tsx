"use client";

import { useEffect, useState } from "react";
import PageContainer from '../components/PageContainer';

export default function MenuPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/products.json")
      .then(res => {
        if (!res.ok) throw new Error("Ürünler yüklenemedi");
        return res.json();
      })
      .then(data => setProducts(data.products || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold text-black mb-6 text-center tracking-tight">Menu</h1>
        {loading && <div className="text-center text-gray-500">Yükleniyor...</div>}
        {error && <div className="text-center text-red-600">{error}</div>}
        {!loading && !error && products.length === 0 && (
          <div className="text-center text-gray-500">Menüde ürün yok.</div>
        )}
        {!loading && !error && products.map((item, idx) => {
          // Format price with comma as decimal separator
          const priceStr = typeof item.price === 'number'
            ? item.price.toFixed(2).replace('.', ',')
            : String(item.price).replace('.', ',');
          return (
            <div
              key={item.id || idx}
              className="bg-white/90 rounded-xl shadow p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-gray-200 hover:shadow-lg transition text-sm"
            >
              <div>
                <h2 className="text-base font-semibold text-black mb-0.5">{item.name}</h2>
                <p className="text-gray-600 text-xs mb-1">{item.description}</p>
                <div className="flex flex-wrap gap-0.5">
                  {item.category && (
                    <span className="bg-black text-white text-[10px] font-semibold px-1 py-0.5 rounded-full uppercase tracking-wide leading-tight whitespace-nowrap">
                      {item.category}
                    </span>
                  )}
                  {item.inStock === false && (
                    <span className="bg-red-500 text-white text-[10px] font-semibold px-1 py-0.5 rounded-full uppercase tracking-wide leading-tight whitespace-nowrap">
                      Tükendi
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right mt-2 sm:mt-0 sm:ml-3">
                <span className="text-lg font-bold text-black bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm whitespace-nowrap overflow-x-auto inline-block">
                  {priceStr} €
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}