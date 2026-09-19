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

import React, { useEffect, useState } from 'react';
import { Avatar, Typography, Table, Empty } from '@douyinfe/semi-ui';
import {
  IconActivity,
  IconClock,
  IconCheckCircleStroked,
} from '@douyinfe/semi-icons';

import { API } from '../../../../../helpers/api';

const { Text } = Typography;

const WINDOW_HOURS = 24;

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatTps = (value) => {
  const num = toNumber(value);
  if (num <= 0) return '-';
  if (num >= 100) return num.toFixed(0);
  if (num >= 10) return num.toFixed(1);
  return num.toFixed(2);
};

const formatLatency = (seconds) => {
  const num = toNumber(seconds);
  if (num <= 0) return '-';
  if (num < 1) return `${Math.round(num * 1000)}ms`;
  return `${num.toFixed(2)}s`;
};

const formatSuccessRate = (rate, total) => {
  if (!total) return '-';
  return `${toNumber(rate).toFixed(2)}%`;
};

const trendTooltip = (point) => {
  const time = new Date(point.timestamp * 1000).toLocaleString();
  return `${time} | ${point.total_count} | ${toNumber(point.success_rate).toFixed(2)}%`;
};

// 性能页：数据来自 /api/model/performance，按模型聚合日志里的
// TPS / 首 Token 延迟 / 平均延迟 / 成功率，并按分组拆分。
const ModelPerformance = ({ modelData, t }) => {
  const modelName = modelData?.model_name || modelData?.modelName || '';
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [performance, setPerformance] = useState(null);

  useEffect(() => {
    if (!modelName) {
      setPerformance(null);
      setFailed(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setPerformance(null);
    API.get('/api/model/performance', {
      params: { model: modelName, hours: WINDOW_HOURS },
    })
      .then((res) => {
        if (cancelled) return;
        const payload = res && res.data;
        if (!payload || !payload.success) {
          setFailed(true);
          setPerformance(null);
          return;
        }
        setPerformance(payload.data || null);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setPerformance(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modelName]);

  if (loading) {
    return (
      <div className='flex justify-center items-center py-10'>
        <Text type='secondary'>{t('加载中...')}</Text>
      </div>
    );
  }

  if (failed) {
    return (
      <div
        className='p-4 rounded-lg border'
        style={{ borderColor: 'var(--semi-color-border)' }}
      >
        <Empty title={t('暂无数据')} description={t('数据加载失败')} />
      </div>
    );
  }

  const overall = (performance && performance.overall) || {};
  const groups = (performance && performance.groups) || [];
  const trend = (performance && performance.trend) || [];

  const groupPerfColumns = [
    { title: t('分组'), dataIndex: 'group', key: 'group', width: 120 },
    { title: 'TPS', dataIndex: 'tps', key: 'tps', width: 100, align: 'center' },
    {
      title: t('平均首 Token 延迟'),
      dataIndex: 'firstToken',
      key: 'firstToken',
      width: 160,
      align: 'center',
    },
    {
      title: t('平均延迟'),
      dataIndex: 'avgLatency',
      key: 'avgLatency',
      width: 120,
      align: 'center',
    },
    {
      title: t('成功率'),
      dataIndex: 'successRate',
      key: 'successRate',
      width: 100,
      align: 'center',
    },
  ];

  const groupPerfData = groups.map((item, index) => ({
    key: item.group || `group-${index}`,
    group: item.group || '-',
    tps: formatTps(item.tps),
    firstToken: item.has_first_token_data
      ? formatLatency(item.avg_first_token_seconds)
      : '-',
    avgLatency: item.has_latency_data
      ? formatLatency(item.avg_latency_seconds)
      : '-',
    successRate: formatSuccessRate(item.success_rate, item.total_count),
  }));

  const maxLatency = trend.reduce(
    (max, point) => Math.max(max, toNumber(point.avg_latency_seconds)),
    0,
  );

  const renderBars = (points, valueOf, color) => (
    <div className='flex items-end gap-1' style={{ height: 96 }}>
      {points.map((point) => (
        <div
          key={point.timestamp}
          className='flex-1 h-full flex flex-col justify-end'
          title={trendTooltip(point)}
        >
          <div
            style={{
              height: `${valueOf(point)}%`,
              backgroundColor: color,
              borderRadius: '2px 2px 0 0',
            }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* 标题区 */}
      <div className='flex items-center mb-4'>
        <Avatar size='small' color='cyan' className='mr-2 shadow-md'>
          <IconActivity size={16} />
        </Avatar>
        <div>
          <Text className='text-lg font-medium'>{t('性能')}</Text>
          <div className='text-xs text-gray-600'>
            {t('模型性能指标与分组表现')}
          </div>
        </div>
      </div>

      {/* 总体指标 */}
      <div className='mb-6'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          <div
            className='p-3 rounded-lg border'
            style={{ borderColor: 'var(--semi-color-border)' }}
          >
            <div className='text-xs text-gray-500 mb-1'>TPS</div>
            <div className='text-2xl font-semibold'>
              {formatTps(overall.tps)}
            </div>
            <div className='text-xs text-gray-500 mt-0.5'>
              {t('持续每秒 Token 数')}
            </div>
          </div>

          <div
            className='p-3 rounded-lg border'
            style={{ borderColor: 'var(--semi-color-border)' }}
          >
            <div className='text-xs text-gray-500 mb-1 flex items-center gap-1'>
              <IconClock size={14} />
              {t('平均首 Token 延迟')}
            </div>
            <div className='text-2xl font-semibold'>
              {overall.has_first_token_data
                ? formatLatency(overall.avg_first_token_seconds)
                : '-'}
            </div>
          </div>

          <div
            className='p-3 rounded-lg border'
            style={{ borderColor: 'var(--semi-color-border)' }}
          >
            <div className='text-xs text-gray-500 mb-1'>{t('平均延迟')}</div>
            <div className='text-2xl font-semibold'>
              {overall.has_latency_data
                ? formatLatency(overall.avg_latency_seconds)
                : '-'}
            </div>
          </div>

          <div
            className='p-3 rounded-lg border'
            style={{ borderColor: 'var(--semi-color-border)' }}
          >
            <div className='text-xs text-gray-500 mb-1 flex items-center gap-1'>
              <IconCheckCircleStroked size={14} />
              {t('成功率')}
            </div>
            <div className='text-2xl font-semibold'>
              {formatSuccessRate(overall.success_rate, overall.total_count)}
            </div>
          </div>
        </div>
      </div>

      {/* 最近 24 小时请求成功率采样 */}
      <div className='mb-6'>
        <div className='text-sm font-medium mb-2'>
          {t('最近 24 小时请求成功率采样')}
        </div>
        <div className='text-xs text-gray-500 mb-2'>
          {t('可用性（最近 24 小时）')}
        </div>
        <div
          className='p-4 rounded-lg border'
          style={{ borderColor: 'var(--semi-color-border)' }}
        >
          {trend.length === 0 ? (
            <Empty
              title={t('暂无数据')}
              description={t('最近 24 小时请求成功率采样')}
            />
          ) : (
            renderBars(
              trend,
              (point) =>
                Math.max(Math.min(toNumber(point.success_rate), 100), 2),
              'var(--semi-color-primary)',
            )
          )}
        </div>
      </div>

      {/* 各分组性能 */}
      <div className='mb-6'>
        <div className='text-sm font-medium mb-2'>{t('各分组性能')}</div>
        <div className='text-xs text-gray-500 mb-2'>
          {t('平均延迟、首 Token 延迟、TPS 和成功率')}
        </div>

        <Table
          columns={groupPerfColumns}
          dataSource={groupPerfData}
          pagination={false}
          size='small'
          bordered
          empty={<Empty title={t('暂无数据')} />}
        />
      </div>

      {/* 延迟趋势 */}
      <div className='mb-2'>
        <div className='text-sm font-medium mb-2'>
          {t('延迟趋势（最近 24 小时）')}
        </div>
        <div className='text-xs text-gray-500 mb-2'>
          {t('平均首 Token 延迟')}
        </div>
        <div
          className='p-4 rounded-lg border'
          style={{ borderColor: 'var(--semi-color-border)' }}
        >
          {trend.length === 0 ? (
            <Empty title={t('暂无数据')} description={t('平均首 Token 延迟')} />
          ) : (
            renderBars(
              trend,
              (point) =>
                maxLatency > 0
                  ? Math.max(
                      (toNumber(point.avg_latency_seconds) / maxLatency) * 100,
                      2,
                    )
                  : 2,
              'var(--semi-color-warning)',
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelPerformance;
