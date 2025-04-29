import { useMapGetter } from 'dashboard/composables/store';
// import { formatTime } from '@chatwoot/utils';

/**
 * A composable function for report metrics calculations and display.
 *
 * @param {string} [accountSummaryKey='getAccountSummary'] - The key for accessing account summary data.
 * @returns {Object} An object containing utility functions for report metrics.
 */
export function useReportMetrics(
  accountSummaryKey = 'getAccountSummary',
  summarFetchingKey = 'getAccountSummaryFetchingStatus'
) {
  const accountSummary = useMapGetter(accountSummaryKey);
  const fetchingStatus = useMapGetter(summarFetchingKey);

  /**
   * Calculates the trend percentage for a given metric.
   *
   * @param {string} key - The key of the metric to calculate trend for.
   * @returns {number} The calculated trend percentage, rounded to the nearest integer.
   */
  const calculateTrend = key => {
    if (!accountSummary.value.previous[key]) return 0;
    const diff = accountSummary.value[key] - accountSummary.value.previous[key];
    return Math.round((diff / accountSummary.value.previous[key]) * 100);
  };

  /**
   * Checks if a given metric key represents an average metric type.
   *
   * @param {string} key - The key of the metric to check.
   * @returns {boolean} True if the metric is an average type, false otherwise.
   */
  const isAverageMetricType = key => {
    return [
      'avg_first_response_time',
      'avg_resolution_time',
      'reply_time',
    ].includes(key);
  };

  const formatTimeInKorean = timeInSeconds => {
    let formattedTime = '';
    if (timeInSeconds >= 60 && timeInSeconds < 3600) {
      const minutes = Math.floor(timeInSeconds / 60);
      formattedTime = `${minutes} 분`;
      const seconds = minutes === 60 ? 0 : Math.floor(timeInSeconds % 60);
      return formattedTime + `${seconds > 0 ? ' ' + seconds + ' 초' : ''}`;
    }
    if (timeInSeconds >= 3600 && timeInSeconds < 86400) {
      const hours = Math.floor(timeInSeconds / 3600);
      formattedTime = `${hours} 시간`;
      const minutes =
        timeInSeconds % 3600 < 60 || hours === 24
          ? 0
          : Math.floor((timeInSeconds % 3600) / 60);
      return formattedTime + `${minutes > 0 ? ' ' + minutes + ' 분' : ''}`;
    }
    if (timeInSeconds >= 86400) {
      const days = Math.floor(timeInSeconds / 86400);
      formattedTime = `${days} 일`;
      const hours =
        timeInSeconds % 86400 < 3600 || days >= 364
          ? 0
          : Math.floor((timeInSeconds % 86400) / 3600);
      return formattedTime + `${hours > 0 ? ' ' + hours + ' 시간' : ''}`;
    }
    return `${Math.floor(timeInSeconds)} 초`;
  };

  /**
   * Formats and displays a metric value based on its type.
   *
   * @param {string} key - The key of the metric to display.
   * @returns {string} The formatted metric value as a string.
   */
  const displayMetric = key => {
    if (isAverageMetricType(key)) {
      return formatTimeInKorean(accountSummary.value[key]);
    }
    return Number(accountSummary.value[key] || '').toLocaleString();
  };

  return {
    calculateTrend,
    isAverageMetricType,
    displayMetric,
    fetchingStatus,
  };
}
