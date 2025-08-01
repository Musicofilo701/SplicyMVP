"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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
  const [currentView, setCurrentView] = useState<"menu" | "payment">("menu");
  const [paymentSelection, setPaymentSelection] = useState<PaymentSelection>({
    selectedItems: [],
    tipPercentage: 0,
    customTip: 0,
    equalDivisionAmount: 0,
    customAmountValue: 0,
  });

  // Modal states
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<"full" | "partial">("full");
  const [showEqualDivisionModal, setShowEqualDivisionModal] = useState(false);
  const [showCustomAmountModal, setShowCustomAmountModal] = useState(false);
  const [modalHistory, setModalHistory] = useState<string[]>([]);
  const [peopleCount, setPeopleCount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [customTipPercentage, setCustomTipPercentage] = useState("");

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
      customAmountValue: 0,
    });
    setPeopleCount("");
    setCustomAmount("");
    setCustomTipPercentage("");
  };

  const handleGoBack = () => {
    const newHistory = [...modalHistory];
    const previousModal = newHistory.pop();
    setModalHistory(newHistory);

    // Close current modal
    setShowProductSelection(false);
    setShowTipModal(false);
    setShowPaymentModal(false);
    setShowEqualDivisionModal(false);
    setShowCustomAmountModal(false);

    // Open previous modal
    if (previousModal === "partial") {
      setShowPartialModal(true);
    } else if (previousModal === "productSelection") {
      setShowProductSelection(true);
    } else if (previousModal === "equalDivision") {
      setShowEqualDivisionModal(true);
    } else if (previousModal === "customAmount") {
      setShowCustomAmountModal(true);
    } else if (previousModal === "tip") {
      setShowTipModal(true);
    } else if (previousModal === "payment") {
      setCurrentView("payment");
    } else {
      // If no history, go back to payment view
      setCurrentView("payment");
    }
  };

  const handleCloseAll = () => {
    setShowPartialModal(false);
    setShowProductSelection(false);
    setShowTipModal(false);
    setShowPaymentModal(false);
    setShowEqualDivisionModal(false);
    setShowCustomAmountModal(false);
    setModalHistory([]);
    setCurrentView("payment");
  };

  const fetchTableOrder = async () => {
    try {
      const response = await fetch(`/api/table-access?table_id=${table_id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (itemId: string) => {
    setPaymentSelection((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(itemId)
        ? prev.selectedItems.filter((id) => id !== itemId)
        : [...prev.selectedItems, itemId],
    }));
  };

  const calculateSelectedTotal = () => {
    if (!order) return 0;
    return order.items
      .filter((item) => paymentSelection.selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  };

  const calculateTipAmount = () => {
    const baseAmount =
      paymentType === "full"
        ? order?.orderTotal || 0
        : calculateSelectedTotal();
    return paymentSelection.tipPercentage > 0
      ? (baseAmount * paymentSelection.tipPercentage) / 100
      : paymentSelection.customTip;
  };

  const calculateFinalTotal = () => {
    const baseAmount =
      paymentType === "full"
        ? order?.orderTotal || 0
        : calculateSelectedTotal();
    return baseAmount + calculateTipAmount();
  };

  const handlePayFull = () => {
    resetAmounts();
    setPaymentType("full");
    setModalHistory(["payment"]);
    setShowTipModal(true);
  };

  const handlePayPartial = () => {
    resetAmounts();
    setPaymentType("partial");
    setShowPartialModal(true);
  };

  const handleProductSelection = () => {
    setPaymentSelection((prev) => ({
      ...prev,
      equalDivisionAmount: 0,
      customAmountValue: 0,
    }));
    setModalHistory((prev) => [...prev, "partial"]);
    setShowPartialModal(false);
    setShowProductSelection(true);
  };

  const handleProductSelectionComplete = () => {
    setModalHistory((prev) => [...prev, "productSelection"]);
    setShowProductSelection(false);
    setShowTipModal(true);
  };

  const handleEqualDivision = () => {
    setPaymentSelection((prev) => ({
      ...prev,
      selectedItems: [],
      customAmountValue: 0,
    }));
    setModalHistory((prev) => [...prev, "partial"]);
    setShowPartialModal(false);
    setShowEqualDivisionModal(true);
  };

  const handleCustomAmountSelection = () => {
    setPaymentSelection((prev) => ({
      ...prev,
      selectedItems: [],
      equalDivisionAmount: 0,
    }));
    setModalHistory((prev) => [...prev, "partial"]);
    setShowPartialModal(false);
    setShowCustomAmountModal(true);
  };

  const handleEqualDivisionComplete = (amount: number) => {
    setPaymentSelection((prev) => ({ ...prev, equalDivisionAmount: amount }));
    setModalHistory((prev) => [...prev, "equalDivision"]);
    setShowEqualDivisionModal(false);
    setShowTipModal(true);
  };

  const handleCustomAmountComplete = () => {
    setModalHistory((prev) => [...prev, "customAmount"]);
    setShowCustomAmountModal(false);
    setShowTipModal(true);
  };

  const handleTipComplete = () => {
    setModalHistory((prev) => [...prev, "tip"]);
    setShowTipModal(false);
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#fefff5] flex items-center justify-center"
        style={{ fontFamily: "Helvetica Neue, sans-serif" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#013D22] mx-auto"></div>
          <p className="mt-4 text-[#000000] font-bold">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div
        className="min-h-screen bg-[#fefff5] flex items-center justify-center p-4"
        style={{ fontFamily: "Helvetica Neue, sans-serif" }}
      >
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-[#000000] mb-2">
            Ordine non trovato
          </h1>
          <p className="text-[#000000]">
            {error ||
              "Non è stato possibile trovare un ordine per questo tavolo."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#fefff5] max-w-md mx-auto relative"
      style={{ fontFamily: "Helvetica Neue, sans-serif" }}
    >
      {/* Green Header */}
      <div className="bg-[#a9fdc0] h-32 relative">
        <div className="absolute top-4 right-4 text-right">
          <p className="text-xs text-[#000000] opacity-70">Powered by</p>
          <p className="text-sm font-bold text-[#000000]">SPLICY</p>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="bg-[#fefff5] px-6 py-4 -mt-8 relative z-10 rounded-t-3xl">
        <h1
          className="text-2xl font-bold text-[#000000] mb-1"
          style={{ fontSize: "25px", fontWeight: "bold" }}
        >
          Birreria Italiana
        </h1>
        <p className="text-[#000000] text-base">Tavolo {table_id}</p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <div className="flex rounded-full overflow-hidden">
          <button
            onClick={() => {
              setCurrentView("menu");
              resetAmounts();
            }}
            className={`flex-1 py-3 px-6 text-base transition-all ${
              currentView === "menu"
                ? "bg-[#a9fdc0] text-[#000000]"
                : "bg-[#013D22] text-white"
            }`}
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "bold",
            }}
          >
            Menù
          </button>
          <button
            onClick={() => {
              setCurrentView("payment");
              resetAmounts();
            }}
            className={`flex-1 py-3 px-6 text-base transition-all ${
              currentView === "payment"
                ? "bg-[#a9fdc0] text-[#000000]"
                : "bg-[#013D22] text-white"
            }`}
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "bold",
            }}
          >
            Paga il conto
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {currentView === "menu" ? (
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
          onClose={handleCloseAll}
          onGoBack={handleGoBack}
          onComplete={handleProductSelectionComplete}
        />
      )}

      {showTipModal && (
        <TipModal
          baseAmount={
            paymentType === "full"
              ? order.orderTotal
              : paymentType === "partial" &&
                  paymentSelection.selectedItems.length > 0
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
          onTipChange={(tip, custom) =>
            setPaymentSelection((prev) => ({
              ...prev,
              tipPercentage: tip,
              customTip: custom,
            }))
          }
          onClose={handleCloseAll}
          onGoBack={handleGoBack}
          onComplete={handleTipComplete}
          setCustomTipPercentage={setCustomTipPercentage}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          total={calculateFinalTotal()}
          onClose={handleCloseAll}
          onGoBack={handleGoBack}
        />
      )}

      {showEqualDivisionModal && (
        <EqualDivisionModal
          orderTotal={order.orderTotal}
          peopleCount={peopleCount}
          onPeopleCountChange={setPeopleCount}
          onClose={handleCloseAll}
          onGoBack={handleGoBack}
          onComplete={handleEqualDivisionComplete}
        />
      )}

      {showCustomAmountModal && (
        <CustomAmountModal
          orderTotal={order.orderTotal}
          customAmount={customAmount}
          onCustomAmountChange={setCustomAmount}
          onClose={handleCloseAll}
          onGoBack={handleGoBack}
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
        <button
          className="pb-3 text-[#000000] border-b-2 border-[#000000]"
          style={{
            fontFamily: "Helvetica Neue, sans-serif",
            fontWeight: "bold",
          }}
        >
          Raccomandati
        </button>
        <button
          className="pb-3 text-[#000000] opacity-60"
          style={{
            fontFamily: "Helvetica Neue, sans-serif",
            fontWeight: "normal",
          }}
        >
          Antipasti
        </button>
        <button
          className="pb-3 text-[#000000] opacity-60"
          style={{
            fontFamily: "Helvetica Neue, sans-serif",
            fontWeight: "normal",
          }}
        >
          Primi
        </button>
        <button
          className="pb-3 text-[#000000] opacity-60"
          style={{
            fontFamily: "Helvetica Neue, sans-serif",
            fontWeight: "normal",
          }}
        >
          Secondi
        </button>
      </div>

      {/* Menu Items */}
      <div className="space-y-4">
        {order.items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="bg-[#fefff5] rounded-2xl p-4 flex justify-between items-start shadow-sm border border-gray-100"
          >
            <div className="flex-1">
              <h3
                className="text-[#000000] text-lg mb-2"
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "bold",
                }}
              >
                {item.name}
              </h3>
              <p
                className="text-[#000000] text-sm leading-relaxed mb-3"
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "normal",
                }}
              >
                {item.description ||
                  "pane bun al pomodoro, pulled pork, cipolla di tropea caramellata, stracciatella, scamorza fusa affumicata, salsa BBQ e rucola selvatica. Aggiunta di Bacon possibile"}
              </p>
              <p
                className="text-[#000000] text-lg"
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "bold",
                }}
              >
                {item.price.toFixed(2)}€
              </p>
            </div>
            {index === 0 && (
              <div className="w-20 h-20 bg-[#013D22] rounded-xl ml-4 flex-shrink-0"></div>
            )}
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <button
          className="bg-[#013D22] text-white px-6 py-3 rounded-full shadow-lg"
          style={{
            fontFamily: "Helvetica Neue, sans-serif",
            fontWeight: "normal",
          }}
        >
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
  onPayPartial,
}: {
  order: Order;
  onPayFull: () => void;
  onPayPartial: () => void;
}) {
  // Group identical items together
  const groupedItems = order.items.reduce((acc, item) => {
    const existingGroup = acc.find(group => group.name === item.name && group.price === item.price);
    if (existingGroup) {
      existingGroup.count += 1;
      existingGroup.items.push(item);
    } else {
      acc.push({
        name: item.name,
        price: item.price,
        count: 1,
        items: [item]
      });
    }
    return acc;
  }, [] as Array<{name: string, price: number, count: number, items: MenuItem[]}>);

  return (
    <div className="space-y-6">
      {/* Order Total Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2
            className="text-[#000000]"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            Conto totale
          </h2>
          <div
            className="text-[#000000]"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {order.orderTotal.toFixed(2).replace('.', ',')}€
          </div>
        </div>
      </div>

      {/* Order Items List */}
      <div className="space-y-4 mb-8">
        {groupedItems.map((group, index) => (
          <div
            key={`${group.name}-${index}`}
            className="flex justify-between items-center"
          >
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                <span
                  className="text-white text-xs"
                  style={{
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "bold",
                  }}
                >
                  {group.count}
                </span>
              </div>
              <span
                className="text-[#000000]"
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {group.name}
              </span>
            </div>
            <div className="text-right">
              <span
                className="text-[#000000]"
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {(group.price * group.count).toFixed(2).replace('.', ',')}€
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Options */}
      <div className="space-y-3 mt-8">
        {/* Pay Full Amount Button */}
        <button
          onClick={onPayFull}
          className="w-full py-3 px-6 text-[#013D22] bg-[#fefff5] border-2 border-[#013D22] rounded-full text-base transition-colors"
          style={{
            fontFamily: "Helvetica Neue, sans-serif",
            fontWeight: "normal",
          }}
        >
          Paga il totale del conto
        </button>

        {/* Pay Partial Amount Button */}
        <button
          onClick={onPayPartial}
          className="w-full py-3 px-6 text-white bg-[#013D22] rounded-full text-base transition-colors hover:bg-[#013D22]"
          style={{
            fontFamily: "Helvetica Neue, sans-serif",
            fontWeight: "normal",
          }}
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
  onCustomAmountSelection,
}: {
  onClose: () => void;
  onProductSelection: () => void;
  onEqualDivision: () => void;
  onCustomAmountSelection: () => void;
}) {
  return (
    <div 
      className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 relative animate-slide-up"
        style={{ fontFamily: "Helvetica Neue, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="text-[#000000] text-2xl">
            ←
          </button>
          <h2
            className="text-lg text-[#000000]"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "bold",
            }}
          >
            Paga una parte
          </h2>
          <button onClick={onClose} className="text-[#000000] text-2xl">
            ×
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <button
            onClick={onEqualDivision}
            className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full text-base"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "normal",
            }}
          >
            Dividi in parti uguali
          </button>
          <button
            onClick={onCustomAmountSelection}
            className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full text-base"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "normal",
            }}
          >
            Scegli un importo personalizzato
          </button>
          <button
            onClick={onProductSelection}
            className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full text-base"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "normal",
            }}
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
  onGoBack,
  onComplete,
}: {
  order: Order;
  selectedItems: string[];
  onSelectItem: (itemId: string) => void;
  onClose: () => void;
  onGoBack: () => void;
  onComplete: () => void;
}) {
  // Group identical items together
  const groupedItems = order.items.reduce((acc, item) => {
    const existingGroup = acc.find(group => group.name === item.name && group.price === item.price);
    if (existingGroup) {
      existingGroup.count += 1;
      existingGroup.items.push(item);
    } else {
      acc.push({
        name: item.name,
        price: item.price,
        count: 1,
        items: [item]
      });
    }
    return acc;
  }, [] as Array<{name: string, price: number, count: number, items: MenuItem[]}>);

  const selectedTotal = order.items
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);

  const handleGroupSelection = (group: {name: string, price: number, count: number, items: MenuItem[]}) => {
    // Check if any item in this group is selected
    const isAnySelected = group.items.some(item => selectedItems.includes(item.id));
    
    if (isAnySelected) {
      // Deselect all items in this group
      group.items.forEach(item => {
        if (selectedItems.includes(item.id)) {
          onSelectItem(item.id);
        }
      });
    } else {
      // Select all items in this group
      group.items.forEach(item => {
        if (!selectedItems.includes(item.id)) {
          onSelectItem(item.id);
        }
      });
    }
  };

  const isGroupSelected = (group: {name: string, price: number, count: number, items: MenuItem[]}) => {
    return group.items.every(item => selectedItems.includes(item.id));
  };

  return (
    <div 
      className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 relative min-h-[80vh] animate-slide-up"
        style={{ fontFamily: "Helvetica Neue, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onGoBack} className="text-[#000000] text-2xl">
            ←
          </button>
          <h2
            className="text-lg text-[#000000]"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "bold",
            }}
          >
            Paga i tuoi prodotti
          </h2>
          <button onClick={onClose} className="text-[#000000] text-2xl">
            ×
          </button>
        </div>

        {/* Product List */}
        <div className="space-y-4 flex-1 mb-6">
          {groupedItems.map((group, index) => (
            <div
              key={`${group.name}-${index}`}
              onClick={() => handleGroupSelection(group)}
              className="flex items-center justify-between p-4 border border-gray-200 bg-white rounded-xl cursor-pointer transition-all"
            >
              <div className="flex items-center flex-1">
                <div
                  className={`w-5 h-5 border-2 rounded-sm mr-3 flex items-center justify-center transition-all ${
                    isGroupSelected(group)
                      ? "bg-[#a9fdc0] border-[#a9fdc0]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                    <span
                      className="text-white text-xs"
                      style={{
                        fontFamily: "Helvetica Neue, sans-serif",
                        fontWeight: "bold",
                      }}
                    >
                      {group.count}
                    </span>
                  </div>
                  <span
                    className="text-[#000000]"
                    style={{
                      fontFamily: "Helvetica Neue, sans-serif",
                      fontWeight: "normal",
                    }}
                  >
                    {group.name}
                  </span>
                </div>
              </div>
              <div
                className="text-[#000000] text-sm"
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "normal",
                }}
              >
                {(group.price * group.count).toFixed(2)}€
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-auto -mx-6 -mb-6">
          <div className="bg-[#a9fdc0] px-6 pt-4 pb-6">
            <div className="flex justify-between items-center mb-4">
              <span
                className="text-[#000000]"
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "bold",
                }}
              >
                Il tuo conto
              </span>
              <div className="flex items-center space-x-3">
                <span
                  className="text-[#000000]"
                  style={{
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "bold",
                  }}
                >
                  {selectedTotal.toFixed(2).replace('.', ',')}€
                </span>
              </div>
            </div>

            <button
              onClick={onComplete}
              disabled={selectedItems.length === 0}
              className={`w-full py-4 px-6 text-white rounded-full text-lg ${
                selectedItems.length === 0 ? "bg-gray-400" : "bg-[#013D22]"
              }`}
              style={{
                fontFamily: "Helvetica Neue, sans-serif",
                fontWeight: "normal",
              }}
            >
              Paga
            </button>
          </div>
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
  onGoBack,
  onComplete,
  setCustomTipPercentage,
}: {
  baseAmount: number;
  tipPercentage: number;
  customTip: number;
  customTipPercentage: string;
  onTipChange: (tip: number, custom: number) => void;
  onClose: () => void;
  onGoBack: () => void;
  onComplete: () => void;
  setCustomTipPercentage: (percentage: string) => void;
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [noTip, setNoTip] = useState(false);

  const tipAmount =
    tipPercentage > 0 ? (baseAmount * tipPercentage) / 100 : customTip;
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
    <div 
      className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 relative animate-slide-up"
        style={{ fontFamily: "Helvetica Neue, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onGoBack} className="text-[#000000] text-2xl">
            ←
          </button>
          <h2 className="text-lg font-bold text-[#000000]">Premia Luca</h2>
          <button onClick={onClose} className="text-[#000000] text-2xl">
            ×
          </button>
        </div>

        {/* Tip Message */}
        <p className="text-[#000000] text-center mb-6 text-sm">
          Hai ricevuto un ottimo servizio? Lascia una mancia per dimostrare il
          tuo apprezzamento.
        </p>

        {/* Tip Options - Larger buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[5, 10, 15].map((percentage) => (
            <div key={percentage} className="relative">
              <button
                onClick={() => handlePercentageClick(percentage)}
                className={`w-full py-6 px-4 rounded-2xl transition-all flex flex-col items-center justify-center ${
                  tipPercentage === percentage && !showCustomInput && !noTip
                    ? "bg-[#a9fdc0] text-[#000000] border border-[#a9fdc0]"
                    : "bg-gray-100 text-[#000000] border border-gray-300"
                }`}
              >
                <span
                  style={{
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontSize: "15px",
                    fontWeight: "normal",
                    lineHeight: "1.2",
                    color: "#000000",
                  }}
                >
                  {percentage}%
                </span>
                <span
                  className="mt-1"
                  style={{
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontSize: "12px",
                    fontWeight: "normal",
                    lineHeight: "1.2",
                    color: "#666666",
                    opacity: 0.8,
                  }}
                >
                  +{((baseAmount * percentage) / 100).toFixed(2)}€
                </span>
              </button>
              {/* "Consigliato" label for 10% */}
              {percentage === 10 && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[#013D22] text-white text-xs px-2 py-1 roundedfull font-bold">
                    Consigliato
                  </span>
                </div>
              )}
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
                style={{ fontFamily: "Helvetica Neue, sans-serif" }}
                autoFocus
              />
              <span className="text-[#000000] font-bold text-lg">%</span>
            </div>
            {customTipPercentage && parseFloat(customTipPercentage) > 0 && (
              <div className="text-center mt-2">
                <span className="text-[#000000] text-sm">
                  {(
                    (baseAmount * parseFloat(customTipPercentage)) /
                    100
                  ).toFixed(2)}
                  €
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
              className={`py-3 px-4 rounded-2xl transition-all ${
                showCustomInput
                  ? "bg-[#a9fdc0] text-[#000000] border border-[#a9fdc0]"
                  : "bg-gray-100 text-[#000000] border border-gray-300"
              }`}
              style={{
                fontFamily: "Helvetica Neue, sans-serif",
                fontSize: "15px",
                fontWeight: "normal",
              }}
            >
              Altro importo
            </button>
            <button
              onClick={handleNoTipClick}
              className={`py-3 px-4 rounded-2xl transition-all ${
                noTip
                  ? "bg-[#a9fdc0] text-[#000000] border border-[#a9fdc0]"
                  : "bg-gray-100 text-[#000000] border border-gray-300"
              }`}
              style={{
                fontFamily: "Helvetica Neue, sans-serif",
                fontSize: "15px",
                fontWeight: "normal",
              }}
            >
              Niente mancia
            </button>
          </div>
        </div>

        {/* Total Display and Pay Button */}
        <div className="-mx-6 -mb-6 mt-6">
          <div className="bg-[#a9fdc0] px-6 pt-4 pb-6">
            <div className="flex justify-between items-center mb-4">
              <span
                className="text-[#000000]"
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "bold",
                }}
              >
                Il tuo conto
              </span>
              <div className="text-right flex items-center space-x-3">
                <span
                  className="text-[#000000] text-sm"
                  style={{
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "normal",
                  }}
                >
                  {baseAmount.toFixed(2).replace('.', ',')}€
                </span>
                <span
                  className="text-[#000000] text-lg"
                  style={{
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "bold",
                  }}
                >
                  {total.toFixed(2).replace('.', ',')}€
                </span>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full text-lg"
              style={{
                fontFamily: "Helvetica Neue, sans-serif",
                fontWeight: "normal",
              }}
            >
              Paga
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Payment Modal
function PaymentModal({
  total,
  onClose,
  onGoBack,
}: {
  total: number;
  onClose: () => void;
  onGoBack: () => void;
}) {
  return (
    <div 
      className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 relative animate-slide-up"
        style={{ fontFamily: "Helvetica Neue, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onGoBack} className="text-[#000000] text-2xl">
            ←
          </button>
          <h2
            className="text-lg text-[#000000]"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "bold",
            }}
          >
            Paga
          </h2>
          <button onClick={onClose} className="text-[#000000] text-2xl">
            ×
          </button>
        </div>

        {/* Payment Message */}
        <p
          className="text-[#000000] text-center mb-8 text-sm"
          style={{
            fontFamily: "Helvetica Neue, sans-serif",
            fontWeight: "normal",
          }}
        >
          Transazione protetta. I tuoi dati sono al sicuro.
        </p>

        {/* Total Display and Pay Button */}
        <div className="-mx-6 -mb-6 mt-6">
          <div className="bg-[#a9fdc0] px-6 pt-4 pb-6">
            <div className="flex justify-between items-center mb-4">
              <span
                className="text-[#000000]"
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "bold",
                }}
              >
                Il tuo conto
              </span>
              <span
                className="text-[#000000]"
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "bold",
                }}
              >
                {total.toFixed(2).replace('.', ',')}€
              </span>
            </div>

            <button
              className="w-full py-4 px-6 text-white bg-[#013D22] rounded-full text-lg"
              style={{
                fontFamily: "Helvetica Neue, sans-serif",
                fontWeight: "normal",
              }}
            >
              Paga
            </button>
          </div>
        </div>
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
  onGoBack,
  onComplete,
}: {
  orderTotal: number;
  peopleCount: string;
  onPeopleCountChange: (count: string) => void;
  onClose: () => void;
  onGoBack: () => void;
  onComplete: (amount: number) => void;
}) {
  const shareAmount =
    peopleCount && parseInt(peopleCount) > 0
      ? orderTotal / parseInt(peopleCount)
      : 0;

  return (
    <div 
      className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 relative animate-slide-up"
        style={{ fontFamily: "Helvetica Neue, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onGoBack} className="text-[#000000] text-2xl">
            ←
          </button>
          <h2
            className="text-lg text-[#000000]"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "bold",
            }}
          >
            Dividi in parti uguali
          </h2>
          <button onClick={onClose} className="text-[#000000] text-2xl">
            ×
          </button>
        </div>

        {/* Instructions */}
        <p
          className="text-[#000000] text-center mb-6 text-sm"
          style={{
            fontFamily: "Helvetica Neue, sans-serif",
            fontWeight: "normal",
          }}
        >
          Inserisci il numero di persone per dividere il conto totale di{" "}
          {orderTotal.toFixed(2)}€
        </p>

        {/* Input */}
        <div className="mb-6">
          <label
            className="block text-[#000000] mb-2"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "bold",
            }}
          >
            Numero di persone
          </label>
          <input
            type="number"
            value={peopleCount}
            onChange={(e) => onPeopleCountChange(e.target.value)}
            placeholder="Es. 4"
            min="1"
            className="w-full py-3 px-4 border border-gray-300 rounded-xl text-[#000000]"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "normal",
            }}
          />
        </div>

        {/* Share Display and Continue Button */}
        {shareAmount > 0 && (
          <div className="-mx-6 -mb-6 mt-6">
            <div className="bg-[#a9fdc0] px-6 pt-4 pb-6">
              <div className="flex justify-between items-center mb-4">
                <span
                  className="text-[#000000]"
                  style={{
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "bold",
                  }}
                >
                  La tua parte
                </span>
                <span
                  className="text-[#000000]"
                  style={{
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "bold",
                  }}
                >
                  {shareAmount.toFixed(2).replace('.', ',')}€
                </span>
              </div>

              <button
                onClick={() => onComplete(shareAmount)}
                disabled={!peopleCount || parseInt(peopleCount) <= 0}
                className={`w-full py-4 px-6 text-white rounded-full text-lg ${
                  peopleCount && parseInt(peopleCount) > 0
                    ? "bg-[#013D22]"
                    : "bg-gray-400"
                }`}
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "normal",
                }}
              >
                Continua
              </button>
            </div>
          </div>
        )}

        {/* Continue Button for when no amount calculated yet */}
        {shareAmount <= 0 && (
          <button
            onClick={() => onComplete(shareAmount)}
            disabled={!peopleCount || parseInt(peopleCount) <= 0}
            className={`w-full py-4 px-6 text-white rounded-full text-lg ${
              peopleCount && parseInt(peopleCount) > 0
                ? "bg-[#013D22]"
                : "bg-gray-400"
            }`}
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "normal",
            }}
          >
            Continua
          </button>
        )}
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
  onGoBack,
  onComplete,
  setPaymentSelection,
}: {
  orderTotal: number;
  customAmount: string;
  onCustomAmountChange: (amount: string) => void;
  onClose: () => void;
  onGoBack: () => void;
  onComplete: () => void;
  setPaymentSelection: (paymentSelection: any) => void;
}) {
  const amount =
    customAmount && parseFloat(customAmount) > 0 ? parseFloat(customAmount) : 0;
  const isValidAmount = amount > 0 && amount <= orderTotal;

  const handleCustomAmountChangeWrapper = (e: any) => {
    const value = e.target.value;
    onCustomAmountChange(value);
    if (value) {
      setPaymentSelection((prev: any) => ({
        ...prev,
        customAmountValue: parseFloat(value),
      }));
    } else {
      setPaymentSelection((prev: any) => ({ ...prev, customAmountValue: 0 }));
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 relative animate-slide-up"
        style={{ fontFamily: "Helvetica Neue, sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onGoBack} className="text-[#000000] text-2xl">
            ←
          </button>
          <h2
            className="text-lg text-[#000000]"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "bold",
            }}
          >
            Importo personalizzato
          </h2>
          <button onClick={onClose} className="text-[#000000] text-2xl">
            ×
          </button>
        </div>

        {/* Instructions */}
        <p
          className="text-[#000000] text-center mb-6 text-sm"
          style={{
            fontFamily: "Helvetica Neue, sans-serif",
            fontWeight: "normal",
          }}
        >
          Inserisci l'importo che vuoi pagare (massimo {orderTotal.toFixed(2)}€)
        </p>

        {/* Input */}
        <div className="mb-6">
          <label
            className="block text-[#000000] mb-2"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "bold",
            }}
          >
            Importo da pagare
          </label>
          <input
            type="number"
            value={customAmount}
            onChange={handleCustomAmountChangeWrapper}
            placeholder="Inserisci il tuo importo"
            min="0.01"
            max={orderTotal}
            step="0.01"
            className="w-full py-3 px-4 border border-gray-300 rounded-xl text-[#000000]"
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "normal",
            }}
          />
          {amount > orderTotal && (
            <p
              className="text-red-500 text-sm mt-2"
              style={{
                fontFamily: "Helvetica Neue, sans-serif",
                fontWeight: "normal",
              }}
            >
              L'importo non può superare il totale del conto
            </p>
          )}
        </div>

        {/* Amount Display and Continue Button */}
        {isValidAmount && (
          <div className="-mx-6 -mb-6 mt-6">
            <div className="bg-[#a9fdc0] px-6 pt-4 pb-6">
              <div className="flex justify-between items-center mb-4">
                <span
                  className="text-[#000000]"
                  style={{
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "bold",
                  }}
                >
                  Importo da pagare
                </span>
                <span
                  className="text-[#000000]"
                  style={{
                    fontFamily: "Helvetica Neue, sans-serif",
                    fontWeight: "bold",
                  }}
                >
                  {amount.toFixed(2).replace('.', ',')}€
                </span>
              </div>

              <button
                onClick={onComplete}
                disabled={!isValidAmount}
                className={`w-full py-4 px-6 text-white rounded-full text-lg ${
                  isValidAmount ? "bg-[#013D22]" : "bg-gray-400"
                }`}
                style={{
                  fontFamily: "Helvetica Neue, sans-serif",
                  fontWeight: "normal",
                }}
              >
                Continua
              </button>
            </div>
          </div>
        )}

        {/* Continue Button for when no valid amount yet */}
        {!isValidAmount && (
          <button
            onClick={onComplete}
            disabled={!isValidAmount}
            className={`w-full py-4 px-6 text-white rounded-full text-lg ${
              isValidAmount ? "bg-[#013D22]" : "bg-gray-400"
            }`}
            style={{
              fontFamily: "Helvetica Neue, sans-serif",
              fontWeight: "normal",
            }}
          >
            Continua
          </button>
        )}
      </div>
    </div>
  );
}