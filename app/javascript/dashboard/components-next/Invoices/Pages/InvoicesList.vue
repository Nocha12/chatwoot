<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import InvoiceCard from 'dashboard/components-next/Invoices/InvoiceCard.vue';

const props = defineProps({ invoices: { type: Array, required: true } });
const { t } = useI18n();

const expandedCardId = ref(null);
const searchQuery = ref('');

const toggleExpanded = id => {
  expandedCardId.value = expandedCardId.value === id ? null : id;
};

const filteredInvoices = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.invoices;
  }

  const query = searchQuery.value.toLowerCase().trim();

  return props.invoices.filter(invoice => {
    // 제목에서 검색
    if (invoice.title && invoice.title.toLowerCase().includes(query)) {
      return true;
    }

    // details 객체의 모든 값에서 검색
    if (invoice.details && typeof invoice.details === 'object') {
      return Object.values(invoice.details).some(value => {
        if (value && typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        if (value && typeof value === 'number') {
          return value.toString().includes(query);
        }
        return false;
      });
    }

    return false;
  });
});
</script>

<template>
  <div class="flex flex-col gap-4 px-6 pt-4 pb-6">
    <!-- 검색 입력 필드 -->
    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('INVOICE_SEARCH.PLACEHOLDER')"
        class="w-full px-3 py-2 border border-n-border rounded-md focus:outline-none focus:ring-2 focus:ring-n-blue-6 focus:border-transparent"
      />
    </div>

    <!-- 검색 결과가 없을 때 -->
    <div
      v-if="filteredInvoices.length === 0 && searchQuery.trim()"
      class="flex items-center justify-center py-10"
    >
      <span class="text-base text-n-slate-11">
        {{ t('INVOICE_SEARCH.NO_RESULTS') }}
      </span>
    </div>

    <!-- 인보이스 카드 목록 -->
    <InvoiceCard
      v-for="invoice in filteredInvoices"
      :id="invoice.id"
      :key="invoice.id"
      :title="invoice.title"
      :invoice-number="invoice.invoiceNumber"
      :total="invoice.total"
      :status="invoice.status"
      :details="invoice.details || {}"
      :table-data="invoice.tableData"
      :is-expanded="expandedCardId === invoice.id"
      @toggle="toggleExpanded(invoice.id)"
    />
  </div>
</template>
