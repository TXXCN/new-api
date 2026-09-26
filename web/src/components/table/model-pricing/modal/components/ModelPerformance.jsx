/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Typography, Table, Empty, Spin } from '@douyinfe/semi-ui';
import {
  IconActivity,
  IconClock,
  IconCheckCircleStroked,
  IconAlertTriangle,
  IconRefresh,
  IconHistogram,
} from '@douyinfe/semi-icons';
import { VChart } from '@visactor/react-vchart';

import { API } from '../../../../../helpers/api';

const { Text } = Typography;

const WINDOW_HOURS = 24;

// ---------- 格式化：与参考站语义一致（无数据显示 N/A / 从未使用过） ----------

const formatPercent = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = Number(value);
  if (!Number.isFinite(num)) return 'N/A';
  return `${num.toFixed(1)}%`;
};

const formatLatency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 'N/A';
  if (num < 1000) return `${Math.round(num)}ms`;
  return `${(num / 1000).toFixed(2)}s`;
};

const formatTps = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 'N/A';
  return `${num.toFixed(2)} t/s`;
};

const formatRelative = (timestamp, t) => {
  const num = Number(timestamp);
  if (!Number.isFinite(num) || num <= 0) return t('从未使用过');
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - num);
  if (diff < 60) return `${diff}${t('秒前')}`;
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}${t('分前')}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t('小时前')}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}${t('天前')}`;
  return `${Math.floor(days / 30)}${t('个月前')}`;
};

const formatCountPair = (window, t) => {
  const success = Number(window && window.success_count) || 0;
  const error = Number(window && window.error_count) || 0;
  return `${success} / ${error}`;
};

const healthLabel = (status, t) => {
  if (status === 'active') return t('活跃');
  if (status === 'idle') return t('空闲');
  if (status === 'error') return t('异常');
  return t('未使用');
};

const healthColor = (status) => {
  if (status === 'active') return 'var(--semi-color-success)';
  if (status === 'error') return 'var(--semi-color-danger)';
  return 'var(--semi-color-text-2)';
};

const successRateColor = (rate) => {
  const num = Number(rate) || 0;
  if (num >= 99.9) return 'var(--semi-color-success)';
  if (num >= 99) return 'var(--semi-color-primary)';
  return 'var(--semi-color-warning)';
};

const avgOf = (list, field) => {
  const values = list
    .map((item) => Number(item && item[field]) || 0)
    .filter((value) => value > 0);
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

// 指标卡
const MetricCard = ({ icon, label, value, valueColor, valueClassName, valueStyle }) => (
  <div
    className='p-4 rounded-xl border'
    style={{
      borderColor: 'var(--semi-color-border)',
      background: 'var(--semi-color-bg-0)',
    }}
  >
    <div className='flex flex-col gap-1'>
      <div
        className='inline-flex items-center gap-1 text-xs'
        style={{ color: 'var(--semi-color-text-2)' }}
      >
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`text-lg font-semibold ${valueClassName || ''}`}
        style={{ color: valueColor || 'var(--semi-color-text-0)', ...(valueStyle || {}) }}
      >
        {value}
      </div>
    </div>
  </div>
);

// 性能页：数据来自 /api/perf-metrics，展示模型性能指标、分组表现与趋势
const ModelPerformance = ({ modelData, t }) => {
  const modelName = modelData?.model_name || modelData?.modelName || '';
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [groups, setGroups] = useState([]);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    if (!modelName) {
      setGroups([]);
      setActivity(null);
      setLoaded(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    API.get('/api/perf-metrics', {
      params: { model: modelName, hours: WINDOW_HOURS },
    })
      .then((res) => {
        if (cancelled) return;
        const payload = res && res.data;
        if (payload && payload.success && payload.data) {
          setGroups(payload.data.groups || []);
          setActivity(payload.data.activity || null);
        } else {
          setGroups([]);
          setActivity(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setGroups([]);
        setActivity(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [modelName]);

  const groupRows = useMemo(
    () =>
      groups.map((item, index) => ({
        key: item.group || `group-${index}`,
        group: item.group || '-',
        tps: formatTps(item.avg_tps),
        ttft: formatLatency(item.avg_ttft_ms),
        latency: formatLatency(item.avg_latency_ms),
        successRate: formatPercent(item.success_rate),
      })),
    [groups],
  );

  // 趋势：从各分组的 series 按时间桶聚合
  const ttftTrend = useMemo(() => {
    const buckets = new Map();
    groups.forEach((item) => {
      (item.series || []).forEach((point) => {
        const value = Number(point.avg_ttft_ms) || 0;
        if (value <= 0) return;
        const ts = Number(point.ts) || 0;
        if (!ts) return;
        const list = buckets.get(ts) || [];
        list.push(value);
        buckets.set(ts, list);
      });
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ts, values]) => ({
        time: new Date(ts * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        ttft: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
      }));
  }, [groups]);

  const availabilityTrend = useMemo(() => {
    const buckets = new Map();
    groups.forEach((item) => {
      (item.series || []).forEach((point) => {
        const rate = Number(point.success_rate);
        if (!Number.isFinite(rate)) return;
        const ts = Number(point.ts) || 0;
        if (!ts) return;
        const list = buckets.get(ts) || [];
        list.push(rate);
        buckets.set(ts, list);
      });
    });
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ts, values]) => ({
        time: new Date(ts * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        success_rate:
          Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100,
      }));
  }, [groups]);

  const ttftSpec = useMemo(() => {
    if (!ttftTrend.length) return null;
    return {
      type: 'line',
      data: [{ id: 'latency', values: ttftTrend }],
      xField: 'time',
      yField: 'ttft',
      point: { visible: true, style: { size: 4 } },
      line: { style: { lineWidth: 2 } },
      legends: { visible: false },
      axes: [
        {
          orient: 'bottom',
          label: { style: { fill: 'currentColor', fontSize: 10 }, autoHide: true, autoLimit: true },
          tick: { visible: false },
        },
        {
          orient: 'left',
          label: {
            formatMethod: (value) => `${Math.round(Number(value) || 0)} ms`,
            style: { fill: 'currentColor', fontSize: 10 },
          },
          grid: { visible: true, style: { lineDash: [3, 3] } },
        },
      ],
      tooltip: {
        mark: {
          content: [
            {
              key: () => t('平均首 TOKEN 延迟'),
              value: (datum) => `${Math.round(Number(datum?.ttft) || 0)} ms`,
            },
          ],
        },
      },
      animationAppear: { duration: 400 },
    };
  }, [ttftTrend, t]);

  const availabilitySpec = useMemo(() => {
    if (!availabilityTrend.length) return null;
    return {
      type: 'line',
      data: [{ id: 'success', values: availabilityTrend }],
      xField: 'time',
      yField: 'success_rate',
      point: { visible: true, style: { size: 4 } },
      line: { style: { lineWidth: 2 } },
      legends: { visible: false },
      axes: [
        {
          orient: 'bottom',
          label: { style: { fill: 'currentColor', fontSize: 10 }, autoHide: true, autoLimit: true },
          tick: { visible: false },
        },
        {
          orient: 'left',
          min: 0,
          max: 100,
          label: {
            formatMethod: (value) => `${Number(value).toFixed(0)}%`,
            style: { fill: 'currentColor', fontSize: 10 },
          },
          grid: { visible: true, style: { lineDash: [3, 3] } },
        },
      ],
      tooltip: {
        mark: {
          content: [
            {
              key: () => t('成功率'),
              value: (datum) => `${(Number(datum?.success_rate) || 0).toFixed(2)}%`,
            },
          ],
        },
      },
      animationAppear: { duration: 400 },
    };
  }, [availabilityTrend, t]);

  const groupColumns = useMemo(
    () => [
      { title: t('分组'), dataIndex: 'group', key: 'group', width: 120 },
      { title: 'TPS', dataIndex: 'tps', key: 'tps', width: 110, align: 'center' },
      {
        title: t('平均首 TOKEN 延迟'),
        dataIndex: 'ttft',
        key: 'ttft',
        width: 160,
        align: 'center',
      },
      { title: t('平均延迟'), dataIndex: 'latency', key: 'latency', width: 120, align: 'center' },
      {
        title: t('成功率'),
        dataIndex: 'successRate',
        key: 'successRate',
        width: 110,
        align: 'center',
      },
    ],
    [t],
  );

  if (loading && !loaded) {
    return (
      <div className='flex justify-center items-center py-10'>
        <Text type='secondary'>{t('加载中...')}</Text>
      </div>
    );
  }

  if (!groups.length && !activity) {
    return (
      <div className='py-8'>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('该模型暂时没有可用的性能监控数据')}
        />
      </div>
    );
  }

  const oneHour = (activity && activity.one_hour) || {};
  const twentyFour = (activity && activity.twenty_four_hours) || {};

  const overallTps = avgOf(groups, 'avg_tps');
  const overallTtft = avgOf(groups, 'avg_ttft_ms');
  const overallLatency = avgOf(groups, 'avg_latency_ms');
  const overallSuccessRate = avgOf(groups, 'success_rate');

  return (
    <div>
      {/* 标题区 */}
      <div className='flex items-center mb-4'>
        <Avatar size='small' color='cyan' className='mr-2 shadow-md'>
          <IconActivity size={16} />
        </Avatar>
        <div>
          <Text className='text-lg font-medium'>{t('性能')}</Text>
          <div className='text-xs text-gray-600'>{t('模型性能指标与分组表现')}</div>
        </div>
      </div>

      {/* 指标卡（4 列 × 3 行） */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 mb-6'>
        <MetricCard
          icon={<IconActivity size={14} />}
          label="TPS"
          value={formatTps(overallTps)}
          hint={t('持续每秒 Token 数')}
        />
        <MetricCard
          icon={<IconClock size={14} />}
          label={t('平均首 TOKEN 延迟')}
          value={formatLatency(overallTtft)}
        />
        <MetricCard
          icon={<IconClock size={14} />}
          label={t('平均延迟')}
          value={formatLatency(overallLatency)}
        />
        <MetricCard
          icon={<IconCheckCircleStroked size={14} />}
          label={t('近一小时成功率')}
          value={formatPercent(oneHour.success_rate)}
          valueColor={successRateColor(oneHour.success_rate)}
        />

        <MetricCard
          icon={<IconCheckCircleStroked size={14} />}
          label={t('近24小时成功率')}
          value={formatPercent(twentyFour.success_rate)}
          valueColor={successRateColor(twentyFour.success_rate)}
        />
        <MetricCard
          icon={<IconCheckCircleStroked size={14} />}
          label={t('最近成功')}
          value={formatRelative(activity && activity.last_success_ts, t)}
        />
        <MetricCard
          icon={<IconHistogram size={14} />}
          label={t('近一小时成功/失败次数')}
          value={formatCountPair(oneHour, t)}
        />
        <MetricCard
          icon={<IconHistogram size={14} />}
          label={t('近24小时成功/失败次数')}
          value={formatCountPair(twentyFour, t)}
        />

        <MetricCard
          icon={<IconActivity size={14} />}
          label={t('状态')}
          value={healthLabel(activity && activity.health_status, t)}
          valueColor={healthColor(activity && activity.health_status)}
        />
        <MetricCard
          icon={<IconRefresh size={14} />}
          label={t('最近调用')}
          value={formatRelative(activity && activity.last_request_ts, t)}
        />
        <MetricCard
          icon={<IconAlertTriangle size={14} />}
          label={t('连续失败')}
          value={Number(activity && activity.consecutive_failures) || 0}
          valueColor='var(--semi-color-danger)'
        />
        <MetricCard
          icon={<IconAlertTriangle size={14} />}
          label={t('最近错误类型')}
          value={(activity && activity.last_error_type) || t('无')}
          valueClassName='block max-w-full truncate'
          valueStyle={{ fontSize: 12, lineHeight: '18px' }}
        />
      </div>

      {/* 各分组性能 */}
      <div className='mb-6'>
        <div className='text-sm font-medium mb-1'>{t('各分组性能')}</div>
        <div className='text-xs text-gray-500 mb-2'>
          {t('Average latency, TTFT, TPS, and success rate')}
        </div>
        <Table
          columns={groupColumns}
          dataSource={groupRows}
          pagination={false}
          size='small'
          bordered
          empty={<Empty title={t('暂无数据')} />}
        />
      </div>

      {/* 延迟趋势 */}
      <div className='mb-6'>
        <div className='text-sm font-medium mb-1'>{t('延迟趋势（最近 24 小时）')}</div>
        <div className='text-xs text-gray-500 mb-2'>{t('平均首 Token 延迟')}</div>
        <div
          className='p-4 rounded-lg border'
          style={{ borderColor: 'var(--semi-color-border)' }}
        >
          {ttftSpec ? (
            <div style={{ height: 220 }}>
              <VChart spec={ttftSpec} />
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('暂无延迟趋势数据')}
            />
          )}
        </div>
      </div>

      {/* 可用性 */}
      <div className='mb-2'>
        <div className='text-sm font-medium mb-1'>{t('可用性（最近 24 小时）')}</div>
        <div className='text-xs text-gray-500 mb-2'>{t('请求成功率采样')}</div>
        <div
          className='p-4 rounded-lg border'
          style={{ borderColor: 'var(--semi-color-border)' }}
        >
          {availabilitySpec ? (
            <div style={{ height: 220 }}>
              <VChart spec={availabilitySpec} />
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('暂无可用性数据')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelPerformance;
