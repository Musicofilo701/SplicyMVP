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
  equalDivisionAmount: number;
  customAmountValue: number;
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
    customTip: 0,
    equalDivisionAmount: 0,
    customAmountValue: 0
  });

  // Modal states
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [showEqualDivisionModal, setShowEqualDivisionModal] = useState(false);
  const [showCustomAmountModal, setShowCustomAmountModal] = useState(false);
  const [peopleCount, setPeopleCount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customTipPercentage, setCustomTipPercentage] = useState('');

  useEffect(() => {
    fetchTableOrder();
    resetAmounts();
  }, [table_id]);

  const resetAmounts = () => {
    setPaymentSelection({
      selectedItems: [],
      tipPercentage: 0,
      customTip: 0,
      equalDivisionAmount: 0,
      customAmountValue: 0
    });
    setPeopleCount('');
    setCustomAmount('');
    setCustomTipPercentage('');
  };

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

  const calculateSelectedTotal = () => {
    if (!order) return 0;
    return order.items
      .filter(item => paymentSelection.selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  };

  const calculateTipAmount = () => {
    const baseAmount = paymentType === 'full' ? (order?.orderTotal || 0) : calculateSelectedTotal();
    return paymentSelection.tipPercentage > 0
      ? (baseAmount * paymentSelection.tipPercentage / 100)
      : paymentSelection.customTip;
  };

  const calculateFinalTotal = () => {
    const baseAmount = paymentType === 'full' ? (order?.orderTotal || 0) : calculateSelectedTotal();
    return baseAmount + calculateTipAmount();
  };

  const handlePayFull = () => {
    resetAmounts();
    setPaymentType('full');
    setShowTipModal(true);
  };

  const handlePayPartial = () => {
    resetAmounts();
    setPaymentType('partial');
    setShowPartialModal(true);
  };

  const handleProductSelection = () => {
    setPaymentSelection(prev => ({
      ...prev,
      equalDivisionAmount: 0,
      customAmountValue: 0
    }));
    setShowPartialModal(false);
    setShowProductSelection(true);
  };

  const handleProductSelectionComplete = () => {
    setShowProductSelection(false);
    setShowTipModal(true);
  };

  const handleEqualDivision = () => {
    setPaymentSelection(prev => ({
      ...prev,
      selectedItems: [],
      customAmountValue: 0
    }));
    setShowPartialModal(false);
    setShowEqualDivisionModal(true);
  };

  const handleCustomAmountSelection = () => {
    setPaymentSelection(prev => ({
      ...prev,
      selectedItems: [],
      equalDivisionAmount: 0
    }));
    setShowPartialModal(false);
    setShowCustomAmountModal(true);
  };

  const handleEqualDivisionComplete = (amount: number) => {
    setPaymentSelection(prev => ({ ...prev, equalDivisionAmount: amount }));
    setShowEqualDivisionModal(false);
    setShowTipModal(true);
  };

  const handleCustomAmountComplete = () => {
    setShowCustomAmountModal(false);
    setShowTipModal(true);
  };

  const handleTipComplete = () => {
    setShowTipModal(false);
    setShowPaymentModal(true);
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
    <div className="min-h-screen bg-[#fefff5] max-w-md mx-auto relative" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
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
        <div className="flex rounded-full overflow-hidden">
          <button
            onClick={() => {setCurrentView('menu'); resetAmounts();}}
            className={`flex-1 py-3 px-6 text-base font-bold transition-all ${
              currentView === 'menu'
                ? 'bg-[#a9fdc0] text-[#000000]'
                : 'bg-[#013D22] text-white'
            }`}
            style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 'bold' }}
          >
            Menù
          </button>
          <button
            onClick={() => {setCurrentView('payment'); resetAmounts();}}
            className={`flex-1 py-3 px-6 text-base font-bold transition-all ${
              currentView === 'payment'
                ? 'bg-[#a9fdc0] text-[#000000]'
                : 'bg-[#013D22] text-white'
            }`}
            style={{ fontFamily: 'Helvetica Neue, sans-serif', fontWeight: 'bold' }}
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
            onPayFull={handlePayFull}
            onPayPartial={handlePayPartial}
          />
        )}
      </div>

      {/* Modals */}
      {showPartialModal && (
        <PartialPaymentModal
          onClose={() => setShowPartialModal(false)}
          onProductSelection={handleProductSelection}
          onEqualDivision={handleEqualDivision}
          onCustomAmountSelection={handleCustomAmountSelection}
        />
      )}

      {showProductSelection && (
        <ProductSelectionModal
          order={order}
          selectedItems={paymentSelection.selectedItems}
          onSelectItem={handleSelectItem}
          onClose={() => setShowProductSelection(false)}
          onComplete={handleProductSelectionComplete}
        />
      )}

      {showTipModal && (
        <TipModal
          baseAmount={
            paymentType === 'full'
              ? order.orderTotal
              : paymentType === 'partial' && paymentSelection.selectedItems.length > 0
                ? calculateSelectedTotal()
                : paymentSelection.equalDivisionAmount > 0
                  ? paymentSelection.equalDivisionAmount
                  : paymentSelection.customAmountValue > 0
                    ? paymentSelection.customAmountValue
                    : 0
          }
          tipPercentage={paymentSelection.tipPercentage}
          customTip={paymentSelection.customTip}
          customTipPercentage={customTipPercentage}
          onTipChange={(tip, custom) => setPaymentSelection(prev => ({ ...prev, tipPercentage: tip, customTip: custom }))}
          onClose={() => setShowTipModal(false)}
          onComplete={handleTipComplete}
          setCustomTipPercentage={setCustomTipPercentage}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          total={calculateFinalTotal()}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showEqualDivisionModal && (
        <EqualDivisionModal
          orderTotal={order.orderTotal}
          peopleCount={peopleCount}
          onPeopleCountChange={setPeopleCount}
          onClose={() => setShowEqualDivisionModal(false)}
          onComplete={handleEqualDivisionComplete}
        />
      )}

      {showCustomAmountModal && (
        <CustomAmountModal
          orderTotal={order.orderTotal}
          customAmount={customAmount}
          onCustomAmountChange={setCustomAmount}
          onClose={() => setShowCustomAmountModal(false)}
          onComplete={handleCustomAmountComplete}
          setPaymentSelection={setPaymentSelection}
        />
      )}

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
          <div key={`${item.id}-${index}`} className="bg-[#fefff5] rounded-2xl p-4 flex justify-between items-start shadow-sm border border-gray-100">
            <div className="flex-1">
              <h3 className="font-bold text-[#000000] text-lg mb-2" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>{item.name}</h3>
              <p className="text-[#000000] text-sm leading-relaxed mb-3" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
                {item.description || "pane bun al pomodoro, pulled pork, cipolla di tropea caramellata, stracciatella, scamorza fusa affumicata, salsa BBQ e rucola selvatica. Aggiunta di Bacon possibile"}
              </p>
              <p className="text-[#000000] font-bold text-lg" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>{item.price.toFixed(2)}€</p>
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
  onPayFull,
  onPayPartial
}: {
  order: Order;
  onPayFull: () => void;
  onPayPartial: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Order Total Section */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-[#000000] mb-2" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
          Conto totale
        </h2>
        <div className="text-4xl font-bold text-[#000000] mb-1" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
          {order.orderTotal.toFixed(2)}€
        </div>
      </div>

      {/* Order Items List */}
      <div className="space-y-3">
        {order.items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex justify-between items-center py-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-[#000000] rounded-full"></div>
              <span className="text-[#000000] font-medium" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#000000] text-sm mr-2" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
                {item.price < 10 ? `${item.price.toFixed(2)}€` : `${Math.floor(item.price)},${(item.price % 1 * 100).toFixed(0).padStart(2, '0')}€`}
              </span>
              <span className="text-[#000000] font-bold" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
                {item.price < 10 ? `${item.price.toFixed(2)}€` : `${Math.floor(item.price)},${(item.price % 1 * 100).toFixed(0).padStart(2, '0')}€`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Options */}
      <div className="space-y-4 mt-8">
        {/* Pay Full Amount Button */}
        <button
          onClick={onPayFull}
          className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full font-bold text-lg transition-colors hover:bg-[#013D22]"
          style={{ fontFamily: 'Helvetica Neue, sans-serif' }}
        >
          Paga il totale del conto
        </button>

        {/* Pay Partial Amount Button */}
        <button
          onClick={onPayPartial}
          className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full font-bold text-lg transition-colors hover:bg-[#013D22]"
          style={{ fontFamily: 'Helvetica Neue, sans-serif' }}
        >
          Paga una parte
        </button>
      </div>
    </div>
  );
}

// Partial Payment Modal
function PartialPaymentModal({
  onClose,
  onProductSelection,
  onEqualDivision,
  onCustomAmountSelection
}: {
  onClose: () => void;
  onProductSelection: () => void;
  onEqualDivision: () => void;
  onCustomAmountSelection: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 relative animate-slide-up" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="text-[#000000] text-xl">
            ←
          </button>
          <h2 className="text-lg font-bold text-[#000000]">Paga una parte</h2>
          <button onClick={onClose} className="text-[#000000] text-xl">
            ×
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <button
            onClick={onEqualDivision}
            className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full font-bold text-base"
          >
            Dividi in parti uguali
          </button>
          <button
            onClick={onCustomAmountSelection}
            className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full font-bold text-base"
          >
            Scegli un importo personalizzato
          </button>
          <button
            onClick={onProductSelection}
            className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full font-bold text-base"
          >
            Paga i prodotti che hai mangiato
          </button>
        </div>
      </div>
    </div>
  );
}

// Product Selection Modal
function ProductSelectionModal({
  order,
  selectedItems,
  onSelectItem,
  onClose,
  onComplete
}: {
  order: Order;
  selectedItems: string[];
  onSelectItem: (itemId: string) => void;
  onClose: () => void;
  onComplete: () => void;
}) {
  const selectedTotal = order.items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 relative min-h-[80vh] animate-slide-up" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="text-[#000000] text-xl">
            ←
          </button>
          <h2 className="text-lg font-bold text-[#000000]">Paga i tuoi prodotti</h2>
          <button onClick={onClose} className="text-[#000000] text-xl">
            ×
          </button>
        </div>

        {/* Product List */}
        <div className="space-y-4 flex-1 mb-6">
          {order.items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div className="flex-1">
                <span className="text-[#000000] font-medium">{item.name}</span>
                <div className="text-[#000000] text-sm">{item.price.toFixed(2)}€</div>
              </div>
              <button
                onClick={() => onSelectItem(item.id)}
                className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center ${
                  selectedItems.includes(item.id)
                    ? 'bg-[#a9fdc0] border-[#a9fdc0]'
                    : 'border-gray-300'
                }`}
              >
                {selectedItems.includes(item.id) && (
                  <span className="text-[#013D22] text-sm">✓</span>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-auto">
          <div className="bg-[#a9fdc0] rounded-xl p-4 mb-4 flex justify-between items-center">
            <span className="text-[#000000] font-bold">Il tuo conto</span>
            <span className="text-[#000000] font-bold">{selectedTotal.toFixed(2)}€</span>
          </div>

          <button
            onClick={onComplete}
            disabled={selectedItems.length === 0}
            className={`w-full py-4 px-6 text-white rounded-full font-bold text-lg ${
              selectedItems.length === 0 ? 'bg-gray-400' : 'bg-[#013D22]'
            }`}
          >
            Paga
          </button>
        </div>
      </div>
    </div>
  );
}

// Tip Modal
function TipModal({
  baseAmount,
  tipPercentage,
  customTip,
  customTipPercentage,
  onTipChange,
  onClose,
  onComplete,
  setCustomTipPercentage
}: {
  baseAmount: number;
  tipPercentage: number;
  customTip: number;
  customTipPercentage: string;
  onTipChange: (tip: number, custom: number) => void;
  onClose: () => void;
  onComplete: () => void;
  setCustomTipPercentage: (percentage: string) => void;
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [noTip, setNoTip] = useState(false);
  
  const tipAmount = tipPercentage > 0 ? (baseAmount * tipPercentage / 100) : customTip;
  const total = baseAmount + tipAmount;

  const handlePercentageClick = (percentage: number) => {
    onTipChange(percentage, 0);
    setShowCustomInput(false);
    setNoTip(false);
  };

  const handleCustomInputClick = () => {
    setShowCustomInput(true);
    setNoTip(false);
    onTipChange(0, 0);
  };

  const handleNoTipClick = () => {
    setNoTip(true);
    setShowCustomInput(false);
    onTipChange(0, 0);
  };

  const handleCustomTipPercentageChange = (e: any) => {
    const value = e.target.value;
    setCustomTipPercentage(value);
    if (value && parseFloat(value) > 0) {
      const percentage = parseFloat(value);
      onTipChange(percentage, 0);
    } else {
      onTipChange(0, 0);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 relative animate-slide-up" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="text-[#000000] text-xl">
            ←
          </button>
          <h2 className="text-lg font-bold text-[#000000]">Premia Luca</h2>
          <button onClick={onClose} className="text-[#000000] text-xl">
            ×
          </button>
        </div>

        {/* Tip Message */}
        <p className="text-[#000000] text-center mb-6 text-sm">
          Hai ricevuto un ottimo servizio? Lascia una mancia per dimostrare il tuo apprezzamento.
        </p>

        {/* Tip Options - Larger buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[5, 10, 15].map(percentage => (
            <div key={percentage} className="relative">
              <button
                onClick={() => handlePercentageClick(percentage)}
                className={`w-full py-6 px-4 rounded-2xl font-bold text-lg transition-all ${
                  tipPercentage === percentage && !showCustomInput && !noTip
                    ? 'bg-[#013D22] text-white'
                    : 'bg-gray-100 text-[#000000] border border-gray-300'
                }`}
              >
                {percentage}%
              </button>
              {/* "Consigliato" label for 10% */}
              {percentage === 10 && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#013D22] text-white text-xs px-2 py-1 rounded-full font-bold">
                    Consigliato
                  </span>
                </div>
              )}
              {/* Tip amount display */}
              <div className="text-center mt-2">
                <span className="text-[#000000] text-sm">
                  {(baseAmount * percentage / 100).toFixed(2)}€
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Input Section */}
        {showCustomInput && (
          <div className="mb-6">
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={customTipPercentage}
                onChange={handleCustomTipPercentageChange}
                placeholder="Es. 12"
                min="0"
                max="100"
                step="0.1"
                className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-[#000000] font-medium text-center"
                style={{ fontFamily: 'Helvetica Neue, sans-serif' }}
                autoFocus
              />
              <span className="text-[#000000] font-bold text-lg">%</span>
            </div>
            {customTipPercentage && parseFloat(customTipPercentage) > 0 && (
              <div className="text-center mt-2">
                <span className="text-[#000000] text-sm">
                  {(baseAmount * parseFloat(customTipPercentage) / 100).toFixed(2)}€
                </span>
              </div>
            )}
          </div>
        )}

        {/* Custom Options - Smaller buttons */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCustomInputClick}
              className={`py-3 px-4 rounded-2xl font-medium text-sm transition-all ${
                showCustomInput
                  ? 'bg-[#013D22] text-white'
                  : 'bg-gray-100 text-[#000000] border border-gray-300'
              }`}
            >
              Altro importo
            </button>
            <button
              onClick={handleNoTipClick}
              className={`py-3 px-4 rounded-2xl font-medium text-sm transition-all ${
                noTip
                  ? 'bg-[#013D22] text-white'
                  : 'bg-gray-100 text-[#000000] border border-gray-300'
              }`}
            >
              Niente mancia
            </button>
          </div>
        </div>

        {/* Total Display */}
        <div className="bg-[#a9fdc0] rounded-xl p-4 mb-6 flex justify-between items-center">
          <span className="text-[#000000] font-bold">Il tuo conto</span>
          <div className="text-right">
            <span className="text-[#000000] text-sm">{baseAmount.toFixed(2)}€ </span>
            <span className="text-[#000000] font-bold">{total.toFixed(2)}€</span>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={onComplete}
          className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full font-bold text-lg"
        >
          Paga
        </button>
      </div>
    </div>
  );
}

// Payment Modal
function PaymentModal({
  total,
  onClose
}: {
  total: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 relative animate-slide-up" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="text-[#000000] text-xl">
            ←
          </button>
          <h2 className="text-lg font-bold text-[#000000]">Paga</h2>
          <button onClick={onClose} className="text-[#000000] text-xl">
            ×
          </button>
        </div>

        {/* Payment Message */}
        <p className="text-[#000000] text-center mb-8 text-sm">
          Transazione protetta. I tuoi dati sono al sicuro.
        </p>

        {/* Total Display */}
        <div className="bg-[#a9fdc0] rounded-xl p-4 mb-6 flex justify-between items-center">
          <span className="text-[#000000] font-bold">Il tuo conto</span>
          <span className="text-[#000000] font-bold">{total.toFixed(2)}€</span>
        </div>

        {/* Pay Button */}
        <button className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full font-bold text-lg">
          Paga
        </button>
      </div>
    </div>
  );
}

// Equal Division Modal
function EqualDivisionModal({
  orderTotal,
  peopleCount,
  onPeopleCountChange,
  onClose,
  onComplete
}: {
  orderTotal: number;
  peopleCount: string;
  onPeopleCountChange: (count: string) => void;
  onClose: () => void;
  onComplete: (amount: number) => void;
}) {
  const shareAmount = peopleCount && parseInt(peopleCount) > 0 ? orderTotal / parseInt(peopleCount) : 0;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 relative animate-slide-up" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="text-[#000000] text-xl">
            ←
          </button>
          <h2 className="text-lg font-bold text-[#000000]">Dividi in parti uguali</h2>
          <button onClick={onClose} className="text-[#000000] text-xl">
            ×
          </button>
        </div>

        {/* Instructions */}
        <p className="text-[#000000] text-center mb-6 text-sm">
          Inserisci il numero di persone per dividere il conto totale di {orderTotal.toFixed(2)}€
        </p>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-[#000000] font-bold mb-2">Numero di persone</label>
          <input
            type="number"
            value={peopleCount}
            onChange={(e) => onPeopleCountChange(e.target.value)}
            placeholder="Es. 4"
            min="1"
            className="w-full py-3 px-4 border border-gray-300 rounded-xl text-[#000000] font-medium"
            style={{ fontFamily: 'Helvetica Neue, sans-serif' }}
          />
        </div>

        {/* Share Display */}
        {shareAmount > 0 && (
          <div className="bg-[#a9fdc0] rounded-xl p-4 mb-6 flex justify-between items-center">
            <span className="text-[#000000] font-bold">La tua parte</span>
            <span className="text-[#000000] font-bold">{shareAmount.toFixed(2)}€</span>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={() => onComplete(shareAmount)}
          disabled={!peopleCount || parseInt(peopleCount) <= 0}
          className={`w-full py-4 px-6 text-white rounded-full font-bold text-lg ${
            peopleCount && parseInt(peopleCount) > 0 ? 'bg-[#013D22]' : 'bg-gray-400'
          }`}
        >
          Continua
        </button>
      </div>
    </div>
  );
}

// Custom Amount Modal
function CustomAmountModal({
  orderTotal,
  customAmount,
  onCustomAmountChange,
  onClose,
  onComplete,
  setPaymentSelection
}: {
  orderTotal: number;
  customAmount: string;
  onCustomAmountChange: (amount: string) => void;
  onClose: () => void;
  onComplete: () => void;
  setPaymentSelection: (paymentSelection: any) => void;
}) {
  const amount = customAmount && parseFloat(customAmount) >0 ? parseFloat(customAmount) : 0;
  const isValidAmount = amount > 0 && amount <= orderTotal;

  const handleCustomAmountChangeWrapper = (e: any) => {
    const value = e.target.value;
    onCustomAmountChange(value);
    if (value) {
      setPaymentSelection((prev: any) => ({ ...prev, customAmountValue: parseFloat(value) }));
    } else {
      setPaymentSelection((prev: any) => ({ ...prev, customAmountValue: 0 }));
    }
  };

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 relative animate-slide-up" style={{ fontFamily: 'Helvetica Neue, sans-serif' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onClose} className="text-[#000000] text-xl">
            ←
          </button>
          <h2 className="text-lg font-bold text-[#000000]">Importo personalizzato</h2>
          <button onClick={onClose} className="text-[#000000] text-xl">
            ×
          </button>
        </div>

        {/* Instructions */}
        <p className="text-[#000000] text-center mb-6 text-sm">
          Inserisci l'importo che vuoi pagare (massimo {orderTotal.toFixed(2)}€)
        </p>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-[#000000] font-bold mb-2">Importo da pagare</label>
          <input
            type="number"
            value={customAmount}
            onChange={handleCustomAmountChangeWrapper}
            placeholder="Es. 25.50"
            min="0.01"
            max={orderTotal}
            step="0.01"
            className="w-full py-3 px-4 border border-gray-300 rounded-xl text-[#000000] font-medium"
            style={{ fontFamily: 'Helvetica Neue, sans-serif' }}
          />
          {amount > orderTotal && (
            <p className="text-red-500 text-sm mt-2">L'importo non può superare il totale del conto</p>
          )}
        </div>

        {/* Amount Display */}
        {isValidAmount && (
          <div className="bg-[#a9fdc0] rounded-xl p-4 mb-6 flex justify-between items-center">
            <span className="text-[#000000] font-bold">Importo da pagare</span>
            <span className="text-[#000000] font-bold">{amount.toFixed(2)}€</span>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={onComplete}
          disabled={!isValidAmount}
          className={`w-full py-4 px-6 text-white rounded-full font-bold text-lg ${
            isValidAmount ? 'bg-[#013D22]' : 'bg-gray-400'
          }`}
        >
          Continua
        </button>
      </div>
    </div>
  );
}