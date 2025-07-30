
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Birroeria Italiana</h1>
              <p className="text-sm text-gray-500">Tavolo {table_id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Powered by</p>
              <p className="text-sm font-medium text-green-600">SPLAY</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setCurrentView('menu')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
              currentView === 'menu'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Menù
          </button>
          <button
            onClick={() => setCurrentView('payment')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
              currentView === 'payment'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Paga il conto
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
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
    <div className="p-4">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Il tuo ordine</h2>
        </div>
        <div className="divide-y">
          {order.items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900">{item.name}</h3>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{item.price.toFixed(2)}€</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Totale</span>
            <span className="text-lg font-bold text-gray-900">{order.orderTotal.toFixed(2)}€</span>
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
    <div className="p-4 space-y-4">
      {/* Item Selection */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Scegli cosa pagare</h2>
          <button
            onClick={onSelectAll}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md"
          >
            Seleziona tutto
          </button>
        </div>
        <div className="divide-y">
          {order.items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="p-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={paymentSelection.selectedItems.includes(item.id)}
                  onChange={() => onSelectItem(item.id)}
                  className="h-4 w-4 text-green-600 rounded border-gray-300"
                />
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-medium text-gray-900">{item.name}</span>
                  <span className="font-semibold text-gray-900">{item.price.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip Selection */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Mancia</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[0, 5, 10, 15].map(percentage => (
              <button
                key={percentage}
                onClick={() => handleTipPercentage(percentage)}
                className={`py-2 px-3 text-sm font-medium rounded-md border ${
                  paymentSelection.tipPercentage === percentage
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {percentage}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Articoli selezionati</span>
            <span className="font-semibold">{selectedTotal.toFixed(2)}€</span>
          </div>
          {tipAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mancia</span>
              <span className="font-semibold">{tipAmount.toFixed(2)}€</span>
            </div>
          )}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Il tuo conto</span>
              <span className="text-lg font-bold text-gray-900">
                {finalTotal.toFixed(2)}€ <span className="text-sm font-normal">IVA incl.</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        disabled={paymentSelection.selectedItems.length === 0}
        className={`w-full py-4 px-4 text-lg font-semibold rounded-lg ${
          paymentSelection.selectedItems.length > 0
            ? 'bg-green-600 text-white'
            : 'bg-gray-300 text-gray-500'
        }`}
      >
        Paga
      </button>
    </div>
  );
}
