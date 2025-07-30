
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
      <div className="min-h-screen bg-[#fefff5] flex items-center justify-center" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#013D22] mx-auto"></div>
          <p className="mt-4 text-[#000000] font-bold">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#fefff5] flex items-center justify-center p-4" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-[#000000] mb-2">
            Ordine non trovato
          </h1>
          <p className="text-[#000000]">
            {error || 'Non è stato possibile trovare un ordine per questo tavolo.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefff5] max-w-md mx-auto" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
      {/* Green Header */}
      <div className="bg-[#a9fdc0] h-32 relative">
        <div className="absolute top-4 right-4 text-right">
          <p className="text-xs text-[#000000] opacity-70">Powered by</p>
          <p className="text-sm font-bold text-[#000000]">SPLICY</p>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="bg-[#fefff5] px-6 py-4 -mt-8 relative z-10 rounded-t-3xl">
        <h1 className="text-2xl font-bold text-[#000000] mb-1" style={{ fontSize: '25px', fontWeight: 'bold' }}>Birreria Italiana</h1>
        <p className="text-[#000000] text-base">Tavolo {table_id}</p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <div className="flex bg-[#a9fdc0] rounded-full p-1">
          <button
            onClick={() => setCurrentView('menu')}
            className={`flex-1 py-3 px-6 text-base font-bold rounded-full transition-all ${
              currentView === 'menu'
                ? 'bg-[#a9fdc0] text-[#000000] shadow-sm'
                : 'bg-[#013D22] text-white'
            }`}
          >
            Menù
          </button>
          <button
            onClick={() => setCurrentView('payment')}
            className={`flex-1 py-3 px-6 text-base font-bold rounded-full transition-all ${
              currentView === 'payment'
                ? 'bg-[#013D22] text-white shadow-sm'
                : 'bg-[#a9fdc0] text-[#000000]'
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
      <div className="flex space-x-6 border-b border-[#013D22]">
        <button className="pb-3 text-[#000000] font-bold border-b-2 border-[#000000]">
          Raccomandati
        </button>
        <button className="pb-3 text-[#000000] opacity-60">
          Antipasti
        </button>
        <button className="pb-3 text-[#000000] opacity-60">
          Primi
        </button>
        <button className="pb-3 text-[#000000] opacity-60">
          Secondi
        </button>
      </div>

      {/* Menu Items */}
      <div className="space-y-4">
        {order.items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="bg-[#a9fdc0] rounded-2xl p-4 flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-[#000000] text-lg mb-2">{item.name}</h3>
              <p className="text-[#000000] text-sm leading-relaxed mb-3">
                {item.description || "pane bun al pomodoro, pulled pork, cipolla di tropea caramellata, stracciatella, scamorza fusa affumicata, salsa BBQ e rucola selvatica. Aggiunta di Bacon possibile"}
              </p>
              <p className="text-[#000000] font-bold text-lg">{item.price.toFixed(2)}€</p>
            </div>
            {index === 0 && (
              <div className="w-20 h-20 bg-[#013D22] rounded-xl ml-4 flex-shrink-0"></div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <button className="bg-[#013D22] text-white px-6 py-3 rounded-full font-bold shadow-lg">
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
      <div className="bg-[#fefff5] rounded-xl border border-[#013D22]">
        <div className="p-4 border-b border-[#013D22] flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#000000]">Scegli cosa pagare</h2>
          <button
            onClick={onSelectAll}
            className="px-4 py-2 text-sm font-bold bg-[#013D22] text-white rounded-lg hover:bg-[#013D22] transition-colors"
          >
            Seleziona tutto
          </button>
        </div>
        <div className="divide-y divide-[#013D22]">
          {order.items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="p-4">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={paymentSelection.selectedItems.includes(item.id)}
                  onChange={() => onSelectItem(item.id)}
                  className="h-5 w-5 text-[#013D22] rounded border-[#013D22] focus:ring-[#013D22]"
                />
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-bold text-[#000000]">{item.name}</span>
                  <span className="font-bold text-[#000000]">€{item.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip Selection */}
      <div className="bg-[#fefff5] rounded-xl border border-[#013D22]">
        <div className="p-4 border-b border-[#013D22]">
          <h2 className="text-lg font-bold text-[#000000]">Mancia</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-3">
            {[0, 5, 10, 15].map(percentage => (
              <button
                key={percentage}
                onClick={() => handleTipPercentage(percentage)}
                className={`py-3 px-4 text-sm font-bold rounded-lg border transition-colors ${
                  paymentSelection.tipPercentage === percentage
                    ? 'bg-[#013D22] text-white border-[#013D22]'
                    : 'bg-[#fefff5] text-[#000000] border-[#013D22] hover:border-[#013D22]'
                }`}
              >
                {percentage}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-[#fefff5] rounded-xl border border-[#013D22]">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[#000000]">Articoli selezionati</span>
            <span className="font-bold text-[#000000]">€{selectedTotal.toFixed(2)}</span>
          </div>
          {tipAmount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[#000000]">Mancia</span>
              <span className="font-bold text-[#000000]">€{tipAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-[#013D22] pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-[#000000]">Il tuo conto</span>
              <div className="text-right">
                <span className="text-xl font-bold text-[#000000]" style={{ fontSize: '25px' }}>€{finalTotal.toFixed(2)}</span>
                <p className="text-sm text-[#000000]">IVA incl.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        disabled={paymentSelection.selectedItems.length === 0}
        className={`w-full py-4 px-6 text-lg font-bold rounded-xl transition-colors ${
          paymentSelection.selectedItems.length > 0
            ? 'bg-[#013D22] text-white hover:bg-[#013D22]'
            : 'bg-[#a9fdc0] text-[#000000] cursor-not-allowed'
        }`}
      >
        Paga
      </button>
    </div>
  );
}
