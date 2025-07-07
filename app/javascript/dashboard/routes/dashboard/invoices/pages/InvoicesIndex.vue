<script setup>
import { onMounted, ref, computed, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import { debounce } from '@chatwoot/utils';
import { useUISettings } from 'dashboard/composables/useUISettings';

import ContactsListLayout from 'dashboard/components-next/Contacts/ContactsListLayout.vue';
import InvoicesList from 'dashboard/components-next/Invoices/Pages/InvoicesList.vue';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';

import { read, utils } from 'xlsx';

const DEFAULT_SORT_FIELD = 'created_at';
const DEBOUNCE_DELAY = 300;

const store = useStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const { updateUISettings, uiSettings } = useUISettings();

const invoices = useMapGetter('invoices/getInvoicesList');
const uiFlags = useMapGetter('invoices/getUIFlags');
const meta = useMapGetter('invoices/getMeta');

const searchQuery = computed(() => route.query?.search);
const searchValue = ref(searchQuery.value || '');
const pageNumber = computed(() => Number(route.query?.page) || 1);

const parseSortSettings = (sortString = '') => {
  const hasDescending = sortString.startsWith('-');
  const sortField = hasDescending ? sortString.slice(1) : sortString;
  return {
    sort: sortField || DEFAULT_SORT_FIELD,
    order: hasDescending ? '-' : '',
  };
};

const { invoices_sort_by: invoicesSortBy = '' } = uiSettings.value ?? {};
const { sort: initialSort, order: initialOrder } =
  parseSortSettings(invoicesSortBy);

const sortState = reactive({
  activeSort: initialSort,
  activeOrdering: initialOrder,
});
const excelInvoices = ref([]);
const selectedSheetIndex = ref(0);
const showSidebar = computed(() => excelInvoices.value.length > 0);
const selectedInvoice = computed(
  () => excelInvoices.value[selectedSheetIndex.value] || null
);
const allSheetInvoices = computed(() =>
  excelInvoices.value.flatMap(sheet => sheet.invoices)
);

const isFetchingList = computed(() => uiFlags.value.isFetching);
const currentPage = computed(() => Number(meta.value?.currentPage));
const totalItems = computed(() => meta.value?.count);
const hasInvoices = computed(
  () => invoices.value.length > 0 || excelInvoices.value.length > 0
);

const headerTitle = computed(() =>
  searchQuery.value
    ? t('INVOICES_LAYOUT.HEADER.SEARCH_TITLE')
    : t('INVOICES_LAYOUT.HEADER.TITLE')
);

const updatePageParam = (page, search = '') => {
  const query = {
    ...route.query,
    page: page.toString(),
    ...(search ? { search } : {}),
  };

  if (!search) {
    delete query.search;
  }

  router.replace({ query });
};

const buildSortAttr = () =>
  `${sortState.activeOrdering}${sortState.activeSort}`;

const fetchInvoices = async (page = 1) => {
  await store.dispatch('invoices/get', { page, sortAttr: buildSortAttr() });
  updatePageParam(page);
};

const searchInvoices = debounce(async (value, page = 1) => {
  searchValue.value = value;

  if (!value) {
    updatePageParam(page);
    await fetchInvoices(page);
    return;
  }

  updatePageParam(page, value);
  await store.dispatch('invoices/search', {
    page,
    sortAttr: buildSortAttr(),
    search: encodeURIComponent(value),
  });
}, DEBOUNCE_DELAY);

const handleSort = async ({ sort, order }) => {
  Object.assign(sortState, { activeSort: sort, activeOrdering: order });

  await updateUISettings({ invoices_sort_by: buildSortAttr() });

  if (searchQuery.value) {
    await searchInvoices(searchValue.value);
    return;
  }

  await fetchInvoices();
};

watch(searchQuery, value => {
  if (isFetchingList.value) return;
  searchValue.value = value || '';
  if (value === undefined) {
    fetchInvoices();
  }
});

onMounted(async () => {
  if (searchQuery.value) {
    await searchInvoices(searchQuery.value, pageNumber.value);
    return;
  }
  await fetchInvoices(pageNumber.value);
});

const handleFileChange = async event => {
  const file = event.target.files[0];
  if (!file) return;

  const data = await file.arrayBuffer();
  const workbook = read(data, { type: 'array' });

  // 모든 시트를 순회하면서 각 시트마다 하나의 InvoiceCard 생성
  const convertedSheets = workbook.SheetNames.filter(name =>
    name.endsWith('프린트')
  )
    .map((sheetName, sheetIndex) => {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) return null;

      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length <= 1) {
        return {
          id: `sheet-${sheetIndex}`,
          title: sheetName,
          invoices: [],
        };
      }

      const headers = jsonData[1];
      const rows = jsonData.slice(2);

      // 각 데이터 행을 개별 InvoiceCard로 변환
      const rowInvoices = rows.map((row, rowIndex) => {
        const details = {};
        headers.forEach((header, headerIndex) => {
          const value = row[headerIndex];
          details[header] = value;
        });

        return {
          id: `${sheetIndex}-${rowIndex}`,
          // title: `${t('INVOICE_CARD.ROW_DATA')} ${rowIndex + 1}`,
          title: `${details['아이디']}, ${details['상품명']}`,
          details,
        };
      });

      return {
        id: `sheet-${sheetIndex}`,
        title: sheetName,
        invoices: rowInvoices,
      };
    })
    .filter(Boolean); // null 값 제거

  excelInvoices.value = convertedSheets;
  selectedSheetIndex.value = 0; // 첫 번째 시트를 기본 선택
};

