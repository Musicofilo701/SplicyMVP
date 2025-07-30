
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function QRLandingPage() {
  const params = useParams();
  const router = useRouter();
  const table_id = params.table_id as string;
  const [loading, setLoading] = useState(true);
  const [hasOrder, setHasOrder] = useState(false);

  useEffect(() => {
    checkTableStatus();
  }, [table_id]);

  const checkTableStatus = async () => {
    try {
      const response = await fetch(`/api/table-access?table_id=${table_id}`);
      setHasOrder(response.ok);
    } catch (error) {
      console.error('Error checking table status:', error);
      setHasOrder(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterTable = () => {
    router.push(`/table/${table_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Controllo tavolo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        {/* Restaurant branding */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Birreria Italiana</h1>
          <p className="text-gray-600">Benvenuto al tavolo {table_id}</p>
        </div>

        {/* Status message */}
        <div className="mb-8">
          {hasOrder ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-600 text-4xl mb-2">✓</div>
              <h2 className="text-lg font-semibold text-green-800 mb-1">
                Ordine trovato!
              </h2>
              <p className="text-green-700 text-sm">
                Puoi visualizzare il menu e pagare il conto
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-yellow-600 text-4xl mb-2">⏳</div>
              <h2 className="text-lg font-semibold text-yellow-800 mb-1">
                Nessun ordine attivo
              </h2>
              <p className="text-yellow-700 text-sm">
                Chiedi al cameriere di inserire il tuo ordine
              </p>
            </div>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={handleEnterTable}
          disabled={!hasOrder}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
            hasOrder
              ? 'bg-green-600 text-white hover:bg-green-700 hover-scale'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasOrder ? 'Entra' : 'Attendi l\'ordine'}
        </button>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-semibold text-green-600">SPLAY</span>
          </p>
        </div>
      </div>
    </div>
  );
}
