import { useEffect, useMemo, useState } from 'react';
import { API } from '../../helpers/api';

const DEFAULT_WINDOW_HOURS = 1;

/**
 * 拉取模型广场的性能摘要（/api/perf-metrics/summary）。
 *
 * 返回 model_name -> 指标 的映射，供模型卡片展示「模型状态」
 * （TPS / 首字延迟 / 成功率 / 最近成功 / 成功失败次数）。
 */
export function useModelPerfMetrics(hours = DEFAULT_WINDOW_HOURS) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await API.get('/api/perf-metrics/summary', {
          params: { hours },
        });
        if (cancelled) return;
        const payload = res && res.data;
        if (payload && payload.success) {
          setMetrics((payload.data && payload.data.models) || []);
        } else {
          setMetrics([]);
        }
      } catch {
        if (!cancelled) setMetrics([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [hours]);

  const metricsMap = useMemo(() => {
    const map = new Map();
    metrics.forEach((item) => {
      if (item && item.model_name) {
        map.set(item.model_name, item);
      }
    });
    return map;
  }, [metrics]);

  return { metrics, metricsMap, loading };
}

export default useModelPerfMetrics;
