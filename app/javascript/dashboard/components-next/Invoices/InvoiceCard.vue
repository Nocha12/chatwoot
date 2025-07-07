<script setup>
defineProps({
  id: { type: Number, required: true },
  title: { type: String, default: '' },
  invoiceNumber: { type: String, default: '' },
  total: { type: [Number, String], default: '' },
  status: { type: String, default: '' },
  isExpanded: { type: Boolean, default: false },
  details: { type: Object, default: () => ({}) },
  tableData: { type: Object, default: null },
});
const emit = defineEmits(['toggle']);
import { useI18n } from 'vue-i18n';

import CardLayout from 'dashboard/components-next/CardLayout.vue';

import Button from 'dashboard/components-next/button/Button.vue';
const { t } = useI18n();

const onClickExpand = () => emit('toggle');
</script>

<template>
  <CardLayout :key="id" layout="row">
    <div class="flex items-center justify-start flex-1 gap-4">
      <div class="flex flex-col gap-0.5 flex-1">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span class="text-base font-medium truncate text-n-slate-12">
            {{ title || invoiceNumber }}
          </span>
        </div>
        <div
          v-if="total || status"
          class="flex flex-wrap items-center justify-start gap-x-3 gap-y-1"
        >
          <span v-if="total" class="text-sm truncate text-n-slate-11">
            {{ total }}
          </span>
          <div v-if="total && status" class="w-px h-3 truncate bg-n-slate-6" />
          <span v-if="status" class="text-sm truncate text-n-slate-11">
            {{ status }}
          </span>
        </div>
      </div>
    </div>

    <Button
      icon="i-lucide-chevron-down"
      variant="ghost"
      color="slate"
      size="xs"
      :class="{ 'rotate-180': isExpanded }"
      @click="onClickExpand"
    />

    <template #after>
      <transition
        enter-active-class="overflow-hidden transition-all duration-300 ease-out"
        leave-active-class="overflow-hidden transition-all duration-300 ease-in"
        enter-from-class="overflow-hidden opacity-0 max-h-0"
        enter-to-class="opacity-100 max-h-[690px] sm:max-h-[470px] md:max-h-[410px]"
        leave-from-class="opacity-100 max-h-[690px] sm:max-h-[470px] md:max-h-[410px]"
        leave-to-class="overflow-hidden opacity-0 max-h-0"
      >
        <div v-show="isExpanded" class="w-full">
          <div class="flex flex-col gap-6 p-6 border-t border-n-strong">
            <slot name="details">
              <!-- 테이블 데이터가 있을 때 표로 표시 -->
              <div
                v-if="tableData && tableData.headers && tableData.rows"
                class="space-y-3"
              >
                <h4 class="text-sm font-semibold text-n-slate-12">
                  {{ t('INVOICE_CARD.TABLE_DATA') }}
                </h4>
                <div class="overflow-x-auto">
                  <table class="w-full border border-n-border rounded-lg">
                    <!-- 헤더 -->
                    <thead class="bg-n-base border-b border-n-border">
                      <tr>
                        <th
                          v-for="(header, index) in tableData.headers"
                          :key="index"
                          class="px-3 py-2 text-left text-xs font-medium text-n-slate-10 uppercase tracking-wide"
                        >
                          {{ header }}
                        </th>
                      </tr>
                    </thead>
                    <!-- 데이터 행들 -->
                    <tbody class="divide-y divide-n-border">
                      <tr
                        v-for="(row, rowIndex) in tableData.rows"
                        :key="rowIndex"
                        class="hover:bg-n-base transition-colors"
                      >
                        <td
                          v-for="(cell, cellIndex) in row"
                          :key="cellIndex"
                          class="px-3 py-2 text-sm text-n-slate-10 bg-transparent whitespace-nowrap"
                        >
                          {{ cell || '-' }}
                        </td>
                        <!-- 행에 빈 셀이 있는 경우 헤더 수만큼 채우기 -->
                        <td
                          v-for="index in Math.max(
                            0,
                            tableData.headers.length - row.length
                          )"
                          :key="`empty-${index}`"
                          class="px-3 py-2 text-sm text-n-slate-10 bg-transparent whitespace-nowrap"
                        >
                          -
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <!-- 기존 details 표시 -->
              <div
                v-else-if="Object.keys(details).length > 0"
                class="space-y-3"
              >
                <h4 class="text-sm font-semibold text-n-slate-12">
                  {{ t('INVOICE_CARD.ADDITIONAL_INFO') }}
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    v-for="(value, key) in details"
                    :key="key"
                    class="flex flex-col gap-1"
                  >
                    <span
                      class="text-xs font-medium text-n-slate-10 uppercase tracking-wide"
                    >
                      {{ key }}
                    </span>
                    <span class="text-sm text-n-slate-11">
                      {{ value || '-' }}
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-n-slate-11">
                {{ t('INVOICE_CARD.NO_DETAILS') }}
              </div>
            </slot>
          </div>
        </div>
      </transition>
    </template>
  </CardLayout>
</template>
