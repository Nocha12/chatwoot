<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import InvoiceCard from 'dashboard/components-next/Invoices/InvoiceCard.vue';
import PaginationFooter from 'dashboard/components-next/pagination/PaginationFooter.vue';

const props = defineProps({
  invoices: { type: Array, required: true },
  allInvoices: { type: Array, default: () => [] },
});
const { t } = useI18n();

const expandedCardId = ref(null);
const searchInput = ref('');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(25);
const searchTimeout = ref(null);

const updateQuery = value => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }

  searchTimeout.value = setTimeout(() => {
    if (value.trim()) {
      searchQuery.value = value;
    }
  }, 300);
};

watch(searchInput, value => {
  if (!value.trim()) {
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value);
      searchTimeout.value = null;
    }
    searchQuery.value = '';
  } else {
    updateQuery(value);
  }
});

watch(searchQuery, () => {
  // 검색 시 첫 페이지로 이동
  currentPage.value = 1;
});

const toggleExpanded = id => {
  expandedCardId.value = expandedCardId.value === id ? null : id;
};

const indexedInvoices = computed(() => {
  let invoicesToIndex = props.invoices;

  if (props.allInvoices.length > 0) {
    if (props.invoices.length > 0) {
      invoicesToIndex = props.invoices;
    } else {
      invoicesToIndex = props.allInvoices;
    }
  }

  return invoicesToIndex.map(invoice => {
    const searchableFields = [];

    // 제목 추가
    if (invoice.title) {
      searchableFields.push(invoice.title.toLowerCase());
    }

    // details 객체의 모든 값 추가
    if (invoice.details && typeof invoice.details === 'object') {
      Object.values(invoice.details).forEach(value => {
        if (value && typeof value === 'string') {
          searchableFields.push(value.toLowerCase());
        } else if (value && typeof value === 'number') {
          searchableFields.push(value.toString());
        }
      });
    }

    return {
      ...invoice,
      searchableText: searchableFields.join(' '),
    };
  });
});

const filteredInvoices = computed(() => {
  if (!searchQuery.value.trim()) {
    return indexedInvoices.value;
  }

  const query = searchQuery.value.toLowerCase().trim();

  return indexedInvoices.value.filter(invoice =>
    invoice.searchableText.includes(query)
  );
});

const paginatedInvoices = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredInvoices.value.slice(start, end);
});

const totalItems = computed(() => filteredInvoices.value.length);

const handlePageChange = page => {
  currentPage.value = page;
  // 페이지 변경 시 맨 위로 스크롤
  const container = document.querySelector('.invoices-list-container');
  if (container) {
    container.scrollTop = 0;
  }
};
</script>

<template>
  <div class="flex flex-col gap-4 px-6 pt-4 pb-6">
    <!-- 검색 입력 필드 -->
    <div class="mb-4">
      <input
        v-model="searchInput"
        type="text"
        :placeholder="t('INVOICE_SEARCH.PLACEHOLDER')"
        class="w-full px-3 py-2 border border-n-border rounded-md focus:outline-none focus:ring-2 focus:ring-n-blue-6 focus:border-transparent"
      />
    </div>

    <!-- 검색 결과가 없을 때 -->
    <div
      v-if="filteredInvoices.length === 0 && searchInput.trim()"
      class="flex items-center justify-center py-10"
    >
      <span class="text-base text-n-slate-11">
        {{ t('INVOICE_SEARCH.NO_RESULTS') }}
      </span>
    </div>

    <!-- 인보이스 카드 목록 -->
    <div class="invoices-list-container flex flex-col gap-3">
      <InvoiceCard
        v-for="invoice in paginatedInvoices"
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

    <!-- 페이지네이션 -->
    <PaginationFooter
      v-if="totalItems > itemsPerPage"
      :current-page="currentPage"
      :total-items="totalItems"
      :items-per-page="itemsPerPage"
      @update:current-page="handlePageChange"
    />
  </div>
</template>

<style scoped>
.invoices-list-container {
  min-height: 400px;
}
</style>
