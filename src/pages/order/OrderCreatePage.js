import React from "react";
import NavlogComponent from "../../components/NavlogComponent";
import OrderHeader from "../../components/order/OrderHeader";
import OrderItemsList from "../../components/order/OrderItemsList";
import OrderSummary from "../../components/order/OrderSummary";
import OrderForm from "../../components/order/OrderForm";
import useOrderCreate from "../../hooks/useOrderCreate";
import ItemModalComponent from "../../components/order/ItemModalComponent";
import ModifiersModalComponent from "../../components/order/universal/ModifiersModalComponent";
import "./OrderCreate.css";

export default function OrderCreatePage() {
  const {
    loading,
    estId,
    estName,
    estLogo,
    formattedTotal,
    orderLines,
    form,
    submitting,
    products,
    modalOpen,
    modalMode,
    modalIndex,
    modalItems,
    modalInitialAdditions,
    modalInitialRemovals,
    openAddItemModal,
    openAdditionsModal,
    openRemovalsModal,
    handleAddItem,
    handleSaveAdditions,
    handleSaveRemovals,
    handleRemoveLine,
    handleQuantity,
    handleSubmit,
    handleFormChange,
    closeModal,
  } = useOrderCreate();

  if (loading) return <div className="order-loading__spinner" />;

  return (
    <>
      <NavlogComponent />

      <div className="order-create__container">
        <OrderHeader estName={estName} estLogo={estLogo} estId={estId} />

        <button
          className="order-create__btn-add-item"
          onClick={openAddItemModal}
        >
          + Adicionar Item
        </button>

        <OrderSummary formattedTotal={formattedTotal} />

        <OrderItemsList
  orderLines={orderLines}
  products={products}
  onRemove={handleRemoveLine}
  onQty={(i, type) => handleQuantity(i, type)}
  onModifiers={(i, type) =>
    type === "additions" ? openAdditionsModal(i) : openRemovalsModal(i)
  }
/>

        <OrderForm
          form={form}
          submitting={submitting}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />
      </div>

      {/* ============================================================
            MODAL: ADICIONAR ITEM (Item principal)
      ============================================================ */}
      {modalOpen && modalMode === "add" && (
        <ItemModalComponent
          products={modalItems}
          onSelect={(prod) =>
            handleAddItem({
              product: prod,
              quantity: 1,
            })
          }
        />
      )}

      {/* ============================================================
            MODAL: ADICIONAIS (usa o mesmo do Edit)
      ============================================================ */}
      {modalOpen && modalMode === "additions" && (
        <ModifiersModalComponent
          products={products}
          initialAdditions={modalInitialAdditions}
          initialRemovals={[]}
          mode="additions"
          onSave={(data) => handleSaveAdditions(modalIndex, data)}
          onClose={closeModal}
        />
      )}

      {/* ============================================================
            MODAL: REMOÇÕES (usa o mesmo do Edit)
      ============================================================ */}
      {modalOpen && modalMode === "removals" && (
        <ModifiersModalComponent
          products={products}
          initialAdditions={[]}
          initialRemovals={modalInitialRemovals}
          mode="removals"
          onSave={(data) => handleSaveRemovals(modalIndex, data)}
          onClose={closeModal}
        />
      )}
    </>
  );
}