const selectSheet = index => {
  selectedSheetIndex.value = index;
};
</script>

<template>
  <div
    class="flex flex-col justify-between flex-1 h-full m-0 overflow-auto bg-n-background"
  >
    <ContactsListLayout
      :search-value="searchValue"
      :header-title="headerTitle"
      :current-page="currentPage"
      :total-items="totalItems"
      :show-pagination-footer="!isFetchingList && hasInvoices"
      :active-sort="sortState.activeSort"
      :active-ordering="sortState.activeOrdering"
      :is-fetching-list="isFetchingList"
      @update:current-page="fetchInvoices"
      @search="searchInvoices"
      @update:sort="handleSort"
    >
      <input
        v-if="excelInvoices.length === 0"
        type="file"
        accept=".xlsx,.xls"
        @change="handleFileChange"
      />
      <div
        v-if="isFetchingList"
        class="flex items-center justify-center py-10 text-n-slate-11"
      >
        <Spinner />
      </div>

      <template v-else>
        <div v-if="!hasInvoices" class="flex items-center justify-center py-10">
          <span class="text-base text-n-slate-11">
            {{
              searchQuery
                ? t('INVOICES_LAYOUT.EMPTY_STATE.SEARCH_EMPTY_STATE_TITLE')
                : t('INVOICES_LAYOUT.EMPTY_STATE.LIST_EMPTY_STATE_TITLE')
            }}
          </span>
        </div>

        <!-- Excel 시트가 있을 때 사이드바와 메인 콘텐츠 -->
        <div v-else-if="showSidebar" class="flex h-full">
          <!-- 왼쪽 사이드바 - 시트 목록 -->
          <div
            class="w-64 bg-n-background border-r border-n-border flex-shrink-0"
          >
            <div class="p-4">
              <h3 class="text-sm font-semibold text-n-slate-12 mb-3">
                {{ t('INVOICE_SIDEBAR.SHEETS_TITLE') }}
              </h3>
              <ul class="space-y-1">
                <li v-for="(invoice, index) in excelInvoices" :key="invoice.id">
                  <button
                    class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
                    :class="[
                      selectedSheetIndex === index
                        ? 'bg-n-blue-6 text-white'
                        : 'text-n-slate-11 hover:bg-n-base hover:text-n-slate-12',
                    ]"
                    @click="selectSheet(index)"
                  >
                    {{ invoice.title }}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <!-- 오른쪽 메인 콘텐츠 - 선택된 시트 정보 -->
          <div class="flex-1 overflow-auto">
          <InvoicesList
            v-if="selectedInvoice && selectedInvoice.invoices"
            :invoices="selectedInvoice.invoices"
            :all-invoices="allSheetInvoices"
          />
          </div>
        </div>

        <!-- 일반 인보이스 목록 (Excel이 아닌 경우) -->
        <InvoicesList v-else :invoices="invoices" />
      </template>
    </ContactsListLayout>
  </div>
</template>
