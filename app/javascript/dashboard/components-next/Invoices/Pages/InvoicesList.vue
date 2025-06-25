<script setup>
import { ref } from 'vue';
import InvoiceCard from 'dashboard/components-next/Invoices/InvoiceCard.vue';

defineProps({ invoices: { type: Array, required: true } });

const expandedCardId = ref(null);

const toggleExpanded = id => {
  expandedCardId.value = expandedCardId.value === id ? null : id;
};
</script>

<template>
  <div class="flex flex-col gap-4 px-6 pt-4 pb-6">
    <InvoiceCard
      v-for="invoice in invoices"
      :key="invoice.id"
      :id="invoice.id"
      :invoice-number="invoice.invoiceNumber"
      :total="invoice.total"
      :status="invoice.status"
      :is-expanded="expandedCardId === invoice.id"
      @toggle="toggleExpanded(invoice.id)"
    />
  </div>
</template>
