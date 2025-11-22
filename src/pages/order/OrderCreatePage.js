import React from "react";
import NavlogComponent from "../../components/NavlogComponent";
import OrderHeader from "../../components/order/OrderHeader";
import OrderItemsList from "../../components/order/OrderItemsList";
import OrderSummary from "../../components/order/OrderSummary";
import OrderForm from "../../components/order/OrderForm";
import OrderUniversalModal from "../../components/order/OrderUniversalModal";
import useOrderCreate from "../../hooks/useOrderCreate";
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
    existingAdds,
    existingRems,
    openAddItemModal,
    openAdditionsModal,
    openRemovalsModal,
    closeModal,
    handleAddItem,
    handleSaveAdditions,
    handleSaveRemovals,
    handleRemoveLine,
    handleQuantity,
    handleSubmit,
    handleFormChange
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
          onModifiers={(i, type) => {
            if (type === "additions") openAdditionsModal(i);
            else openRemovalsModal(i);
          }}
        />

        <OrderForm
          form={form}
          submitting={submitting}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />
      </div>

      {modalOpen && (
        <OrderUniversalModal
          show={modalOpen}
          title={
            modalMode === "add-item"
              ? "Adicionar Item"
              : modalMode === "additions"
              ? "Adicionais"
              : "Remoções"
          }
          products={modalItems}
          mode={modalMode}
          existingAdds={existingAdds}
          existingRems={existingRems}
          onSelect={handleAddItem}
          onSave={(data) => {
            if (modalMode === "additions") handleSaveAdditions(modalIndex, data);
            else if (modalMode === "removals") handleSaveRemovals(modalIndex, data);
          }}
          onClose={closeModal}
        />
      )}
    </>
  );
}
