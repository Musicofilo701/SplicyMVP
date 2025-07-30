
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
}

interface Order {
  table_id: string;
  items: MenuItem[];
  orderTotal: number;
}

interface PaymentSelection {
  selectedItems: string[];
  tipPercentage: number;
  customTip: number;
}

export default function TablePage() {
  const params = useParams();
  const table_id = params.table_id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'menu' | 'payment'>('menu');
  const [paymentSelection, setPaymentSelection] = useState<PaymentSelection>({
    selectedItems: [],
    tipPercentage: 0,
    customTip: 0
  });

  useEffect(() => {
    fetchTableOrder();
  }, [table_id]);

  const fetchTableOrder = async () => {
    try {
      const response = await fetch(`/api/table-access?table_id=${table_id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (itemId: string) => {
    setPaymentSelection(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(itemId)
        ? prev.selectedItems.filter(id => id !== itemId)
        : [...prev.selectedItems, itemId]
    }));
  };

  const handleSelectAll = () => {
    if (!order) return;
    setPaymentSelection(prev => ({
      ...prev,
      selectedItems: order.items.map(item => item.id)
    }));
  };

  const calculateSelectedTotal = () => {
    if (!order) return 0;
    return order.items
      .filter(item => paymentSelection.selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  };

  const calculateTipAmount = () => {
    const selectedTotal = calculateSelectedTotal();
    return paymentSelection.tipPercentage > 0 
      ? (selectedTotal * paymentSelection.tipPercentage / 100)
      : paymentSelection.customTip;
  };

  const calculateFinalTotal = () => {
    return calculateSelectedTotal() + calculateTipAmount();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Ordine non trovato
          </h1>
          <p className="text-gray-600">
            {error || 'Non è stato possibile trovare un ordine per questo tavolo.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto">
      {/* Green Header */}
      <div className="bg-green-400 h-32 relative">
        <div className="absolute top-4 right-4 text-right">
          <p className="text-xs text-black opacity-70">Powered by</p>
          <p className="text-sm font-bold text-black">SPLICY</p>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="bg-white px-6 py-4 -mt-8 relative z-10 rounded-t-3xl">
        <h1 className="text-2xl font-bold text-black mb-1">Birreria Italiana</h1>
        <p className="text-gray-600 text-base">Tavolo {table_id}</p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <div className="flex bg-green-100 rounded-full p-1">
          <button
            onClick={() => setCurrentView('menu')}
            className={`flex-1 py-3 px-6 text-base font-medium rounded-full transition-all ${
              currentView === 'menu'
                ? 'bg-green-500 text-white shadow-sm'
                : 'text-green-700'
            }`}
          >
            Menù
          </button>
          <button
            onClick={() => setCurrentView('payment')}
            className={`flex-1 py-3 px-6 text-base font-medium rounded-full transition-all ${
              currentView === 'payment'
                ? 'bg-green-800 text-white shadow-sm'
                : 'text-green-700'
            }`}
          >
            Paga il conto
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {currentView === 'menu' ? (
          <MenuView order={order} />
        ) : (
          <PaymentView
            order={order}
            paymentSelection={paymentSelection}
            onSelectItem={handleSelectItem}
            onSelectAll={handleSelectAll}
            onTipChange={setPaymentSelection}
            selectedTotal={calculateSelectedTotal()}
            tipAmount={calculateTipAmount()}
            finalTotal={calculateFinalTotal()}
          />
        )}
      </div>

      {/* Bottom spacing for mobile safe area */}
      <div className="h-20"></div>
    </div>
  );
}

// Menu View Component
function MenuView({ order }: { order: Order }) {
  return (
    <div className="space-y-4">
      {/* Tab categories */}
      <div className="flex space-x-6 border-b border-gray-200">
        <button className="pb-3 text-black font-semibold border-b-2 border-black">
          Raccomandati
        </button>
        <button className="pb-3 text-gray-400">
          Antipasti
        </button>
        <button className="pb-3 text-gray-400">
          Primi
        </button>
        <button className="pb-3 text-gray-400">
          Secondi
        </button>
      </div>

      {/* Menu Items */}
      <div className="space-y-4">
        {order.items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="bg-gray-100 rounded-2xl p-4 flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-black text-lg mb-2">{item.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                {item.description || "pane bun al pomodoro, pulled pork, cipolla di tropea caramellata, stracciatella, scamorza fusa affumicata, salsa BBQ e rucola selvatica. Aggiunta di Bacon possibile"}
              </p>
              <p className="text-black font-bold text-lg">{item.price.toFixed(2)}€</p>
            </div>
            {index === 0 && (
              <div className="w-20 h-20 bg-gray-300 rounded-xl ml-4 flex-shrink-0"></div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <button className="bg-green-600 text-white px-6 py-3 rounded-full font-medium shadow-lg">
          Paga ora online
        </button>
      </div>
    </div>
  );
}

// Payment View Component
function PaymentView({ 
  order, 
  paymentSelection, 
  onSelectItem, 
  onSelectAll,
  onTipChange,
  selectedTotal,
  tipAmount,
  finalTotal
}: {
  order: Order;
  paymentSelection: PaymentSelection;
  onSelectItem: (itemId: string) => void;
  onSelectAll: () => void;
  onTipChange: (selection: PaymentSelection) => void;
  selectedTotal: number;
  tipAmount: number;
  finalTotal: number;
}) {
  const handleTipPercentage = (percentage: number) => {
    onTipChange({
      ...paymentSelection,
      tipPercentage: percentage,
      customTip: 0
    });
  };

  return (
    <div className="space-y-6">
      {/* Item Selection */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-black">Scegli cosa pagare</h2>
          <button
            onClick={onSelectAll}
            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Seleziona tutto
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {order.items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="p-4">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={paymentSelection.selectedItems.includes(item.id)}
                  onChange={() => onSelectItem(item.id)}
                  className="h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-medium text-black">{item.name}</span>
                  <span className="font-semibold text-black">€{item.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip Selection */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-black">Mancia</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {[0, 5, 10, 15].map(percentage => (
              <button
                key={percentage}
                onClick={() => handleTipPercentage(percentage)}
                className={`py-3 px-4 text-sm font-medium rounded-lg border transition-colors ${
                  paymentSelection.tipPercentage === percentage
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-black border-gray-300 hover:border-gray-400'
                }`}
              >
                {percentage}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Articoli selezionati</span>
            <span className="font-semibold text-black">€{selectedTotal.toFixed(2)}</span>
          </div>
          {tipAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mancia</span>
              <span className="font-semibold text-black">€{tipAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-black">Il tuo conto</span>
              <div className="text-right">
                <span className="text-xl font-bold text-black">€{finalTotal.toFixed(2)}</span>
                <p className="text-sm text-gray-500">IVA incl.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        disabled={paymentSelection.selectedItems.length === 0}
        className={`w-full py-4 px-6 text-lg font-semibold rounded-xl transition-colors ${
          paymentSelection.selectedItems.length > 0
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Paga
      </button>
    </div>
  );
}
