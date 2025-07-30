
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-black">Birroeria Italiana</h1>
              <p className="text-sm text-gray-500">Tavolo {table_id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Powered by</p>
              <p className="text-sm font-semibold text-black">Splicy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex">
          <button
            onClick={() => setCurrentView('menu')}
            className={`flex-1 py-4 px-6 text-base font-medium border-b-2 transition-colors ${
              currentView === 'menu'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Menù
          </button>
          <button
            onClick={() => setCurrentView('payment')}
            className={`flex-1 py-4 px-6 text-base font-medium border-b-2 transition-colors ${
              currentView === 'payment'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Paga il conto
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-50">
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
    </div>
  );
}

// Menu View Component
function MenuView({ order }: { order: Order }) {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-black">Il tuo ordine</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {order.items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="p-6 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-black">{item.name}</h3>
              </div>
              <div className="text-right">
                <p className="font-semibold text-black">€{item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-xl">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-black">Totale</span>
            <span className="text-xl font-bold text-black">€{order.orderTotal.toFixed(2)}</span>
          </div>
        </div>
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
    <div className="p-6 space-y-6">
      {/* Item Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-black">Scegli cosa pagare</h2>
          <button
            onClick={onSelectAll}
            className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Seleziona tutto
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {order.items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="p-6">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={paymentSelection.selectedItems.includes(item.id)}
                  onChange={() => onSelectItem(item.id)}
                  className="h-5 w-5 text-black rounded border-gray-300 focus:ring-black focus:ring-2"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-black">Mancia</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-3">
            {[0, 5, 10, 15].map(percentage => (
              <button
                key={percentage}
                onClick={() => handleTipPercentage(percentage)}
                className={`py-3 px-4 text-sm font-medium rounded-lg border transition-colors ${
                  paymentSelection.tipPercentage === percentage
                    ? 'bg-black text-white border-black'
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 space-y-4">
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
          <div className="border-t border-gray-100 pt-4">
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
            ? 'bg-black text-white hover:bg-gray-800'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Paga
      </button>
    </div>
  );
}
